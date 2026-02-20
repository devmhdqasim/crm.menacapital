import axios from 'axios';

/**
 * Event Service (formerly Branch Service)
 * Handles all event management related API calls including:
 * - Get All Events (with pagination)
 * - Create Event
 * - Update Event
 * - Delete Event
 */

const API_BASE_URL = 'https://staging.crm.saveingold.app/api/v1';

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Returns refresh token or null
 */
const getRefreshToken = () => { 
  return localStorage.getItem('refreshToken');
};

/**
 * Get all events with pagination and date filtering
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @param {string} startDate - Start date filter (ISO format)
 * @param {string} endDate - End date filter (ISO format)
 * @returns {Promise} - Returns list of events with pagination info
 */
export const getAllBranches = async (page = 1, limit = 10, startDate = '', endDate = '') => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching events...');
    console.log('📄 Page:', page, 'Limit:', limit);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const response = await axios.get(
      `${API_BASE_URL}/event/getAll/en?paramPage=${page}&paramLimit=${limit}&fromDate=${startDate}&toDate=${endDate}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Events fetched successfully:', response.data);

    const data = response.data;

    // Handle both allEvents and allBranches for backward compatibility
    const eventsArray = data.payload?.allEvents || data.payload?.allBranches;
    
    if (data.status === 'success' && eventsArray?.[0]?.data) {
      const eventsData = eventsArray[0].data;
      const metadata = eventsArray[0].metadata?.[0] || {};
      
      console.log('📊 Retrieved', eventsData.length, 'events');
      console.log('📊 Total events:', metadata.total);
      console.log('📊 Current page:', metadata.paramPage);

      return {
        success: true,
        data: eventsData,
        metadata: metadata,
        message: data.message,
      };
    } else {
      console.error('❌ Unexpected response structure:', data);
      return {
        success: false,
        message: data.message || 'Failed to fetch events',
        data: [],
        metadata: {},
      };
    }
  } catch (error) {
    console.error('❌ Get events error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch events',
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
 * Create a new event
 * @param {Object} eventData - Event data object
 * @param {string} eventData.branchName - Event name (maps to eventName)
 * @param {string} eventData.branchLocation - Event location
 * @param {string} eventData.branchPhoneNumber - Event phone number
 * @param {string} eventData.branchEmail - Event email address
 * @param {string} eventData.branchPassword - Event password
 * @param {string} eventData.branchManager - Event manager ID (Sales Manager)
 * @param {Array<string>} eventData.branchMembers - Array of event member IDs
 * @param {Array<number>} eventData.branchCoordinates - Event coordinates [latitude, longitude]
 * @param {boolean} eventData.isAvailable - Event availability status
 * @param {string} [eventData.eventSource] - Optional event source name
 * @returns {Promise} - Returns created event info
 */
export const createBranch = async (eventData) => {
  try {
    const authToken = getRefreshToken();
    console.log('🔵 Creating new event...');
    console.log('📝 Event data:', eventData);

    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload matching the event API structure
    const payload = {
      eventName: eventData.branchName,
      eventLocation: eventData.branchLocation,
      eventPhoneNumber: eventData.branchPhoneNumber,
      eventEmail: eventData.branchEmail,
      eventPassword: eventData.branchPassword,
      eventManager: eventData.branchManager,
      eventCoordinates: eventData.branchCoordinates || [0, 0],
      eventMembers: eventData.branchMembers || [],
      isAvailable: eventData.isAvailable !== undefined ? eventData.isAvailable : true,
    };

    // ── NEW: only include eventSource when provided ────────────────────────
    if (eventData.eventSource) {
      payload.eventSource = eventData.eventSource;
    }

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.post(
      `${API_BASE_URL}/event/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Event created successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      console.log('✅ Event creation successful');
      console.log('📨 Message:', data.payload?.message);
      return {
        success: true,
        data: data.payload,
        message: data.payload?.message || data.message || 'Event created successfully',
      };
    } else {
      console.error('❌ Event creation failed:', data.message);
      return {
        success: false,
        message: data.message || 'Failed to create event',
      };
    }
  } catch (error) {
    console.error('❌ Create event error:', error);
    console.error('❌ Error response:', error.response?.data);

    if (error.response?.status === 401) {
      console.log('❌ Unauthorized (401), token may be expired');
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }

    if (error.response?.status === 400) {
      console.error('❌ Bad request (400), validation error');
      return {
        success: false,
        message: error.response.data?.message || 'Invalid event data. Please check all fields.',
        error: error.response.data,
      };
    }

    if (error.response?.status === 409) {
      console.error('❌ Conflict (409), event may already exist');
      return {
        success: false,
        message: error.response.data?.message || 'Event with this name already exists.',
        error: error.response.data,
      };
    }

    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to create event',
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
 * Update an existing event
 * @param {string} branchId - Event's ID
 * @param {Object} eventData - Event data to update
 * @param {string} [eventData.eventSource] - Optional event source name
 * @returns {Promise} - Returns updated event info
 */
export const updateBranch = async (branchId, eventData) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Updating event...');
    console.log('🆔 Event ID:', branchId);
    console.log('📝 Event data:', eventData);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    // Prepare the payload matching the event API structure
    const payload = {
      _id: branchId,
      eventName: eventData.branchName,
      eventLocation: eventData.branchLocation,
      eventPhoneNumber: eventData.branchPhoneNumber,
      eventEmail: eventData.branchEmail,
      eventManager: eventData.branchManager,
      eventMembers: eventData.branchMembers || [],
      eventCoordinates: eventData.branchCoordinates || [0, 0],
      isAvailable: eventData.isAvailable !== undefined ? eventData.isAvailable : true,
    };

    // Only include password if provided (optional for updates)
    if (eventData.branchPassword) {
      payload.eventPassword = eventData.branchPassword;
    }

    // ── NEW: only include eventSource when provided ────────────────────────
    if (eventData.eventSource) {
      payload.eventSource = eventData.eventSource;
    }

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/event/update/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Event updated successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Event updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update event',
      };
    }
  } catch (error) {
    console.error('❌ Update event error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to update event',
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
 * Delete an event
 * @param {string} branchId - Event's ID to delete
 * @returns {Promise} - Returns deletion result
 */
export const deleteBranch = async (branchId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Deleting event...');
    console.log('🆔 Event ID:', branchId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    console.log('🔑 Using refresh token for API call');

    const payload = {
      _id: branchId
    };

    console.log('📤 Sending payload to API:', payload);

    const response = await axios.patch(
      `${API_BASE_URL}/event/delete/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Event deleted successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message || 'Event deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete event',
      };
    }
  } catch (error) {
    console.error('❌ Delete event error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to delete event',
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
 * Get event by ID
 * @param {string} branchId - Event's ID
 * @returns {Promise} - Returns event details
 */
export const getBranchById = async (branchId) => {
  try {
    const authToken = getRefreshToken();
    
    console.log('🔵 Fetching event by ID...');
    console.log('🆔 Event ID:', branchId);
    
    if (!authToken) {
      console.error('❌ No refresh token found in localStorage!');
      throw new Error('No refresh token available. Please login first.');
    }

    const response = await axios.get(
      `${API_BASE_URL}/event/${branchId}/en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    console.log('✅ Event fetched successfully:', response.data);

    const data = response.data;

    if (data.status === 'success') {
      return {
        success: true,
        data: data.payload,
        message: data.message,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch event',
      };
    }
  } catch (error) {
    console.error('❌ Get event by ID error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch event',
    };
  }
};

/**
 * Debug function to check event service state
 */
export const debugBranchService = () => {
  console.log('🔍 === EVENT SERVICE DEBUG INFO ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Refresh Token:', getRefreshToken() ? 'Present (' + getRefreshToken().substring(0, 30) + '...)' : '❌ Missing');
  console.log('====================================');
};