import axios from 'axios';

/**
 * Task Service
 * Handles all task management related API calls including:
 * - Get All Tasks (with pagination)
 * - Create Task
 * - Update Task
 * - Delete Task
 */

const API_BASE_URL = 'https://api.crm.saveingold.app/api/v1';

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Returns refresh token or null
 */
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Create a new task
 * @param {Object} taskData - Task data object
 * @param {string} taskData.agentId - Agent's ID (_id)
 * @param {string} taskData.leadId - Lead's ID (_id)
 * @param {string} taskData.salesManagerId - Sales Manager's ID (_id) - Optional
 * @param {string} taskData.taskTitle - Task title
 * @param {string} taskData.taskDescription - Task description
 * @param {string} taskData.taskPriority - Task priority (High, Normal, Low)
 * @param {string} taskData.taskScheduledDate - Scheduled date (YYYY-MM-DD)
 * @param {string} taskData.taskStatus - Task status (Open, In Progress, Completed, Pending)
 * @param {string} taskData.leadRemarks - Lead remarks (optional)
 * @param {string} taskData.leadResponseStatus - Lead response status (optional)
 * @returns {Promise} - Returns created task info
 */
export const createTask = async (taskData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Creating new task...');
    console.log('📝 Task data:', taskData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      agentId: taskData.agentId,
      leadId: taskData.leadId,
      taskTitle: taskData.taskTitle,
      taskDescription: taskData.taskDescription,
      taskPriority: taskData.taskPriority,
      taskScheduledDate: taskData.taskScheduledDate,
      taskStatus: taskData.taskStatus,
      leadRemarks: taskData.leadRemarks || '',
      leadResponseStatus: taskData.leadResponseStatus || '',
    };

    // Add salesManagerId only if provided
    if (taskData.salesManagerId) {
      payload.salesManagerId = taskData.salesManagerId;
    }

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.post(
      `${API_BASE_URL}/task/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Task created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Task creation successful');
      console.log('📨 Message:', data.message);

      return {
        success: true,
        data: data.payload,
        message: data.message || 'Task created successfully',
      };
    } else {
      console.error('❌ Task creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create task',
      };
    }
  } catch (error) {
    console.error('❌ Create task error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response?.status === 400) {
      console.error('❌ Bad request (400), validation error');
      return {
        success: false,
        message: error.response.data?.message || 'Invalid task data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 404) {
      console.error('❌ Not found (404)');
      return {
        success: false,
        message: error.response.data?.message || 'Agent or Lead not found.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create task',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Update an existing task
 * @param {string} taskId - Task's ID (_id)
 * @param {Object} taskData - Task data to update (same structure as createTask)
 * @returns {Promise} - Returns updated task info
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating task...');
    console.log('🆔 Task ID:', taskId);
    console.log('📝 Task data:', taskData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      _id: taskId,
      agentId: taskData.agentId,
      leadId: taskData.leadId,
      taskTitle: taskData.taskTitle,
      taskDescription: taskData.taskDescription,
      taskPriority: taskData.taskPriority,
      taskScheduledDate: taskData.taskScheduledDate,
      taskStatus: taskData.taskStatus,
      leadRemarks: taskData.leadRemarks || '',
      leadResponseStatus: taskData.leadResponseStatus || '',
    };

    // Add salesManagerId only if provided
    if (taskData.salesManagerId) {
      payload.salesManagerId = taskData.salesManagerId;
    }

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/task/update/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Task updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Task update successful');
      console.log('📨 Message:', data.message);

      return {
        success: true,
        data: data.payload,
        message: data.message || 'Task updated successfully',
      };
    } else {
      console.error('❌ Task update failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to update task',
      };
    }
  } catch (error) {
    console.error('❌ Update task error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response?.status === 400) {
      console.error('❌ Bad request (400), validation error');
      return {
        success: false,
        message: error.response.data?.message || 'Invalid task data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 404) {
      console.error('❌ Not found (404)');
      return {
        success: false,
        message: error.response.data?.message || 'Task not found.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to update task',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Delete a task
 * @param {string} taskId - Task's ID (_id)
 * @returns {Promise} - Returns deletion result
 */
export const deleteTask = async (taskId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting task...');
    console.log('🆔 Task ID:', taskId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.patch(
      `${API_BASE_URL}/task/delete/en`,
      { _id: taskId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Task deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Task deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete task',
      };
    }
  } catch (error) {
    console.error('❌ Delete task error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to delete task',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Get all tasks with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @param {string} startDate - Start date for filtering (optional)
 * @param {string} endDate - End date for filtering (optional)
 * @returns {Promise} - Returns list of tasks with pagination info
 */
export const getAllTasks = async (page = 1, limit = 10, startDate = '', endDate = '') => {
  try {
    const authToken = getRefreshToken();
    console.log('🔵 Fetching tasks...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }
    
    console.log('🔑 Using refresh token for API call');
    
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;
    
    const refreshUrl = `${API_BASE_URL}/task/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`;
    
    const response = await axios.get(
      refreshUrl,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );
    
    console.log('✅ Tasks fetched successfully:', response.data);
    const data = response.data;
    
    if (data.status === 'success' && data.payload?.allTasks?.[0]?.data) {
      const tasksData = data.payload.allTasks[0].data;
      const metadata = data.payload.allTasks[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', tasksData.length, 'tasks');
      console.log('📊 Total tasks:', metadata.total);
      console.log('📊 Current page:', metadata.page);
      
      return {
        success: true,
        data: tasksData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch tasks',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch tasks',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Debug function to check task service state
 */
export const debugTaskService = () => {
  console.log('🔍 === TASK SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('==================================');
};