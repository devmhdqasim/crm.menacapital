import axios from 'axios'; 

/**
 * Auth Service
 * Handles all authentication related API calls including: 
 * - Login (with email or username)
 * - Refresh Token
 * - OTP Verification
 */

const API_BASE_URL = 'https://staging.crm.saveingold.app/api/v1';  

/**
 * Login user with email/username and password 
 * @param {string} login - User's email address or username
 * @param {string} password - User's password
 * @param {string} loginBy - Either "email" or "username"
 * @returns {Promise} - Returns user info and access token  
 */

export const loginUser = async (login, password, loginBy = 'email') => {  
  try { 
    console.log('🔵 Attempting login...');
    console.log('📝 Login with:', { login, loginBy });
    
    const response = await axios.post( 
      `${API_BASE_URL}/auth/login/en`,
      {
        login,
        password,
        loginBy, // "email" or "username"
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }, 
        timeout: 30000,
      }
    );

    console.log('✅ Login response received:', response.data);

    const data = response.data;
    if (data.status === 'success' && data.payload?.userInfo) {
      const { accessToken, ...userInfo } = data.payload.userInfo;
      
      console.log('📝 AccessToken from login:', accessToken ? 'Present' : 'Missing');
      console.log('👤 User Info:', {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.roleName,
        department: userInfo.department,
      });
      
      if (accessToken) {
        // Store the initial access token
        localStorage.setItem('accessToken', accessToken);
        // Store complete user info including role
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        // Store loginBy for future reference
        localStorage.setItem('loginBy', loginBy);
        window.dispatchEvent(new Event('user-login'));

        console.log('✅ Access token stored in localStorage');
        console.log('✅ User info stored with role:', userInfo.roleName);
        console.log('✅ Login type stored:', loginBy);
        console.log('📦 localStorage.accessToken:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
        
        // Immediately refresh the token after login to get refreshToken
        console.log('🔄 Calling refresh token API...');
        const refreshResult = await refreshToken(accessToken);
        
        if (refreshResult.success) {
          console.log('✅ Refresh token API successful');
        } else {
          console.warn('⚠️ Token refresh failed after login:', refreshResult.message);
        }
      } else {
        console.error('❌ No accessToken in login response!');
      }

      return {
        success: true,
        data: data.payload,
        message: data.payload.message || data.message,
      };
    } else {
      console.error('❌ Login response missing payload or userInfo');
      return {
        success: false,
        message: data.payload.message || 'Login failed',
      };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Invalid credentials. Please try again.',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: data.payload.message || 'An unexpected error occurred',
      };
    }
  }
};

export const loginBranch = async (login, password, loginBy = 'email') => {
  try {
    console.log('🔵 Attempting login...');
    console.log('📝 Login with:', { login, loginBy });
    
    const response = await axios.post(
      `${API_BASE_URL}/auth/branch/login/en`,
      {
        login,
        password,
        loginBy, // "email" or "username"
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Login response received:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.userInfo) {
      const { accessToken, ...userInfo } = data.payload.userInfo;
      
      console.log('📝 AccessToken from login:', accessToken ? 'Present' : 'Missing');
      console.log('👤 User Info:', {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.roleName,
        department: userInfo.department,
      });
      
      if (accessToken) {
        // Store the initial access token
        localStorage.setItem('accessToken', accessToken);
        const updatedUserInfo = {...userInfo, role: 'Kiosk Member', roleName: 'Kiosk Member'}

        // Store complete user info including role
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        // Store loginBy for future reference
        localStorage.setItem('loginBy', loginBy);
        
        console.log('✅ Access token stored in localStorage');
        console.log('✅ User info stored with role:', userInfo.roleName);
        console.log('✅ Login type stored:', loginBy);
        console.log('📦 localStorage.accessToken:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
        
        // Immediately refresh the token after login to get refreshToken
        console.log('🔄 Calling refresh token API...');
        const refreshResult = await refreshToken(accessToken);
        
        if (refreshResult.success) {
          console.log('✅ Refresh token API successful');
        } else {
          console.warn('⚠️ Token refresh failed after login:', refreshResult.message);
        }
      } else {
        console.error('❌ No accessToken in login response!');
      }

      return {
        success: true,
        data: data.payload,
        message: data.payload.message || data.message,
      };
    } else {
      console.error('❌ Login response missing payload or userInfo');
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Invalid credentials. Please try again.',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

export const loginEvent = async (login, password, loginBy = 'email') => {
  try {
    console.log('🔵 Attempting login...');
    console.log('📝 Login with:', { login, loginBy });
    
    const response = await axios.post(
      `${API_BASE_URL}/auth/event/login/en`,
      {
        login,
        password,
        loginBy, // "email" or "username"
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Login response received:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.userInfo) {
      const { accessToken, ...userInfo } = data.payload.userInfo;
      
      console.log('📝 AccessToken from login:', accessToken ? 'Present' : 'Missing');
      console.log('👤 User Info:', {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.roleName,
        department: userInfo.department,
      });
      
      if (accessToken) {
        // Store the initial access token
        localStorage.setItem('accessToken', accessToken);
        const updatedUserInfo = {...userInfo, role: 'Event Member', roleName: 'Event Member'}

        // Store complete user info including role
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        // Store loginBy for future reference
        localStorage.setItem('loginBy', loginBy);
        
        console.log('✅ Access token stored in localStorage');
        console.log('✅ User info stored with role:', userInfo.roleName);
        console.log('✅ Login type stored:', loginBy);
        console.log('📦 localStorage.accessToken:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
        
        // Immediately refresh the token after login to get refreshToken
        console.log('🔄 Calling refresh token API...');
        const refreshResult = await refreshToken(accessToken);
        
        if (refreshResult.success) {
          console.log('✅ Refresh token API successful');
        } else {
          console.warn('⚠️ Token refresh failed after login:', refreshResult.message);
        }
      } else {
        console.error('❌ No accessToken in login response!');
      }

      return {
        success: true,
        data: data.payload,
        message: data.payload.message || data.message,
      };
    } else {
      console.error('❌ Login response missing payload or userInfo');
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Invalid credentials. Please try again.',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Refresh the access token
 * @param {string} token - Current access token (optional, will use stored token if not provided)
 * @returns {Promise} - Returns new tokens
 */
export const refreshToken = async (token = null) => {
  try {
    const accessToken = token || localStorage.getItem('accessToken');
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    console.log('🔄 RefreshToken called with token:', accessToken ? 'Present' : 'Missing');

    if (!accessToken) {
      console.error('❌ No access token available for refresh');
      throw new Error('No access token available');
    }

    // One-liner selection for refresh URL based on role
    const refreshUrl = (userInfo?.roleName === 'Event Member' || userInfo?.role === 'Event Member') 
      ? `${API_BASE_URL}/auth/event/refreshToken/en`
      : (userInfo?.roleName === 'Kiosk Member' || userInfo?.role === 'Kiosk Member')
        ? `${API_BASE_URL}/auth/branch/refreshToken/en`
        : `${API_BASE_URL}/auth/refreshToken/en`;

    console.log(`🔗 Using refresh URL: ${refreshUrl}`);

    const response = await axios.post(
      refreshUrl,
      { accessToken },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Token refresh response:', response.data);

    const data = response.data;

    if (data.status === 'success' && data.payload?.updatedTokens) {
      const { serverToken, refreshToken } = data.payload.updatedTokens;

      if (serverToken) {
        localStorage.setItem('serverToken', serverToken);
        console.log('✅ Server token stored');
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Refresh token stored');
      }

      return {
        success: true,
        data: data.payload,
        message: data.message,
        serverToken,
        refreshToken,
      };
    } else {
      console.error('❌ Refresh response missing updatedTokens');
      return {
        success: false,
        message: data.message || 'Token refresh failed',
      };
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    console.error('❌ Error response:', error.response?.data);

    if (error.response?.status === 401) {
      console.log('❌ Token expired (401), logging out...');
      logoutUser();
      window.location.href = '/login';
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to refresh token',
      error: error.response?.data,
    };
  }
};


/**
 * Change user password
 * @param {string} email - User's email address
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} - Returns password change result
 */
export const changePassword = async (email, currentPassword, newPassword) => {
  try {
    const refreshToken = getRefreshToken();
    
    console.log('🔵 Attempting password change...');
    console.log('📝 Email:', email);
    
    if (!refreshToken) {
      console.error('❌ No refresh token available');
      throw new Error('Authentication required. Please login first.');
    }

    const response = await axios.patch(
      `${API_BASE_URL}/auth/userProfile/password/update/en`,
      {
        email,
        currentPassword,
        newPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Password change response:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Password changed successfully');
      
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Password changed successfully',
      };
    } else {
      console.error('❌ Password change failed:', data.message);
      return {
        success: false,
        message: data.message || 'Password change failed',
      };
    }
  } catch (error) {
    console.error('❌ Password change error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.payload?.message || error.response.data?.message || 'Failed to change password. Please try again.',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};


/**
 * Verify OTP sent to email
 * @param {string} email - User's email address
 * @param {string} passcode - 6-digit OTP code
 * @returns {Promise} - Returns verification result
 */
export const verifyOTP = async (email, passcode) => {
  try {
    // Get the refresh token from localStorage
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Verifying OTP...');
    console.log('📦 Checking tokens in localStorage:');
    console.log('   - accessToken:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
    console.log('   - serverToken:', localStorage.getItem('serverToken') ? 'Present' : 'Missing');
    console.log('   - refreshToken:', localStorage.getItem('refreshToken') ? 'Present' : 'Missing');
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      console.error('❌ Please ensure login and refresh token APIs completed successfully');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for OTP verification:', authToken.substring(0, 50) + '...');

    const response = await axios.post(
      `${API_BASE_URL}/auth/verifyOTPWithEmail/en`,
      {
        email,
        passcode,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ OTP verification response:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ OTP verified successfully');
      
      // Update user info if returned in payload
      if (data.payload?.userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(data.payload.userInfo));
        console.log('✅ User info updated');
      }

      return {
        success: true,
        data: data.payload,
        message: data.message,
      };
    } else {
      console.error('❌ OTP verification failed:', data.message);
      return {
        success: false,
        message: data.message || 'OTP verification failed',
      };
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Invalid OTP. Please try again.',
        error: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
};

/**
 * Resend OTP to email
 * @param {string} email - User's email address
 * @returns {Promise} - Returns resend result
 */
export const resendOTP = async (email) => {
  try {
    // Get the refresh token from localStorage
    const authToken = localStorage.getItem('refreshToken');
    
    console.log('🔵 Resending OTP...');
    console.log('🔑 Using refresh token:', authToken ? 'Present' : 'Missing');
    
    if (!authToken) {
      console.error('❌ No refresh token available');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/resendOTP/en`,
      {
        email,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ OTP resent successfully:', response.data);

    const data = response.data;

    return {
      success: data.status === 'success',
      message: data.message || 'OTP sent successfully',
      data: data.payload,
    };
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to resend OTP',
      error: error.response?.data,
    };
  }
};

/**
 * Logout user
 * Clears stored authentication data
 */
export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('serverToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('loginBy');
  console.log('🔴 User logged out, all tokens cleared');
  window.dispatchEvent(new Event('user-logout'));
};

/**
 * Get stored user info
 * @returns {Object|null} - Returns user info or null
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Get stored access token (from initial login)
 * @returns {string|null} - Returns access token or null
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Get stored refresh token (used for all subsequent API calls)
 * @returns {string|null} - Returns refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Get stored server token
 * @returns {string|null} - Returns server token or null
 */
export const getServerToken = () => {
  return localStorage.getItem('serverToken');
};

/**
 * Get stored loginBy value
 * @returns {string|null} - Returns "email" or "username"
 */
export const getLoginBy = () => {
  return localStorage.getItem('loginBy');
};

/**
 * Check if user is authenticated
 * @returns {boolean} - Returns true if user has valid refresh token
 */
export const isAuthenticated = () => {
  const refreshToken = getRefreshToken();
  return !!refreshToken;
};

/**
 * Setup axios interceptor to automatically add refresh token and handle errors
 * Call this once in your app initialization
 */
export const setupAxiosInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      // Use refreshToken for all API calls except login and refresh
      if (config.url && 
          !config.url.includes('/auth/login') && 
          !config.url.includes('/auth/branch/login') && 
          !config.url.includes('/auth/event/login') && 
          !config.url.includes('/auth/refreshToken')) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          config.headers.Authorization = `Bearer ${refreshToken}`;
          console.log('🔑 Interceptor added refresh token to:', config.url);
        } else {
          console.warn('⚠️ No refresh token available for:', config.url);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 and not already retried, try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        console.log('⚠️ Got 401, attempting to refresh token...');
        
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
          // Retry original request with new refresh token
          const newRefreshToken = getRefreshToken();
          originalRequest.headers.Authorization = `Bearer ${newRefreshToken}`;
          console.log('🔄 Retrying request with new token...');
          return axios(originalRequest);
        } else {
          // Refresh failed, logout
          console.log('❌ Token refresh failed, logging out...');
          logoutUser();
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  console.log('✅ Axios interceptor setup complete - will use refreshToken for all APIs');
};

/**
 * Debug function to check token state
 * Call this to see what tokens are stored
 */
export const debugTokens = () => {
  console.log('🔍 === TOKEN DEBUG INFO ===');
  console.log('accessToken:', localStorage.getItem('accessToken') ? 'Present (' + localStorage.getItem('accessToken').substring(0, 30) + '...)' : '❌ Missing');
  console.log('serverToken:', localStorage.getItem('serverToken') ? 'Present (' + localStorage.getItem('serverToken').substring(0, 30) + '...)' : '❌ Missing');
  console.log('refreshToken:', localStorage.getItem('refreshToken') ? 'Present (' + localStorage.getItem('refreshToken').substring(0, 30) + '...)' : '❌ Missing');
  console.log('userInfo:', localStorage.getItem('userInfo') ? 'Present' : '❌ Missing');
  console.log('loginBy:', localStorage.getItem('loginBy') || '❌ Missing');
  console.log('=========================');
};