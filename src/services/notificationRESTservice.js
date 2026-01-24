// src/services/notificationRESTservice.js
import axios from 'axios';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';

/**
 * Base API configuration
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
 * Get user info from localStorage
 * @returns {Object|null} - Returns user info object or null
 */
const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Determine notification endpoint type based on user role
 * @returns {string} - Returns 'user', 'branch', or 'event'
 */
const getNotificationEndpointType = () => {
  const userInfo = getUserInfo();
  
  if (userInfo?.roleName === 'Branch' || userInfo?.role === 'Branch' || 
      userInfo?.roleName === 'Branch Manager' || userInfo?.role === 'Branch Manager' ||
      userInfo?.roleName === 'Kiosk Member' || userInfo?.role === 'Kiosk Member') {
    return 'branch';
  } else if (userInfo?.roleName === 'Event Member' || userInfo?.role === 'Event Member') {
    return 'event';
  }
  return 'user';
};

/**
 * Get all notifications from backend (REST API)
 * Automatically determines the correct endpoint based on user role
 * @param {string} filter - Filter type: 'All', 'Unread', or 'Read'
 */
export const getNotifications = async (filter = 'All') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching notifications...');
    console.log('🔍 Filter:', filter);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const endpointType = getNotificationEndpointType();
    let endpoint = '';
    
    if (endpointType === 'branch') {
      endpoint = `${API_BASE_URL}/notification/branch/getAllByBranch/en`;
      console.log('📍 Using branch notifications endpoint');
    } else if (endpointType === 'event') {
      endpoint = `${API_BASE_URL}/notification/event/getAllByEvent/en`;
      console.log('📍 Using event notifications endpoint');
    } else {
      endpoint = `${API_BASE_URL}/notification/user/getAllByUser/en`;
      console.log('📍 Using user notifications endpoint');
    }

    // Add query parameters based on filter
    const params = {};
    if (filter === 'Unread') {
      params.isRead = false;
    } else if (filter === 'Read') {
      params.isRead = true;
    }
    // If filter is 'All', don't add isRead parameter

    console.log('🌐 API URL:', endpoint);
    console.log('📊 Query params:', params);

    const response = await axios.get(
      endpoint,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        params: params,
        timeout: 30000,
      }
    );

    console.log('✅ Notifications fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      let notificationsData = [];
      
      if (data.payload?.myNotifications) {
        notificationsData = data.payload.myNotifications;
      } 
      else if (data.payload?.notifications) {
        notificationsData = data.payload.notifications;
      } else if (data.payload?.allNotifications) {
        notificationsData = data.payload.allNotifications;
      } else if (data.payload?.data) {
        notificationsData = data.payload.data;
      } else if (data.data) {
        notificationsData = data.data;
      } else if (Array.isArray(data.payload)) {
        notificationsData = data.payload;
      }

      console.log('📊 Retrieved', notificationsData.length, 'notifications');
      console.log('📊 Sample notification:', notificationsData[0]);

      return notificationsData;
    } else {
      console.error('❌ Unexpected response structure');
      console.error('❌ Full response data:', JSON.stringify(data, null, 2));
      return [];
    }
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      throw new Error('Session expired. Please login again.');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch notifications');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Mark a notification as read (REST API)
 * Automatically determines the correct endpoint based on user role
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Marking notification as read...');
    console.log('🆔 Notification ID:', notificationId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const endpointType = getNotificationEndpointType();
    let endpoint = '';
    
    if (endpointType === 'branch') {
      endpoint = `${API_BASE_URL}/notification/branch/updateStatus/en`;
    } else if (endpointType === 'event') {
      endpoint = `${API_BASE_URL}/notification/event/updateStatus/en`;
    } else {
      endpoint = `${API_BASE_URL}/notification/user/updateStatus/en`;
    }

    const response = await axios.patch(
      endpoint,
      {
        _id: notificationId,
        isRead: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Notification marked as read successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Mark as read successful');
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Notification marked as read',
      };
    } else {
      console.error('❌ Mark as read failed:', data.message);
      throw new Error(data.message || 'Failed to mark notification as read');
    }
  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      throw new Error('Session expired. Please login again.');
    }
    
    if (error.response?.status === 404) {
      console.error('❌ Not found (404)');
      throw new Error('Notification not found.');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to mark notification as read');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Mark all notifications as read (REST API)
 * Uses bulk update endpoint
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Marking all notifications as read...');
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // First, get all unread notifications
    const notifications = await getNotifications('Unread');
    const unreadIds = notifications.map(n => n._id);

    if (unreadIds.length === 0) {
      console.log('✅ No unread notifications to mark');
      return {
        success: true,
        message: 'No unread notifications',
      };
    }

    const endpointType = getNotificationEndpointType();
    let endpoint = '';
    
    if (endpointType === 'branch') {
      endpoint = `${API_BASE_URL}/notification/branch/updateMany/en`;
    } else if (endpointType === 'event') {
      endpoint = `${API_BASE_URL}/notification/event/updateMany/en`;
    } else {
      endpoint = `${API_BASE_URL}/notification/user/updateMany/en`;
    }

    const response = await axios.patch(
      endpoint,
      {
        notificationIds: unreadIds,
        isRead: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ All notifications marked as read successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Mark all as read successful');
      return {
        success: true,
        data: data.payload,
        message: data.message || 'All notifications marked as read',
      };
    } else {
      console.error('❌ Mark all as read failed:', data.message);
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      throw new Error('Session expired. Please login again.');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to mark all notifications as read');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Delete a notification (REST API)
 * Automatically determines the correct endpoint based on user role
 */
export const deleteNotification = async (notificationId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting notification...');
    console.log('🆔 Notification ID:', notificationId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const endpointType = getNotificationEndpointType();
    let endpoint = '';
    
    if (endpointType === 'branch') {
      endpoint = `${API_BASE_URL}/notification/branch/delete/en`;
    } else if (endpointType === 'event') {
      endpoint = `${API_BASE_URL}/notification/event/delete/en`;
    } else {
      endpoint = `${API_BASE_URL}/notification/user/delete/en`;
    }

    const response = await axios.delete(
      endpoint,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          _id: notificationId
        },
        timeout: 30000,
      }
    );

    console.log('✅ Notification deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Deletion successful');
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Notification deleted successfully',
      };
    } else {
      console.error('❌ Deletion failed:', data.message);
      throw new Error(data.message || 'Failed to delete notification');
    }
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      throw new Error('Session expired. Please login again.');
    }
    
    if (error.response?.status === 404) {
      console.error('❌ Not found (404)');
      throw new Error('Notification not found.');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to delete notification');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

/**
 * Delete multiple notifications in bulk
 * Automatically determines the correct endpoint based on user role
 * @param {Array<string>} notificationIds - Array of notification IDs to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteMultipleNotifications = async (notificationIds) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting multiple notifications...');
    console.log('🆔 Notification IDs:', notificationIds);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const endpointType = getNotificationEndpointType();
    let endpoint = '';
    
    if (endpointType === 'branch') {
      endpoint = `${API_BASE_URL}/notification/branch/deleteMany/en`;
    } else if (endpointType === 'event') {
      endpoint = `${API_BASE_URL}/notification/event/deleteMany/en`;
    } else {
      endpoint = `${API_BASE_URL}/notification/user/deleteMany/en`;
    }

    const response = await axios.delete(
      endpoint,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          notificationIds: notificationIds
        },
        timeout: 30000,
      }
    );

    console.log('✅ Notifications deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Bulk deletion successful');
      return {
        success: true,
        data: data.payload,
        message: data.message || `${notificationIds.length} notifications deleted successfully`,
      };
    } else {
      console.error('❌ Bulk deletion failed:', data.message);
      throw new Error(data.message || 'Failed to delete notifications');
    }
  } catch (error) {
    console.error('❌ Delete multiple notifications error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      throw new Error('Session expired. Please login again.');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to delete notifications');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

// ========================================
// FIREBASE FUNCTIONS (UNCHANGED)
// ========================================

/**
 * Get FCM token for the current device
 */
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging not initialized');
      return null;
    }

    const vapidKey = 'YOUR_VAPID_KEY_HERE'; // Replace with your VAPID key
    
    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('FCM Token:', token);
      localStorage.setItem('firebaseToken', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
};

/**
 * Subscribe to foreground messages
 */
export const subscribeToMessages = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });

  return unsubscribe;
};

/**
 * Send FCM token to backend
 */
export const sendTokenToBackend = async (token, userId) => {
  try {
    const response = await fetch('/api/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send token to backend');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending token to backend:', error);
    throw error;
  }
};