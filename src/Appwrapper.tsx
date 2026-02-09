import React, { useEffect, useState } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import app from '@/config/firebase';

interface AppWrapperProps {
  children: React.ReactNode;
}

interface NotificationData {
  title: string;
  body: string;
  timestamp: string;
}

/**
 * AppWrapper component that handles app-level initialization
 * including Firebase notifications with visual banner
 */
export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    console.log('🚀 AppWrapper initialized');

    // Initialize Firebase Messaging
    const initializeMessaging = async () => {
      try {
        const messaging = getMessaging(app);
        console.log('✅ Messaging initialized in AppWrapper');

        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('🔔 Message received in AppWrapper:', payload);
          
          // Show notification banner
          const notificationData: NotificationData = {
            title: payload.notification?.title || 'New Notification',
            body: payload.notification?.body || 'You have a new notification',
            timestamp: new Date().toLocaleTimeString(),
          };
          
          setNotification(notificationData);
          setShowBanner(true);

          // Auto-hide after 10 seconds
          setTimeout(() => {
            setShowBanner(false);
          }, 10000);

          // Log to console for debugging
          console.log('📬 Notification Data:', {
            title: notificationData.title,
            body: notificationData.body,
            payload: payload,
          });
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing messaging in AppWrapper:', error);
      }
    };

    initializeMessaging();

    return () => {
      console.log('🔥 AppWrapper cleanup');
    };
  }, []);

  const closeBanner = () => {
    setShowBanner(false);
  };

  const copyToken = () => {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      navigator.clipboard.writeText(token);
      alert('Token copied to clipboard!');
    } else {
      alert('No token found!');
    }
  };

  return (
    <>
      {/* Visual Notification Banner - Shows at top of app */}
      {showBanner && notification && (
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] animate-slideDown2"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                {/* Notification Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-black">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-black/70 font-semibold">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-black/90 font-medium">
                    {notification.body}
                  </p>
                  <p className="text-xs text-black/60 mt-2 font-mono">
                    ✅ Notification received and displayed successfully!
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={closeBanner}
                  className="flex-shrink-0 w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Close notification"
                >
                  <svg
                    className="w-5 h-5 text-black"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info Panel - Bottom Right Corner with Smooth Transitions */}
      <div
        className={`fixed bottom-4 right-4 z-[9998] bg-[#1A1A1A]/95 backdrop-blur-sm border border-[#BBA473]/30 rounded-lg shadow-2xl transition-all duration-300 ease-in-out ${
          showDebugPanel
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="p-3 max-w-xs">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-[#BBA473] text-xs flex items-center gap-2 mr-3">
              <span>🔔</span>
              <span>Notification Debug</span>
            </div>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="w-5 h-5 rounded-full bg-[#BBA473]/20 hover:bg-[#BBA473]/30 flex items-center justify-center transition-colors group"
              aria-label="Close debug panel"
            >
              <svg
                className="w-3 h-3 text-[#BBA473] group-hover:text-white transition-colors"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Debug Information */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 bg-black/30 rounded">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 font-semibold">✅ Listening</span>
            </div>
            
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 bg-black/30 rounded">
              <span className="text-gray-400">Token:</span>
              <span className={`font-semibold ${localStorage.getItem('firebaseToken') ? 'text-blue-400' : 'text-red-400'}`}>
                {localStorage.getItem('firebaseToken') ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-3 py-1.5 px-2 bg-black/30 rounded">
              <span className="text-gray-400">Last:</span>
              <span className="text-yellow-400 font-semibold truncate max-w-[120px]">
                {notification ? notification.timestamp : 'None'}
              </span>
            </div>

            {notification && (
              <div className="py-1.5 px-2 bg-black/30 rounded">
                <div className="text-gray-400 mb-1">Last Message:</div>
                <div className="text-[#BBA473] font-semibold truncate">
                  {notification.title}
                </div>
              </div>
            )}
          </div>

          {/* Copy Token Button */}
          <button
            onClick={copyToken}
            className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded text-xs font-bold hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            📋 Copy FCM Token
          </button>
        </div>
      </div>

      {/* Reopen Debug Panel Button - Shows when panel is closed */}
      {!showDebugPanel && (
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed !hidden bottom-4 right-4 z-[9998] w-12 h-12 bg-[#1A1A1A]/95 backdrop-blur-sm border border-[#BBA473]/30 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#BBA473]/20 transition-all duration-300 group animate-fadeIn"
          aria-label="Open debug panel"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🔔</span>
        </button>
      )}

      {/* App Content */}
      {children}

      {/* Animation Styles */}
      <style>{`
        @keyframes slideDown2 {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideDown2 {
          animation: slideDown2 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};