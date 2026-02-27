import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, onChildAdded, onChildChanged, query, limitToLast } from 'firebase/database';
import database from '../config/firebaseDb';
import toast from 'react-hot-toast';
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

// Only these roles should receive toast/banner notifications
const ALLOWED_NOTIFICATION_ROLES = ['Admin', 'Sales Manager', 'Agent'];

function isNotificationAllowedForUser() {
  const userInfo = getUserInfo();
  if (!userInfo) return false;
  const role = userInfo.roleName || '';
  return ALLOWED_NOTIFICATION_ROLES.includes(role);
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

  // Track active toast IDs to enforce max 3 visible notifications
  const activeToastIds = useRef([]);
  const MAX_VISIBLE_TOASTS = 3;

  const showManagedToast = useCallback((toastFn) => {
    // Dismiss oldest toast if at the limit
    while (activeToastIds.current.length >= MAX_VISIBLE_TOASTS) {
      const oldest = activeToastIds.current.shift();
      toast.dismiss(oldest);
    }
    const id = toastFn();
    if (id) {
      activeToastIds.current.push(id);
    }
    return id;
  }, []);

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
    if (!database || !isNotificationAllowedForUser()) return;

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
    if (!database || !isNotificationAllowedForUser()) return;

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
    if (!database || !isNotificationAllowedForUser()) return;

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

  // --- Listen for new notification entries at notifications/whatsappSessions ---
  // Same pattern as the working whatsappSessions reminder listener.
  // BE writes: notifications/whatsappSessions/{pushId} -> { createdAt, notes, phoneNumber, type, ... }
  // No userId matching — shows notification for ANY new entry.
  useEffect(() => {
    if (!database) return;

    // Don't listen when user is not logged in
    const userInfo = getUserInfo();
    if (!userInfo) return;

    // Block only Kiosk/Event
    const BLOCKED_ROLES = ['Kiosk Member', 'Event Member'];
    const userRole = userInfo?.roleName || '';
    if (BLOCKED_ROLES.includes(userRole)) return;

    const notifRef = ref(database, 'notifications/whatsappSessions');
    const prevKeys = { current: new Set() };
    let isInitial = true;

    console.log('🔔 Listening on notifications/whatsappSessions');

    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.log('🔔 notifications/whatsappSessions — no data');
        return;
      }

      const data = snapshot.val();
      const entries = Object.entries(data);
      const currentKeys = new Set(entries.map(([key]) => key));

      console.log('🔔 notifications/whatsappSessions:', { total: entries.length, isInitial });

      if (isInitial) {
        prevKeys.current = currentKeys;
        isInitial = false;
        return;
      }

      // Find new entries
      entries.forEach(([key, value]) => {
        if (prevKeys.current.has(key)) return;
        // Skip non-object children
        if (!value || typeof value !== 'object') return;

        const phone = typeof value.phoneNumber === 'object'
          ? (value.phoneNumber?.phoneNumber || '')
          : (value.phoneNumber || '');

        console.log('🔔 NEW notification:', { key, type: value.type, phone, notes: value.notes });

        playSound();
        showManagedToast(() => toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (phone) {
                sessionStorage.setItem('openChatForPhone', phone.replace(/\D/g, ''));
                sessionStorage.setItem('openChatForName', phone);
                if (window.location.pathname === '/inbox') {
                  window.dispatchEvent(new Event('openChatFromNotification'));
                } else {
                  window.location.href = '/inbox';
                }
              }
            }}
            style={{
              maxWidth: '400px',
              width: '100%',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #2d1a00 0%, #3d2400 50%, #2d1a00 100%)',
              borderRadius: '16px',
              padding: '0',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(251,146,60,0.1)',
              overflow: 'hidden',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
              transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
            }}
          >
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #fb923c, #f59e0b, #fb923c, transparent)',
            }} />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                flexShrink: 0,
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(145deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: '#fbbf24',
                    background: 'rgba(245,158,11,0.15)',
                    borderRadius: '20px',
                  }}>
                    {value.type === 'REMINDER_NOTIFICATION' ? 'Reminder' : 'Notification'}
                  </span>
                  <span style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '11px',
                    fontWeight: 500,
                    marginLeft: 'auto',
                  }}>
                    {value.createdAt ? new Date(value.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'just now'}
                  </span>
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>
                  {value.title || (phone ? `Reply to ${phone}` : 'Reminder')}
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.4',
                }}>
                  {value.notes || value.message || 'You have a pending reminder for this contact'}
                </p>
              </div>
              {/* Close button */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(245,158,11,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
            </div>
            <div style={{ height: '2px', width: '100%', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#f59e0b', animation: 'toast-shrink 6s linear forwards' }} />
            </div>
          </div>
        ), { duration: 6000, position: 'top-right' }));
      });

      prevKeys.current = currentKeys;
    }, (error) => {
      console.error('🔔 Firebase notifications/whatsappSessions error:', error);
    });

    return () => unsubscribe();
  }, [playSound, showManagedToast]);

  // --- Listen for NEW entries under any notifications/{id} object ---
  // Uses onChildAdded + onChildChanged instead of onValue on root (more reliable with Firebase rules).
  // Skips reserved sub-paths that already have their own listeners.
  // Uses createdAt timestamp to avoid toasting old entries on page load — no isInitial gate.
  const NOTIF_RESERVED_KEYS = ['general', 'inbox', 'trigger', 'whatsappSessions'];

  useEffect(() => {
    if (!database) return;

    const userInfo = getUserInfo();
    if (!userInfo) return;

    const BLOCKED_ROLES = ['Kiosk Member', 'Event Member'];
    if (BLOCKED_ROLES.includes(userInfo?.roleName || '')) return;

    const notifRootRef = ref(database, 'notifications');
    const listenStartTime = new Date().toISOString();
    const shownKeys = new Set();

    console.log('🔔 Listening on notifications/* (child events), startTime:', listenStartTime);

    const processParentSnapshot = (snapshot) => {
      const parentKey = snapshot.key;
      if (NOTIF_RESERVED_KEYS.includes(parentKey)) return;

      const parentData = snapshot.val();
      if (!parentData || typeof parentData !== 'object') return;

      Object.entries(parentData).forEach(([pushKey, value]) => {
        if (!value || typeof value !== 'object') return;

        const compositeKey = `${parentKey}/${pushKey}`;
        if (shownKeys.has(compositeKey)) return;
        shownKeys.add(compositeKey);

        // Only toast entries created AFTER this listener started
        if (!value.createdAt || value.createdAt <= listenStartTime) return;

        const phone = typeof value.phoneNumber === 'object'
          ? (value.phoneNumber?.phoneNumber || '')
          : (value.phoneNumber || '');

        console.log('🔔 NEW notification entry:', { compositeKey, type: value.type, phone, notes: value.notes });

        playSound();
        showManagedToast(() => toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (phone) {
                sessionStorage.setItem('openChatForPhone', phone.replace(/\D/g, ''));
                sessionStorage.setItem('openChatForName', phone);
                if (window.location.pathname === '/inbox') {
                  window.dispatchEvent(new Event('openChatFromNotification'));
                } else {
                  window.location.href = '/inbox';
                }
              }
            }}
            style={{
              maxWidth: '400px',
              width: '100%',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #0a1e2e 0%, #0d2a3d 50%, #0a1e2e 100%)',
              borderRadius: '16px',
              padding: '0',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.1)',
              overflow: 'hidden',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
              transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
            }}
          >
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #06b6d4, #0891b2, #06b6d4, transparent)',
            }} />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                position: 'relative',
                flexShrink: 0,
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(145deg, #06b6d4, #0891b2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(6,182,212,0.3)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#06b6d4',
                  border: '2.5px solid #0a1e2e',
                  boxShadow: '0 0 8px rgba(6,182,212,0.5)',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: '#67e8f9',
                    background: 'rgba(6,182,212,0.15)',
                    borderRadius: '20px',
                  }}>
                    Follow-up
                  </span>
                  <span style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '11px',
                    fontWeight: 500,
                    marginLeft: 'auto',
                  }}>
                    {value.createdAt ? new Date(value.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'just now'}
                  </span>
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>
                  {phone ? `Follow up with ${phone}` : 'Follow-up Reminder'}
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.4',
                }}>
                  {value.notes || 'You have a pending follow-up for this contact'}
                </p>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(6,182,212,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
            </div>
            <div style={{ height: '2px', width: '100%', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#06b6d4', animation: 'toast-shrink 6s linear forwards' }} />
            </div>
          </div>
        ), { duration: 6000, position: 'top-right' }));
      });
    };

    // onChildAdded: fires once per existing child + for each new child added
    const unsubAdded = onChildAdded(notifRootRef, processParentSnapshot);
    // onChildChanged: fires when a child node changes (e.g. new push key added under it)
    const unsubChanged = onChildChanged(notifRootRef, processParentSnapshot);

    return () => {
      unsubAdded();
      unsubChanged();
    };
  }, [playSound, showManagedToast]);

  // --- Listen for whatsappSessions reminder flag ---
  useEffect(() => {
    if (!database || !isNotificationAllowedForUser()) return;

    const sessionsRef = ref(database, 'whatsappSessions');
    const prevRemindersRef = { current: new Map() };
    let isInitial = true;

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const currentReminders = new Map();

      Object.entries(data).forEach(([phone, session]) => {
        if (session && session.reminder === true) {
          currentReminders.set(phone, true);
        }
      });

      if (isInitial) {
        prevRemindersRef.current = currentReminders;
        isInitial = false;
        return;
      }

      // Find newly added reminder:true entries
      currentReminders.forEach((_, phone) => {
        if (prevRemindersRef.current.has(phone)) return;

        // New reminder flag detected
        playSound();
        showManagedToast(() => toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              sessionStorage.setItem('openChatForPhone', phone.replace(/\D/g, ''));
              sessionStorage.setItem('openChatForName', phone);
              if (window.location.pathname === '/inbox') {
                window.dispatchEvent(new Event('openChatFromNotification'));
              } else {
                window.location.href = '/inbox';
              }
            }}
            style={{
              maxWidth: '400px',
              width: '100%',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1050 50%, #1a0a2e 100%)',
              borderRadius: '16px',
              padding: '0',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.1)',
              overflow: 'hidden',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
              transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
            }}
          >
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #a855f7, #7c3aed, #a855f7, transparent)',
            }} />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                position: 'relative',
                flexShrink: 0,
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(145deg, #a855f7, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                  </svg>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2.5px solid #1a0a2e',
                  boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: '#c084fc',
                    background: 'rgba(168,85,247,0.15)',
                    borderRadius: '20px',
                  }}>
                    Session Reminder
                  </span>
                  <span style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '11px',
                    fontWeight: 500,
                    marginLeft: 'auto',
                  }}>
                    just now
                  </span>
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>
                  Reminder from {phone}
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: '1.4',
                }}>
                  Kindly reply to this customer
                </p>
              </div>
              {/* Close button */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(168,85,247,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              {/* Arrow indicator - commented out for now */}
              {/* <div style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(168,85,247,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div> */}
            </div>
            <div style={{ height: '2px', width: '100%', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#a855f7', animation: 'toast-shrink 7s linear forwards' }} />
            </div>
          </div>
        ), { duration: 7000, position: 'top-right' }));
      });

      prevRemindersRef.current = currentReminders;
    }, (error) => {
      console.error('Firebase whatsappSessions reminder listener error:', error);
    });

    return () => unsubscribe();
  }, [playSound]);

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
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
      {children}
    </FirebaseNotificationContext.Provider>
  );
};
