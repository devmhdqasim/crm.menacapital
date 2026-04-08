import axios from 'axios';

/**
 * Task Service
 * Handles all task management related API calls including:
 * - Get All Tasks (with pagination)
 * - Create Task
 * - Update Task
 * - Delete Task
 */

const API_BASE_URL = 'https://staging.crm.saveingold.app/api/v1';

/** 
 * Get refresh token from localStorage
 * @returns {string|null} - Returns refresh token or null
 */
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const getUserInfo = () => { 
  return localStorage.getItem('userInfo');
};

/**
 * Search leads by ID
 * @param {string} keyword - Search keyword (Lead ID)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of matching leads
 */
export const searchLeadById = async (keyword, page = 1, limit = 10) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Searching leads by ID...');
    console.log('🔍 Keyword:', keyword);
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/lead/searchById/en?keyword=${encodeURIComponent(keyword)}&paramPage=${page}&paramLimit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead search successful:', response.data);

    const data = response.data;
    
    console.log('🔍 Checking response structure...');
    console.log('📦 data.status:', data.status);
    console.log('📦 data.payload:', data.payload);
    console.log('📦 data.payload?.allSearchedLeads:', data.payload?.allSearchedLeads);

    if (data.status === 'success' && data.payload?.allSearchedLeads) {
      const leadsData = data.payload.allSearchedLeads;
      
      console.log('📊 Found', leadsData.length, 'leads');
      console.log('📊 First lead:', leadsData[0]);
      
      return {
        success: true,
        data: leadsData,
        metadata: {
          total: leadsData.length,
          page: page,
          limit: limit
        },
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      console.error('❌ Full response data:', JSON.stringify(data, null, 2));
      return {
        success: false,
        message: data.message || 'No leads found',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Search leads error:', error);
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
        message: error.response.data?.message || 'Failed to search leads',
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
 * @param {string} taskData.answerStatus - Answer status (Answered, Not Answered) - Optional
 * @param {string} taskData.leadRemarks - Lead remarks (optional)
 * @param {string} taskData.leadResponseStatus - Lead response status (optional)
 * @param {string} taskData.leadStatus - Lead status (optional)
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
      answerStatus: taskData.answerStatus || '', // FIXED: Use answerStatus (without "ed")
      leadRemarks: taskData.leadRemarks || '',
      leadResponseStatus: taskData.leadResponseStatus || '',
      leadStatus: taskData.leadStatus || '', // Add leadStatus field
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
 * Create a new auto task (simplified version)
 * @param {Object} taskData - Task data object
 * @param {string} taskData.leadId - Lead's ID (_id)
 * @param {string} taskData.leadStatus - Lead status
 * @param {string} taskData.taskTitle - Task title
 * @param {string} taskData.taskDescription - Task description
 * @returns {Promise} - Returns created task info
 */
export const createAutoTask = async (taskData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Creating new auto task...');
    console.log('📝 Task data:', taskData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      leadId: taskData.leadId,
      leadStatus: taskData.leadStatus,
      taskTitle: taskData.taskTitle,
      taskDescription: taskData.taskDescription
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.post(
      `${API_BASE_URL}/task/auto/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Auto task created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Auto task creation successful');
      console.log('📨 Message:', data.message);

      return {
        success: true,
        data: data.payload,
        message: data.message || 'Task created successfully',
      };
    } else {
      console.error('❌ Auto task creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create task',
      };
    }
  } catch (error) {
    console.error('❌ Create auto task error:', error);
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
        message: error.response.data?.message || 'Lead not found.',
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
    console.log('📝 Task data received:', taskData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload - FIXED: Use answerStatus instead of answeredStatus
    const payload = {
      _id: taskId,
      agentId: taskData.agentId,
      leadId: taskData.leadId,
      taskTitle: taskData.taskTitle,
      taskDescription: taskData.taskDescription,
      taskPriority: taskData.taskPriority,
      taskScheduledDate: taskData.taskScheduledDate,
      taskStatus: taskData.taskStatus,
      answerStatus: taskData.answerStatus || '', // FIXED: Use answerStatus (not answeredStatus)
      leadRemarks: taskData.leadRemarks || '',
      leadResponseStatus: taskData.leadResponseStatus || '',
    };

    // Add salesManagerId only if provided
    if (taskData.salesManagerId) {
      payload.salesManagerId = taskData.salesManagerId;
    }

    console.log('📤 Sending payload to API:', payload);
    console.log('📤 answerStatus value:', payload.answerStatus);

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
 * @param {string} keyword - Search keyword (optional)
 * @param {string} status - Task status filter (optional)
 * @param {string} assignedBy - Assigned by filter (optional)
 * @param {string} priority - Priority filter (optional)
 * @param {string} leadId - Lead ID filter (optional)
 * @returns {Promise} - Returns list of tasks with pagination info
 */
export const getAllTasks = async (page = 1, limit = 10, startDate = '', endDate = '', keyword = '', status = '', assignedBy = '', priority = '', leadId = '') => {
  try {
    const authToken = getRefreshToken();
    console.log('🔵 Fetching tasks...');
    console.log('📄 Page:', page, 'Limit:', limit);
    console.log('🔍 Filters:', { keyword, status, assignedBy, priority, leadId });
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }
    
    console.log('🔑 Using refresh token for API call');
    
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    const userRole = userInfo?.roleName;
    
    // Build the correct API URL based on user role
    const roleParam = userRole === 'Agent' ? 'assignedBy' : 'assignedTo';
    
    const refreshUrl = `${API_BASE_URL}/task/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}&keyword=${keyword}&status=${status}&${roleParam}=${assignedBy}&priority=${priority}&leadId=${leadId}`;
    
    console.log('🌐 API URL:', refreshUrl);
    console.log('👤 User Role:', userRole);
    console.log('🔑 Using parameter:', roleParam);
    console.log('🎯 Lead ID Filter:', leadId || 'None');
    
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
      const summary = data.payload.allTasks[0].summary || []; // ✅ ADD THIS LINE
      
      console.log('📊 Retrieved', tasksData.length, 'tasks');
      console.log('📊 Total tasks:', metadata.total);
      console.log('📊 Current page:', metadata.page);
      console.log('📊 Summary data:', summary); // ✅ ADD THIS LINE
      
      return {
        success: true,
        data: tasksData,
        metadata: metadata,
        summary: summary, // ✅ ADD THIS LINE
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