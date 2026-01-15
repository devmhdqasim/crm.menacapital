// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase Cloud Messaging (only in browser and if supported)
let messaging = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch((error) => {
    console.log('Firebase Messaging not supported:', error);
  });
}

export { app, analytics, messaging, getToken, onMessage };
export default app;