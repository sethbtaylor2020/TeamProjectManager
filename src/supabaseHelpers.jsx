// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE DATABASE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

import supabase from './config/supabaseClient'

// ─── TASK FUNCTIONS ────────────────────────────────────────────────────────────

/**
 * Add a new task to the database
 * @param {Object} params
 * @param {string} params.description - Task description (required)
 * @param {number} params.projectId - Project ID (required)
 * @param {number} params.userId - User ID to assign task to (required)
 * @param {string} params.color - Task color (optional)
 * @param {number} params.points - Task points (optional)
 * @param {number} params.sprintNum - Sprint number (optional)
 * @param {boolean} params.complete - Completion status (optional, default: false)
 * @returns {boolean} true if success, false if failure
 */
export async function addTask({ 
  description, 
  projectId, 
  userId, 
  color = null, 
  points = null, 
  sprintNum = null, 
  complete = false 
}) {
  try {
    // Generate UUID for task
    const taskId = crypto.randomUUID()

    // Insert task
    const { error: taskError } = await supabase
      .from('Tasks')
      .insert({
        task_id: taskId,
        description,
        project_id: projectId,
        color,
        points,
        sprint_num: sprintNum,
        complete,
        created_at: new Date().toISOString()
      })

    if (taskError) throw taskError

    // Assign to user
    const { error: assignError } = await supabase
      .from('User_tasks')
      .insert({
        user_id: userId,
        task_id: taskId
      })

    if (assignError) throw assignError

    return true
  } catch (error) {
    console.error('Error adding task:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Remove a task from the database
 * @param {string} taskId - UUID of the task to remove
 * @returns {boolean} true if success, false if failure
 */
export async function removeTask(taskId) {
  try {
    // Delete from User_tasks first (manual cascade)
    const { error: userTaskError } = await supabase
      .from('User_tasks')
      .delete()
      .eq('task_id', taskId)

    if (userTaskError) throw userTaskError

    // Delete task
    const { error: taskError } = await supabase
      .from('Tasks')
      .delete()
      .eq('task_id', taskId)

    if (taskError) throw taskError

    return true
  } catch (error) {
    console.error('Error removing task:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Update task fields
 * @param {string} taskId - UUID of the task to update
 * @param {Object} updates - Object containing fields to update
 * @param {string} updates.description - New description
 * @param {string} updates.color - New color
 * @param {number} updates.points - New points value
 * @param {number} updates.sprint_num - New sprint number
 * @param {boolean} updates.complete - New completion status
 * @param {number} updates.project_id - New project ID
 * @returns {boolean} true if success, false if failure
 */
export async function updateTask(taskId, updates) {
  try {
    const { error } = await supabase
      .from('Tasks')
      .update(updates)
      .eq('task_id', taskId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error updating task:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Update only the completion status of a task
 * @param {string} taskId - UUID of the task
 * @param {boolean} complete - New completion status
 * @returns {boolean} true if success, false if failure
 */
export async function updateTaskStatus(taskId, complete) {
  return updateTask(taskId, { complete })
}

/**
 * Assign an additional user to a task
 * NOTE: Tasks can have multiple users. This ADDS a user to the task.
 * If you're seeing unexpected behavior, check if the task already has this user assigned.
 * To remove a user from a task, use removeUserFromTask()
 * @param {string} taskId - UUID of the task
 * @param {number} userId - ID of the user to assign
 * @returns {boolean} true if success, false if failure
 */
export async function reassignTaskUser(taskId, userId) {
  try {
    const { error } = await supabase
      .from('User_tasks')
      .insert({
        user_id: userId,
        task_id: taskId
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error reassigning task user:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Remove a user from a task assignment
 * @param {string} taskId - UUID of the task
 * @param {number} userId - ID of the user to remove
 * @returns {boolean} true if success, false if failure
 */
export async function removeUserFromTask(taskId, userId) {
  try {
    const { error } = await supabase
      .from('User_tasks')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error removing user from task:', error)
    // TODO: Add alert for user
    return false
  }
}

// ─── USER FUNCTIONS ────────────────────────────────────────────────────────────

/**
 * Add a new user to the database
 * @param {Object} params
 * @param {number} params.userId - User ID (required)
 * @param {string} params.username - Username (required)
 * @param {string} params.alias - Display name (optional)
 * @param {string} params.email - Email address (optional)
 * @param {string} params.phoneNumber - Phone number (optional)
 * @returns {boolean} true if success, false if failure
 */
export async function addUser({ 
  userId, 
  username, 
  alias = null, 
  email = null, 
  phoneNumber = null 
}) {
  try {
    const { error } = await supabase
      .from('Users')
      .insert({
        user_id: userId,
        username,
        alias,
        email,
        phone_number: phoneNumber
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error adding user:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Remove a user from the database (also removes from all projects and tasks)
 * @param {number} userId - ID of the user to remove
 * @returns {boolean} true if success, false if failure
 */
export async function removeUser(userId) {
  try {
    // Remove from User_tasks
    const { error: userTaskError } = await supabase
      .from('User_tasks')
      .delete()
      .eq('user_id', userId)

    if (userTaskError) throw userTaskError

    // Remove from Project_users
    const { error: projectUserError } = await supabase
      .from('Project_users')
      .delete()
      .eq('user_id', userId)

    if (projectUserError) throw projectUserError

    // Remove user
    const { error: userError } = await supabase
      .from('Users')
      .delete()
      .eq('user_id', userId)

    if (userError) throw userError

    return true
  } catch (error) {
    console.error('Error removing user:', error)
    // TODO: Add alert for user
    return false
  }
}

// ─── PROJECT FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Add a new project to the database
 * @param {Object} params
 * @param {number} params.projectId - Project ID (required)
 * @param {string} params.projectName - Project name (required)
 * @param {string} params.createdAt - Creation timestamp (optional, defaults to now)
 * @returns {boolean} true if success, false if failure
 */
export async function addProject({ projectId, projectName, createdAt = null }) {
  try {
    const { error } = await supabase
      .from('Projects')
      .insert({
        Project_id: projectId,
        project_name: projectName,
        created_at: createdAt || new Date().toISOString()
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error adding project:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Remove a project from the database (also removes all tasks and user assignments)
 * @param {number} projectId - ID of the project to remove
 * @returns {boolean} true if success, false if failure
 */
export async function removeProject(projectId) {
  try {
    // Get all tasks in this project
    const { data: tasks, error: getTasksError } = await supabase
      .from('Tasks')
      .select('task_id')
      .eq('project_id', projectId)

    if (getTasksError) throw getTasksError

    // Remove each task (which will also remove from User_tasks)
    for (const task of tasks) {
      const success = await removeTask(task.task_id)
      if (!success) throw new Error(`Failed to remove task ${task.task_id}`)
    }

    // Remove from Project_users
    const { error: projectUserError } = await supabase
      .from('Project_users')
      .delete()
      .eq('project_id', projectId)

    if (projectUserError) throw projectUserError

    // Remove project
    const { error: projectError } = await supabase
      .from('Projects')
      .delete()
      .eq('Project_id', projectId)

    if (projectError) throw projectError

    return true
  } catch (error) {
    console.error('Error removing project:', error)
    // TODO: Add alert for user
    return false
  }
}

// ─── PROJECT-USER ASSIGNMENT FUNCTIONS ─────────────────────────────────────────

/**
 * Assign a user to a project
 * @param {number} userId - ID of the user
 * @param {number} projectId - ID of the project
 * @returns {boolean} true if success, false if failure
 */
export async function assignUserToProject(userId, projectId) {
  try {
    const { error } = await supabase
      .from('Project_users')
      .insert({
        user_id: userId,
        project_id: projectId
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error assigning user to project:', error)
    // TODO: Add alert for user
    return false
  }
}

/**
 * Remove a user from a project (also removes them from all tasks in that project)
 * @param {number} userId - ID of the user
 * @param {number} projectId - ID of the project
 * @returns {boolean} true if success, false if failure
 */
export async function removeUserFromProject(userId, projectId) {
  try {
    // Get all task IDs for this user in this project
    const { data: userTasks, error: getUserTasksError } = await supabase
      .from('User_tasks')
      .select('task_id')
      .eq('user_id', userId)

    if (getUserTasksError) throw getUserTasksError

    if (userTasks && userTasks.length > 0) {
      const taskIds = userTasks.map(ut => ut.task_id)

      // Get tasks that belong to this project
      const { data: projectTasks, error: getProjectTasksError } = await supabase
        .from('Tasks')
        .select('task_id')
        .in('task_id', taskIds)
        .eq('project_id', projectId)

      if (getProjectTasksError) throw getProjectTasksError

      // Remove user from those tasks
      if (projectTasks && projectTasks.length > 0) {
        const projectTaskIds = projectTasks.map(t => t.task_id)

        const { error: removeTasksError } = await supabase
          .from('User_tasks')
          .delete()
          .eq('user_id', userId)
          .in('task_id', projectTaskIds)

        if (removeTasksError) throw removeTasksError
      }
    }

    // Remove from Project_users
    const { error: projectUserError } = await supabase
      .from('Project_users')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)

    if (projectUserError) throw projectUserError

    return true
  } catch (error) {
    console.error('Error removing user from project:', error)
    // TODO: Add alert for user
    return false
  }
}