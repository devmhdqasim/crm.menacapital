import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (data: any) => void;
  addMessageListener: (callback: (data: any) => void) => () => void;
  reconnect: () => void;
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
  const socketRef = useRef<Socket | null>(null);
  const messageListenersRef = useRef<Set<(data: any) => void>>(new Set());

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

        // Show global toast notification for new incoming messages
        const senderPhone = data.from || data.waId || 'Unknown';
        const messagePreview = data.text || data.message || '';
        const previewText = messagePreview.length > 60
          ? messagePreview.substring(0, 60) + '...'
          : messagePreview;

        toast(
          `${previewText || 'New media message'}`,
          {
            icon: '💬',
            duration: 4000,
            style: {
              background: '#2A2A2A',
              color: '#fff',
              border: '1px solid #BBA473',
            },
          }
        );

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
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;