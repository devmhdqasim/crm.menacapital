/**
 * Authentication Utilities
 * Helper functions for managing user authentication and role-based access
 */

/**
 * Get the current user's information from localStorage
 * @returns {Object|null} - User info object or null if not found
 */
export const getCurrentUser = () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  };
  
  /**
   * Get the current user's role
   * @returns {string|null} - User's role name or null if not found
   */
  export const getUserRole = () => {
    const user = getCurrentUser();
    return user?.roleName || null;
  };
  
  /**
   * Get the current user's full name
   * @returns {string} - User's full name
   */
  export const getUserFullName = () => {
    const user = getCurrentUser();
    if (!user) return 'Guest';
    
    const firstName = user.firstName?.en || user.firstName || '';
    const surname = user.surname?.en || user.surname || '';
    
    return `${firstName} ${surname}`.trim() || user.email || 'User';
  };
  
  /**
   * Get the current user's email
   * @returns {string|null} - User's email or null
   */
  export const getUserEmail = () => {
    const user = getCurrentUser();
    return user?.email || null;
  };
  
  /**
   * Get the current user's ID
   * @returns {string|null} - User's ID or null
   */
  export const getUserId = () => {
    const user = getCurrentUser();
    return user?.id || null;
  };
  
  /**
   * Get the current user's profile image URL
   * @returns {string|null} - User's image URL or null
   */
  export const getUserImageUrl = () => {
    const user = getCurrentUser();
    return user?.imageUrl || null;
  };
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  export const isAuthenticated = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const userInfo = getCurrentUser();
    return !!(refreshToken && userInfo);
  };
  
  /**
   * Check if user has a specific role
   * @param {string} roleName - The role to check
   * @returns {boolean} - True if user has the specified role
   */
  export const hasRole = (roleName) => {
    const userRole = getUserRole();
    return userRole === roleName;
  };
  
  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roleNames - Array of role names to check
   * @returns {boolean} - True if user has any of the specified roles
   */
  export const hasAnyRole = (roleNames) => {
    const userRole = getUserRole();
    return roleNames.includes(userRole);
  };
  
  /**
   * Save user info to localStorage
   * @param {Object} userInfo - User information object
   */
  export const setUserInfo = (userInfo) => {
    try {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } catch (error) {
      console.error('❌ Error saving user info:', error);
    }
  };
  
  /**
   * Clear user info from localStorage
   */
  export const clearUserInfo = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('serverToken');
    localStorage.removeItem('refreshToken');
  };
  
  /**
   * Update user info in localStorage (partial update)
   * @param {Object} updates - Object with properties to update
   */
  export const updateUserInfo = (updates) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn('⚠️ No user info to update');
        return false;
      }
      
      const updatedUser = { ...currentUser, ...updates };
      setUserInfo(updatedUser);
      return true;
    } catch (error) {
      console.error('❌ Error updating user info:', error);
      return false;
    }
  };
  
  /**
   * Check if user's email is verified
   * @returns {boolean} - True if email is verified
   */
  export const isEmailVerified = () => {
    const user = getCurrentUser();
    return user?.isEmailVerified || false;
  };
  
  /**
   * Check if user's phone is verified
   * @returns {boolean} - True if phone is verified
   */
  export const isPhoneVerified = () => {
    const user = getCurrentUser();
    return user?.isPhoneVerified || false;
  };
  
  /**
   * Get user's department
   * @returns {string|null} - User's department or null
   */
  export const getUserDepartment = () => {
    const user = getCurrentUser();
    return user?.department || null;
  };
  
  /**
   * Debug function to log current user info
   */
  export const debugUserInfo = () => {
    console.log('🔍 === USER INFO DEBUG ===');
    const user = getCurrentUser();
    if (user) {
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', getUserFullName());
      console.log('Role:', user.roleName);
      console.log('Department:', user.department);
      console.log('Email Verified:', user.isEmailVerified);
      console.log('Phone Verified:', user.isPhoneVerified);
    } else {
      console.log('❌ No user info found');
    }
    console.log('========================');
  };