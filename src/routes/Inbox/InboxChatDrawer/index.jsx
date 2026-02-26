import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPreviousMessages, sendWatiMessage, sendSessionFile } from '../../../services/inboxService';
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

  // Maximize State
  const [isMaximized, setIsMaximized] = useState(false);

  // Block/Spam State
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSpam, setIsSpam] = useState(false);
  
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
      
      fetchPreviousMessages();
      loadContactNotes();
      loadContactTags();
      loadBlockSpamStatus();

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
        type: data.type || 'text',
        mediaUrl: data.data || data.media?.url || null,
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
        rawMessages = rawMessages.filter(msg => msg.eventType !== 'sentMessageDELIVERED_v2');

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

            // Text content
            let messageText = msg.text || '';

            // Media URL: from data field (e.g. "data/images/xxx.jpg", "data/audios/xxx.opus")
            const mediaUrl = msg.data || null;

            // Template detection
            const isTemplate = messageType === 'template' || msg.eventType === 'broadcastMessage';

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

  // Handle retry message
  const handleRetryMessage = async (messageId, messageText) => {
    setRetryingMessageId(messageId);
    try {
      const result = await sendWatiMessage(contact.phone, messageText);

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
    video: 16 * 1024 * 1024,     // 16 MB
  };

  // Allowed MIME types with labels
  const ALLOWED_FILE_TYPES = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'audio/mpeg': 'audio',
    'video/mp4': 'video',
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ✅ Handle file selection and send
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
      }
    }

    if (!mediaCategory) {
      toast.error(
        'Unsupported file type. Allowed: JPEG, PNG, WebP images, MP3 audio, MP4 video.',
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

    const type = mediaCategory === 'document' ? 'document' : mediaCategory;

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

      // ✅ CRITICAL FIX: Read file as ArrayBuffer for sending
      const reader = new FileReader();
      
      // Helper to mark the message as failed (keeps it visible in chat)
      const markFailed = () => {
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessageId
            ? { ...msg, status: 'failed', failed: true }
            : msg
        ));
        setIsSending(false);
        event.target.value = '';
      };

      // Use Wati sendSessionFile API for audio/video, WebSocket for others
      if (type === 'audio' || type === 'video') {
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
          toast.success(`${type === 'audio' ? 'Audio' : 'Video'} sent successfully!`);
          if (refreshContacts) refreshContacts();
        } else {
          console.error('❌ Wati API error:', result.message);
          toast.error(result.message || `Failed to send ${type}`);
          markFailed();
        }

        setIsSending(false);
        event.target.value = '';
      } else {
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
          event.target.value = '';
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
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessageId
          ? { ...msg, status: 'failed', failed: true }
          : msg
      ));
      setIsSending(false);
      event.target.value = '';
    }
  };

  // Handle camera captured blob (photo or video)
  const handleCameraFile = async (blob, type) => {
    if (!blob || !contact) return;

    const mimeType = blob.type || (type === 'image' ? 'image/jpeg' : 'video/mp4');
    const ext = type === 'image' ? 'jpg' : 'mp4';
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
        console.log('📤 Sending camera video via Wati API:', {
          phone: contact.phone,
          size: blob.size,
          fileName,
        });

        const result = await sendSessionFile(contact.phone, blob, fileName);

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

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordingTimer, isRecording]);

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
        accept="image/jpeg,image/png,image/webp,audio/mpeg,.mp3,video/mp4,.mp4"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full bg-gradient-to-br from-[#1A1A1A] to-[#252525] shadow-2xl z-50 flex transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isMaximized ? 'w-full' : showProfileSidebar ? 'w-full lg:w-[900px]' : 'w-full md:w-[500px] lg:w-[650px]'}`}>
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
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                        >
                          <Phone className="w-4 h-4" />
                          Call Contact
                        </button>
                        <button
                          onClick={() => setContactNotFound(false)}
                          className="px-4 py-2.5 bg-[#3A3A3A] text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-[#4A4A4A] border border-[#BBA473]/20"
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

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto bg-[#1A1A1A] custom-scrollbar">
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
                  />
                ) : activeTab === 'notes' ? (
                  <NotesArea
                    notes={notes}
                    setNotes={setNotes}
                    newNote={newNote}
                    setNewNote={setNewNote}
                    contact={contact}
                  />
                ) : (
                  <InboxLeadStatus contact={contact} refreshContacts={refreshContacts} />
                )}
              </div>

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
          0% { background-color: rgba(187, 164, 115, 0.2); }
          50% { background-color: rgba(187, 164, 115, 0.4); }
          100% { background-color: transparent; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #BBA473 0%, #8E7D5A 100%);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #d4bc89 0%, #a69363 100%);
        }
      `}</style>
    </>
  );
};

export default InboxChatDrawer;