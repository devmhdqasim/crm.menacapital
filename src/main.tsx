import { AppProvider } from './AppProvider';
import { initMocks } from './test';
import '@/UI/Layout/global.css';
import { AppRoutes } from '@/routes';
import '@radix-ui/themes/styles.css';
// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { CRMProvider } from './context/CRMContext';
import { AppWrapper } from './Appwrapper';
import { WebSocketProvider } from './context/WebSocketContext';
import { FirebaseNotificationProvider } from './context/FirebaseNotificationContext';

// Register Service Worker for Firebase Cloud Messaging
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
      
      if (registration.active) {
        console.log('✅ Service Worker is active');
      }
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker update found');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ New Service Worker installed, page refresh recommended');
            }
          });
        }
      });
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
} else {
  console.warn('⚠️ Service Workers are not supported in this browser');
}

// Check notification permission status
if ('Notification' in window) {
  console.log('🔔 Current notification permission:', Notification.permission);
}

initMocks().then(() => {
  // eslint-disable-next-line unicorn/prefer-query-selector,@typescript-eslint/no-non-null-assertion
  createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <WebSocketProvider>
      <CRMProvider>
        <AppProvider>
          <FirebaseNotificationProvider>
          <AppWrapper>
            <AppRoutes />
          </AppWrapper>
          </FirebaseNotificationProvider>
          <Toaster
            position="top-right"
            containerStyle={{ top: 12, right: 12 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#2A2A2A',
                color: '#fff',
                border: '1px solid #BBA473',
              },
              success: {
                iconTheme: {
                  primary: '#BBA473',
                  secondary: '#1A1A1A',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1A1A1A',
                },
              },
            }}
          />
        </AppProvider>
      </CRMProvider>
      </WebSocketProvider>
    // </StrictMode>,
  );
});