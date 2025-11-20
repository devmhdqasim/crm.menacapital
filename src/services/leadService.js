import axios from 'axios';


/**
 * Lead Service
 * Handles all lead management related API calls including:
 * - Get All Leads (with pagination)
 * - Create Lead
 * - Update Lead
 * - Delete Lead
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
 * Assign a lead to an agent
 * @param {string} leadId - Lead's ID (_id)
 * @param {string} agentId - Agent's ID (_id)
 * @returns {Promise} - Returns assignment result
 */
export const assignLeadToAgent = async (leadId, agentId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Assigning lead to agent...');
    console.log('📝 Lead ID:', leadId);
    console.log('👤 Agent ID:', agentId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const payload = {
      leadId: leadId,
      agentId: agentId,
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/lead/assignToAgent/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead assigned successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Assignment successful');
      console.log('📨 Message:', data.message);

      return {
        success: true,
        data: data.payload,
        message: data.message || 'Lead assigned to agent successfully',
      };
    } else {
      console.error('❌ Assignment failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to assign lead to agent',
      };
    }
  } catch (error) {
    console.error('❌ Assign lead to agent error:', error);
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
        message: error.response.data?.message || 'Invalid data. Please check lead ID and agent ID.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 404) {
      console.error('❌ Not found (404)');
      return {
        success: false,
        message: error.response.data?.message || 'Lead or Agent not found.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to assign lead to agent',
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
 * Update lead task with response status and remarks
 * @param {string} leadId - Lead's ID (_id)
 * @param {Object} taskPayload - Task payload object containing:
 *   @param {boolean} taskPayload.contacted - Whether the lead was contacted
 *   @param {boolean} taskPayload.answered - Whether the lead answered
 *   @param {boolean} taskPayload.interested - Whether the lead is interested
 *   @param {boolean} taskPayload.hot - Whether it's a hot lead
 *   @param {boolean} taskPayload.cold - Whether it's a cold lead
 *   @param {boolean} taskPayload.real - Whether it's a real account
 *   @param {boolean} taskPayload.deposited - Whether deposit was made
 *   @param {string} taskPayload.latestRemarks - Remarks or notes about the lead
 *   @param {string} taskPayload.currentStatus - Current status description
 * @returns {Promise} - Returns update result
 */
export const updateLeadTask = async (leadId, taskPayload) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating lead task...');
    console.log('🆔 Lead ID:', leadId);
    console.log('📊 Task Payload:', taskPayload);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const payload = {
      _id: leadId,
      leadAgentId: taskPayload.leadAgentId || localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo')).id 
        : null,

      contacted: taskPayload.contacted,
      answered: taskPayload.answered,
      interested: taskPayload.interested,
      hot: taskPayload.hot,
      cold: taskPayload.cold,
      real: taskPayload.real,
      demo: taskPayload.demo,
      deposited: taskPayload.deposited,


      // contacted: true,
      // answered: true,
      // interested: true,
      // hot: false,
      // cold: false,
      // real: false,
      // demo: false,
      // deposited: false,

      lastUpdatedAt: "2025-11-14T10:25:00.000Z",
      latestRemarks: taskPayload.latestRemarks || '',
      currentStatus: taskPayload.currentStatus || ''
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/lead/updateStatus/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead task updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Task update successful');
      console.log('📨 Message:', data.message);

      return {
        success: true,
        data: data.payload,
        message: data.message || 'Lead task updated successfully',
      };
    } else {
      console.error('❌ Task update failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to update lead task',
      };
    }
  } catch (error) {
    console.error('❌ Update lead task error:', error);
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
        message: error.response.data?.message || 'Invalid data. Please check all fields.',
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
        message: error.response.data?.message || 'Failed to update lead task',
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
 * Get all leads with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of leads with pagination info
 */
export const getAllLeads = async (page = 1, limit = 10, startDate, endDate) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching leads...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const isBranchLogin = userInfo?.roleName === 'Agent' || userInfo?.role === 'Agent';
    const refreshUrl = isBranchLogin
      ? `${API_BASE_URL}/lead/agents/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`
      : `${API_BASE_URL}/lead/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`;

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

    console.log('✅ Leads fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allLeads?.[0]?.data) {
      const leadsData = data.payload.allLeads[0].data;
      const metadata = data.payload.allLeads[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', leadsData.length, 'leads');
      console.log('📊 Total leads:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: leadsData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch leads',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get leads error:', error);
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
        message: error.response.data?.message || 'Failed to fetch leads',
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

export const getAllBranchLeads = async (page = 1, limit = 10, startDate, endDate) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching leads...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const refreshUrl =`${API_BASE_URL}/lead/branch/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`

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

    console.log('✅ Leads fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allLeads?.[0]?.data) {
      const leadsData = data.payload.allLeads[0].data;
      const metadata = data.payload.allLeads[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', leadsData.length, 'leads');
      console.log('📊 Total leads:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: leadsData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch leads',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get leads error:', error);
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
        message: error.response.data?.message || 'Failed to fetch leads',
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
 * Delete a user (PATCH METHOD)
 * @param {string} userId - User's ID to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteBranch = async (userId) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Deleting user...');
    console.log('🆔 User ID:', userId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.patch(
      `${API_BASE_URL}/lead/branch/delete/en`, 
      { _id: userId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ User deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'User deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete user',
      };
    }
  } catch (error) {
    console.error('❌ Delete user error:', error);
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
        message: error.response.data?.message || 'Failed to delete user',
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

export const getAllSalesManagerLeads = async (page = 1, limit = 10, fromDate = '', toDate = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching leads...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const refreshUrl = `${API_BASE_URL}/lead/sales/en?paramPage=${page}&paramLimit=${limit}&fromDate=${fromDate}&toDate=${toDate}`

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

    console.log('✅ Leads fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allBranchLeads?.[0]?.data) {
      const leadsData = data.payload.allBranchLeads[0].data;
      const metadata = data.payload.allBranchLeads[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', leadsData.length, 'leads');
      console.log('📊 Total leads:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: leadsData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch leads',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get leads error:', error);
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
        message: error.response.data?.message || 'Failed to fetch leads',
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
 * Create a new lead
 * @param {Object} leadData - Lead data object
 * @param {string} leadData.leadName - Lead's full name
 * @param {string} leadData.leadEmail - Lead's email address
 * @param {string} leadData.leadPhoneNumber - Lead's phone number
 * @param {string} leadData.leadResidency - Lead's country of residency
 * @param {string} leadData.leadPreferredLanguage - Lead's preferred language
 * @param {string} leadData.leadDateOfBirth - Lead's date of birth (YYYY-MM-DD)
 * @param {string} leadData.leadNationality - Lead's nationality
 * @param {string} leadData.leadDescription - Description or notes about the lead
 * @param {string} leadData.leadSource - Source of the lead (e.g., "Facebook Ads", "Website")
 * @param {string} leadData.leadSourceId - Source of the lead (e.g., "Facebook Ads", "Website")
 * @param {string} leadData.leadStatus - Status of the lead (e.g., "New", "Contacted", "Qualified")
 * @returns {Promise} - Returns created lead info
 */
export const createLead = async (leadData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Creating new lead...');
    console.log('📝 Lead data:', {
      leadName: leadData.leadName,
      leadEmail: leadData.leadEmail,
      leadSource: leadData.leadSource,
      leadSourceId: leadData.leadSourceId,
      leadStatus: leadData.leadStatus,
    });
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      leadName: leadData.leadName,
      leadEmail: leadData.leadEmail,
      leadPhoneNumber: leadData.leadPhoneNumber,
      leadResidency: leadData.leadResidency,
      leadPreferredLanguage: leadData.leadPreferredLanguage || 'English',
      leadDateOfBirth: leadData.leadDateOfBirth,
      leadNationality: leadData.leadNationality,
      leadDescription: leadData.leadDescription || '',
      leadSource: leadData.leadSource,
      leadSourceId: leadData.leadSourceId,
      leadStatus: leadData.leadStatus || 'New',
      depositStatus: leadData.depositStatus || '',
    };

    console.log('📤 Sending payload to API');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const isBranchLogin = userInfo?.roleName === 'Kiosk Member' || userInfo?.role === 'Kiosk Member';
    const refreshUrl = isBranchLogin
      ? `${API_BASE_URL}/lead/branch/create/en`
      : `${API_BASE_URL}/lead/create/en`;

    const response = await axios.post(
      refreshUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Lead creation successful');
      console.log('📨 Message:', data.payload?.message);

      return {
        success: true,
        data: data.payload,
        message: data.payload?.message || data.message || 'Lead created successfully',
      };
    } else {
      console.error('❌ Lead creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create lead',
      };
    }
  } catch (error) {
    console.error('❌ Create lead error:', error);
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
        message: error.response.data?.message || 'Invalid lead data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 409) {
      console.error('❌ Conflict (409), lead may already exist');
      return {
        success: false,
        message: error.response.data?.message || 'Lead with this email or phone already exists.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create lead',
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
 * Update an existing lead
 * @param {string} leadId - Lead's ID
 * @param {Object} leadData - Lead data to update (same structure as createLead)
 * @returns {Promise} - Returns updated lead info
 */
export const updateLead = async (leadId, leadData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating lead...');
    console.log('🆔 Lead ID:', leadId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const isBranchLogin = userInfo?.roleName === 'Kiosk Member' || userInfo?.role === 'Kiosk Member';
    const refreshUrl = isBranchLogin
      ? `${API_BASE_URL}/lead/branch/update/en`
      : `${API_BASE_URL}/lead/update/en`;

    const response = await axios.patch(
      refreshUrl,
      {...leadData, _id: leadId},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Lead updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update lead',
      };
    }
  } catch (error) {
    console.error('❌ Update lead error:', error);
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
        message: error.response.data?.message || 'Failed to update lead',
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
 * Delete a lead
 * @param {string} leadId - Lead's ID to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteLead = async (leadId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting lead...');
    console.log('🆔 Lead ID:', leadId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const isBranchLogin = userInfo?.roleName === 'Kiosk Member' || userInfo?.role === 'Kiosk Member';
    const refreshUrl = isBranchLogin
      ? `${API_BASE_URL}/lead/branch/delete/en`
      : `${API_BASE_URL}/lead/delete/en`;

    const response = await axios.delete(
      refreshUrl,
      {_id: leadId},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Lead deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete lead',
      };
    }
  } catch (error) {
    console.error('❌ Delete lead error:', error);
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
        message: error.response.data?.message || 'Failed to delete lead',
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
 * Search leads by query
 * @param {string} query - Search query (name, email, phone, etc.)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns filtered list of leads
 */
export const searchLeads = async (query, page = 1, limit = 10) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Searching leads...');
    console.log('🔍 Query:', query);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/lead/search/en?query=${encodeURIComponent(query)}&paramPage=${page}&paramLimit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Leads search completed:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload?.leads || [],
        metadata: data.payload?.metadata || {},
        message: data.message,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Search failed',
        data: [],
      };
    }
  } catch (error) {
    console.error('❌ Search leads error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search leads',
      data: [],
    };
  }
};

/**
 * Get lead statistics
 * @returns {Promise} - Returns lead statistics (total, by status, by source, etc.)
 */
export const getLeadStats = async () => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching lead statistics...');
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/lead/stats/en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead statistics fetched:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch statistics',
      };
    }
  } catch (error) {
    console.error('❌ Get lead stats error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch statistics',
    };
  }
};

/**
 * Update lead status
 * @param {string} leadId - Lead's ID
 * @param {string} newStatus - New status (e.g., "New", "Contacted", "Qualified", "Converted", "Lost")
 * @returns {Promise} - Returns update result
 */
export const updateLeadStatus = async (leadId, newStatus) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating lead status...');
    console.log('🆔 Lead ID:', leadId);
    console.log('📊 New Status:', newStatus);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.patch(
      `${API_BASE_URL}/lead/updateStatus/${leadId}/en`,
      { leadStatus: newStatus },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Lead status updated:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Lead status updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update lead status',
      };
    }
  } catch (error) {
    console.error('❌ Update lead status error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update lead status',
    };
  }
};

/**
 * Debug function to check lead service state
 */
export const debugLeadService = () => {
  console.log('🔍 === LEAD SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('==================================');
};