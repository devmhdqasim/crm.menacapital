// src/config/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Helper function to safely get environment variables
const getEnvVar = (key) => {
  // For Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[`VITE_${key}`];
  }
  // For Create React App
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`];
  }
  // Fallback
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
    console.error('❌ Missing Firebase configuration:', missingKeys);
    console.error('Current config:', firebaseConfig);
    throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}`);
  }
};

// Initialize Firebase (prevent multiple initializations)
let app;
try {
  validateConfig();
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  app = null;
}

// Initialize Firebase Cloud Messaging (only in browser and if supported)
let messaging = null;

if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          messaging = getMessaging(app);
          console.log('✅ Firebase Messaging initialized');
        } catch (error) {
          console.error('❌ Firebase Messaging initialization error:', error);
        }
      } else {
        console.warn('⚠️ Firebase Messaging not supported in this browser');
      }
    })
    .catch((error) => {
      console.error('❌ Error checking messaging support:', error);
    });
}

export { app, messaging };
export default app;