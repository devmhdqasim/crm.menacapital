import { useState, useMemo, Suspense, lazy } from "react";
import { useLocation } from 'react-router-dom';
import { useRoutes, Navigate } from 'react-router-dom';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
// import UserWidget from '@/features/user/components/UserWidget';
import ProtectedRoute from '@/components/ProtectedRoute';
import { RouteLoadingFallback } from '@/components/LoadingSpinner';

import { getUserRole } from '@/utils/authUtils';
import { ROUTES, getAllowedRoutes } from '@/config/roleConfig';


// ⭐ Lazy load route components for better performance
const LoginPage = lazy(() => import('@/routes/Login'));
const DashboardPage = lazy(() => import('@/routes/Dashboard'));
const BranchDashboardPage = lazy(() => import('@/routes/BranchDashboard'));
const AgentsPage = lazy(() => import('@/routes/Agents'));
const KioskMembersPage = lazy(() => import('@/routes/KioskMembers'));
const LeadsPage = lazy(() => import('@/routes/Leads'));
const AdminLeadsPage = lazy(() => import('@/routes/LeadsAdmin'));
const BranchesPage = lazy(() => import('@/routes/Branches'));
const BranchLeadsPage = lazy(() => import('@/routes/BranchLeads'));
const SalesManagerLeadsPage = lazy(() => import('@/routes/SalesManagerLeads'));
const RoleManagementPage = lazy(() => import('@/routes/RoleManagement'));
const TasksPage = lazy(() => import('@/routes/Tasks'));  // NEW: Tasks page
const SalesManagersPage = lazy(() => import('@/routes/SalesManagers'));  // NEW: Sales Managers page

export function AppRoutes() {
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
    <div className="min-h-screen flex bg-[#BBA473]">
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
            ${!isLoginPage ? 'bg-gray-50' : 'bg-white'}
            animate-fadeIn
          `}
        >
          {element}
        </main>
      </div>
    </div>
  );
}