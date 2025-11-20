import axios from 'axios';


/**
 * User Service
 * Handles all user management related API calls including:
 * - Get All Users (with pagination)
 * - Create User
 * - Update User (PATCH)
 * - Delete User (PATCH)
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
 * Get all users with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of users with pagination info
 */
export const getAllUsers = async (page = 1, limit = 10, startDate = '', endDate = '') => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Fetching users...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/user/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Users fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allUsers?.[0]?.data) {
      const usersData = data.payload.allUsers[0].data;
      const metadata = data.payload.allUsers[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', usersData.length, 'users');
      console.log('📊 Total users:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: usersData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch users',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get users error:', error);
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
        message: error.response.data?.message || 'Failed to fetch users',
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
 * Get Kiosk Members By Branch with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of users with pagination info
 */
export const getAllUsersKioskMembers = async (page = 1, limit = 100) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Fetching users...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/branch/kioskMembers/en?paramPage=${page}&paramLimit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 30000,
      },
    );

    console.log('✅ Users fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allMembers?.[0]?.data) {
      const usersData = data.payload.allMembers[0].data;
      const metadata = data.payload.allMembers[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', usersData.length, 'users');
      console.log('📊 Total users:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: usersData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch users',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get users error:', error);
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
        message: error.response.data?.message || 'Failed to fetch users',
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

export const getKioskMembersbySalesManager = async (page = 1, limit = 100) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Fetching users...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/salesManager/kioskMembers/en?paramPage=${page}&paramLimit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 30000,
      },
    );

    console.log('✅ Users fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allMembers?.[0]?.data) {
      const usersData = data.payload.allMembers[0].data;
      const metadata = data.payload.allMembers[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', usersData.length, 'users');
      console.log('📊 Total users:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: usersData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch users',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get users error:', error);
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
        message: error.response.data?.message || 'Failed to fetch users',
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
 * Create a new user
 * @param {Object} userData - User data object
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @param {string} userData.phoneNumber - User's phone number
 * @param {string} userData.password - User's password
 * @param {string} userData.dateOfBirthday - User's date of birth (YYYY-MM-DD)
 * @param {string} userData.gender - User's gender
 * @param {string} userData.imageUrl - User's profile image URL
 * @param {string} userData.roleName - User's role name
 * @param {string} userData.department - User's department
 * @param {string} userData.inBranch - User's branch
 * @param {string} userData.countryOfResidence - User's country of residence
 * @param {string} userData.nationality - User's nationality
 * @param {boolean} userData.isPhoneVerified - Phone verification status
 * @param {boolean} userData.isEmailVerified - Email verification status
 * @param {string} userData.deviceType - Device type
 * @param {string} userData.deviceName - Device name
 * @param {string} userData.deviceOperatingSystem - Device OS
 * @param {string} userData.deviceIPAddress - Device IP address
 * @returns {Promise} - Returns created user info
 */
export const createUser = async (userData) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Creating new user...');
    console.log('📝 User data:', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.roleName,
      department: userData.department,
    });
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password,
      dateOfBirthday: userData.dateOfBirthday,
      gender: userData.gender,
      imageUrl: userData.imageUrl || "https://example.com/images/default.jpg",
      roleName: userData.roleName,
      department: userData.department,
      inBranch: userData.inBranch,
      countryOfResidence: userData.countryOfResidence,
      nationality: userData.nationality,
      isPhoneVerified: userData.isPhoneVerified !== undefined ? userData.isPhoneVerified : true,
      isEmailVerified: userData.isEmailVerified !== undefined ? userData.isEmailVerified : true,
      deviceType: userData.deviceType || "Desktop",
      deviceName: userData.deviceName || "unknown",
      deviceOperatingSystem: userData.deviceOperatingSystem || "unknown",
      deviceIPAddress: userData.deviceIPAddress || "0.0.0.0",
    };

    console.log('📤 Sending payload to API');

    const response = await axios.post(
      `${API_BASE_URL}/user/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ User created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ User creation successful');
      console.log('📨 Message:', data.payload?.message);

      return {
        success: true,
        data: data.payload,
        message: data.payload?.message || data.message || 'User created successfully',
      };
    } else {
      console.error('❌ User creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create user',
      };
    }
  } catch (error) {
    console.error('❌ Create user error:', error);
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
        message: error.response.data?.message || 'Invalid user data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 409) {
      console.error('❌ Conflict (409), user may already exist');
      return {
        success: false,
        message: error.response.data?.message || 'User with this email or phone already exists.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create user',
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
 * Update an existing user (PATCH METHOD)
 * @param {string} userId - User's ID
 * @param {Object} userData - User data to update
 * @returns {Promise} - Returns updated user info
 */
export const updateUser = async (userId, userData) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Updating user...');
    console.log('🆔 User ID:', userId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.patch(
      `${API_BASE_URL}/user/update/en`,
      { userId, ...userData },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ User updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'User updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update user',
      };
    }
  } catch (error) {
    console.error('❌ Update user error:', error);
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
        message: error.response.data?.message || 'Failed to update user',
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
export const deleteUser = async (userId) => {
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
      `${API_BASE_URL}/user/delete/en`,
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

/**
 * Search users by query
 * @param {string} query - Search query (name, email, phone, etc.)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns filtered list of users
 */
export const searchUsers = async (query, page = 1, limit = 10) => {
  try {
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Searching users...');
    console.log('🔍 Query:', query);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/user/search/en?query=${encodeURIComponent(query)}&paramPage=${page}&paramLimit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Users search completed:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload?.users || [],
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
    console.error('❌ Search users error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search users',
      data: [],
    };
  }
};

/**
 * Get device information from browser
 * @returns {Object} - Device information
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Desktop';
  let deviceOperatingSystem = 'unknown';

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/tablet/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    deviceOperatingSystem = 'windows';
  } else if (/mac/i.test(userAgent)) {
    deviceOperatingSystem = 'apple';
  } else if (/linux/i.test(userAgent)) {
    deviceOperatingSystem = 'linux';
  } else if (/android/i.test(userAgent)) {
    deviceOperatingSystem = 'android';
  } else if (/ios|iphone|ipad/i.test(userAgent)) {
    deviceOperatingSystem = 'ios';
  }

  return {
    deviceType,
    deviceOperatingSystem,
    deviceName: navigator.platform || 'unknown',
  };
};

/**
 * Debug function to check user service state
 */
export const debugUserService = () => {
  console.log('🔍 === USER SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('Device Info:', getDeviceInfo());
  console.log('==================================');
};