import React, { useEffect } from "react";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";
import toast from "react-hot-toast";
import app from "@/config/firebase";

const requestNotificationPermission = async (): Promise<NotificationPermission | undefined> => {
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  } else {
    console.warn("This browser does not support notifications.");
  }
};

// interface CustomToastContentProps {
//   title: string;
//   body: string;
// }

// const CustomToastContent: React.FC<CustomToastContentProps> = ({ title, body }) => (
//   <div className="flex flex-col gap-1">
//     <h3 className="font-semibold text-lg text-white">{title}</h3>
//     <p className="text-sm text-gray-200">{body}</p>
//   </div>
// );

interface NotificationComponentProps {
  onNotificationReceived?: (payload: MessagePayload) => void;
}

const NotificationComponent: React.FC<NotificationComponentProps> = ({ onNotificationReceived }) => {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const permission = await requestNotificationPermission();
        
        if (permission === "granted") {
          console.log("Notification permission granted!");
          
          const messaging = getMessaging(app);
          
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: "BMlgwOu_IttRJNt-E2IaFi3uTNzyQB0zS0izl3ysAm3zMsw2k38yNotI21fYMLzs6vaKz59V1y7EUh66hys7R5g", // Replace with your VAPID key from Firebase Console
          }).catch((error) => {
            console.error("Error generating token:", error);
            return null;
          });

          if (token) {
            console.log("FCM Token:", token);
            localStorage.setItem("firebaseToken", token);
            
            // Send token to your backend
            // await sendTokenToBackend(token);
          } else {
            console.log("No token available");
          }

          // Handle foreground messages
          onMessage(messaging, (payload: MessagePayload) => {
            console.log("Message received in foreground:", payload);
            
            // Trigger notification state update
            if (onNotificationReceived) {
              onNotificationReceived(payload);
            }
            
            // Show toast notification
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-[#BBA473]/30`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center border border-[#BBA473]/30">
                          <span className="text-xl">🔔</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {payload.notification?.title || 'New Notification'}
                        </p>
                        <p className="mt-1 text-sm text-gray-300">
                          {payload.notification?.body || 'You have a new notification'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-[#BBA473]/20">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[#BBA473] hover:text-[#8E7D5A] focus:outline-none"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ),
              {
                duration: 5000,
                position: 'top-right',
              }
            );
          });
          
        } else if (permission === "denied") {
          console.warn("Notification permission denied by the user.");
          toast.error("Please enable notifications in your browser settings");
        } else if (permission === "default") {
          console.warn("Notification permission dismissed by the user.");
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      initializeNotifications();
    }
  }, [onNotificationReceived]);

  return null; // No UI needed, toasts are handled globally
};

export default NotificationComponent;