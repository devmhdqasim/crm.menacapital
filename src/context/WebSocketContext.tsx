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

        // Check if this is our own echoed message (agent-sent)
        const isOwnMessage =
          data.owner === true ||
          data.eventType === 'sentMessage' ||
          data.direction === 'outbound';

        const messageText = data.text || data.message || '';
        const isRecentlySent = messageText && recentlySentTextsRef.current.has(messageText.trim());

        // Only show notification for genuine incoming customer messages
        if (!isOwnMessage && !isRecentlySent) {
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
                  window.location.reload();
                } else {
                  window.location.href = '/inbox';
                }
              }}
              style={{
                maxWidth: '380px',
                width: '100%',
                cursor: 'pointer',
                background: '#1A1A1A',
                borderRadius: '16px',
                padding: '0',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(187,164,115,0.25), 0 0 30px rgba(187,164,115,0.08)',
                overflow: 'hidden',
                opacity: t.visible ? 1 : 0,
                transform: t.visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
                transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
              }}
            >
              {/* Top gold accent bar */}
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #BBA473, #D4C89A, #BBA473)',
              }} />

              <div style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}>
                {/* Avatar with glow */}
                <div style={{
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, #BBA473, #8E7D5A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(187,164,115,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  {/* Online pulse dot */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2.5px solid #1A1A1A',
                    boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      color: '#BBA473',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '0.2px',
                    }}>
                      {senderPhone}
                    </span>
                    <span style={{
                      color: '#666',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      just now
                    </span>
                  </div>
                  <p style={{
                    color: '#d4d4d4',
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

                {/* Arrow indicator */}
                <div style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(187,164,115,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBA473" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
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
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;