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

      {/* Debug Info - Bottom Right Corner */}
      <div className="fixed bottom-4 right-4 z-[9998] bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg p-3 text-xs font-mono text-white max-w-xs">
        <div className="font-bold text-[#BBA473] mb-2">🔔 Notification Debug</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Status:</span>
            <span className="text-green-400">✅ Listening</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Token:</span>
            <span className="text-blue-400">
              {localStorage.getItem('firebaseToken') ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Last:</span>
            <span className="text-yellow-400">
              {notification ? notification.timestamp : 'None'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            const token = localStorage.getItem('firebaseToken');
            if (token) {
              navigator.clipboard.writeText(token);
              alert('Token copied to clipboard!');
            } else {
              alert('No token found!');
            }
          }}
          className="mt-2 w-full px-2 py-1 bg-[#BBA473] text-black rounded text-xs font-semibold hover:bg-[#8E7D5A] transition-colors"
        >
          Copy FCM Token
        </button>
      </div>

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
      `}</style>
    </>
  );
};