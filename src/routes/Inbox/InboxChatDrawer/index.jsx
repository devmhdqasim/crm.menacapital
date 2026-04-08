import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Phone, X, Image as ImageIcon, Video, Music, Send, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPreviousMessages, sendMessageViaBackend, sendSessionFile, markMessagesRead } from '../../../services/inboxService';
import { useWebSocket } from '../../../context/WebSocketContext';
import ChatHeader from '../Chatheader';
import ChatTabs from '../Chattabs';
import MessagesArea from '../Messagesarea';
import NotesArea from '../Notesarea';
import ChatInput from '../Chatinput';
import ProfileSidebar from '../ProfileSidebar';
import TemplatePicker from '../Templatepicker';
import ReminderModal from '../Remindermodal';
import InboxLeadStatus from '../Inboxleadstatus';
import AssignAgent from '../AssignAgent';
import { convertToMp4 } from '../../../utils/videoConverter';

const InboxChatDrawer = ({ isOpen, onClose, contact, refreshContacts }) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState(null);
  const [failedMessages, setFailedMessages] = useState(new Set());
  const [activeTab, setActiveTab] = useState('chat');
  
  // UI State
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  // Notes State
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // Tags State
  const [contactTags, setContactTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  // ✅ Media State - CRITICAL: Initialize downloadedImages as Set
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [downloadedImages, setDownloadedImages] = useState(new Set());
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  
  // Emoji State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Media Preview Modal State
  const [mediaPreviewFile, setMediaPreviewFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [mediaPreviewType, setMediaPreviewType] = useState(null);
  const [mediaPreviewMime, setMediaPreviewMime] = useState(null);

  // Maximize State
  const [isMaximized, setIsMaximized] = useState(false);

  // Reply State
  const [replyToMessage, setReplyToMessage] = useState(null);

  // Star & Pin State
  const [starredMessages, setStarredMessages] = useState(new Set());
  const [pinnedMessages, setPinnedMessages] = useState([]);

  // Block/Spam State
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSpam, setIsSpam] = useState(false);

  // Chat Background Customization
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatBg, setChatBg] = useState(() => {
    try { return localStorage.getItem('chat_bg') || 'image:stars'; }
    catch { return 'image:stars'; }
  });

  // Mouse position for parallax on stars bg
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const contentAreaRef = useRef(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const emojiPickerRef = useRef(null);
  
  // WebSocket integration
  const { isConnected, addMessageListener, sendMessage: sendWsMessage, trackSentMessage } = useWebSocket();
  
  // Notification sound
  const notificationSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

  // Mouse move handler for stars parallax (viewport-relative, ignores scroll)
  const handleContentMouseMove = useCallback((e) => {
    const el = contentAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Fetch messages and contact data
  useEffect(() => {
    if (contact) {
      setMessages([]);
      setIsLoading(true);
      setContactNotFound(false);
      setMessageInput('');
      setShowTemplatePicker(false);
      setRetryingMessageId(null);
      setIsSending(false);
      setActiveTab('chat');
      setShowMessageSearch(false);
      setDownloadedImages(new Set()); // ✅ Reset on contact change
      setReplyToMessage(null);

      fetchPreviousMessages();
      loadContactNotes();
      loadContactTags();
      loadBlockSpamStatus();
      loadStarredMessages();
      loadPinnedMessage();

      // Mark messages as read when opening the conversation
      if (contact.phone) {
        markMessagesRead(contact.phone).catch(() => {});
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [contact]);

  // WebSocket listener for incoming messages
  useEffect(() => {
    if (!contact || !isConnected) return;

    console.log('👂 Listening for messages from:', contact.phone);

    const unsubscribe = addMessageListener((data) => {
      console.log('📨 Socket.IO data received:', data);

      // Handle message status updates (delivered / read)
      if (data.type === 'status_update') {
        const { messageId, status } = data;
        // waId may be a string (already extracted in WebSocketContext) or object
        const rawWaId = data.waId || '';
        const waId = typeof rawWaId === 'object' && rawWaId !== null
          ? String(rawWaId.phoneNumber || '')
          : String(rawWaId);
        const contactWaId = contact.phone.replace(/\D/g, '');

        if (!waId || (!waId.includes(contactWaId) && !contactWaId.includes(waId))) {
          return;
        }

        const newStatus = (status || '').toLowerCase();
        const statusPriority = { sending: 0, sent: 1, delivered: 2, read: 3 };

        console.log('📊 Updating message status:', messageId, '->', newStatus);

        setMessages(prev => {
          // Find the index of the matched message
          const matchedIndex = prev.findIndex(msg =>
            msg.sender === 'user' &&
            messageId && (msg.id === messageId || msg.whatsappMessageId === messageId)
          );

          // If no match found, just update by messageId alone
          if (matchedIndex === -1) {
            return prev.map(msg => {
              if (msg.sender === 'user' && messageId && (msg.id === messageId || msg.whatsappMessageId === messageId)) {
                const currentPriority = statusPriority[msg.status] ?? -1;
                const newPriority = statusPriority[newStatus] ?? -1;
                if (newPriority > currentPriority) return { ...msg, status: newStatus };
              }
              return msg;
            });
          }

          // WhatsApp rule: a status applies to the matched message AND all earlier user messages
          return prev.map((msg, i) => {
            if (msg.sender !== 'user') return msg;
            if (i <= matchedIndex) {
              const currentPriority = statusPriority[msg.status] ?? -1;
              const newPriority = statusPriority[newStatus] ?? -1;
              if (newPriority > currentPriority) return { ...msg, status: newStatus };
            }
            return msg;
          });
        });

        return;
      }

      // Handle regular incoming messages
      const rawFrom = data.from || data.waId || '';
      const messageWaId = typeof rawFrom === 'object' && rawFrom !== null
        ? String(rawFrom.phoneNumber || '')
        : String(rawFrom);
      const contactWaId = contact.phone.replace(/\D/g, '');
      
      if (!messageWaId || (!messageWaId.includes(contactWaId) && !contactWaId.includes(messageWaId))) {
        return;
      }

      // Handle "Read type" messages — show red badge + mark all previous user msgs as read
      if (data.name === 'Read type') {
        console.log('📖 Read type received, marking previous messages as read');
        const statusPriority = { sending: 0, sent: 1, delivered: 2, read: 3 };

        setMessages(prev => {
          // Find last user message to mark everything up to it as read
          let lastUserIndex = -1;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].sender === 'user') { lastUserIndex = i; break; }
          }

          const updated = prev.map((msg, i) => {
            if (msg.sender === 'user' && i <= lastUserIndex) {
              const currentPriority = statusPriority[msg.status] ?? -1;
              if (3 > currentPriority) return { ...msg, status: 'read' };
            }
            return msg;
          });

          // Add read receipt badge
          const badge = {
            id: `read-receipt-${Date.now()}`,
            text: 'Message read',
            sender: 'system',
            isReadReceipt: true,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            sortTimestamp: Date.now(),
          };
          return [...updated, badge];
        });

        setTimeout(() => scrollToBottom(), 100);
        return;
      }

      // Skip delivery/read status events that weren't caught by WebSocketContext
      // (backend sometimes sends eventType in `type` field instead of `eventType`)
      const msgType = data.type || data.eventType || '';
      if (msgType.includes('DELIVERED') || msgType.includes('READ_v')) {
        console.log('📊 Skipping status event in chat:', msgType);
        return;
      }

      // Play notification sound
      notificationSound.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });

      console.log('📬 Processing incoming message:', {
        from: data.from,
        hasText: !!data.text,
        hasData: !!data.data,
        dataUrl: data.data,
        type: data.type
      });

      // Resolve media type: backend sends type:"message" for all media, so infer from URL/path
      const rawMediaUrl = data.data || data.media?.url || '';
      let resolvedType = data.type || 'text';
      if (resolvedType === 'message' || resolvedType === 'text') {
        if (rawMediaUrl) {
          const pathLower = rawMediaUrl.toLowerCase();
          if (pathLower.includes('/images/') || pathLower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) {
            resolvedType = 'image';
          } else if (pathLower.includes('/audios/') || pathLower.includes('/ptt/') || pathLower.match(/\.(opus|ogg|mp3|m4a|aac)(\?|$)/)) {
            resolvedType = 'audio';
          } else if (pathLower.includes('/videos/') || pathLower.match(/\.(mp4|mov|avi|3gp|webm)(\?|$)/)) {
            resolvedType = 'video';
          } else if (pathLower.includes('/documents/') || pathLower.match(/\.(pdf|doc|docx|xls|xlsx)(\?|$)/)) {
            resolvedType = 'document';
          }
        }
        // If still "message" with no media, treat as text
        if (resolvedType === 'message') resolvedType = 'text';
      }

      // Create new message object
      const newMessage = {
        id: `socket-${Date.now()}`,
        text: data.text || data.message || '',
        sender: 'contact',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        sortTimestamp: Date.now(),
        status: 'delivered',
        type: resolvedType,
        mediaUrl: rawMediaUrl || null,
        leadData: data.leadData || null,
        leadAgentId: data.leadData?.leadAgentId || null,
      };

      console.log('📨 Created message:', newMessage);

      setMessages(prev => {
        const exists = prev.some(msg =>
          msg.text === newMessage.text &&
          Math.abs(msg.sortTimestamp - newMessage.sortTimestamp) < 5000
        );
        if (exists) return prev;

        return [...prev, newMessage].sort((a, b) => a.sortTimestamp - b.sortTimestamp);
      });

      // Mark as read since user is viewing this conversation
      if (contact.phone) {
        markMessagesRead(contact.phone).catch(() => {});
      }

      setTimeout(() => scrollToBottom(), 100);

      if (refreshContacts) {
        refreshContacts();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [contact, isConnected, addMessageListener, refreshContacts]);

  // Fetch previous messages from backend API
  const fetchPreviousMessages = async () => {
    if (!contact || !contact.phone) return;

    setIsLoading(true);
    setContactNotFound(false);
    try {
      const cleanWaId = contact.phone.replace(/\D/g, '');
      const result = await getPreviousMessages(cleanWaId, 100, 1);

      if (result.success && result.data) {
        const responseData = result.data;
        // Handle response structure: { result: "success", messages: { items: [...] } }
        let rawMessages = [];
        if (Array.isArray(responseData.messages?.items)) {
          rawMessages = responseData.messages.items;
        } else if (Array.isArray(responseData.data?.messages?.items)) {
          rawMessages = responseData.data.messages.items;
        } else if (Array.isArray(responseData.data)) {
          rawMessages = responseData.data;
        } else if (Array.isArray(responseData)) {
          rawMessages = responseData;
        }

        console.log('Messages found:', rawMessages.length, 'from response:', responseData);

        // Filter out status events (not actual messages)
        rawMessages = rawMessages.filter(msg => msg.eventType !== 'sentMessageDELIVERED_v2' && msg.eventType !== 'ticket');

        if (rawMessages.length > 0) {
          const transformedMessages = rawMessages.map((msg) => {
            // Timestamp: use timestamp field (Unix seconds string) or created ISO date
            const rawTs = msg.timestamp;
            const timestamp = rawTs
              ? parseInt(rawTs) * 1000
              : new Date(msg.created || msg.createdAt).getTime();
            const date = new Date(timestamp);

            const timeString = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            // Message type directly from type field
            const messageType = msg.type || 'text';

            // Template detection
            const isTemplate = messageType === 'template' || msg.eventType === 'broadcastMessage';

            // Text content: use finalText for broadcast/template messages
            let messageText = msg.text || msg.finalText || '';

            // Extract template name from eventDescription (e.g. 'Broadcast message with using "support_en" template')
            let templateName = null;
            if (isTemplate && msg.eventDescription) {
              const match = msg.eventDescription.match(/"([^"]+)"/);
              if (match) templateName = match[1];
            }

            // Media URL: from data field (e.g. "data/images/xxx.jpg", "data/audios/xxx.opus")
            const mediaUrl = msg.data || null;

            // Sender: owner=true means sent by business (user), owner=false means from customer (contact)
            const isOutgoing = msg.owner === true;

            // Status: map statusString (SENT, DELIVERED, READ) to lowercase
            const statusMap = { 'SENT': 'sent', 'DELIVERED': 'delivered', 'READ': 'read', 'FAILED': 'failed' };
            const status = statusMap[msg.statusString] || msg.statusString?.toLowerCase() || 'sent';

            return {
              id: msg.id || `api-${timestamp}-${Math.random()}`,
              whatsappMessageId: msg.id || null,
              text: messageText,
              sender: isOutgoing ? 'user' : 'contact',
              timestamp: timeString,
              sortTimestamp: timestamp,
              status: status,
              type: messageType,
              mediaUrl: mediaUrl,
              isTemplate: isTemplate,
              templateName: templateName,
            };
          });

          transformedMessages.sort((a, b) => a.sortTimestamp - b.sortTimestamp);
          setMessages(transformedMessages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
        if (result.message) {
          console.warn('Failed to load messages:', result.message);
        }
      }
    } catch (error) {
      console.error('Error fetching previous messages:', error);
      toast.error('Failed to load conversation history');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load contact notes
  const loadContactNotes = () => {
    try {
      const storedNotes = localStorage.getItem(`notes_${contact.id}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
  };

  // Load contact tags
  const loadContactTags = () => {
    try {
      const storedTags = localStorage.getItem(`tags_${contact.id}`);
      if (storedTags) {
        setContactTags(JSON.parse(storedTags));
      } else {
        setContactTags([]);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      setContactTags([]);
    }
  };

  // Load block/spam status
  const loadBlockSpamStatus = () => {
    try {
      const blocked = localStorage.getItem(`blocked_${contact.id}`);
      const spam = localStorage.getItem(`spam_${contact.id}`);
      setIsBlocked(blocked === 'true');
      setIsSpam(spam === 'true');
    } catch (error) {
      console.error('Error loading block/spam status:', error);
    }
  };

  // Toggle block contact
  const handleToggleBlock = useCallback(() => {
    const newVal = !isBlocked;
    setIsBlocked(newVal);
    localStorage.setItem(`blocked_${contact.id}`, String(newVal));
    toast.success(newVal ? 'Contact blocked' : 'Contact unblocked');
  }, [isBlocked, contact]);

  // Toggle spam contact
  const handleToggleSpam = useCallback(() => {
    const newVal = !isSpam;
    setIsSpam(newVal);
    localStorage.setItem(`spam_${contact.id}`, String(newVal));
    toast.success(newVal ? 'Marked as spam' : 'Removed from spam');
  }, [isSpam, contact]);

  // Chat background presets
  const chatBgColors = [
    { label: 'Default', value: '#1A1A1A' },
    { label: 'Charcoal', value: '#0D0D0D' },
    { label: 'Dark Slate', value: '#1E293B' },
    { label: 'Midnight', value: '#0F172A' },
    { label: 'Deep Navy', value: '#111827' },
    { label: 'Dark Olive', value: '#1A1C16' },
    { label: 'Espresso', value: '#1C1410' },
    { label: 'Dark Plum', value: '#1A1020' },
    { label: 'Gold Tint', value: 'linear-gradient(180deg, #1A1A1A 0%, #1F1B14 100%)' },
    { label: 'Ocean', value: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' },
    { label: 'Ember', value: 'linear-gradient(180deg, #1A1A1A 0%, #1C1410 100%)' },
    { label: 'Aurora', value: 'linear-gradient(180deg, #0F172A 0%, #1A1020 100%)' },
  ];

  const chatBgPatterns = [
    { label: 'Dots', value: 'pattern:dots', bg: '#1A1A1A', css: 'radial-gradient(circle, #2A2A2A 1px, transparent 1px)', size: '20px 20px' },
    { label: 'Grid', value: 'pattern:grid', bg: '#1A1A1A', css: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', size: '24px 24px' },
    { label: 'Diagonal', value: 'pattern:diagonal', bg: '#1A1A1A', css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #222 10px, #222 11px)', size: 'auto' },
    { label: 'Cross', value: 'pattern:cross', bg: '#1A1A1A', css: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', size: '32px 32px' },
    { label: 'Gold Dots', value: 'pattern:golddots', bg: '#1A1A1A', css: 'radial-gradient(circle, #16A24915 1px, transparent 1px)', size: '18px 18px' },
    { label: 'Gold Grid', value: 'pattern:goldgrid', bg: '#1A1A1A', css: 'linear-gradient(#16A24910 1px, transparent 1px), linear-gradient(90deg, #16A24910 1px, transparent 1px)', size: '28px 28px' },
    { label: 'Checkers', value: 'pattern:checkers', bg: '#1A1A1A', css: 'conic-gradient(#1E1E1E 90deg, #1A1A1A 90deg 180deg, #1E1E1E 180deg 270deg, #1A1A1A 270deg)', size: '40px 40px' },
    { label: 'Waves', value: 'pattern:waves', bg: '#1A1A1A', css: 'repeating-linear-gradient(135deg, transparent, transparent 6px, #22222280 6px, #22222280 7px, transparent 7px, transparent 13px, #22222240 13px, #22222240 14px)', size: 'auto' },
    { label: 'Hex', value: 'pattern:hex', bg: '#1A1A1A', css: 'radial-gradient(circle at 0% 50%, #252525 25%, transparent 25%), radial-gradient(circle at 100% 50%, #252525 25%, transparent 25%)', size: '30px 52px' },
    { label: 'Fine Dots', value: 'pattern:finedots', bg: '#0F172A', css: 'radial-gradient(circle, #1E293B 0.5px, transparent 0.5px)', size: '12px 12px' },
    { label: 'Plaid', value: 'pattern:plaid', bg: '#1A1A1A', css: 'linear-gradient(#22222280 1px, transparent 1px), linear-gradient(90deg, #22222280 1px, transparent 1px), linear-gradient(#22222240 2px, transparent 2px), linear-gradient(90deg, #22222240 2px, transparent 2px)', size: '20px 20px, 20px 20px, 60px 60px, 60px 60px' },
    { label: 'Zigzag', value: 'pattern:zigzag', bg: '#1A1A1A', css: 'linear-gradient(135deg, #222 25%, transparent 25%), linear-gradient(225deg, #222 25%, transparent 25%), linear-gradient(315deg, #222 25%, transparent 25%), linear-gradient(45deg, #222 25%, transparent 25%)', size: '20px 20px' },
  ];

  const chatBgImages = [
    { label: 'Topography', value: 'image:topography', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath d='M306 300c0-28 23-51 51-51s51 23 51 51-23 51-51 51-51-23-51-51zm-102 0c0-28 23-51 51-51s51 23 51 51-23 51-51 51-51-23-51-51zm-102 0c0-28 23-51 51-51s51 23 51 51-23 51-51 51-51-23-51-51z' fill='none' stroke='%23252525' stroke-width='1'/%3E%3C/svg%3E")` },
    { label: 'Bubbles', value: 'image:bubbles', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='25' cy='25' r='15' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3Ccircle cx='75' cy='75' r='20' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3Ccircle cx='70' cy='20' r='8' fill='none' stroke='%23252525' stroke-width='0.5'/%3E%3Ccircle cx='20' cy='70' r='12' fill='none' stroke='%23252525' stroke-width='0.5'/%3E%3C/svg%3E")` },
    { label: 'Stars', value: 'image:stars', bg: '#0F172A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23334155'/%3E%3Ccircle cx='60' cy='30' r='0.5' fill='%23475569'/%3E%3Ccircle cx='100' cy='15' r='1.2' fill='%23334155'/%3E%3Ccircle cx='30' cy='60' r='0.7' fill='%23475569'/%3E%3Ccircle cx='80' cy='70' r='1' fill='%23334155'/%3E%3Ccircle cx='50' cy='90' r='0.5' fill='%23475569'/%3E%3Ccircle cx='110' cy='100' r='0.8' fill='%23334155'/%3E%3Ccircle cx='15' cy='100' r='1' fill='%23475569'/%3E%3Ccircle cx='90' cy='50' r='0.6' fill='%23334155'/%3E%3C/svg%3E")` },
    { label: 'Diamonds', value: 'image:diamonds', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 4L44 24L24 44L4 24Z' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3C/svg%3E")` },
    { label: 'Hexagons', value: 'image:hexagons', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50Z' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3Cpath d='M28 100L0 84L0 50L28 34L56 50L56 84Z' fill='none' stroke='%23252525' stroke-width='0.3'/%3E%3C/svg%3E")` },
    { label: 'Triangles', value: 'image:triangles', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 0L60 52H0Z' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3C/svg%3E")` },
    { label: 'Gold Hex', value: 'image:goldhex', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50Z' fill='none' stroke='%23BBA473' stroke-width='0.3' opacity='0.12'/%3E%3Cpath d='M28 100L0 84L0 50L28 34L56 50L56 84Z' fill='none' stroke='%23BBA473' stroke-width='0.2' opacity='0.08'/%3E%3C/svg%3E")` },
    { label: 'Circuits', value: 'image:circuits', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 40h20m0 0v-20m0 0h20m0 0v40m0 0h20m0 0v-20m0 0h20' fill='none' stroke='%23222' stroke-width='0.5'/%3E%3Ccircle cx='20' cy='20' r='2' fill='%23252525'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%23252525'/%3E%3Ccircle cx='60' cy='20' r='2' fill='%23252525'/%3E%3C/svg%3E")` },
    { label: 'Waves', value: 'image:waves', bg: '#0F172A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20'%3E%3Cpath d='M0 10c25-10 25 10 50 0s25 10 50 0' fill='none' stroke='%231E293B' stroke-width='1'/%3E%3C/svg%3E")` },
    { label: 'Leaves', value: 'image:leaves', bg: '#1A1C16', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 10c15 0 20 15 20 30s-20 30-20 30S20 55 20 40s5-30 20-30z' fill='none' stroke='%23252820' stroke-width='0.5'/%3E%3Cpath d='M40 10v60' fill='none' stroke='%23252820' stroke-width='0.3'/%3E%3C/svg%3E")` },
    { label: 'Moroccan', value: 'image:moroccan', bg: '#1C1410', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M20 0a20 20 0 010 40 20 20 0 010-40M0 20a20 20 0 0140 0 20 20 0 01-40 0' fill='none' stroke='%23261E16' stroke-width='0.5'/%3E%3C/svg%3E")` },
    { label: 'Scales', value: 'image:scales', bg: '#1A1A1A', svg: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 20a20 20 0 0140 0' fill='none' stroke='%23252525' stroke-width='0.5'/%3E%3Cpath d='M20 20a20 20 0 0140 0' fill='none' stroke='%23222' stroke-width='0.5' transform='translate(-20,20)'/%3E%3C/svg%3E")` },
  ];

  const handleChatBgChange = useCallback((bg) => {
    setChatBg(bg);
    try { localStorage.setItem('chat_bg', bg); } catch {}
  }, []);

  // Handle reply to a message - show reply bar above input
  const handleReplyToMessage = useCallback((message) => {
    setReplyToMessage(message);
    setActiveTab('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Load starred messages from localStorage
  const loadStarredMessages = () => {
    try {
      const stored = localStorage.getItem(`starred_${contact.id}`);
      setStarredMessages(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch { setStarredMessages(new Set()); }
  };

  // Load pinned messages from localStorage
  const loadPinnedMessage = () => {
    try {
      const stored = localStorage.getItem(`pinned_${contact.id}`);
      if (!stored) { setPinnedMessages([]); return; }
      const parsed = JSON.parse(stored);
      // migrate old single-object format to array
      setPinnedMessages(Array.isArray(parsed) ? parsed : [parsed]);
    } catch { setPinnedMessages([]); }
  };

  // Toggle star on a message
  const handleToggleStar = useCallback((messageId) => {
    setStarredMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
        toast.success('Star removed');
      } else {
        next.add(messageId);
        toast.success('Message starred');
      }
      localStorage.setItem(`starred_${contact.id}`, JSON.stringify([...next]));
      return next;
    });
  }, [contact]);

  // Toggle pin on a message (supports multiple)
  const handleTogglePin = useCallback((message) => {
    setPinnedMessages(prev => {
      const exists = prev.some(p => p.id === message.id);
      let next;
      if (exists) {
        next = prev.filter(p => p.id !== message.id);
        toast.success('Message unpinned');
      } else {
        const pinData = { id: message.id, text: message.text, sender: message.sender };
        next = [...prev, pinData];
        toast.success('Message pinned');
      }
      if (next.length === 0) {
        localStorage.removeItem(`pinned_${contact.id}`);
      } else {
        localStorage.setItem(`pinned_${contact.id}`, JSON.stringify(next));
      }
      return next;
    });
  }, [contact]);

  // Handle retry message
  const handleRetryMessage = async (messageId, messageText) => {
    setRetryingMessageId(messageId);
    try {
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const result = await sendMessageViaBackend(cleanPhone, 'text', messageText, contact.name || '');

      if (result.success) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'sent', failed: false }
            : msg
        ));
        setFailedMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        toast.success('Message resent successfully!');
      } else {
        toast.error(result.message || 'Failed to resend message');
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      toast.error('Failed to resend message');
    } finally {
      setRetryingMessageId(null);
    }
  };

  // Message search
  const handleMessageSearch = (query) => {
    setMessageSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages
      .map((msg, index) => ({ ...msg, originalIndex: index }))
      .filter(msg => 
        msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
      );
    
    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      scrollToMessage(results[0].id);
    }
  };

  // Navigate search results
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex].id);
  };

  // Scroll to specific message
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 2000);
    }
  };

  // File size limits (in bytes)
  const FILE_SIZE_LIMITS = {
    image: 1 * 1024 * 1024,      // 1 MB
    audio: 16 * 1024 * 1024,     // 16 MB
    video: 30 * 1024 * 1024,     // 30 MB
    document: 16 * 1024 * 1024,  // 16 MB
  };

  // Allowed MIME types with labels
  const ALLOWED_FILE_TYPES = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'audio/mpeg': 'audio',
    'video/mp4': 'video',
    'application/pdf': 'document',
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ✅ Handle file selection — validate then show preview modal
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !contact) return;

    console.log('📎 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      contact: contact.phone
    });

    // Validate file type — use browser detection, fall back to extension for audio
    let detectedMime = file.type;
    let mediaCategory = ALLOWED_FILE_TYPES[detectedMime];

    if (!mediaCategory) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'mp3') {
        detectedMime = 'audio/mpeg';
        mediaCategory = 'audio';
      } else if (ext === 'pdf') {
        detectedMime = 'application/pdf';
        mediaCategory = 'document';
      }
    }

    if (!mediaCategory) {
      toast.error(
        'Unsupported file type. Allowed: JPEG, PNG, WebP images, MP3 audio, MP4 video, PDF documents.',
        { duration: 5000 }
      );
      event.target.value = '';
      return;
    }

    // Validate file size
    const sizeLimit = FILE_SIZE_LIMITS[mediaCategory];
    if (file.size > sizeLimit) {
      toast.error(
        `File too large (${formatFileSize(file.size)}). Max size for ${mediaCategory} files is ${formatFileSize(sizeLimit)}.`,
        { duration: 5000 }
      );
      event.target.value = '';
      return;
    }

    // Reject empty files
    if (file.size === 0) {
      toast.error('Cannot send an empty file.');
      event.target.value = '';
      return;
    }

    // Show preview modal instead of sending immediately
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewFile(file);
    setMediaPreviewUrl(previewUrl);
    setMediaPreviewType(mediaCategory === 'document' ? 'document' : mediaCategory);
    setMediaPreviewMime(detectedMime);

    // Reset file input so same file can be re-selected
    event.target.value = '';
  };

  // Confirm sending from media preview modal
  const handleMediaPreviewConfirm = async () => {
    const file = mediaPreviewFile;
    const type = mediaPreviewType;
    const detectedMime = mediaPreviewMime;

    // Close modal and revoke preview URL
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewFile(null);
    setMediaPreviewUrl(null);
    setMediaPreviewType(null);
    setMediaPreviewMime(null);

    if (!file || !contact) return;

    setIsSending(true);

    try {
      // ✅ Create local URL for immediate display
      const localUrl = URL.createObjectURL(file);

      // ✅ CRITICAL: Create optimistic message FIRST so it shows in chat immediately
      const optimisticMessageId = `local-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticMessageId,
        text: '',
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        sortTimestamp: Date.now(),
        status: 'sending',
        type,
        mediaUrl: localUrl,
        downloadedImageUrl: localUrl,
        localFile: true,
      };

      // ✅ Add to messages immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // ✅ Mark as downloaded so it displays without blur
      setDownloadedImages(prev => new Set(prev).add(optimisticMessageId));

      // Helper to mark the message as failed (keeps it visible in chat)
      const markFailed = () => {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessageId
            ? { ...msg, status: 'failed', failed: true }
            : msg
        ));
        setIsSending(false);
      };

      // Use Wati sendSessionFile API for audio/video/document, WebSocket for others
      if (type === 'audio' || type === 'video' || type === 'document') {
        // For audio files, ensure the File object has the correct MIME type
        // (browsers on macOS can misdetect .ogg/.mp3 MIME types)
        let fileToSend = file;
        if (type === 'audio' && detectedMime && file.type !== detectedMime) {
          fileToSend = new File([file], file.name, { type: detectedMime });
        }

        console.log('📤 Sending media via Wati API:', {
          phone: contact.phone,
          type,
          fileSize: fileToSend.size,
          fileName: fileToSend.name,
          mimeType: fileToSend.type,
        });

        const result = await sendSessionFile(contact.phone, fileToSend, fileToSend.name);

        if (result.success) {
          setMessages(prev => prev.map(msg =>
            msg.id === optimisticMessageId
              ? { ...msg, status: 'sent' }
              : msg
          ));
          toast.success(`${type === 'audio' ? 'Audio' : type === 'document' ? 'Document' : 'Video'} sent successfully!`);
          if (refreshContacts) refreshContacts();
        } else {
          console.error('❌ Wati API error:', result.message);
          toast.error(result.message || `Failed to send ${type}`);
          markFailed();
        }

        setIsSending(false);
      } else {
        const reader = new FileReader();

        reader.onload = () => {
          if (!isConnected) {
            toast.error('Not connected to server. File saved in chat.');
            markFailed();
            return;
          }

          const cleanPhone = contact.phone.replace(/\D/g, '');

          console.log('📤 Sending media via WebSocket:', {
            waId: cleanPhone,
            type,
            fileSize: file.size,
            mimeType: file.type
          });

          sendWsMessage({
            waId: cleanPhone,
            type,
            file: {
              buffer: reader.result,
              originalName: file.name,
              mimeType: file.type,
              size: file.size
            },
            name: 'Agent'
          });

          setTimeout(() => {
            setMessages(prev => prev.map(msg =>
              msg.id === optimisticMessageId
                ? { ...msg, status: 'sent' }
                : msg
            ));
          }, 500);

          toast.success(`${type === 'image' ? 'Image' : 'File'} sent successfully!`);

          if (refreshContacts) {
            refreshContacts();
          }

          setIsSending(false);
        };

        reader.onerror = () => {
          toast.error('Failed to read file');
          markFailed();
        };

        reader.readAsArrayBuffer(file);
      }

    } catch (error) {
      console.error('Error sending file:', error);
      toast.error(`Failed to send ${type}`);
      setIsSending(false);
    }
  };

  // Cancel media preview modal
  const handleMediaPreviewCancel = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewFile(null);
    setMediaPreviewUrl(null);
    setMediaPreviewType(null);
    setMediaPreviewMime(null);
  };

  // Handle camera captured blob (photo or video)
  const handleCameraFile = async (blob, type) => {
    if (!blob || !contact) return;

    const mimeType = blob.type || (type === 'image' ? 'image/jpeg' : 'video/mp4');
    const extMap = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'image/jpeg': 'jpg' };
    const ext = extMap[mimeType] || (type === 'image' ? 'jpg' : 'mp4');
    const fileName = `camera-${type}-${Date.now()}.${ext}`;

    // Validate captured file size
    const sizeLimit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.video;
    if (blob.size > sizeLimit) {
      toast.error(
        `Captured ${type} too large (${formatFileSize(blob.size)}). Max size is ${formatFileSize(sizeLimit)}.`,
        { duration: 5000 }
      );
      return;
    }

    if (blob.size === 0) {
      toast.error('Captured file is empty. Please try again.');
      return;
    }

    setIsSending(true);

    try {
      const localUrl = URL.createObjectURL(blob);
      const optimisticMessageId = `camera-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticMessageId,
        text: '',
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        sortTimestamp: Date.now(),
        status: 'sending',
        type,
        mediaUrl: localUrl,
        downloadedImageUrl: localUrl,
        localFile: true,
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setDownloadedImages(prev => new Set(prev).add(optimisticMessageId));

      const markFailed = () => {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessageId
            ? { ...msg, status: 'failed', failed: true }
            : msg
        ));
        setIsSending(false);
      };

      // Use Wati API for video captures, WebSocket for photos
      if (type === 'video') {
        // Always convert recorded video to standard MP4.
        // Browser MediaRecorder produces WebM or fragmented MP4 — both rejected by WhatsApp.
        let videoToSend = blob;
        let videoFileName = fileName.replace(/\.\w+$/, '.mp4');
        console.log('🔄 Converting recorded video from', mimeType, 'to standard MP4...');
        toast('Converting video to MP4... This may take a moment.', { icon: '🔄', duration: 5000 });
        try {
          // Add 2-minute timeout so the UI doesn't get stuck forever
          const conversionPromise = convertToMp4(blob);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Video conversion timed out after 2 minutes')), 120000)
          );
          videoToSend = await Promise.race([conversionPromise, timeoutPromise]);
        } catch (convErr) {
          console.error('❌ Video conversion failed:', convErr);
          toast.error('Failed to convert video. Please try again.');
          markFailed();
          return;
        }

        console.log('📤 Sending camera video via Wati API:', {
          phone: contact.phone,
          size: videoToSend.size,
          fileName: videoFileName,
        });

        const result = await sendSessionFile(contact.phone, videoToSend, videoFileName);

        if (result.success) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === optimisticMessageId ? { ...msg, status: 'sent' } : msg
            )
          );
          toast.success('Video sent!');
          if (refreshContacts) refreshContacts();
        } else {
          toast.error(result.message || 'Failed to send video');
          markFailed();
        }

        setIsSending(false);
      } else {
        const reader = new FileReader();

        reader.onload = () => {
          if (!isConnected) {
            toast.error('Not connected to server. Capture saved in chat.');
            markFailed();
            return;
          }

          const cleanPhone = contact.phone.replace(/\D/g, '');

          sendWsMessage({
            waId: cleanPhone,
            type,
            file: {
              buffer: reader.result,
              originalName: fileName,
              mimeType,
              size: blob.size,
            },
            name: 'Agent',
          });

          setTimeout(() => {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === optimisticMessageId ? { ...msg, status: 'sent' } : msg
              )
            );
          }, 500);

          toast.success('Photo sent!');
          if (refreshContacts) refreshContacts();
          setIsSending(false);
        };

        reader.onerror = () => {
          toast.error('Failed to process captured media');
          markFailed();
        };

        reader.readAsArrayBuffer(blob);
      }
    } catch (error) {
      console.error('Error sending camera capture:', error);
      toast.error('Failed to send captured media');
      setIsSending(false);
    }
  };

  // Clear interval whenever recordingTimer changes
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  // Stop recorder only on actual unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Hidden file input for attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,audio/mpeg,.mp3,video/mp4,.mp4,application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full bg-gradient-to-br from-[#1A1A1A] to-[#252525] shadow-2xl z-50 flex transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isMaximized ? 'w-full' : showProfileSidebar ? 'w-full lg:w-[950px]' : 'w-full md:w-[560px] lg:w-[720px]'}`}>
        {contact && (
          <>
            {/* Main Chat Area */}
            <div className={`flex flex-col ${showProfileSidebar ? 'flex-1' : 'w-full'} transition-all duration-300`}>
              {/* Header */}
              <ChatHeader
                contact={contact}
                isConnected={isConnected}
                showMessageSearch={showMessageSearch}
                setShowMessageSearch={setShowMessageSearch}
                setShowReminderModal={setShowReminderModal}
                showProfileSidebar={showProfileSidebar}
                setShowProfileSidebar={setShowProfileSidebar}
                onClose={onClose}
                messageSearchQuery={messageSearchQuery}
                setMessageSearchQuery={setMessageSearchQuery}
                searchResults={searchResults}
                currentSearchIndex={currentSearchIndex}
                activeTab={activeTab}
                handleMessageSearch={handleMessageSearch}
                navigateSearch={navigateSearch}
                messages={messages}
                isMaximized={isMaximized}
                setIsMaximized={setIsMaximized}
                isBlocked={isBlocked}
                isSpam={isSpam}
                onToggleBlock={handleToggleBlock}
                onToggleSpam={handleToggleSpam}
                onToggleChatSettings={() => setShowChatSettings(prev => !prev)}
                showChatSettings={showChatSettings}
              />

              {/* 24-Hour Window Warning */}
              {contactNotFound && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-yellow-500/30 p-5 animate-slideDown flex-shrink-0">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-bold mb-2 text-base">
                        ⏰ 24-Hour Messaging Window Closed
                      </h4>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                        WhatsApp Business requires the contact to message you first or use template messages.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#16A249] to-[#1C4F2A] text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                        >
                          <Phone className="w-4 h-4" />
                          Call Contact
                        </button>
                        <button
                          onClick={() => setContactNotFound(false)}
                          className="px-4 py-2.5 bg-[#3A3A3A] text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-[#4A4A4A] border border-[#16A249]/20"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked/Spam Banner */}
              {(isBlocked || isSpam) && (
                <div className="bg-gradient-to-r from-red-500/10 to-red-900/10 border-b border-red-500/30 px-4 py-2.5 flex items-center gap-3 animate-slideDown flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{isBlocked ? '🚫' : '⚠️'}</span>
                  </div>
                  <p className="text-sm text-red-300 flex-1">
                    {isBlocked && isSpam
                      ? 'This contact is blocked and marked as spam'
                      : isBlocked
                      ? 'This contact is blocked'
                      : 'This contact is marked as spam'}
                  </p>
                  <button
                    onClick={isBlocked ? handleToggleBlock : handleToggleSpam}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    {isBlocked ? 'Unblock' : 'Remove Spam'}
                  </button>
                </div>
              )}

              {/* Tabs */}
              <ChatTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                notesCount={notes.length}
                isLeadUnassigned={!contact.agentId}
                contactId={contact.id}
                contactPhone={contact.phone}  // ✅ Add this
              />

              {/* Chat Settings Panel */}
              {showChatSettings && (
                <div className="border-b border-[#16A249]/20 bg-[#222222] animate-slideDown flex-shrink-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Chat Background</h4>
                      <button
                        onClick={() => setShowChatSettings(false)}
                        className="text-gray-400 hover:text-white text-xs transition-colors"
                      >
                        Close
                      </button>
                    </div>

                    {/* Colors & Gradients */}
                    <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-wider">Colors</p>
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {chatBgColors.map((preset) => {
                        const isActive = chatBg === preset.value;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => handleChatBgChange(preset.value)}
                            className={`group relative rounded-lg h-10 border-2 transition-all duration-200 hover:scale-105 ${
                              isActive
                                ? 'border-[#16A249] ring-1 ring-[#16A249]/50'
                                : 'border-[#333] hover:border-[#555]'
                            }`}
                            style={{ background: preset.value }}
                            title={preset.label}
                          >
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#16A249]" />
                              </div>
                            )}
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Patterns */}
                    <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-wider">Patterns</p>
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {chatBgPatterns.map((preset) => {
                        const isActive = chatBg === preset.value;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => handleChatBgChange(preset.value)}
                            className={`group relative rounded-lg h-10 border-2 transition-all duration-200 hover:scale-105 overflow-hidden ${
                              isActive
                                ? 'border-[#16A249] ring-1 ring-[#16A249]/50'
                                : 'border-[#333] hover:border-[#555]'
                            }`}
                            style={{
                              backgroundColor: preset.bg,
                              backgroundImage: preset.css,
                              backgroundSize: preset.size,
                            }}
                            title={preset.label}
                          >
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#16A249] shadow-[0_0_4px_#16A249]" />
                              </div>
                            )}
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Images */}
                    <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-wider">Images</p>
                    <div className="grid grid-cols-6 gap-2">
                      {chatBgImages.map((preset) => {
                        const isActive = chatBg === preset.value;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => handleChatBgChange(preset.value)}
                            className={`group relative rounded-lg h-10 border-2 transition-all duration-200 hover:scale-105 overflow-hidden ${
                              isActive
                                ? 'border-[#16A249] ring-1 ring-[#16A249]/50'
                                : 'border-[#333] hover:border-[#555]'
                            }`}
                            style={{
                              backgroundColor: preset.bg,
                              backgroundImage: preset.svg,
                            }}
                            title={preset.label}
                          >
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#16A249] shadow-[0_0_4px_#16A249]" />
                              </div>
                            )}
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div
                ref={contentAreaRef}
                onMouseMove={chatBg === 'image:stars' ? handleContentMouseMove : undefined}
                className={`flex-1 overflow-y-auto custom-scrollbar relative${chatBg.startsWith('image:') ? ' animated-bg' : ''}`}
                style={(() => {
                  if (chatBg.startsWith('pattern:')) {
                    const p = chatBgPatterns.find(pt => pt.value === chatBg);
                    if (p) return { backgroundColor: p.bg, backgroundImage: p.css, backgroundSize: p.size };
                    return { backgroundColor: '#1A1A1A' };
                  }
                  if (chatBg.startsWith('image:')) {
                    const img = chatBgImages.find(i => i.value === chatBg);
                    if (img) return { backgroundColor: img.bg, backgroundImage: img.svg };
                    return { backgroundColor: '#1A1A1A' };
                  }
                  return { background: chatBg };
                })()}
              >
                {/* Stars interactive overlay: shooting star + mouse glow */}
                {chatBg === 'image:stars' && (
                  <div className="sticky top-0 left-0 w-full h-0 pointer-events-none overflow-visible z-[1]">
                    <div className="absolute top-0 left-0 w-full overflow-hidden" style={{ height: contentAreaRef.current?.clientHeight || '100vh' }}>
                      {/* Mouse-following glow with fire tint */}
                      <div
                        className="absolute w-48 h-48 rounded-full transition-all duration-700 ease-out"
                        style={{
                          left: `${mousePos.x * 100}%`,
                          top: `${mousePos.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          background: 'radial-gradient(circle, rgba(255,140,50,0.04) 0%, rgba(22,162,73,0.06) 30%, transparent 70%)',
                        }}
                      />
                      {/* Shooting star 1 */}
                      <div className="shooting-star shooting-star-1">
                        <span className="shooting-star-ember" />
                        <span className="shooting-star-ember ember-2" />
                        <span className="shooting-star-ember ember-3" />
                      </div>
                      {/* Shooting star 2 (delayed) */}
                      <div className="shooting-star shooting-star-2">
                        <span className="shooting-star-ember" />
                        <span className="shooting-star-ember ember-2" />
                        <span className="shooting-star-ember ember-3" />
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'chat' ? (
                  <MessagesArea
                    messages={messages}
                    isLoading={isLoading}
                    contact={contact}
                    isConnected={isConnected}
                    messagesEndRef={messagesEndRef}
                    retryingMessageId={retryingMessageId}
                    handleRetryMessage={handleRetryMessage}
                    downloadedImages={downloadedImages}
                    setDownloadedImages={setDownloadedImages}
                    setMessages={setMessages}
                    onReply={handleReplyToMessage}
                    starredMessages={starredMessages}
                    pinnedMessages={pinnedMessages}
                    onToggleStar={handleToggleStar}
                    onTogglePin={handleTogglePin}
                  />
                ) : activeTab === 'notes' ? (
                  <NotesArea
                    notes={notes}
                    setNotes={setNotes}
                    newNote={newNote}
                    setNewNote={setNewNote}
                    contact={contact}
                  />
                ) : activeTab === 'assign' ? (
                  <AssignAgent contact={contact} refreshContacts={refreshContacts} />
                ) : (
                  <InboxLeadStatus contact={contact} refreshContacts={refreshContacts} />
                )}
              </div>

              {/* Reply Preview Bar */}
              {replyToMessage && (
                <div className="bg-[#1e1e1e] border-t border-[#333] px-4 pt-3 flex-shrink-0">
                  <div className="flex items-start gap-3 bg-[#2A2A2A] rounded-xl px-3 py-2.5 border-l-[3px] border-[#16A249]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#00FF7F]">
                        {replyToMessage.sender === 'user' ? 'You' : contact?.name?.split(' ')[0] || 'Contact'}
                      </p>
                      <p className="text-sm text-gray-300 truncate">
                        {replyToMessage.text || 'Media'}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyToMessage(null)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <ChatInput
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                isSending={isSending}
                setIsSending={setIsSending}
                contact={contact}
                isConnected={isConnected}
                sendWsMessage={sendWsMessage}
                messages={messages}
                setMessages={setMessages}
                setContactNotFound={setContactNotFound}
                refreshContacts={refreshContacts}
                inputRef={inputRef}
                fileInputRef={fileInputRef}
                setShowTemplatePicker={setShowTemplatePicker}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                recordingDuration={recordingDuration}
                setRecordingDuration={setRecordingDuration}
                recordingTimer={recordingTimer}
                setRecordingTimer={setRecordingTimer}
                mediaRecorderRef={mediaRecorderRef}
                audioChunksRef={audioChunksRef}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                emojiPickerRef={emojiPickerRef}
                downloadedImages={downloadedImages}
                setDownloadedImages={setDownloadedImages}
                trackSentMessage={trackSentMessage}
                onCameraCapture={handleCameraFile}
                replyToMessage={replyToMessage}
                setReplyToMessage={setReplyToMessage}
              />
            </div>

            {/* Profile Sidebar */}
            {showProfileSidebar && (
              <ProfileSidebar
                contact={contact}
                contactTags={contactTags}
                setContactTags={setContactTags}
                newTag={newTag}
                setNewTag={setNewTag}
                showTagInput={showTagInput}
                setShowTagInput={setShowTagInput}
                setShowReminderModal={setShowReminderModal}
                isBlocked={isBlocked}
                isSpam={isSpam}
                onToggleBlock={handleToggleBlock}
                onToggleSpam={handleToggleSpam}
              />
            )}
          </>
        )}

        {/* Template Picker Overlay */}
        {showTemplatePicker && (
          <TemplatePicker
            contact={contact}
            onClose={() => setShowTemplatePicker(false)}
            setMessages={setMessages}
            refreshContacts={refreshContacts}
          />
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <ReminderModal
            contact={contact}
            onClose={() => setShowReminderModal(false)}
          />
        )}
      </div>

      {/* Media Preview Modal */}
      {mediaPreviewFile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn"
          onClick={handleMediaPreviewCancel}
        >
          <div
            className="bg-[#1E1E1E] rounded-2xl border border-[#16A249]/20 shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#16A249]/15 flex items-center justify-center">
                  {mediaPreviewType === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-[#00FF7F]" />
                  ) : mediaPreviewType === 'video' ? (
                    <Video className="w-4 h-4 text-[#00FF7F]" />
                  ) : mediaPreviewType === 'document' ? (
                    <FileText className="w-4 h-4 text-[#00FF7F]" />
                  ) : (
                    <Music className="w-4 h-4 text-[#00FF7F]" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Send {mediaPreviewType === 'image' ? 'Image' : mediaPreviewType === 'video' ? 'Video' : mediaPreviewType === 'document' ? 'Document' : 'Audio'}
                  </h3>
                  <p className="text-gray-500 text-xs truncate max-w-[220px]">
                    {mediaPreviewFile.name} &middot; {formatFileSize(mediaPreviewFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleMediaPreviewCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Area */}
            <div className="p-5 flex items-center justify-center bg-[#161616] min-h-[200px]">
              {mediaPreviewType === 'image' && (
                <img
                  src={mediaPreviewUrl}
                  alt="Preview"
                  className="max-h-[360px] max-w-full object-contain rounded-lg"
                />
              )}
              {mediaPreviewType === 'video' && (
                <video
                  src={mediaPreviewUrl}
                  controls
                  autoPlay
                  muted
                  className="max-h-[360px] max-w-full rounded-lg"
                />
              )}
              {mediaPreviewType === 'audio' && (
                <div className="w-full flex flex-col items-center gap-4 py-6">
                  <div className="w-20 h-20 rounded-full bg-[#16A249]/10 flex items-center justify-center">
                    <Music className="w-10 h-10 text-[#00FF7F]" />
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-[280px]">{mediaPreviewFile.name}</p>
                  <audio
                    src={mediaPreviewUrl}
                    controls
                    className="w-full max-w-[320px]"
                  />
                </div>
              )}
              {mediaPreviewType === 'document' && (
                <div className="w-full flex flex-col items-center gap-4 py-6">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-red-400" />
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-[280px]">{mediaPreviewFile.name}</p>
                  <p className="text-gray-500 text-xs">{formatFileSize(mediaPreviewFile.size)}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-[#333]">
              <button
                onClick={handleMediaPreviewCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#333] transition-colors border border-[#3A3A3A]"
              >
                Cancel
              </button>
              <button
                onClick={handleMediaPreviewConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#16A249] to-[#1C4F2A] text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.8; 
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .highlight-message {
          animation: highlightPulse 2s ease-out;
        }

        @keyframes highlightPulse {
          0% { background-color: rgba(22, 162, 73, 0.2); }
          50% { background-color: rgba(22, 162, 73, 0.4); }
          100% { background-color: transparent; }
        }

        @keyframes driftBg {
          0% { background-position: 0% 0%; }
          25% { background-position: 50% 25%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 75%; }
          100% { background-position: 0% 0%; }
        }

        .animated-bg {
          animation: driftBg 60s ease-in-out infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #16A249 0%, #1C4F2A 100%);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #1EB956 0%, #267A3D 100%);
        }

        /* Shooting star animations — angled diagonal fall */
        .shooting-star {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #fff;
          border-radius: 50%;
          opacity: 0;
          box-shadow:
            0 0 4px 2px rgba(255,200,80,0.8),
            0 0 8px 4px rgba(255,140,50,0.5),
            0 0 16px 6px rgba(255,80,20,0.25),
            0 0 2px 1px rgba(255,255,255,0.9);
        }

        /* Fire glow around the head */
        .shooting-star::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,200,80,0.6) 0%, rgba(255,100,30,0.3) 50%, transparent 100%);
          animation: fireFlicker 0.15s ease-in-out infinite alternate;
        }

        /* Tail — angled to match the 35° diagonal trajectory */
        .shooting-star::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 100%;
          width: 90px;
          height: 2px;
          background: linear-gradient(to left, rgba(255,200,80,0.7), rgba(255,120,30,0.4) 30%, rgba(22,162,73,0.2) 60%, transparent);
          transform-origin: right center;
          transform: translateY(-50%);
          border-radius: 1px;
        }

        /* Fire ember particles trailing behind */
        .shooting-star-ember {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #ff9030;
          box-shadow: 0 0 3px 1px rgba(255,140,50,0.6);
          animation: emberDrift 0.4s ease-out infinite;
          top: 0;
          left: 0;
        }

        .shooting-star-ember.ember-2 {
          width: 1.5px;
          height: 1.5px;
          background: #ffcc44;
          animation-delay: 0.12s;
          animation-duration: 0.35s;
          box-shadow: 0 0 2px 1px rgba(255,200,60,0.5);
        }

        .shooting-star-ember.ember-3 {
          width: 1px;
          height: 1px;
          background: #ff6020;
          animation-delay: 0.22s;
          animation-duration: 0.5s;
          box-shadow: 0 0 2px 1px rgba(255,80,20,0.4);
        }

        /* Star 1 — starts top-left, falls at ~35° angle */
        .shooting-star-1 {
          top: -5%;
          left: 10%;
          animation: shootingStar1 7s ease-in-out 2s infinite;
        }

        /* Star 2 — different start, same angle */
        .shooting-star-2 {
          top: -5%;
          left: 40%;
          animation: shootingStar2 7s ease-in-out 5.5s infinite;
        }

        @keyframes shootingStar1 {
          0%  { transform: translate(0, 0) rotate(35deg); opacity: 0; }
          2%  { opacity: 0.9; }
          18% { transform: translate(55vw, 38vh) rotate(35deg); opacity: 0; }
          100% { opacity: 0; }
        }

        @keyframes shootingStar2 {
          0%  { transform: translate(0, 0) rotate(35deg); opacity: 0; }
          2%  { opacity: 0.9; }
          18% { transform: translate(50vw, 35vh) rotate(35deg); opacity: 0; }
          100% { opacity: 0; }
        }

        @keyframes fireFlicker {
          0%  { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }

        @keyframes emberDrift {
          0%  { transform: translate(0, 0) scale(1); opacity: 0.9; }
          100% { transform: translate(-10px, -6px) scale(0); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default InboxChatDrawer;