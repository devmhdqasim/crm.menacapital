import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import database from '../config/firebaseDb';
import { useNotificationSound } from '../hooks/useNotificationSound';

const FirebaseNotificationContext = createContext(null);

export const useFirebaseNotifications = () => {
  const context = useContext(FirebaseNotificationContext);
  if (!context) {
    throw new Error('useFirebaseNotifications must be used within FirebaseNotificationProvider');
  }
  return context;
};

const STORAGE_KEY = 'firebase_read_notification_ids';

function getReadIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  try {
    const trimmed = ids.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable
  }
}

function getUserInfo() {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
}

function shouldShowToUser(notification, userInfo) {
  if (!userInfo) return false;

  const { targetRoles = [], targetUserIds = [] } = notification;
  const hasRoles = Array.isArray(targetRoles) && targetRoles.length > 0;
  const hasUserIds = Array.isArray(targetUserIds) && targetUserIds.length > 0;

  if (!hasRoles && !hasUserIds) return true;

  const userRole = userInfo.roleName || '';
  const userId = userInfo._id || userInfo.id || '';

  if (hasRoles && targetRoles.includes(userRole)) return true;
  if (hasUserIds && targetUserIds.includes(userId)) return true;

  return false;
}

function parseFirebaseNotifications(snapshot, source) {
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.entries(data).map(([key, value]) => ({
    id: `fb_${source}_${key}`,
    firebaseKey: key,
    source,
    title: value.title || 'Notification',
    message: value.message || '',
    type: value.type || 'general',
    priority: value.priority || 'medium',
    targetRoles: value.targetRoles || [],
    targetUserIds: value.targetUserIds || [],
    senderName: value.senderName || '',
    senderPhone: value.senderPhone || '',
    createdAt: value.createdAt || Date.now(),
  }));
}

export const FirebaseNotificationProvider = ({ children }) => {
  const [generalNotifications, setGeneralNotifications] = useState([]);
  const [inboxNotifications, setInboxNotifications] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds);
  const [latestNotification, setLatestNotification] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  const isInitialLoadGeneral = useRef(true);
  const isInitialLoadInbox = useRef(true);
  const isInitialTriggerLoad = useRef(true);
  const prevGeneralIds = useRef(new Set());
  const prevInboxIds = useRef(new Set());
  const bannerTimerRef = useRef(null);

  // Refs to hold latest notification lists for trigger listener
  const generalNotificationsRef = useRef([]);
  const inboxNotificationsRef = useRef([]);

  const { play: playSound } = useNotificationSound();

  const triggerBanner = useCallback((notification) => {
    setLatestNotification(notification);
    setShowBanner(true);
    playSound();

    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setShowBanner(false);
    }, 8000);
  }, [playSound]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
  }, []);

  // Keep refs in sync with state
  useEffect(() => { generalNotificationsRef.current = generalNotifications; }, [generalNotifications]);
  useEffect(() => { inboxNotificationsRef.current = inboxNotifications; }, [inboxNotifications]);

  // Subscribe to general notifications
  useEffect(() => {
    if (!database) return;

    const userInfo = getUserInfo();
    const generalRef = query(ref(database, 'notifications/general'), limitToLast(50));

    const unsubscribe = onValue(generalRef, (snapshot) => {
      const all = parseFirebaseNotifications(snapshot, 'general');
      const filtered = all.filter((n) => shouldShowToUser(n, userInfo));

      setGeneralNotifications(filtered);

      if (isInitialLoadGeneral.current) {
        prevGeneralIds.current = new Set(filtered.map((n) => n.id));
        isInitialLoadGeneral.current = false;
        return;
      }

      const currentIds = new Set(filtered.map((n) => n.id));
      const newNotifications = filtered.filter((n) => !prevGeneralIds.current.has(n.id));
      prevGeneralIds.current = currentIds;

      if (newNotifications.length > 0) {
        const newest = newNotifications.sort((a, b) => b.createdAt - a.createdAt)[0];
        triggerBanner(newest);
      }
    }, (error) => {
      console.error('Firebase general notifications error:', error);
    });

    return () => unsubscribe();
  }, [triggerBanner]);

  // Subscribe to inbox notifications
  useEffect(() => {
    if (!database) return;

    const userInfo = getUserInfo();
    const inboxRef = query(ref(database, 'notifications/inbox'), limitToLast(50));

    const unsubscribe = onValue(inboxRef, (snapshot) => {
      const all = parseFirebaseNotifications(snapshot, 'inbox');
      const filtered = all.filter((n) => shouldShowToUser(n, userInfo));

      setInboxNotifications(filtered);

      if (isInitialLoadInbox.current) {
        prevInboxIds.current = new Set(filtered.map((n) => n.id));
        isInitialLoadInbox.current = false;
        return;
      }

      const currentIds = new Set(filtered.map((n) => n.id));
      const newNotifications = filtered.filter((n) => !prevInboxIds.current.has(n.id));
      prevInboxIds.current = currentIds;

      if (newNotifications.length > 0) {
        const newest = newNotifications.sort((a, b) => b.createdAt - a.createdAt)[0];
        triggerBanner(newest);
      }
    }, (error) => {
      console.error('Firebase inbox notifications error:', error);
    });

    return () => unsubscribe();
  }, [triggerBanner]);

  // --- Trigger boolean listener ---
  // Toggle `notifications/trigger` in Firebase Console:
  //   false → shows latest general notification banner
  //   true  → shows latest inbox notification banner
  useEffect(() => {
    if (!database) return;

    const triggerDbRef = ref(database, 'notifications/trigger');

    const unsubscribe = onValue(triggerDbRef, (snapshot) => {
      // Skip the initial load so banner doesn't fire on page open
      if (isInitialTriggerLoad.current) {
        isInitialTriggerLoad.current = false;
        return;
      }

      const value = snapshot.val();
      const list = value === true
        ? inboxNotificationsRef.current
        : generalNotificationsRef.current;

      if (list.length > 0) {
        const latest = [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
        triggerBanner(latest);
      }
    }, (error) => {
      console.error('Firebase trigger listener error:', error);
    });

    return () => unsubscribe();
  }, [triggerBanner]);

  // Cleanup banner timer
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const allFirebaseNotifications = [...generalNotifications, ...inboxNotifications]
    .sort((a, b) => b.createdAt - a.createdAt);

  const unreadFirebaseCount = allFirebaseNotifications.filter(
    (n) => !readIds.includes(n.id)
  ).length;

  const markFirebaseAsRead = useCallback((notificationId) => {
    setReadIds((prev) => {
      if (prev.includes(notificationId)) return prev;
      const updated = [...prev, notificationId];
      saveReadIds(updated);
      return updated;
    });
  }, []);

  const markAllFirebaseAsRead = useCallback(() => {
    const allIds = allFirebaseNotifications.map((n) => n.id);
    setReadIds((prev) => {
      const merged = [...new Set([...prev, ...allIds])];
      saveReadIds(merged);
      return merged;
    });
  }, [allFirebaseNotifications]);

  const isFirebaseNotificationRead = useCallback(
    (notificationId) => readIds.includes(notificationId),
    [readIds]
  );

  const value = {
    firebaseNotifications: allFirebaseNotifications,
    unreadFirebaseCount,
    markFirebaseAsRead,
    markAllFirebaseAsRead,
    isFirebaseNotificationRead,
    latestNotification,
    showBanner,
    dismissBanner,
  };

  return (
    <FirebaseNotificationContext.Provider value={value}>
      {children}
    </FirebaseNotificationContext.Provider>
  );
};
