// ═══════════════════════════════════════════════════════════════════════════════
// DONUT VIEW - Project Task Completion by User
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import supabase from './config/supabaseClient'
import './Donutview.css'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

function DonutView() {
  // ─── STATE ────────────────────────────────────────────────────────────────────
  
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ─── COLOR PALETTE ────────────────────────────────────────────────────────────
  
  const userColors = [
    { base: '#3b82f6', dark: '#1e40af' }, // Blue
    { base: '#10b981', dark: '#065f46' }, // Green
    { base: '#f59e0b', dark: '#92400e' }, // Orange
    { base: '#ef4444', dark: '#991b1b' }, // Red
    { base: '#8b5cf6', dark: '#5b21b6' }, // Purple
    { base: '#ec4899', dark: '#9f1239' }, // Pink
    { base: '#14b8a6', dark: '#115e59' }, // Teal
    { base: '#f97316', dark: '#9a3412' }, // Deep Orange
  ]

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOAD PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    const { data, error } = await supabase
      .from('Projects')
      .select('*')
      .order('project_name')

    if (error) {
      console.error('Error loading projects:', error)
    } else {
      setProjects(data)
      console.log('Loaded projects:', data)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOAD CHART DATA WHEN PROJECT CHANGES
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (selectedProjectId) {
      loadChartData(selectedProjectId)
    } else {
      setChartData(null)
      setError('')
    }
  }, [selectedProjectId])

  async function loadChartData(projectId) {
    setLoading(true)
    setError('')

    try {
      // Step 1: Get all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from('Tasks')
        .select('task_id, points, complete')
        .eq('project_id', projectId)

      if (tasksError) throw tasksError

      if (!tasks || tasks.length === 0) {
        setError('Not enough information to evaluate')
        setChartData(null)
        setLoading(false)
        return
      }

      // Step 2: Get all user assignments for these tasks
      const taskIds = tasks.map(t => t.task_id)
      
      const { data: userTasks, error: userTasksError } = await supabase
        .from('User_tasks')
        .select('user_id, task_id')
        .in('task_id', taskIds)

      if (userTasksError) throw userTasksError

      if (!userTasks || userTasks.length === 0) {
        setError('Not enough information to evaluate')
        setChartData(null)
        setLoading(false)
        return
      }

      // Step 3: Get user details
      const userIds = [...new Set(userTasks.map(ut => ut.user_id))]
      
      const { data: users, error: usersError } = await supabase
        .from('Users')
        .select('user_id, alias, username')
        .in('user_id', userIds)

      if (usersError) throw usersError

      // Step 4: Calculate points per user
      const userStats = {}

      // Initialize user stats
      users.forEach(user => {
        userStats[user.user_id] = {
          alias: user.alias || user.username,
          totalPoints: 0,
          completedPoints: 0
        }
      })

      // Calculate points
      userTasks.forEach(ut => {
        const task = tasks.find(t => t.task_id === ut.task_id)
        if (task && task.points) {
          userStats[ut.user_id].totalPoints += task.points
          if (task.complete) {
            userStats[ut.user_id].completedPoints += task.points
          }
        }
      })

      // Step 5: Build chart data
      const outerLabels = []
      const outerData = []
      const outerColors = []

      let totalProjectPoints = 0
      let totalCompletedPoints = 0

      Object.entries(userStats).forEach(([userId, stats], index) => {
        const colorIndex = index % userColors.length
        const incompletePoints = stats.totalPoints - stats.completedPoints
        
        // Add completed segment for this user
        outerLabels.push(`${stats.alias} - Completed`)
        outerData.push(stats.completedPoints)
        outerColors.push(userColors[colorIndex].dark)
        
        // Add incomplete segment for this user
        outerLabels.push(`${stats.alias} - Incomplete`)
        outerData.push(incompletePoints)
        outerColors.push(userColors[colorIndex].base)

        totalProjectPoints += stats.totalPoints
        totalCompletedPoints += stats.completedPoints
      })

      const totalIncompletePoints = totalProjectPoints - totalCompletedPoints

      // Calculate total percentage
      const projectPercentage = totalProjectPoints > 0 
        ? Math.round((totalCompletedPoints / totalProjectPoints) * 100)
        : 0

      setTotalPercentage(projectPercentage)

      // Step 6: Create Chart.js dataset with two rings
      const data = {
        labels: outerLabels,
        datasets: [
          // Outer ring - Per-user breakdown
          {
            label: 'User Tasks',
            data: outerData,
            backgroundColor: outerColors,
            borderWidth: 2,
            borderColor: '#fff',
            weight: 2  // Larger weight = outer ring
          },
          // Inner ring - Overall project progress (closer to center)
          {
            label: 'Project Total',
            data: [totalCompletedPoints, totalIncompletePoints],
            backgroundColor: ['#10b981', '#e5e7eb'],  // Green for complete, gray for incomplete
            borderWidth: 2,
            borderColor: '#fff',
            weight: 1  // Smaller weight = inner ring
          }
        ]
      }

      setChartData(data)

    } catch (err) {
      console.error('Error loading chart data:', err)
      setError('Failed to load chart data')
    }

    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHART OPTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? 'bottom' : 'right',
        labels: {
          generateLabels: (chart) => {
            const data = chart.data
            if (data.datasets.length > 0 && data.datasets[0].data.length) {
              // Get outer ring data (dataset 0 - now the user breakdown)
              const outerData = data.datasets[0].data
              const outerLabels = data.labels
              const outerColors = data.datasets[0].backgroundColor
              
              // Group by user (every 2 items = one user)
              const userLabels = []
              for (let i = 0; i < outerData.length; i += 2) {
                const completed = outerData[i] || 0
                const incomplete = outerData[i + 1] || 0
                const total = completed + incomplete
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
                
                // Extract user name from label (before " - Completed")
                const userName = outerLabels[i].replace(' - Completed', '')
                
                userLabels.push({
                  text: `${userName}: ${percentage}% (${completed}/${total} pts)`,
                  fillStyle: outerColors[i + 1], // Use the lighter color for legend
                  hidden: false,
                  index: i
                })
              }
              return userLabels
            }
            return []
          },
          padding: 15,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetIndex = context.datasetIndex
            const label = context.label || ''
            const value = context.parsed || 0
            
            if (datasetIndex === 1) {
              // Inner ring - show project totals
              return `Project ${label.toLowerCase()}: ${value} pts`
            } else {
              // Outer ring - show user task details
              return `${label}: ${value} pts`
            }
          }
        }
      }
    },
    cutout: '50%'  // Adjusted for two rings
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="donut-view-container">
      <div className="donut-header">
        <Link to="/" className="back-link">← Back to Tasks</Link>
        <h1>Donut View</h1>
      </div>

      {/* ─── PROJECT SELECTOR ───────────────────────────────────────────── */}
      <div className="project-selector">
        <label>
          <strong>Select Project: </strong>
          <select 
            value={selectedProjectId || ''} 
            onChange={(e) => {
              const projectId = e.target.value ? Number(e.target.value) : null
              setSelectedProjectId(projectId)
            }}
          >
            <option value="">-- Choose a project --</option>
            {projects.map(project => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ─── CHART DISPLAY ──────────────────────────────────────────────── */}
      {!selectedProjectId && (
        <div className="message-box">
          <p>Please select a project</p>
        </div>
      )}

      {selectedProjectId && loading && (
        <div className="message-box">
          <p>Loading chart data...</p>
        </div>
      )}

      {selectedProjectId && error && (
        <div className="message-box error">
          <p>{error}</p>
        </div>
      )}

      {selectedProjectId && !loading && chartData && (
        <div className="chart-container">
          <div className="chart-wrapper">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="center-text">
              <div className="center-percentage">{totalPercentage}%</div>
              <div className="center-label">Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DonutView