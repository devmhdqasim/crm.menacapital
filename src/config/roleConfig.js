/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * This file centralizes all role permissions for easy maintenance.
 * To add a new role or modify permissions, simply update this configuration.
 */

/**
 * Define all available routes in the application
 */
export const ROUTES = {
  // Public routes
  LOGIN: '/',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  BRANCHDASHBOARD: '/br-dashboard',
  AGENT: '/agents',                    // Changed from '/agent' to '/agents'
  LEADS: '/leads',
  BRANCHLEADS: '/br-leads',
  ADMINLEADS: '/ad-leads',
  SALESMANAGERLEADS: '/sm-leads',
  BRANCHES: '/branches',
  KIOSKMEMBER: '/kiosk-members',
  ROLE_MANAGEMENT: '/role-management',
  SETTINGS: '/settings',
  TASKS: '/tasks',
  SALES_MANAGERS: '/sales-managers',   // Changed from '/sales-manager' to '/sales-managers'
};

/**
 * Define all roles in the system
 * These MUST match exactly with the roleName field from your API response
 */
export const ROLES = {
  SUPER_ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  AGENT: 'Agent',
  KIOSK_MEMBER: 'Kiosk Member',
};

/**
 * Role Permissions Configuration
 * 
 * Each role has an array of allowed routes.
 * To add a new role:
 * 1. Add it to the ROLES object above
 * 2. Add its permissions here
 * 
 * To modify permissions:
 * - Simply add or remove routes from the allowedRoutes array
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    allowedRoutes: [
      ROUTES.DASHBOARD,
      ROUTES.SALES_MANAGERS,  // Admin can access Sales Managers
      ROUTES.AGENT,           // Admin can access Agents
      ROUTES.KIOSKMEMBER,
      ROUTES.ADMINLEADS,
      ROUTES.BRANCHES,
      ROUTES.ROLE_MANAGEMENT,
    ],
    label: 'Admin',
    description: 'Access to dashboard, sales managers, agents, leads, branches, and role management',
  },
  
  [ROLES.SALES_MANAGER]: {
    allowedRoutes: [
      ROUTES.DASHBOARD,
      ROUTES.AGENT,           // Sales Manager can access Agents
      ROUTES.SALESMANAGERLEADS,
      ROUTES.TASKS,           // Sales Manager can access Tasks
      // ROUTES.KIOSKMEMBER,
    ],
    label: 'Sales Manager',
    description: 'Access to dashboard, agents, leads, and tasks',
  },
  
  [ROLES.AGENT]: {
    allowedRoutes: [
      ROUTES.DASHBOARD,
      ROUTES.LEADS,
      ROUTES.TASKS,           // Agents can access Tasks
    ],
    label: 'Agent',
    description: 'Access to dashboard, leads, and tasks',
  },
  
  [ROLES.KIOSK_MEMBER]: {
    allowedRoutes: [
      ROUTES.BRANCHDASHBOARD,
      ROUTES.BRANCHLEADS,
    ],
    label: 'Kiosk Member',
    description: 'Access to dashboard and leads only',
  },
};

/**
 * Default role to use if user role is not found
 * This provides a fallback with minimal permissions
 */
export const DEFAULT_ROLE = ROLES.AGENT;

/**
 * Sidebar Menu Configuration
 * Maps routes to their sidebar display properties
 */
export const SIDEBAR_MENU_CONFIG = [
  {
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon: 'Home',
  },
  {
    label: 'Dashboard',
    route: ROUTES.BRANCHDASHBOARD,
    icon: 'Home',
  },
  {
    label: 'Agents',              // Changed from 'SIG Team' to 'Agents'
    route: ROUTES.AGENT,
    icon: 'User',
  },
  {
    label: 'Sales Managers',
    route: ROUTES.SALES_MANAGERS,
    icon: 'Users',
  },
  {
    label: 'Kiosk Members',
    route: ROUTES.KIOSKMEMBER,
    icon: 'CheckSquare',
  },
  {
    label: 'Leads',
    route: ROUTES.LEADS,
    icon: 'TrendingUp',
  },
  {
    label: 'Leads',
    route: ROUTES.ADMINLEADS,
    icon: 'TrendingUp',
  },
  {
    label: 'Leads',
    route: ROUTES.BRANCHLEADS,
    icon: 'TrendingUp',
  },
  {
    label: 'Leads',
    route: ROUTES.SALESMANAGERLEADS,
    icon: 'TrendingUp',
  },
  {
    label: 'Tasks',
    route: ROUTES.TASKS,
    icon: 'CheckSquare',
  },
  {
    label: 'Branches',
    route: ROUTES.BRANCHES,
    icon: 'GitBranch',
  },
  {
    label: 'Role Management',
    route: ROUTES.ROLE_MANAGEMENT,
    icon: 'ShieldCheck',
  },
];

/**
 * Bottom menu items (always visible to authenticated users)
 */
export const BOTTOM_MENU_CONFIG = [
  {
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon: 'Settings',
  },
];

/**
 * Helper function to check if a role has access to a specific route
 * @param {string} userRole - The user's role
 * @param {string} route - The route to check
 * @returns {boolean} - True if user has access
 */
export const hasRouteAccess = (userRole, route) => {
  if (!userRole) return false;
  
  // Get role permissions, fallback to default role if not found
  const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[DEFAULT_ROLE];
  
  return rolePermissions.allowedRoutes.includes(route);
};

/**
 * Helper function to get all allowed routes for a role
 * @param {string} userRole - The user's role
 * @returns {Array<string>} - Array of allowed routes
 */
export const getAllowedRoutes = (userRole) => {
  console.log('🎯 getAllowedRoutes called with role:', userRole);
  
  if (!userRole) {
    console.log('❌ No userRole provided');
    return [];
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  if (!rolePermissions) {
    console.log('⚠️ Role not found in ROLE_PERMISSIONS:', userRole);
    console.log('Available roles:', Object.keys(ROLE_PERMISSIONS));
    console.log('Using DEFAULT_ROLE:', DEFAULT_ROLE);
    return ROLE_PERMISSIONS[DEFAULT_ROLE].allowedRoutes;
  }
  
  console.log('✅ Found permissions for role:', userRole);
  console.log('Allowed routes:', rolePermissions.allowedRoutes);
  
  return rolePermissions.allowedRoutes;
};

/**
 * Helper function to filter menu items based on role
 * @param {Array} menuItems - Array of menu items with route property
 * @param {string} userRole - The user's role
 * @returns {Array} - Filtered menu items
 */
export const filterMenuByRole = (menuItems, userRole) => {
  if (!userRole) return [];
  
  const allowedRoutes = getAllowedRoutes(userRole);
  
  return menuItems.filter(item => {
    // Check if main route is allowed
    return allowedRoutes.includes(item.route);
  });
};

/**
 * Helper function to get role information
 * @param {string} userRole - The user's role
 * @returns {Object} - Role information
 */
export const getRoleInfo = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[DEFAULT_ROLE];
};