import { useState, useMemo, Suspense, lazy } from "react";
import { useLocation } from 'react-router-dom';
import { useRoutes, Navigate } from 'react-router-dom';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
// import UserWidget from '@/features/user/components/UserWidget';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RouteLoadingFallback } from '@/components/LoadingSpinner';
import GridBackground from '@/components/GridBackground'; // Import GridBackground

import { getUserRole } from '@/utils/authUtils';
import { ROUTES, getAllowedRoutes } from '@/config/roleConfig';

// Auto-reload once on stale chunk errors after a new deployment
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        return new Promise(() => {}); // hang while reloading
      }
      sessionStorage.removeItem('chunk_reload');
      throw error; // re-throw if reload didn't fix it
    })
  );
}

// ⭐ Lazy load route components for better performance
const LoginPage = lazyWithRetry(() => import('@/routes/Login'));
const UpdatePasswordPage = lazyWithRetry(() => import('@/routes/UpdatePassword'));
const DashboardPage = lazyWithRetry(() => import('@/routes/Dashboard'));
const NotificationsPage = lazyWithRetry(() => import('@/routes/Notifications'));
const BranchDashboardPage = lazyWithRetry(() => import('@/routes/BranchDashboard'));
const AgentsPage = lazyWithRetry(() => import('@/routes/Agents'));
const KioskMembersPage = lazyWithRetry(() => import('@/routes/KioskMembers'));
const LeadsPage = lazyWithRetry(() => import('@/routes/Leads'));
const AdminLeadsPage = lazyWithRetry(() => import('@/routes/LeadsAdmin'));
const BranchesPage = lazyWithRetry(() => import('@/routes/Branches'));
const ExhibitionPage = lazyWithRetry(() => import('@/routes/Exhibitions'));
const WatiInboxPage = lazyWithRetry(() => import('@/routes/Inbox'));
const BranchLeadsPage = lazyWithRetry(() => import('@/routes/BranchLeads'));
const EventLeadsPage = lazyWithRetry(() => import('@/routes/EventLeads'));
const SalesManagerLeadsPage = lazyWithRetry(() => import('@/routes/SalesManagerLeads'));
const RoleManagementPage = lazyWithRetry(() => import('@/routes/RoleManagement'));
const TasksPage = lazyWithRetry(() => import('@/routes/Tasks'));
const SalesManagersPage = lazyWithRetry(() => import('@/routes/SalesManagers'));

export function AppRoutes() {
  // Clear chunk reload flag on successful render
  sessionStorage.removeItem('chunk_reload');

  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get user role and allowed routes
  const userRole = getUserRole();
  const allowedRoutes = useMemo(() => getAllowedRoutes(userRole), [userRole]);

  // Define all routes with protection and Suspense
  const allRoutes = [
    {
      path: '/',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <LoginPage />
        </Suspense>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.DASHBOARD}>
            <DashboardPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/br-dashboard',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.BRANCHDASHBOARD}>
            <BranchDashboardPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/agents',  // Changed from '/agent' to '/agents'
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.AGENT}>
            <AgentsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/kiosk-members',  // Changed from '/agent' to '/agents'
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.KIOSKMEMBER}>
            <KioskMembersPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/leads',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.LEADS}>
            <LeadsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/ad-leads',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.ADMINLEADS}>
            <AdminLeadsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },

    {
      path: '/sm-leads',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.SALESMANAGERLEADS}>
            <SalesManagerLeadsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/br-leads',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.BRANCHLEADS}>
            <BranchLeadsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/ev-leads',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.EVENTLEADS}>
            <EventLeadsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },

    {
      path: '/branches',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.BRANCHES}>
            <BranchesPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/exhibition',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.EXHIBITION}>
            <ExhibitionPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/inbox',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.INBOX}>
            <WatiInboxPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/role-management',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.ROLE_MANAGEMENT}>
            <RoleManagementPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/tasks',
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.TASKS}>
            <TasksPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/sales-managers',  // Changed from '/sales-manager' to '/sales-managers'
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.SALES_MANAGERS}>
            <SalesManagersPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },

    {
      path: '/update-password',  // Changed from '/sales-manager' to '/sales-managers'
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.UPDATE_PASSWORD}>
            <UpdatePasswordPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '/notifications',  // Changed from '/sales-manager' to '/sales-managers'
      element: (
        <Suspense fallback={<RouteLoadingFallback />}>
          <ProtectedRoute requiredRoute={ROUTES.NOTIFICATIONS}>
            <NotificationsPage />
          </ProtectedRoute>
        </Suspense>
      ),
    },

    // Catch-all route for undefined paths
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />,
    },
  ];

  const element = useRoutes(allRoutes);

  // hide Header & Sidebar on login route
  const isLoginPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex bg-[#050505] text-white relative">
      {/* Global Background */}
      {!isLoginPage && <GridBackground />}

      {!isLoginPage && (
        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          userRole={userRole}
        />
      )}

      {/* Main Content Wrapper with smooth transitions */}
      <div
        className={`
          flex flex-col flex-1 min-w-0
          transition-all duration-300 ease-in-out
          ${!isLoginPage
            ? isCollapsed
              ? 'lg:ml-20'
              : 'lg:ml-64'
            : ''
          }
        `}
      >
        {!isLoginPage && (
          <Header
            menuItems={[
              { label: 'Home', href: '/dashboard', testId: 'home-link' },
              { label: 'Agents', href: '/agents', testId: 'agents-link' },  // Changed from 'Clients' and '/agent' to 'Agents' and '/agents'
            ]}
          />
        )}

        {/* Main Content Area with fade-in animation */}
        <main
          className={`
            flex-1 w-full
            overflow-x-hidden
            ${!isLoginPage ? 'bg-black' : 'bg-black'}
            animate-fadeIn
          `}
        >
          {element}
        </main>
      </div>
    </div>
  );
}