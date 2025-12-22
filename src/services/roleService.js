import axios from 'axios';

/**
 * Role Service
 * Handles all role management related API calls including:
 * - Get All Roles (with pagination)
 * - Create Role
 * - Update Role
 * - Delete Role
 */

const API_BASE_URL = 'https://staging.crm.saveingold.app/api/v1';

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Returns refresh token or null
 */
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Get all roles with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} - Returns list of roles with pagination info
 */
export const getAllRoles = async (page = 1, limit = 10, startDate = '', endDate = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching roles...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/role/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Roles fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.allRoles?.[0]?.data) {
      const rolesData = data.payload.allRoles[0].data;
      const metadata = data.payload.allRoles[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', rolesData.length, 'roles');
      console.log('📊 Total roles:', metadata.total);
      console.log('📊 Current page:', metadata.page);

      return {
        success: true,
        data: rolesData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch roles',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get roles error:', error);
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
        message: error.response.data?.message || 'Failed to fetch roles',
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
 * Create a new role
 * @param {Object} roleData - Role data object
 * @param {string} roleData.roleName - Role name
 * @param {string} roleData.department - Department
 * @param {Object} roleData.permissions - Permissions object
 * @param {Object} roleData.permissions.userPermissions - User permissions
 * @param {boolean} roleData.permissions.userPermissions.canAdd - Can add users
 * @param {boolean} roleData.permissions.userPermissions.canEdit - Can edit users
 * @param {boolean} roleData.permissions.userPermissions.canDelete - Can delete users
 * @param {boolean} roleData.permissions.userPermissions.canView - Can view users
 * @param {Object} roleData.permissions.leadPermissions - Lead permissions
 * @param {boolean} roleData.permissions.leadPermissions.canAdd - Can add leads
 * @param {boolean} roleData.permissions.leadPermissions.canEdit - Can edit leads
 * @param {boolean} roleData.permissions.leadPermissions.canDelete - Can delete leads
 * @param {boolean} roleData.permissions.leadPermissions.canView - Can view leads
 * @returns {Promise} - Returns created role info
 */
export const createRole = async (roleData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Creating new role...');
    console.log('📝 Role data:', {
      roleName: roleData.roleName,
      department: roleData.department,
    });
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload
    const payload = {
      roleName: roleData.roleName,
      department: roleData.department,
      permissions: {
        userPermissions: {
          canAdd: roleData.permissions?.userPermissions?.canAdd || false,
          canEdit: roleData.permissions?.userPermissions?.canEdit || false,
          canDelete: roleData.permissions?.userPermissions?.canDelete || false,
          canView: roleData.permissions?.userPermissions?.canView || false,
        },
        leadPermissions: {
          canAdd: roleData.permissions?.leadPermissions?.canAdd || false,
          canEdit: roleData.permissions?.leadPermissions?.canEdit || false,
          canDelete: roleData.permissions?.leadPermissions?.canDelete || false,
          canView: roleData.permissions?.leadPermissions?.canView || false,
        },
      },
    };

    console.log('📤 Sending payload to API');

    const response = await axios.post(
      `${API_BASE_URL}/role/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Role created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Role creation successful');
      console.log('📨 Message:', data.payload?.message);

      return {
        success: true,
        data: data.payload,
        message: data.payload?.message || data.message || 'Role created successfully',
      };
    } else {
      console.error('❌ Role creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create role',
      };
    }
  } catch (error) {
    console.error('❌ Create role error:', error);
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
        message: error.response.data?.message || 'Invalid role data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 409) {
      console.error('❌ Conflict (409), role may already exist');
      return {
        success: false,
        message: error.response.data?.message || 'Role with this name already exists.',
        error: error.response.data,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create role',
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
 * Update an existing role
 * @param {string} roleId - Role's ID
 * @param {Object} roleData - Role data to update (same structure as createRole)
 * @returns {Promise} - Returns updated role info
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating role...');
    console.log('🆔 Role ID:', roleId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.put(
      `${API_BASE_URL}/role/update/${roleId}/en`,
      roleData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Role updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Role updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update role',
      };
    }
  } catch (error) {
    console.error('❌ Update role error:', error);
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
        message: error.response.data?.message || 'Failed to update role',
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
 * Delete a role
 * @param {string} roleId - Role's ID to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteRole = async (roleId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting role...');
    console.log('🆔 Role ID:', roleId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.delete(
      `${API_BASE_URL}/role/delete/${roleId}/en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Role deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Role deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete role',
      };
    }
  } catch (error) {
    console.error('❌ Delete role error:', error);
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
        message: error.response.data?.message || 'Failed to delete role',
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
 * Get role by ID
 * @param {string} roleId - Role's ID
 * @returns {Promise} - Returns role details
 */
export const getRoleById = async (roleId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching role by ID...');
    console.log('🆔 Role ID:', roleId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/role/${roleId}/en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Role fetched successfully:', response.data);

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
        message: data.message || 'Failed to fetch role',
      };
    }
  } catch (error) {
    console.error('❌ Get role by ID error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch role',
    };
  }
};

/**
 * Debug function to check role service state
 */
export const debugRoleService = () => {
  console.log('🔍 === ROLE SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('==================================');
};