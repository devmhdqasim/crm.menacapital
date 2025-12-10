import { AppProvider } from './AppProvider';
import { initMocks } from './test';
import '@/UI/Layout/global.css';
import { AppRoutes } from '@/routes';
import '@radix-ui/themes/styles.css';
// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { CRMProvider } from './context/CRMContext';

initMocks().then(() => {
  // eslint-disable-next-line unicorn/prefer-query-selector,@typescript-eslint/no-non-null-assertion
  createRoot(document.getElementById('root')!).render(
    // <StrictMode>
      <CRMProvider>
        <AppProvider>
            <AppRoutes />
          <Toaster
          position="top-right"
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
    // </StrictMode>,
  );
});
