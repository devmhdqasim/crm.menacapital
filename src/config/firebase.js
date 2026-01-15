// src/config/firebase.js (or firebase.ts)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-dwT4V7vUx32nUdao_BZksPQZcy1SETU",
  authDomain: "saveingold-crm.firebaseapp.com",
  projectId: "saveingold-crm",
  storageBucket: "saveingold-crm.firebasestorage.app",
  messagingSenderId: "650149237633",
  appId: "1:650149237633:web:60d68b25381dfbebe88e80",
  measurementId: "G-E52RNTDFLC"
};

// Initialize Firebase (prevent multiple initializations)
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Cloud Messaging (only in browser and if supported)
let messaging = null;

if (typeof window !== 'undefined') {
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

// IMPORTANT: Only export app and messaging instances
// DO NOT export getToken, onMessage, etc. - those should be imported from 'firebase/messaging' directly
export { app, messaging };
export default app;