import React from 'react';
import NotificationBanner from './components/NotificationBanner';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  return (
    <>
      <NotificationBanner />
      {children}
    </>
  );
};
