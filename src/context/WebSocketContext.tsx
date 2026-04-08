import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (data: any) => void;
  addMessageListener: (callback: (data: any) => void) => () => void;
  reconnect: () => void;
  trackSentMessage: (text: string) => void;
  unreadCount: number;
  resetUnreadCount: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const messageListenersRef = useRef<Set<(data: any) => void>>(new Set());
  const recentlySentTextsRef = useRef<Set<string>>(new Set());

  const connect = () => {
    try {
      // Connect to Socket.IO server
      const socket = io('https://staging.crm.saveingold.app', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setIsConnected(true);
      });

      // Listen for customer messages from WhatsApp
      socket.on('customer_message', (data) => {
        console.log('📩 Customer message received:', data);

        setLastMessage(data);

        // Detect DELIVERED / READ status events from backend
        // Backend sends these via customer_message with eventType like:
        //   "sentMessageDELIVERED_v2" or "sentMessageREAD_v2"
        const eventType = data.eventType || '';
        if (eventType.includes('DELIVERED') || eventType.includes('READ')) {
          const status = eventType.includes('READ') ? 'read' : 'delivered';
          const rawWaId = data.waId || data.from || '';
          const waId = typeof rawWaId === 'object' && rawWaId !== null
            ? (rawWaId.phoneNumber || '')
            : rawWaId;
          const messageId = data.whatsappMessageId || data.messageId || '';

          console.log(`📊 Status update via customer_message: ${status}`, { messageId, waId });

          const statusUpdate = {
            type: 'status_update',
            status,
            messageId,
            waId,
          };

          // Notify all listeners with the status update
          messageListenersRef.current.forEach((listener) => {
            listener(statusUpdate);
          });
          return; // Don't process as a regular message
        }

        // Check if this is our own echoed message (agent-sent)
        const isOwnMessage =
          data.owner === true ||
          data.eventType === 'sentMessage' ||
          data.direction === 'outbound';

        const messageText = data.text || data.message || '';
        const isRecentlySent = messageText && recentlySentTextsRef.current.has(messageText.trim());

        // Check if the current user is logged in and their role is allowed
        const BLOCKED_NOTIFICATION_ROLES = ['Kiosk Member', 'Event Member'];
        let userRole = '';
        let userId = '';
        let isLoggedIn = false;
        try {
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            isLoggedIn = true;
            const parsed = JSON.parse(userInfo);
            userRole = parsed.roleName || '';
            userId = parsed._id || parsed.id || '';
          }
        } catch {}
        const isRoleBlocked = BLOCKED_NOTIFICATION_ROLES.includes(userRole);

        // Sales Agent filtering: block everything (notification + listener forwarding + inbox pop)
        // Agents only see their own leads; Sales Managers see everything
        const leadAgentId = data.leadData?.leadAgentId || null;
        const isSalesAgent = userRole === 'Agent';
        const isAgentFiltered = isSalesAgent && leadAgentId !== userId;
        console.log('🔍 Agent filter debug:', { userRole, userId, leadAgentId, isSalesAgent, isAgentFiltered });

        if (isAgentFiltered) {
          console.log('🚫 Agent filtered — skipping notification + listener forwarding');
          return; // Early exit: no toast, no unread count, no listener forwarding
        }

        // Only show notification for genuine incoming customer messages (skip read receipts, logged out, blocked roles)
        if (!isOwnMessage && !isRecentlySent && data.name !== 'Read type' && !isRoleBlocked && isLoggedIn) {
          const previewText = messageText.length > 60
            ? messageText.substring(0, 60) + '...'
            : messageText;

          const rawPhone = data.from || data.waId || 'Unknown';
          const senderPhone = typeof rawPhone === 'object' && rawPhone !== null
            ? (rawPhone.phoneNumber || JSON.stringify(rawPhone))
            : rawPhone;

          // Increment unread count
          setUnreadCount(prev => prev + 1);

          // Custom rich notification toast
          toast.custom((t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                sessionStorage.setItem('openChatForPhone', senderPhone.replace(/\D/g, ''));
                sessionStorage.setItem('openChatForName', senderPhone);
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
                background: 'linear-gradient(135deg, #0a2e24 0%, #0f3d30 50%, #0a2e24 100%)',
                borderRadius: '16px',
                padding: '0',
                border: '1px solid rgba(37, 211, 102, 0.25)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(37,211,102,0.08)',
                overflow: 'hidden',
                opacity: t.visible ? 1 : 0,
                transform: t.visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
                transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
              }}
            >
              {/* Top WhatsApp green accent bar */}
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #25D366, transparent)',
              }} />

              <div style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}>
                {/* WhatsApp icon */}
                <div style={{
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(145deg, #25D366, #128C7E)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(37,211,102,0.3)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  {/* Online pulse dot */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#25D366',
                    border: '2.5px solid #0a2e24',
                    boxShadow: '0 0 8px rgba(37,211,102,0.5)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '1px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: '#5afa9e',
                      background: 'rgba(37,211,102,0.15)',
                      borderRadius: '20px',
                    }}>
                      WhatsApp
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
                  <div style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.2px',
                    marginBottom: '3px',
                  }}>
                    {senderPhone}
                  </div>
                  <p style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: '13px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.4',
                  }}>
                    {previewText || 'New media message'}
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
                    background: 'rgba(37,211,102,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,211,102,0.25)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,211,102,0.1)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  background: 'rgba(37,211,102,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div> */}
              </div>

              {/* Bottom progress bar */}
              <div style={{ height: '2px', width: '100%', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: '#25D366',
                  animation: 'toast-shrink 5s linear forwards',
                }} />
              </div>
            </div>
          ), {
            duration: 5000,
            position: 'top-right',
          });
        }

        // Clean up matched sent text
        if (isRecentlySent) {
          recentlySentTextsRef.current.delete(messageText.trim());
        }

        // Skip forwarding our own echoed messages to listeners (prevents duplicate images/media)
        if (isOwnMessage || isRecentlySent) {
          return;
        }

        // Notify all listeners
        messageListenersRef.current.forEach((listener) => {
          listener(data);
        });
      });

      // ✨ NEW: Listen for message status updates (single tick, double tick, read)
      socket.on('message_status', (data) => {
        console.log('📊 Message status update:', data);
        
        setLastMessage({ ...data, type: 'status_update' });
        
        // Notify all listeners
        messageListenersRef.current.forEach((listener) => {
          listener({ ...data, type: 'status_update' });
        });
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        setIsConnected(false);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('❌ Error creating Socket.IO connection:', error);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const addMessageListener = useCallback((callback: (data: any) => void) => {
    messageListenersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      messageListenersRef.current.delete(callback);
    };
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      // Emit to backend using the 'send_message' event
      socketRef.current.emit('send_message', data);
      console.log('📤 Message sent via Socket.IO:', data);
    } else {
      console.warn('⚠️ Socket.IO not connected. Message not sent:', data);
    }
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const trackSentMessage = useCallback((text: string) => {
    if (!text) return;
    const trimmed = text.trim();
    recentlySentTextsRef.current.add(trimmed);
    // Auto-remove after 10 seconds
    setTimeout(() => {
      recentlySentTextsRef.current.delete(trimmed);
    }, 10000);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageListener,
    reconnect: connect,
    trackSentMessage,
    unreadCount,
    resetUnreadCount,
  };

  return (
    <WebSocketContext.Provider value={value}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;