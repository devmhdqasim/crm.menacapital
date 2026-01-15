// src/services/notificationService.js
// CORRECT: Import getToken directly from Firebase SDK, not from your config
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase'; // Only import messaging instance

/**
 * Get all notifications from backend
 */
export const getNotifications = async () => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

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