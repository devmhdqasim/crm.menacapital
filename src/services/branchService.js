import axios from 'axios';

/**
 * Branch Service
 * Handles all branch management related API calls including:
 * - Get All Branches (with pagination)
 * - Create Branch
 * - Update Branch
 * - Delete Branch
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
 * Get all branches with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of branches with pagination info
 */
export const getAllBranches = async (page = 1, limit = 10, startDate = '', endDate = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching branches...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/branch/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Branches fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allBranches?.[0]?.data) {
      const branchesData = data.payload.allBranches[0].data;
      const metadata = data.payload.allBranches[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', branchesData.length, 'branches');
      console.log('📊 Total branches:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: branchesData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch branches',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get branches error:', error);
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
        message: error.response.data?.message || 'Failed to fetch branches',
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
 * Create a new branch
 * @param {Object} branchData - Branch data object
 * @param {string} branchData.branchName - Branch name
 * @param {string} branchData.branchLocation - Branch location/address
 * @param {string} branchData.branchPhoneNumber - Branch phone number
 * @param {string} branchData.branchEmail - Branch email address
 * @param {string} branchData.branchManager - Branch manager ID
 * @param {Array<string>} branchData.branchMember - Array of kiosk member IDs
 * @param {Array<number>} branchData.branchCoordinates - Branch coordinates [latitude, longitude]
 * @returns {Promise} - Returns created branch info
 */

export const createBranch = async (branchData) => {
  try {
    const authToken = getRefreshToken();
    console.log('🔵 Creating new branch...');
    console.log('📝 Branch data:', {
      branchName: branchData.branchName,
      branchLocation: branchData.branchLocation,
      branchMember: branchData.branchMember,
      salesManager: branchData.salesManager,
    });

    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload - USE THE DATA FROM branchData PARAMETER
    const payload = {
      branchName: branchData.branchName,
      branchLocation: branchData.branchLocation,
      branchPhoneNumber: branchData.branchPhoneNumber,
      branchEmail: branchData.branchEmail,
      branchCoordinates: branchData.branchCoordinates || [0, 0],
      branchPassword: branchData.branchPassword,
      branchMembers: branchData.branchMembers,
      branchManager: branchData.branchManager,
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.post(
      `${API_BASE_URL}/branch/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Branch created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Branch creation successful');
      console.log('📨 Message:', data.payload?.message);
      return {
        success: true,
        data: data.payload,
        message: data.payload?.message || data.message || 'Branch created successfully',
      };
    } else {
      console.error('❌ Branch creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create branch',
      };
    }
  } catch (error) {
    console.error('❌ Create branch error:', error);
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
        message: error.response.data?.message || 'Invalid branch data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 409) {
      console.error('❌ Conflict (409), branch may already exist');
      return {
        success: false,
        message: error.response.data?.message || 'Branch with this name already exists.',
        error: error.response.data,
      };
    }

    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create branch',
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
 * Update an existing branch
 * @param {string} branchId - Branch's ID
 * @param {Object} branchData - Branch data to update
 * @returns {Promise} - Returns updated branch info
 */
export const updateBranch = async (branchId, branchData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating branch...');
    console.log('🆔 Branch ID:', branchId);
    console.log('📝 Branch data:', branchData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload matching the API structure
    const payload = {
      _id: branchId,
      branchName: branchData.branchName,
      branchLocation: branchData.branchLocation,
      branchPhoneNumber: branchData.branchPhoneNumber,
      branchEmail: branchData.branchEmail,
      branchManager: branchData.branchManager,
      branchMembers: branchData.branchMembers,
      branchCoordinates: branchData.branchCoordinates || [0, 0],
    };

    // Only include branchMember if it's provided
    if (branchData.branchMember && branchData.branchMember.length > 0) {
      payload.branchMember = branchData.branchMember;
    }

    // Only include password if provided (optional for updates)
    if (branchData.branchPassword) {
      payload.branchPassword = branchData.branchPassword;
    }

    // Include isAvailable if provided
    if (branchData.isAvailable !== undefined) {
      payload.isAvailable = branchData.isAvailable;
    }

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/branch/update/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Branch updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Branch updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update branch',
      };
    }
  } catch (error) {
    console.error('❌ Update branch error:', error);
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
        message: error.response.data?.message || 'Failed to update branch',
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
 * Delete a branch
 * @param {string} branchId - Branch's ID to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteBranch = async (branchId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting branch...');
    console.log('🆔 Branch ID:', branchId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const payload = {
      _id: branchId
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/branch/delete/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        // data: payload, // Send _id in request body
        timeout: 30000,
      }
    );

    console.log('✅ Branch deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Branch deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete branch',
      };
    }
  } catch (error) {
    console.error('❌ Delete branch error:', error);
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
        message: error.response.data?.message || 'Failed to delete branch',
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
 * Get branch by ID
 * @param {string} branchId - Branch's ID
 * @returns {Promise} - Returns branch details
 */
export const getBranchById = async (branchId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching branch by ID...');
    console.log('🆔 Branch ID:', branchId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/branch/${branchId}/en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Branch fetched successfully:', response.data);

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
        message: data.message || 'Failed to fetch branch',
      };
    }
  } catch (error) {
    console.error('❌ Get branch by ID error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch branch',
    };
  }
};

/**
 * Debug function to check branch service state
 */
export const debugBranchService = () => {
  console.log('🔍 === BRANCH SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('====================================');
};