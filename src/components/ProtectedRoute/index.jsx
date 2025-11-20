import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '@/utils/authUtils';
import { hasRouteAccess, ROUTES } from '@/config/roleConfig';

/**
 * ProtectedRoute Component
 * Wraps routes to provide role-based access control
 * Optimized for performance - minimal re-renders and fast checks
 * 
 * Usage:
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 * } />
 */
const ProtectedRoute = ({ children, requiredRoute = null }) => {
  const location = useLocation();

  // Check authentication first (fastest check)
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If no specific route requirement, render immediately
  if (!requiredRoute) {
    return children;
  }

  // Check role-based access
  const userRole = getUserRole();
  const hasAccess = hasRouteAccess(userRole, requiredRoute);

  if (!hasAccess) {
    // Redirect to dashboard if no access
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // User has access, render the component
  return children;
};

export default ProtectedRoute;