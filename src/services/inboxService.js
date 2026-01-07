import axios from 'axios';

// Wati API Configuration
const WATI_API_URL = 'https://live-mt-server.wati.io/206676/api/v1';
const WATI_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImluZm9Ac2F2ZWluZ29sZC5hZSIsIm5hbWVpZCI6ImluZm9Ac2F2ZWluZ29sZC5hZSIsImVtYWlsIjoiaW5mb0BzYXZlaW5nb2xkLmFlIiwiYXV0aF90aW1lIjoiMDEvMDUvMjAyNiAxMTo1NTowOCIsInRlbmFudF9pZCI6IjIwNjY3NiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.n_-Y-1caVpYdcLwRrIeIJK_uTAvkOnEfTKKZZfcel34';

// Create axios instance with base config
const watiApi = axios.create({
  baseURL: WATI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WATI_API_TOKEN}`,
  },
});

/**
 * Send a WhatsApp message via Wati
 * @param {string} phoneNumber - Recipient phone number with country code (e.g., +971501234567)
 * @param {string} message - Message text to send
 * @returns {Promise} API response
 */
export const sendWatiMessage = async (phoneNumber, message) => {
  try {
    // Remove any spaces, dashes, or special characters from phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const response = await watiApi.post('/sendSessionMessage', {
      whatsappNumber: cleanPhone,
      messageText: message,
    });

    return {
      success: true,
      data: response.data,
      message: 'Message sent successfully',
    };
  } catch (error) {
    console.error('Error sending Wati message:', error);
    console.error('Error response:', error.response?.data);
    
    // If contact not found, provide helpful message
    if (error.response?.data?.info?.includes("Can't find Contact")) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Contact not found in Wati. The contact needs to message your WhatsApp Business number first, or you need to add them manually in Wati.',
        contactNotFound: true,
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.info || error.response?.data?.error || 'Failed to send message',
    };
  }
};

/**
 * Create or add a contact in Wati
 * @param {string} phoneNumber - Contact phone number with country code
 * @param {string} name - Contact name
 * @param {object} customParams - Additional custom parameters
 * @returns {Promise} API response
 */
export const createWatiContact = async (phoneNumber, name = '', customParams = {}) => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const payload = {
      whatsappNumber: cleanPhone,
      name: name || cleanPhone,
      customParams: customParams,
    };
    
    const response = await watiApi.post('/addContact', payload);

    return {
      success: true,
      data: response.data,
      message: 'Contact created successfully',
    };
  } catch (error) {
    console.error('Error creating Wati contact:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.info || error.response?.data?.error || 'Failed to create contact',
    };
  }
};

/**
 * Get conversation messages from Wati
 * @param {string} phoneNumber - Contact phone number with country code
 * @param {number} pageSize - Number of messages to retrieve (default: 100)
 * @param {number} pageNumber - Page number for pagination (default: 0)
 * @returns {Promise} API response with messages
 */
export const getWatiMessages = async (phoneNumber, pageSize = 100, pageNumber = 0) => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Try to get messages for the contact
    const response = await watiApi.get(`/getMessages/${cleanPhone}`, {
      params: {
        pageSize: pageSize,
        pageNumber: pageNumber,
      },
    });

    return {
      success: true,
      data: response.data,
      messages: response.data?.messages || response.data?.result?.messages || [],
    };
  } catch (error) {
    console.error('Error fetching Wati messages:', error);
    console.error('Error response:', error.response?.data);
    
    // If contact not found, return empty messages instead of error
    if (error.response?.data?.info?.includes("Can't find Contact")) {
      return {
        success: true,
        data: {},
        messages: [],
        info: 'Contact not found in Wati. No conversation history available.',
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.info || error.response?.data?.error || 'Failed to fetch messages',
      messages: [],
    };
  }
};

/**
 * Send a WhatsApp template message via Wati
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {string} templateName - Name of the approved template
 * @param {Array} parameters - Array of parameter values for the template
 * @returns {Promise} API response
 */
export const sendWatiTemplateMessage = async (phoneNumber, templateName, parameters = []) => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const response = await watiApi.post('/sendTemplateMessage', {
      whatsappNumber: cleanPhone,
      template_name: templateName,
      broadcast_name: `Template_${Date.now()}`,
      parameters: parameters,
    });

    return {
      success: true,
      data: response.data,
      message: 'Template message sent successfully',
    };
  } catch (error) {
    console.error('Error sending Wati template message:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to send template message',
    };
  }
};

/**
 * Send a media message (image, document, video, audio) via Wati
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {string} mediaUrl - Public URL of the media file
 * @param {string} caption - Optional caption for the media
 * @param {string} filename - Optional filename for documents
 * @returns {Promise} API response
 */
export const sendWatiMediaMessage = async (phoneNumber, mediaUrl, caption = '', filename = '') => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const payload = {
      whatsappNumber: cleanPhone,
      media_url: mediaUrl,
    };

    if (caption) payload.caption = caption;
    if (filename) payload.filename = filename;

    const response = await watiApi.post('/sendSessionFile', payload);

    return {
      success: true,
      data: response.data,
      message: 'Media message sent successfully',
    };
  } catch (error) {
    console.error('Error sending Wati media message:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to send media message',
    };
  }
};

/**
 * Get contact info from Wati
 * @param {string} phoneNumber - Contact phone number with country code
 * @returns {Promise} API response with contact info
 */
export const getWatiContactInfo = async (phoneNumber) => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const response = await watiApi.get(`/getContact/${cleanPhone}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching Wati contact info:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to fetch contact info',
    };
  }
};

/**
 * Mark messages as read
 * @param {string} phoneNumber - Contact phone number with country code
 * @returns {Promise} API response
 */
export const markWatiMessagesAsRead = async (phoneNumber) => {
  try {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const response = await watiApi.post(`/markAsRead/${cleanPhone}`);

    return {
      success: true,
      data: response.data,
      message: 'Messages marked as read',
    };
  } catch (error) {
    console.error('Error marking Wati messages as read:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to mark messages as read',
    };
  }
};

/**
 * Get unread message count
 * @returns {Promise} API response with unread count
 */
export const getWatiUnreadCount = async () => {
  try {
    const response = await watiApi.get('/getUnreadCount');

    return {
      success: true,
      data: response.data,
      count: response.data?.unreadCount || response.data?.result?.unreadCount || 0,
    };
  } catch (error) {
    console.error('Error fetching Wati unread count:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to fetch unread count',
      count: 0,
    };
  }
};

/**
 * Setup Wati webhook for receiving messages
 * @param {string} webhookUrl - Your server's webhook URL
 * @returns {Promise} API response
 */
export const setupWatiWebhook = async (webhookUrl) => {
  try {
    const response = await watiApi.post('/setWebhook', {
      url: webhookUrl,
    });

    return {
      success: true,
      data: response.data,
      message: 'Webhook setup successfully',
    };
  } catch (error) {
    console.error('Error setting up Wati webhook:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to setup webhook',
    };
  }
};

export default {
  sendWatiMessage,
  getWatiMessages,
  sendWatiTemplateMessage,
  sendWatiMediaMessage,
  getWatiContactInfo,
  markWatiMessagesAsRead,
  getWatiUnreadCount,
  setupWatiWebhook,
  createWatiContact,
};