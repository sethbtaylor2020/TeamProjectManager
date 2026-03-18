// ═══════════════════════════════════════════════════════════════════════════════
// THREE DYNAMIC DATASETS
// ═══════════════════════════════════════════════════════════════════════════════
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import supabase from './config/supabaseClient'
import './PTM.css'
import { themes } from './theme'
import { 
  addTask, 
  removeTask, 
  updateTask, 
  updateTaskStatus, 
  reassignTaskUser, 
  removeUserFromTask,
  addUser, 
  removeUser, 
  addProject, 
  removeProject, 
  assignUserToProject, 
  removeUserFromProject 
} from './supabaseHelpers'

function ProjectTaskManager() {
  // ─── STATE FOR THE THREE DATASETS ─────────────────────────────────────────────
  
  const [projects, setProjects] = useState([])              // Dataset 1: All projects
  const [usersInProject, setUsersInProject] = useState([])  // Dataset 2: Users in selected project
  const [userTasks, setUserTasks] = useState([])            // Dataset 3: Tasks for selected user

  // ─── STATE FOR SELECTIONS ─────────────────────────────────────────────────────
  
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // ─── STATE FOR LOADING ────────────────────────────────────────────────────────
  
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)

  // ─── STATE FOR Notification ───────────────────────────────────────────────────
  const [lateSprintWarnings, setLateSprintWarnings] = useState([]);

  // ─── Function and States for Themes ─────────────────────────────────────────── 

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  function setTheme(themeName) {
    const root = document.documentElement;
    const theme = themes[themeName];

    if (!theme) return;

    Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  async function toggleTask(taskId, currentValue) {
    // 1. Update Supabase
    const { error } = await supabase
      .from('Tasks')
      .update({ complete: !currentValue })
      .eq('task_id', taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    // 2. Update local state
    setUserTasks(prev =>
      prev.map(t =>
        t.task_id === taskId ? { ...t, complete: !currentValue } : t
      )
    );
  }
}


  // ═══════════════════════════════════════════════════════════════════════════════
  // DATASET 1: LOAD ALL PROJECTS (runs once when component loads)
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadProjects()
  }, [])  // Empty array = run once on mount

  async function loadProjects() {
    setLoadingProjects(true)

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

    setLoadingProjects(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATASET 2: LOAD USERS IN SELECTED PROJECT (runs when project changes)
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (selectedProjectId) {
      loadUsersInProject(selectedProjectId)
    } else {
      setUsersInProject([])
      setSelectedUserId(null)
    }
  }, [selectedProjectId])  // Run when selectedProjectId changes

  async function loadUsersInProject(projectId) {
    setLoadingUsers(true)

    // Step 1: Get user IDs from Project_users table
    const { data: projectUsers, error: error1 } = await supabase
      .from('Project_users')
      .select('*')
      .eq('project_id', projectId)

    if (error1) {
      console.error('Error loading project users:', error1)
      setLoadingUsers(false)
      return
    }

    // If no users in project, set empty and return
    if (!projectUsers || projectUsers.length === 0) {
      setUsersInProject([])
      setLoadingUsers(false)
      return
    }

    // Extract user IDs
    const userIds = projectUsers.map(pu => pu.user_id)

    // Step 2: Get full user details
    const { data: users, error: error2 } = await supabase
      .from('Users')
      .select('*')
      .in('user_id', userIds)
      .order('alias')

    if (error2) {
      console.error('Error loading users:', error2)
    } else {
      setUsersInProject(users)
      console.log('Loaded users for project', projectId, ':', users)
    }

    setLoadingUsers(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATASET 3: LOAD TASKS FOR SELECTED USER (runs when user changes)
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (selectedUserId && selectedProjectId) {
      loadUserTasks(selectedUserId, selectedProjectId)
    } else {
      setUserTasks([])
    }
  }, [selectedUserId, selectedProjectId])  // Run when either changes

  async function loadUserTasks(userId, projectId) {
    setLoadingTasks(true)

    // Step 1: Get task IDs for this user
    const { data: userTaskData, error: error1 } = await supabase
      .from('User_tasks')
      .select('*')
      .eq('user_id', userId)

    if (error1) {
      console.error('Error loading user tasks:', error1)
      setLoadingTasks(false)
      return
    }

    if (!userTaskData || userTaskData.length === 0) {
      setUserTasks([])
      setLoadingTasks(false)
      return
    }

    // Extract task IDs
    const taskIds = userTaskData.map(ut => ut.task_id)

    // Step 2: Get full task details, filtered by project
    const { data: tasks, error: error2 } = await supabase
      .from('Tasks')
      .select('*')
      .in('task_id', taskIds)
      .eq('project_id', projectId)
      .order('created_at')

    if (error2) {
      console.error('Error loading tasks:', error2)
    } else {
      setUserTasks(tasks)
      // --- Notification thing ---
      // Assume project has a field "current_sprint"
      const project = projects.find(p => p.project_id === projectId);
      const currentSprint = 2;

      // Filter tasks where sprint_num is past
      const late = tasks
        .filter(t => !t.complete && t.sprint_num < currentSprint)
        .sort((a, b) => b.points - a.points); // order by points desc

      setLateSprintWarnings(late);
      // -- Notification thing end ---
      console.log('Loaded tasks for user', userId, 'in project', projectId, ':', tasks)
    }

    setLoadingTasks(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  if (loadingProjects) {
    return <div>Loading projects...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/projects">Old Things</Link>
      <h1>Project Task Manager</h1>

      {/* ─── PROJECT SELECTOR ─────────────────────────────────────────────── */}
      <div className="head_box">
        <div style={{ marginBottom: '20px' }}>
          <label> {/* Edit UI */}
            <strong>Select Project: </strong>
            <select 
              value={selectedProjectId || ''} 
              onChange={(e) => {
                const projectId = e.target.value ? Number(e.target.value) : null
                setSelectedProjectId(projectId)
                setSelectedUserId(null)  // Reset user selection
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
          
          <div style={{ marginTop: '10px'}}>
            Total projects: {projects.length}
          </div>
        </div>

        {/* ─── USER SELECTOR ────────────────────────────────────────────────── */}
        {/* Edit UI */}
        {selectedProjectId && (
          <div style={{ marginBottom: '20px', paddingLeft: '20px' }}>
            <label>
              <strong>Select User: </strong>
              {loadingUsers ? (
                <span>Loading users...</span>
              ) : (
                <select 
                  value={selectedUserId || ''} 
                  onChange={(e) => {
                    const userId = e.target.value ? Number(e.target.value) : null
                    setSelectedUserId(userId)
                  }}
                >
                  <option value="">-- Choose a user --</option>
                  {usersInProject.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.alias} ({user.username})
                    </option>
                  ))}
                </select>
              )}
            </label>
            
            <div style={{ marginTop: '10px'}}>
              Users in this project: {usersInProject.length}
            </div>
          </div>
          )}
      </div>

      {/* ─── TASKS DISPLAY ────────────────────────────────────────────────── */}
      {/* Edit UI */}
      {selectedUserId && selectedProjectId && (
        <div style={{ marginTop: '20px', paddingLeft: '40px' }}>
          <h3>Tasks</h3>
          
          {loadingTasks ? (
            <div>Loading tasks...</div>
          ) : userTasks.length === 0 ? (
            <div>No tasks found for this user in this project.</div>
          ) : (
            <>
              <div style={{ marginBottom: '10px'}}>
                Total tasks: {userTasks.length}
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {userTasks.map(task => (
                  <li 
                    key={task.task_id} 
                    style={{ 
                      marginBottom: '15px', 
                      padding: '10px', 
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: task.complete ? 'var()' : 'var(--box-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={task.complete}
                        onChange={() => toggleTask(task.task_id, task.complete)}
                      />
                      <span style={{ 
                        textDecoration: task.complete ? 'line-through' : 'none',
                        flex: 1
                      }}>
                        {task.description}
                      </span>
                      <span style={{ 
                        padding: '2px 8px',
                        backgroundColor: task.color,
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {task.points} pts
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        Sprint {task.sprint_num}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <button onClick={() => setShowThemeMenu(!showThemeMenu)}>Themes</button>
      <div className={`toggle ${showThemeMenu ? "theme-visible" : "theme-hidden"}`}>
        <button onClick={() => setTheme("dark")}>Dark</button>
        <button onClick={() => setTheme("ocean")}>Ocean</button>
        <button onClick={() => setTheme("sunset")}>Sunset</button>
        <button onClick={() => setTheme("forest")}>Forest</button>
        <button onClick={() => setTheme("lavender")}>Lavender</button>
        <button onClick={() => setTheme("cyberpunk")}>Cyberpunk</button>
        <button onClick={() => setTheme("sand")}>Sand</button>
        <button onClick={() => setTheme("midnight")}>Midnight</button>
      </div>
      {/* Notification html Addition */}
      {lateSprintWarnings.length > 0 && (
        <div className="late-warning-box">
          <h4>⚠ Past Sprint Tasks</h4>
          <ul>
            {lateSprintWarnings.map(t => (
              <li key={t.task_id}>
                <strong>{t.points} pts</strong> — {t.description} (Sprint {t.sprint_num})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ProjectTaskManager

// ═══════════════════════════════════════════════════════════════════════════════
// HOW THE DATA FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

/*

1. Component loads
   └─> loadProjects() runs
       └─> projects state fills with all projects

2. User selects a project
   └─> selectedProjectId updates
       └─> useEffect detects change
           └─> loadUsersInProject() runs
               └─> usersInProject state fills with users in that project

3. User selects a user
   └─> selectedUserId updates
       └─> useEffect detects change
           └─> loadUserTasks() runs
               └─> userTasks state fills with tasks for that user in that project

*/

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLIFIED VERSION - JUST THE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

async function getProjects() {
  const { data, error } = await supabase
    .from('Projects')
    .select('*')
    .order('project_name')
  
  return data
}

async function getUsersInProject(projectId) {
  // Get user IDs from junction table
  const { data: projectUsers } = await supabase
    .from('Project_users')
    .select('*')
    .eq('project_id', projectId)
  
  const userIds = projectUsers.map(pu => pu.user_id)
  
  // Get full user details
  const { data: users } = await supabase
    .from('Users')
    .select('*')
    .in('user_id', userIds)
    .order('alias')
  
  return users
}

async function getUserTasks(userId, projectId) {
  // Get task IDs for user
  const { data: userTasks } = await supabase
    .from('User_tasks')
    .select('*')
    .eq('user_id', userId)
  
  const taskIds = userTasks.map(ut => ut.task_id)
  
  // Get task details filtered by project
  const { data: tasks } = await supabase
    .from('Tasks')
    .select('*')
    .in('task_id', taskIds)
    .eq('project_id', projectId)
    .order('created_at')
  
  return tasks
}