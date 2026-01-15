import React, { useEffect } from 'react';
import NotificationComponent from './components/NotificationComponent';

interface AppWrapperProps {
  children: React.ReactNode;
}

/**
 * AppWrapper component that handles app-level initialization
 * including Firebase notifications
 */
export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Additional initialization logic can go here
    console.log('🚀 App initialized');
    
    return () => {
      console.log('🔥 App cleanup');
    };
  }, []);

  return (
    <>
      {/* Firebase Cloud Messaging Component */}
      <NotificationComponent />
      
      {/* App Content */}
      {children}
    </>
  );
};