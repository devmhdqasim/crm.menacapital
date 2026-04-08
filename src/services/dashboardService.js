import axios from 'axios';

/**
 * Dashboard Service
 * Handles all dashboard related API calls including:
 * - Get Dashboard Statistics (with date filters)
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
 * Get dashboard statistics
 * @param {string} fromDate - Start date for filtering (optional, format: YYYY-MM-DD)
 * @param {string} toDate - End date for filtering (optional, format: YYYY-MM-DD)
 * @returns {Promise} - Returns dashboard statistics
 */
export const getDashboardStats = async (fromDate = '', toDate = '', keyword = '', agentId = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching dashboard statistics...');
    console.log('📅 From Date:', fromDate || 'Not specified');
    console.log('📅 To Date:', toDate || 'Not specified');
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;
 
    // ✅ Decide which URL to hit based on role
    const isBranchLogin = userInfo?.roleName === 'Event Member' || userInfo?.role === 'Event Member';
    const refreshUrl = isBranchLogin
      ? `${API_BASE_URL}/dashboard/event/en?fromDate=${fromDate}&toDate=${toDate}&keyword=${keyword}&agentId=${agentId}`
      : `${API_BASE_URL}/dashboard/admin/en?fromDate=${fromDate}&toDate=${toDate}&keyword=${keyword}&agentId=${agentId}`;

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

    console.log('✅ Dashboard statistics fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload) {
      console.log('📊 Dashboard Data:');
      console.log('  - Sales Managers:', data.payload.totalSalesManagers);
      console.log('  - Agents:', data.payload.totalAgents);
      console.log('  - Branches:', data.payload.totalBranches);
      console.log('  - Kiosk Members:', data.payload.totalKioskMembers);
      console.log('  - Total Leads:', data.payload.leadsCountPerStatus?.total);

      return {
        success: true,
        data: data.payload,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch dashboard statistics',
        data: null,
      };
    }
  } catch (error) {
    console.error('❌ Get dashboard statistics error:', error);
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
        message: error.response.data?.message || 'Failed to fetch dashboard statistics',
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

export const getBranchDashboardStats = async (fromDate = '', toDate = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching dashboard statistics...');
    console.log('📅 From Date:', fromDate || 'Not specified');
    console.log('📅 To Date:', toDate || 'Not specified');
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

    // ✅ Decide which URL to hit based on role
    const refreshUrl = `${API_BASE_URL}/dashboard/kiosk/en?fromDate=${fromDate}&toDate=${toDate}`

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

    console.log('✅ Dashboard statistics fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload) {
      console.log('📊 Dashboard Data:');
      console.log('  - Sales Managers:', data.payload.totalSalesManagers);
      console.log('  - Agents:', data.payload.totalAgents);
      console.log('  - Branches:', data.payload.totalBranches);
      console.log('  - Kiosk Members:', data.payload.totalKioskMembers);
      console.log('  - Total Leads:', data.payload.leadsCountPerStatus?.total);

      return {
        success: true,
        data: data.payload,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure');
      return {
        success: false,
        message: data.message || 'Failed to fetch dashboard statistics',
        data: null,
      };
    }
  } catch (error) {
    console.error('❌ Get dashboard statistics error:', error);
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
        message: error.response.data?.message || 'Failed to fetch dashboard statistics',
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
 * Get dashboard statistics with date range helper
 * @param {string} filterType - Filter type ('Last 3 Days', 'Last Week', 'Last Month', 'Last Year')
 * @returns {Promise} - Returns dashboard statistics
 */
export const getDashboardStatsByFilter = async (fromDate, toDate, keyword, agentId) => {
  const today = new Date();
  // let fromDate = '';
  // let toDate = today.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

  // switch (filterType) {
  //   case 'Last 3 Days':
  //     const threeDaysAgo = new Date(today);
  //     threeDaysAgo.setDate(today.getDate() - 3);
  //     fromDate = threeDaysAgo.toISOString().split('T')[0];
  //     break;
    
  //   case 'Last Week':
  //     const oneWeekAgo = new Date(today);
  //     oneWeekAgo.setDate(today.getDate() - 7);
  //     fromDate = oneWeekAgo.toISOString().split('T')[0];
  //     break;
    
  //   case 'Last Month':
  //     const oneMonthAgo = new Date(today);
  //     oneMonthAgo.setMonth(today.getMonth() - 1);
  //     fromDate = oneMonthAgo.toISOString().split('T')[0];
  //     break;
    
  //   case 'Last Year':
  //     const oneYearAgo = new Date(today);
  //     oneYearAgo.setFullYear(today.getFullYear() - 1);
  //     fromDate = oneYearAgo.toISOString().split('T')[0];
  //     break;
    
  //   default:
  //     // No filter, return all data
  //     fromDate = '';
  //     toDate = '';
  // }

  // console.log('🔵 Applying filter:', filterType);
  console.log('📅 Calculated date range:', { fromDate, toDate, keyword, agentId });

  return await getDashboardStats(fromDate, toDate, keyword, agentId);
};

/**
 * Debug function to check dashboard service state
 */
export const debugDashboardService = () => {
  console.log('🔍 === DASHBOARD SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('====================================');
};