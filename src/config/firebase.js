// src/config/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Helper function to safely get environment variables for Next.js
const getEnvVar = (key) => {
  // For Next.js (both client and server side)
  // Next.js exposes NEXT_PUBLIC_ prefixed vars to the client
  if (typeof process !== 'undefined' && process.env) {
    // Try NEXT_PUBLIC_ prefix first (for client-side)
    const publicVar = process.env[`NEXT_PUBLIC_${key}`];
    if (publicVar) return publicVar;
    
    // Try without prefix (for server-side or Vercel secrets)
    const serverVar = process.env[key];
    if (serverVar) return serverVar;
  }
  
  // Fallback for other environments (Vite, CRA, etc.)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[`VITE_${key}`];
  }
  
  return undefined;
};

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID')
};

// Validate that all required config values are present
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.warn('⚠️ Missing Firebase configuration:', missingKeys);
    console.warn('ℹ️ Firebase features will be disabled. App will continue to work without Firebase.');
    return false;
  }
  return true;
};

// Initialize Firebase (prevent multiple initializations)
let app = null;
let isFirebaseEnabled = false;

try {
  isFirebaseEnabled = validateConfig();
  
  if (isFirebaseEnabled) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('ℹ️ Firebase not configured - app will run without Firebase features');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.log('ℹ️ App will continue without Firebase features');
  app = null;
  isFirebaseEnabled = false;
}

// Initialize Firebase Cloud Messaging (only in browser and if supported)
let messaging = null;

if (typeof window !== 'undefined' && app && isFirebaseEnabled) {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          messaging = getMessaging(app);
          console.log('✅ Firebase Messaging initialized');
        } catch (error) {
          console.error('❌ Firebase Messaging initialization error:', error);
          console.log('ℹ️ Messaging features will be disabled');
        }
      } else {
        console.warn('⚠️ Firebase Messaging not supported in this browser');
      }
    })
    .catch((error) => {
      console.error('❌ Error checking messaging support:', error);
    });
}

// Export helper to check if Firebase is available
export const isFirebaseAvailable = () => isFirebaseEnabled && app !== null;

export { app, messaging };
export default app;