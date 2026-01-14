// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-dwT4V7vUx32nUdao_BZksPQZcy1SETU",
  authDomain: "saveingold-crm.firebaseapp.com",
  projectId: "saveingold-crm",
  storageBucket: "saveingold-crm.firebasestorage.app",
  messagingSenderId: "650149237633",
  appId: "1:650149237633:web:60d68b25381dfbebe88e80",
  measurementId: "G-E52RNTDFLC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Firebase Messaging initialization error:', error);
}

export { app, analytics, messaging, getToken, onMessage };