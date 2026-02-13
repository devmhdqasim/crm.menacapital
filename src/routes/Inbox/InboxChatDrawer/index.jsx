import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPreviousMessages, sendWatiMessage } from '../../../services/inboxService';
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
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const emojiPickerRef = useRef(null);
  
  // WebSocket integration
  const { isConnected, addMessageListener, sendMessage: sendWsMessage } = useWebSocket();
  
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

      // Handle message status updates
      if (data.type === 'status_update') {
        const { messageId, status, waId } = data;
        const contactWaId = contact.phone.replace(/\D/g, '');
        
        if (!waId || (!waId.includes(contactWaId) && !contactWaId.includes(waId))) {
          return;
        }

        console.log('📊 Updating message status:', messageId, status);

        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId || 
              (msg.sender === 'user' && Math.abs(msg.sortTimestamp - Date.now()) < 10000)) {
            return { ...msg, status: status.toLowerCase() };
          }
          return msg;
        }));
        
        return;
      }

      // Handle regular incoming messages
      const messageWaId = data.from || data.waId;
      const contactWaId = contact.phone.replace(/\D/g, '');
      
      if (!messageWaId || (!messageWaId.includes(contactWaId) && !contactWaId.includes(messageWaId))) {
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
        // Handle multiple response structures:
        // 1. Direct: { data: [...messages], pagination: {...} }
        // 2. Wrapped: { data: { data: [...messages], pagination: {...} } }
        // 3. Nested: { data: { data: { data: [...messages] } } }
        let rawMessages = [];
        if (Array.isArray(responseData.data)) {
          rawMessages = responseData.data;
        } else if (Array.isArray(responseData.data?.data)) {
          rawMessages = responseData.data.data;
        } else if (Array.isArray(responseData)) {
          rawMessages = responseData;
        }

        console.log('Messages found:', rawMessages.length, 'from response:', responseData);

        if (rawMessages.length > 0) {
          const transformedMessages = rawMessages.map((msg) => {
            // Timestamp: use rawPayload.timestamp (Unix seconds) or createdAt
            const rawTs = msg.rawPayload?.timestamp;
            const timestamp = rawTs
              ? parseInt(rawTs) * 1000
              : new Date(msg.createdAt || msg.created).getTime();
            const date = new Date(timestamp);

            const timeString = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            // Message type from messageType field
            const messageType = msg.messageType || msg.rawPayload?.type || 'text';

            // Text content
            let messageText = msg.text || msg.rawPayload?.text || '';

            // Media URL: from media object or rawPayload.data
            const mediaUrl = msg.media?.url || msg.rawPayload?.data || null;

            // Template detection
            const isTemplate = messageType === 'template' || msg.rawPayload?.eventType === 'broadcastMessage';

            // Sender: direction "inbound" = contact, "outbound" = user
            // Also check rawPayload.owner for outgoing messages
            const isOutgoing = msg.direction === 'outbound' || msg.rawPayload?.owner === true;

            return {
              id: msg._id || msg.whatsappMessageId || `api-${timestamp}-${Math.random()}`,
              text: messageText,
              sender: isOutgoing ? 'user' : 'contact',
              timestamp: timeString,
              sortTimestamp: timestamp,
              status: msg.status || 'sent',
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

  // ✅ NEW: Handle file selection and send
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !contact) return;

    console.log('📎 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      contact: contact.phone
    });

    // WhatsApp-safe MIME types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'audio/mpeg',
      'audio/ogg',
      'audio/mp4',
      'video/mp4'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type. Only JPEG, PNG images and MP3, OGG, MP4 audio/video files are supported.');
      event.target.value = '';
      return;
    }

    // Determine type
    let type = 'image';
    if (file.type.startsWith('audio')) {
      type = 'audio';
    } else if (file.type.startsWith('video')) {
      type = 'video';
    }

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
      
      reader.onload = () => {
        if (!isConnected) {
          toast.error('Not connected to server. Please try again.');
          // Remove the optimistic message if not connected
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId));
          setIsSending(false);
          event.target.value = '';
          return;
        }

        const cleanPhone = contact.phone.replace(/\D/g, '');
        
        console.log('📤 Sending media via WebSocket:', {
          waId: cleanPhone,
          type,
          fileSize: file.size,
          mimeType: file.type
        });
        
        // ✅ CRITICAL: Send the file via Socket.IO with proper structure
        sendWsMessage({
          waId: cleanPhone,
          type,
          file: {
            buffer: reader.result, // ArrayBuffer
            originalName: file.name,
            mimeType: file.type,
            size: file.size
          },
          name: 'Agent'
        });

        // ✅ Update message status to 'sent' after successful send
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessageId 
              ? { ...msg, status: 'sent' }
              : msg
          ));
        }, 500);

        toast.success(`${type === 'image' ? 'Image' : type === 'audio' ? 'Audio' : 'Video'} sent successfully!`);
        
        if (refreshContacts) {
          refreshContacts();
        }
        
        setIsSending(false);
        event.target.value = '';
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        // Remove the optimistic message if reading failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId));
        setIsSending(false);
        event.target.value = '';
      };

      // ✅ CRITICAL: Read as ArrayBuffer (matches backend expectation)
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error(`Failed to send ${type}`);
      setIsSending(false);
      event.target.value = '';
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

      {/* Hidden file input - ✅ NOW WITH onChange HANDLER */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,audio/mpeg,audio/ogg,audio/mp4,video/mp4"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full bg-gradient-to-br from-[#1A1A1A] to-[#252525] shadow-2xl z-50 flex transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${showProfileSidebar ? 'w-full lg:w-[900px]' : 'w-full md:w-[500px] lg:w-[650px]'}`}>
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

              {/* Tabs */}
              <ChatTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                notesCount={notes.length}
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
              />
            )}
          </>
        )}

        {/* Template Picker Overlay */}
        {showTemplatePicker && (
          <TemplatePicker
            contact={contact}
            onClose={() => setShowTemplatePicker(false)}
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