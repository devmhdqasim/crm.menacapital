import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../config/axios';

// ⚠️ IMPORTANT: Replace with your actual VAPID key from Firebase Console
// Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

/**
 * Sanitize email to create valid Firebase topic name
 * Firebase topics can only contain: a-z, A-Z, 0-9, -, _
 */
export const sanitizeTopic = (email) => {
  if (typeof email === 'string' && email.trim()) {
    const topic = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    console.info('✅ Sanitized topic:', topic);
    return topic;
  } else {
    console.warn('⚠️ Email is not a valid string, cannot sanitize topic.');
    return '';
  }
};

/**
 * Get user info from localStorage
 */
const getUserInfo = () => { 
  try { 
    const userInfo = localStorage.getItem('userInfo'); 
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    return null;
  }
};

/**
 * Subscribe to multiple topics at once
 */
export const subscribeToMultipleTopics = async (topics, token) => {
  try {
    if (!token) {
      console.error('❌ No FCM token provided');
      return;
    }

    const sanitizedTopics = topics
      .map(t => typeof t === 'string' ? t.toLowerCase().replace(/[^a-z0-9_-]/g, '') : '')
      .filter(t => t.length > 0);

    if (sanitizedTopics.length === 0) {
      console.error('❌ No valid topics to subscribe');
      return;
    }

    // Send to backend using your axios instance
    await api.post('/notifications/subscribe-multiple-topics', {
      token: token,
      topics: sanitizedTopics
    });
    
    console.log(`✅ Subscribed to ${sanitizedTopics.length} topics:`, sanitizedTopics);
  } catch (error) {
    console.error('❌ Error subscribing to multiple topics:', error);
  }
};

/**
 * Save FCM token to backend
 */
const saveTokenToBackend = async (token) => {
  try {
    const userInfo = getUserInfo();
    
    if (!userInfo) {
      console.warn('⚠️ No user info found, saving token without user association');
    }

    // Send token to backend using your axios instance
    const response = await api.post('/notifications/register-token', {
      fcmToken: token,
      userId: userInfo?.id,
      email: userInfo?.email,
      role: userInfo?.roleName,
      branchId: userInfo?.branchId,
      branchName: userInfo?.branchName
    });
    
    console.log('✅ Token saved to backend successfully');
    return response;
  } catch (error) {
    console.error('❌ Error saving token to backend:', error);
    throw error;
  }
};

/**
 * Subscribe user to all relevant topics
 */
const subscribeToUserTopics = async (token) => {
  try {
    const userInfo = getUserInfo();
    
    if (!userInfo) {
      console.warn('⚠️ No user info, skipping topic subscriptions');
      return;
    }

    const topics = [];

    // 1. User-specific topic (based on email)
    if (userInfo.email) {
      const userTopic = sanitizeTopic(userInfo.email);
      if (userTopic) topics.push(userTopic);
    }

    // 2. Role-based topic
    if (userInfo.roleName) {
      const roleTopic = `role_${userInfo.roleName.toLowerCase().replace(/\s+/g, '')}`;
      topics.push(roleTopic);
    }

    // 3. Branch-based topic
    if (userInfo.branchName) {
      const branchTopic = `branch_${userInfo.branchName.toLowerCase().replace(/\s+/g, '')}`;
      topics.push(branchTopic);
    }

    // 4. All users topic (for broadcasts)
    topics.push('all_users');

    // Subscribe to all topics
    if (topics.length > 0) {
      await subscribeToMultipleTopics(topics, token);
      console.log(`✅ Subscribed to ${topics.length} topics for user: ${userInfo.email}`);
    }
  } catch (error) {
    console.error('❌ Error subscribing to user topics:', error);
  }
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    console.log('🔔 Requesting notification permission...');
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      if (!messaging) {
        console.warn('⚠️ Firebase messaging not available');
        return null;
      }
      
      // Get FCM token
      console.log('📱 Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (token) {
        console.log('✅ FCM Token obtained:', token);
        
        // Save token to backend
        await saveTokenToBackend(token);
        
        // Subscribe to all relevant topics
        await subscribeToUserTopics(token);
        
        return token;
      } else {
        console.log('⚠️ No registration token available');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received:', payload);
        resolve(payload);
      });
    } else {
      console.warn('⚠️ Firebase messaging not available');
    }
  });

/**
 * Get all notifications from backend
 */
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data || response; // Handle both response.data and direct response
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    console.log('✅ All notifications marked as read');
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);
    console.log('✅ Notification deleted:', notificationId);
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
  }
};