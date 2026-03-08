import axios from 'axios';

// Wati API Configuration
const WATI_API_URL = 'https://live-mt-server.wati.io/1071091/api/v1';
const WATI_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InNhbGVzQHNhdmVpbmdvbGQuYWUiLCJuYW1laWQiOiJzYWxlc0BzYXZlaW5nb2xkLmFlIiwiZW1haWwiOiJzYWxlc0BzYXZlaW5nb2xkLmFlIiwiYXV0aF90aW1lIjoiMDIvMDUvMjAyNiAwNjozOToyNyIsInRlbmFudF9pZCI6IjEwNzEwOTEiLCJkYl9uYW1lIjoibXQtcHJvZC1UZW5hbnRzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQURNSU5JU1RSQVRPUiIsImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.t9wvx6-EtH0zdMZFzhQWXlL0pWz-SWwZQ13E9tKkmV4';

// Phone number formatting utilities
const formatPhoneForWati = (phoneNumber, defaultCountryCode = '971') => {
  if (!phoneNumber) return '';
  
  let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return '+' + cleaned.substring(2);
  if (cleaned.startsWith('0')) return `+${defaultCountryCode}${cleaned.substring(1)}`;
  if (!cleaned.startsWith(defaultCountryCode)) return `+${defaultCountryCode}${cleaned}`;
  
  return `+${cleaned}`;
};

// Create axios instance with base config
const watiApi = axios.create({
  baseURL: WATI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WATI_API_TOKEN}`,
  },
});

// Add request interceptor for logging
watiApi.interceptors.request.use(
  (config) => {
    console.log('📤 Wati API Request:', {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
watiApi.interceptors.response.use(
  (response) => {
    console.log('📥 Wati API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Check if contact exists in Wati
 * @param {string} phoneNumber - Phone number to check
 * @returns {Promise} Response with exists status
 */
export const checkWatiContactExists = async (phoneNumber) => {
  try {
    const cleanPhone = formatPhoneForWati(phoneNumber);
    console.log('🔍 Checking if contact exists:', cleanPhone);
    
    const response = await watiApi.get(`/getContact/${cleanPhone}`);
    
    return {
      success: true,
      exists: true,
      data: response.data,
    };
  } catch (error) {
    // 404 or "Contact not found" means contact doesn't exist
    if (error.response?.status === 404 || 
        error.response?.data?.info?.includes("Can't find Contact") ||
        error.response?.data?.info?.includes("Contact not found")) {
      return {
        success: true,
        exists: false,
        message: 'Contact not found in Wati',
      };
    }
    
    return {
      success: false,
      exists: false,
      error: error.response?.data || error.message,
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
    const cleanPhone = formatPhoneForWati(phoneNumber);

    console.log('📝 Creating Wati contact:', cleanPhone, name);
    
    const payload = {
      whatsappNumber: cleanPhone,
      name: name || cleanPhone,
      customParams: [
        { name: 'email', value: customParams.email || '' },
        { name: 'nationality', value: customParams.nationality || '' },
        { name: 'source', value: customParams.source || '' },
      ].filter(param => param.value), // Only include non-empty values
    };
    
    const response = await watiApi.post('/addContact', payload);

    return {
      success: true,
      data: response.data,
      message: 'Contact created successfully',
    };
  } catch (error) {
    console.error('❌ Error creating Wati contact:', error.response?.data);
    
    // Check if contact already exists
    if (error.response?.data?.info?.includes('already exists')) {
      return {
        success: true,
        data: error.response.data,
        message: 'Contact already exists in Wati',
        alreadyExists: true,
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.info || error.response?.data?.error || 'Failed to create contact',
    };
  }
};

/**
 * Send a WhatsApp message via Wati
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {string} message - Message text to send
 * @returns {Promise} API response
 */
export const sendWatiMessage = async (phoneNumber, message) => {
  try {
    const cleanPhone = formatPhoneForWati(phoneNumber);

    console.log('📨 Sending Wati message to:', cleanPhone);
    
    // Send message using query parameters as per Wati API docs
    // URL format: /sendSessionMessage/{whatsappNumber}?messageText={text}
    const response = await watiApi.post(`/sendSessionMessage/${cleanPhone}`, null, {
      params: {
        messageText: message,
      },
    }); 

    console.log('✅ Send message response:', response.data);

    // Check if the response indicates success
    // Wati returns { result: true/false, message: "...", ticketStatus: "..." }
    if (response.data && response.data.result === true) {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Message sent successfully',
      };
    } else if (response.data && response.data.result === false) {
      // API returned result: false, treat as error
      const errorMessage = response.data.message || 'Failed to send message';
      const ticketStatus = response.data.ticketStatus;
      
      // Check for specific error conditions
      if (errorMessage.includes('Ticket has been expired') || errorMessage.includes('expired')) {
        return {
          success: false,
          error: response.data,
          message: '24-hour messaging window expired. The contact needs to message you first to reopen the conversation.',
          windowExpired: true,
          ticketStatus: ticketStatus,
        };
      }

      return {
        success: false,
        error: response.data,
        message: errorMessage,
        ticketStatus: ticketStatus,
      };
    }

    // Fallback - if result field doesn't exist, assume success
    return {
      success: true,
      data: response.data,
      message: 'Message sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending Wati message:', error.response?.data);
    
    const errorData = error.response?.data || {};
    const errorInfo = errorData.info || errorData.message || '';
    const errorStatus = error.response?.status;
    
    // Handle 404 - might mean contact needs to initiate conversation first
    if (errorStatus === 404) {
      return {
        success: false,
        error: errorData || error.message,
        message: 'Unable to send message. The contact may need to message your WhatsApp Business number first to open a conversation window.',
        contactNotFound: true,
      };
    }
    
    // Handle specific error cases
    if (errorInfo.includes("Can't find Contact") || errorInfo.includes("Contact not found")) {
      return {
        success: false,
        error: errorData || error.message,
        message: 'Contact not found in Wati. The contact needs to message your WhatsApp Business number first.',
        contactNotFound: true,
      };
    }
    
    if (errorInfo.includes('outside the 24 hour window') || errorInfo.includes('24 hour') || errorInfo.includes('Ticket has been expired') || errorInfo.includes('expired')) {
      return {
        success: false,
        error: errorData || error.message,
        message: '24-hour messaging window expired. The contact needs to message you first to reopen the conversation.',
        windowExpired: true,
      };
    }

    if (errorInfo.includes('not a valid whatsapp number') || errorInfo.includes('invalid number')) {
      return {
        success: false,
        error: errorData || error.message,
        message: 'Invalid WhatsApp number. Please verify the phone number is correct.',
      };
    }
    
    return {
      success: false,
      error: errorData || error.message,
      message: errorData.message || errorInfo || 'Failed to send message. Please ensure the contact has messaged your WhatsApp Business number first.',
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
    const cleanPhone = formatPhoneForWati(phoneNumber);

    console.log('📬 Fetching Wati messages for:', cleanPhone);
    
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
    console.error('❌ Error fetching Wati messages:', error.response?.data);
    
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
 * Get all WhatsApp message templates from Wati
 * @returns {Promise} API response with templates list
 */
export const getWatiTemplates = async () => {
  try {
    console.log('📋 Fetching Wati templates');
    
    const response = await watiApi.get('/getMessageTemplates');

    console.log('📋 Full API response:', response.data);

    return {
      success: true,
      data: response.data, // Return full response data
      templates: response.data?.messageTemplates || [],
    };
  } catch (error) {
    console.error('❌ Error fetching Wati templates:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.info || error.response?.data?.error || 'Failed to fetch templates',
      templates: [],
    };
  }
};

/**
 * Send a WhatsApp template message via Wati (for outside 24-hour window)
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {string} templateName - Name of the approved template (elementName from template)
 * @param {Array} parameters - Array of parameter objects with name and value: [{ name: "param_name", value: "value" }]
 * @returns {Promise} API response
 */
export const sendWatiTemplateMessage = async (phoneNumber, templateName, parameters = []) => {
  try {
    let cleanPhone = formatPhoneForWati(phoneNumber);
    // Remove the + sign for Wati template API - it expects just the number
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }

    console.log('📨 Sending Wati template message to:', cleanPhone, 'Template:', templateName, 'Params:', parameters);

    // Format parameters for Wati API
    // Wati expects: customParams: [{ name: "param_name", value: "value" }]
    // Parameters should already be in the correct format with name and value
    const formattedParams = parameters.map((param) => {
      // Handle both object format { name, value } and legacy array format
      if (typeof param === 'object' && param.name !== undefined) {
        return {
          name: String(param.name),
          value: String(param.value || ''),
        };
      }
      // Legacy support for simple value array (shouldn't be used anymore)
      return {
        name: String(param),
        value: String(param || ''),
      };
    });

    const payload = {
      template_name: templateName,
      broadcast_name: `Template_${Date.now()}`,
      receivers: [
        {
          whatsappNumber: cleanPhone,
          customParams: formattedParams,
        }
      ],
    };

    console.log('📤 Template payload:', JSON.stringify(payload, null, 2));

    // Use the correct endpoint - sendTemplateMessages (plural)
    const response = await watiApi.post('/sendTemplateMessages', payload);

    console.log('✅ Template send response:', response.data);

    // Check for success in response
    if (response.data && (response.data.result === true || response.data.result === 'true' || response.status === 200)) {
      return {
        success: true,
        data: response.data,
        message: 'Template message sent successfully',
      };
    }

    // Handle API returned success but result is false
    if (response.data && response.data.result === false) {
      return {
        success: false,
        data: response.data,
        message: response.data.message || response.data.info || 'Failed to send template message',
      };
    }

    // Default to success if we got a 200 response
    return {
      success: true,
      data: response.data,
      message: 'Template message sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending Wati template message:', error.response?.data || error.message);

    const errorData = error.response?.data || {};
    const errorInfo = errorData.info || errorData.message || errorData.error || '';
    const errorStatus = error.response?.status;
    
    // Handle specific error cases
    if (errorInfo.includes("Can't find Contact") || errorInfo.includes("Contact not found")) {
      return {
        success: false,
        error: errorData || error.message,
        message: 'Contact not found in Wati. The contact needs to message your WhatsApp Business number first.',
        contactNotFound: true,
      };
    }
    
    if (errorInfo.includes('outside the 24 hour window') || errorInfo.includes('expired')) {
      return {
        success: false,
        error: errorData || error.message,
        message: '24-hour messaging window expired. Template messages are for re-engaging outside the window, but the contact must have previously messaged you.',
        windowExpired: true,
      };
    }

    if (errorInfo.includes('not approved') || errorInfo.includes('template not found')) {
      return {
        success: false,
        error: errorData || error.message,
        message: 'Template not found or not approved. Please ensure the template is approved in your Wati account.',
      };
    }
    
    return {
      success: false,
      error: errorData || error.message,
      message: errorData.message || errorInfo || 'Failed to send template message',
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
    const cleanPhone = formatPhoneForWati(phoneNumber);
    
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
    console.error('❌ Error sending Wati media message:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to send media message',
    };
  }
};

/**
 * Send a file directly to Wati via sendSessionFile endpoint (multipart/form-data)
 * Use this for voice notes, videos, and other file uploads.
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {File|Blob} file - The file or blob to send
 * @param {string} filename - Filename for the upload
 * @returns {Promise} API response
 */
export const sendSessionFile = async (phoneNumber, file, filename) => {
  try {
    const cleanPhone = formatPhoneForWati(phoneNumber);
    // Remove leading '+' for the URL path
    const phoneForUrl = cleanPhone.replace(/^\+/, '');

    // Wrap Blob into a File object so FormData sends it correctly
    const fileObj = file instanceof File
      ? file
      : new File([file], filename, { type: file.type || 'application/octet-stream' });

    const formData = new FormData();
    formData.append('file', fileObj, filename);

    const response = await axios.post(
      `${WATI_API_URL}/sendSessionFile/${phoneForUrl}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${WATI_API_TOKEN}`,
          // Let axios set Content-Type with correct boundary
        },
      }
    );

    // Wati can return HTTP 200 with { result: false } in the body
    if (response.data?.result === false || response.data?.result === 'false') {
      console.error('❌ Wati API returned failure:', response.data);
      return {
        success: false,
        error: response.data,
        message: response.data?.message || 'Failed to send file',
      };
    }

    return {
      success: true,
      data: response.data,
      message: 'File sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending session file:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to send file',
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
    const cleanPhone = formatPhoneForWati(phoneNumber);
    
    const response = await watiApi.get(`/getContact/${cleanPhone}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching Wati contact info:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to fetch contact info',
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
    console.error('❌ Error fetching Wati unread count:', error.response?.data);
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
    console.error('❌ Error setting up Wati webhook:', error.response?.data);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || error.response?.data?.error || 'Failed to setup webhook',
    };
  }
};

/**
 * Fetch image with authorization header and return blob URL
 * @param {string} imageUrl - Wati image URL
 * @returns {Promise} Blob URL for the image
 */
export const fetchWatiImage = async (imageUrl) => {
  try {
    console.log('🖼️ Fetching Wati image:', imageUrl);

    // For relative Wati paths (e.g. "data/images/xxx.jpg", "data/audios/xxx.opus"),
    // use the /api/file/showFile endpoint
    const isRelativePath = imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:');

    const WATI_BASE = 'https://live-mt-server.wati.io/1071091';
    const url = isRelativePath
      ? `${WATI_BASE}/api/file/showFile?fileName=${encodeURIComponent(imageUrl)}`
      : imageUrl;

    const response = await axios.get(url, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${WATI_API_TOKEN}`,
      },
    });
    
    // Create blob URL
    const blobUrl = URL.createObjectURL(response.data);
    
    console.log('✅ Image fetched successfully, blob URL:', blobUrl);
    
    return {
      success: true,
      blobUrl: blobUrl,
    };
  } catch (error) {
    console.error('❌ Error fetching Wati image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get previous messages from backend API
 * @param {string} waId - WhatsApp ID (phone number digits only, e.g. "971503045327")
 * @param {number} pageSize - Number of messages per page (default: 20)
 * @param {number} pageNumber - Page number for pagination (default: 1)
 * @returns {Promise} API response with messages
 */
export const getPreviousMessages = async (waId, pageSize = 20, pageNumber = 1) => {
  const API_BASE_URL = 'https://api.crm.saveingold.app/api/v1';
  const authToken = localStorage.getItem('refreshToken');

  try {
    if (!authToken) {
      throw new Error('No auth token available. Please login first.');
    }

    const cleanWaId = waId.replace(/\D/g, '');
    console.log('📬 Fetching previous messages from backend for:', cleanWaId);

    const response = await axios.get(`${API_BASE_URL}/wati/getMessage/en`, {
      params: {
        waId: cleanWaId,
        pageSize: 15,
        pageNumber,
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      timeout: 30000,
    });

    console.log('📥 Previous messages response:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching previous messages:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Session expired. Please login again.',
      };
    }

    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Failed to fetch previous messages',
    };
  }
};

export default {
  sendWatiMessage,
  getWatiMessages,
  getWatiTemplates,
  sendWatiTemplateMessage,
  sendWatiMediaMessage,
  getWatiContactInfo,
  getWatiUnreadCount,
  setupWatiWebhook,
  createWatiContact,
  checkWatiContactExists,
  fetchWatiImage,
  getPreviousMessages,
};