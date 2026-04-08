import axios from 'axios';

const API_BASE_URL = 'https://staging.crm.saveingold.app/api/v1';

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Create a follow-up reminder
 * @param {Object} reminderData
 * @param {string} reminderData.title - Reminder title
 * @param {string} reminderData.notes - Optional notes
 * @param {number} reminderData.remindAt - Hours from now to remind
 * @param {string} reminderData.phoneNumber - Contact phone number
 * @returns {Promise} - Returns creation result
 */
export const createReminder = async (reminderData) => {
  try {
    const authToken = getRefreshToken();

    if (!authToken) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }

    const payload = {
      title: reminderData.title,
      notes: reminderData.notes || '',
      remindAt: reminderData.remindAt,
      phoneNumber: reminderData.phoneNumber,
      status: 'scheduled',
    };

    const response = await axios.post(
      `${API_BASE_URL}/reminder/create/en`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    const data = response.data;

    if (data.data && data.data._id) {
      return {
        success: true,
        data: data.data,
        message: data.message || 'Reminder set successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to set reminder',
      };
    }
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        requiresAuth: true,
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response.data?.message || 'Invalid reminder data',
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to set reminder. Please try again.',
    };
  }
};
