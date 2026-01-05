import axios from 'axios';

// Wati API Configuration
const WATI_API_URL = '';
const WATI_API_TOKEN = '';

// Create axios instance with base config
const watiApi = axios.create({
  baseURL: WATI_API_URL,
  headers: {
    'Content-Type': 'application/json-patch+json',
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
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to send message',
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
    
    const response = await watiApi.get('/getMessages', {
      params: {
        whatsappNumber: cleanPhone,
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
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to fetch messages',
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
    
    const response = await watiApi.get('/getContact', {
      params: {
        whatsappNumber: cleanPhone,
      },
    });

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
    
    const response = await watiApi.post('/markAsRead', {
      whatsappNumber: cleanPhone,
    });

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
};