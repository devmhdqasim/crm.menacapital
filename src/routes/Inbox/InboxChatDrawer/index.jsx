import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Check, CheckCheck, Clock, AlertCircle, RefreshCw, Phone, Mail, Globe, User, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendWatiMessage, getWatiMessages, createWatiContact } from '../../../services/inboxService';
import { useWebSocket } from '../../../context/WebSocketContext';

const InboxChatDrawer = ({ isOpen, onClose, contact, refreshContacts }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState(null);
  const [failedMessages, setFailedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // WebSocket integration
  const { isConnected, addMessageListener, sendMessage: sendWsMessage } = useWebSocket();

  // Fetch messages from Wati when contact is selected
  useEffect(() => {
    if (contact) {
      fetchWatiMessages();
      // Focus input when drawer opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [contact]);

  // WebSocket listener for real-time messages
  useEffect(() => {
    if (!contact || !isConnected) return;

    // Subscribe to messages for this contact
    sendWsMessage({
      type: 'SUBSCRIBE',
      phoneNumber: contact.phone,
    });

    const unsubscribe = addMessageListener((data) => {
      console.log('📨 WebSocket message received:', data);

      // Handle new messages
      if (data.type === 'NEW_MESSAGE' && data.phoneNumber === contact.phone) {
        const newMessage = {
          id: `ws-${Date.now()}`,
          text: data.message.text,
          sender: data.message.owner ? 'user' : 'contact',
          timestamp: new Date(data.message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          sortTimestamp: new Date(data.message.timestamp).getTime(),
          status: 'delivered',
          type: data.message.messageType || 'text',
        };

        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage].sort((a, b) => a.sortTimestamp - b.sortTimestamp);
        });

        // Auto-scroll to bottom
        setTimeout(() => scrollToBottom(), 100);

        // Show toast notification if it's from contact
        if (!data.message.owner) {
          toast.success(`New message from ${contact.name}`, {
            duration: 3000,
            icon: '💬',
          });
        }

        // Refresh contacts list to update last message
        if (refreshContacts) {
          refreshContacts();
        }
      }

      // Handle message status updates
      if (data.type === 'MESSAGE_STATUS_UPDATE' && data.phoneNumber === contact.phone) {
        setMessages(prev => prev.map(msg => {
          // Update status for matching message ID or recent user messages
          if (msg.id === data.messageId || (msg.sender === 'user' && msg.status === 'sent')) {
            return { ...msg, status: data.status };
          }
          return msg;
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [contact, isConnected, addMessageListener, sendWsMessage, refreshContacts]);

  const fetchWatiMessages = async () => {
    if (!contact || !contact.phone) return;
    
    setIsLoading(true);
    setContactNotFound(false);
    try {
      const result = await getWatiMessages(contact.phone, 100, 0);
      
      console.log('📥 Wati API Response:', result);
      
      if (result.success && result.data && result.data.messages && result.data.messages.items) {
        const watiMessages = result.data.messages.items;
        
        // Transform Wati messages to our format
        const transformedMessages = watiMessages
          .filter(msg => msg.eventType === 'message')
          .map((msg) => {
            const timestamp = msg.timestamp ? parseInt(msg.timestamp) * 1000 : new Date(msg.created).getTime();
            const date = new Date(timestamp);
            
            const timeString = date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            
            return {
              id: msg.id,
              text: msg.text || (msg.type === 'image' ? '📷 Image' : msg.type === 'document' ? '📄 Document' : msg.type === 'audio' ? '🎵 Audio' : '📎 Media'),
              sender: msg.owner ? 'user' : 'contact',
              timestamp: timeString,
              sortTimestamp: timestamp,
              status: msg.statusString ? msg.statusString.toLowerCase() : 'sent',
              type: msg.type || 'text',
              mediaUrl: msg.data?.url || null,
            };
          });
        
        transformedMessages.sort((a, b) => a.sortTimestamp - b.sortTimestamp);
        
        console.log('✅ Transformed messages:', transformedMessages);
        setMessages(transformedMessages);
      } else if (result.info && result.info.includes('Contact not found')) {
        setContactNotFound(true);
        console.log('⚠️ Contact not found in Wati:', contact.phone);
        
        if (contact.remarks || contact.latestRemarks) {
          setMessages([
            {
              id: 1,
              text: contact.remarks || contact.latestRemarks,
              sender: 'contact',
              timestamp: new Date(contact.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              sortTimestamp: new Date(contact.createdAt).getTime(),
              status: 'read',
            },
          ]);
        } else {
          setMessages([]);
        }
      } else {
        console.error('❌ Failed to fetch Wati messages:', result.message);
        if (contact.remarks || contact.latestRemarks) {
          setMessages([
            {
              id: 1,
              text: contact.remarks || contact.latestRemarks,
              sender: 'contact',
              timestamp: new Date(contact.createdAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              sortTimestamp: new Date(contact.createdAt).getTime(),
              status: 'read',
            },
          ]);
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching Wati messages:', error);
      toast.error('Failed to load conversation history');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateContact = async () => {
    if (!contact) return;
    
    setIsSending(true);
    try {
      const result = await createWatiContact(contact.phone, contact.name, {
        email: contact.email,
        nationality: contact.nationality,
        source: contact.source,
      });
      
      if (result.success) {
        toast.success('Contact added to Wati successfully!');
        setContactNotFound(false);
        fetchWatiMessages();
      } else {
        toast.error(result.message || 'Failed to add contact to Wati');
      }
    } catch (error) {
      console.error('❌ Error creating Wati contact:', error);
      toast.error('Failed to add contact to Wati');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (retryMessageId = null, retryText = null) => {
    const textToSend = retryText || messageInput.trim();
    if (!textToSend || !contact) return;

    const isRetry = retryMessageId !== null;
    
    if (isRetry) {
      setRetryingMessageId(retryMessageId);
    } else {
      setIsSending(true);
    }
    
    try {
      const result = await sendWatiMessage(contact.phone, textToSend);
      
      if (result.success) {
        if (isRetry) {
          // Update the failed message to sent
          setMessages(prev => prev.map(msg => 
            msg.id === retryMessageId 
              ? { ...msg, status: 'sent', failed: false }
              : msg
          ));
          setFailedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(retryMessageId);
            return newSet;
          });
          toast.success('Message resent successfully!');
        } else {
          const newMessage = {
            id: Date.now(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            sortTimestamp: Date.now(),
            status: 'sent',
            failed: false,
          };

          setMessages([...messages, newMessage]);
          setMessageInput('');
          setContactNotFound(false);
          
          // Status updates will be handled by WebSocket
          // But keep fallback for when WebSocket is not connected
          if (!isConnected) {
            setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
              ));
            }, 1000);
            
            setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
              ));
            }, 3000);
          }
        }
        
        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        if (isRetry) {
          // Don't add a new failed message, keep the existing one
          // Show appropriate error toast
          if (result.contactNotFound || result.windowExpired) {
            setContactNotFound(true);
            toast.error('Cannot resend: 24-hour messaging window closed', {
              duration: 4000,
              icon: '⏰',
            });
          } else {
            toast.error(result.message || 'Failed to resend message', {
              duration: 4000,
            });
          }
        } else {
          // Mark message as failed for new messages
          const failedMessage = {
            id: Date.now(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            sortTimestamp: Date.now(),
            status: 'failed',
            failed: true,
          };
          
          setMessages([...messages, failedMessage]);
          setFailedMessages(prev => new Set(prev).add(failedMessage.id));
          setMessageInput('');
          
          // Show error toast for new messages
          if (result.contactNotFound || result.windowExpired) {
            setContactNotFound(true);
            toast.error('Cannot send message: 24-hour messaging window closed', {
              duration: 4000,
              icon: '⏰',
            });
          } else {
            toast.error(result.message || 'Failed to send message', {
              duration: 4000,
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      if (isRetry) {
        // For retry errors, just show the error toast without creating a new message
        toast.error('Failed to resend message. Please try again.', {
          duration: 4000,
        });
      } else {
        // For new message errors, create a failed message
        const failedMessage = {
          id: Date.now(),
          text: textToSend,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          sortTimestamp: Date.now(),
          status: 'failed',
          failed: true,
        };
        
        setMessages([...messages, failedMessage]);
        setFailedMessages(prev => new Set(prev).add(failedMessage.id));
        setMessageInput('');
        
        toast.error('Failed to send message. Please try again.', {
          duration: 4000,
        });
      }
    } finally {
      if (isRetry) {
        setRetryingMessageId(null);
      } else {
        setIsSending(false);
      }
    }
  };

  const handleRetryMessage = (messageId, messageText) => {
    handleSendMessage(messageId, messageText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status, failed) => {
    if (failed) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-[#BBA473]" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[650px] bg-gradient-to-br from-[#1A1A1A] to-[#252525] shadow-2xl z-50 flex flex-col transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {contact && (
          <>
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0 group">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg ring-2 ring-[#BBA473]/20 transition-transform duration-300 group-hover:scale-110">
                      <span className="text-2xl font-bold text-white">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* WebSocket connection indicator */}
                    {isConnected && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2A2A2A] animate-pulse" title="Real-time updates active"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate text-lg">{capitalizeWords(contact.name)}</h3>
                    <p className="text-sm text-gray-400 truncate flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {formatPhoneDisplay(contact.phone)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="p-2.5 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300 hover:scale-110"
                    title="Contact Info"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showContactInfo ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expandable Contact Info */}
              <div className={`overflow-hidden transition-all duration-300 ${showContactInfo ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[#1A1A1A]/50 rounded-lg p-4 backdrop-blur-sm border border-[#BBA473]/10">
                  <div className="grid grid-cols-1 gap-3">
                    {contact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-[#BBA473]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">Email</p>
                          <p className="text-white truncate">{contact.email}</p>
                        </div>
                      </div>
                    )}
                    {contact.nationality && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-[#BBA473]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">Nationality</p>
                          <p className="text-white truncate">{contact.nationality}</p>
                        </div>
                      </div>
                    )}
                    {contact.agent && contact.agent !== 'Not Assigned' && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#BBA473]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">Assigned Agent</p>
                          <p className="text-white truncate">{capitalizeWords(contact.agent)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
                    <div className="mt-3 pt-3 border-t border-[#BBA473]/10">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        contact.kioskLeadStatus === 'Demo' 
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : contact.kioskLeadStatus === 'Real'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        {contact.kioskLeadStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Window Warning - Enhanced */}
            {contactNotFound && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-yellow-500/30 p-5 animate-slideDown">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-yellow-400 font-bold mb-2 text-base">
                      ⏰ 24-Hour Messaging Window Closed
                    </h4>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                      WhatsApp Business requires the contact to message you first or the conversation must be within 24 hours of their last message.
                    </p>
                    
                    <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-yellow-500/20">
                      <p className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        How to reopen the conversation:
                      </p>
                      <ul className="text-sm text-gray-300 space-y-2.5">
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-0.5 text-lg">1.</span>
                          <span>Ask the contact to send a message to your WhatsApp Business number</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-0.5 text-lg">2.</span>
                          <span>Call them and request they message you on WhatsApp</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-0.5 text-lg">3.</span>
                          <span>Use approved WhatsApp template messages (if configured)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-sm font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] shadow-lg hover:shadow-xl hover:scale-105"
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

            {/* Messages Area - Enhanced */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#1A1A1A] custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#BBA473]/20 border-t-[#BBA473]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A]"></div>
                    </div>
                  </div>
                  <span className="text-gray-400 mt-4 font-medium">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                  <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center animate-pulse-slow">
                      <svg className="w-14 h-14 text-[#BBA473]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Start a Conversation</h3>
                  <p className="text-gray-400 text-sm max-w-xs mb-6 leading-relaxed">
                    No messages yet. Send a message below to start chatting with {contact.name.split(' ')[0]}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'} animate-ping`}></div>
                    <span>{isConnected ? 'Real-time updates active' : 'Ready to chat'}</span>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className={`max-w-[80%] group ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md ${
                          message.sender === 'user'
                            ? message.failed
                              ? 'bg-red-500/20 text-white border border-red-500/30'
                              : 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black'
                            : 'bg-[#2A2A2A] text-white border border-[#BBA473]/20'
                        } transition-all duration-300 hover:shadow-lg ${message.sender === 'user' && !message.failed ? 'hover:scale-[1.02]' : ''}`}
                      >
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          <span className={`text-xs font-medium ${
                            message.sender === 'user' 
                              ? message.failed 
                                ? 'text-red-300' 
                                : 'text-black/70' 
                              : 'text-gray-400'
                          }`}>
                            {message.timestamp}
                          </span>
                          {message.sender === 'user' && (
                            <span className="ml-1">{getMessageStatusIcon(message.status, message.failed)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Retry Button for Failed Messages */}
                      {message.failed && message.sender === 'user' && (
                        <button
                          onClick={() => handleRetryMessage(message.id, message.text)}
                          disabled={retryingMessageId === message.id}
                          className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {retryingMessageId === message.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows="1"
                    disabled={isSending}
                    className="w-full px-5 py-3.5 pr-12 border-2 border-[#BBA473]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white placeholder-gray-500 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-4 bottom-4 text-xs text-gray-500">
                    {messageInput.length > 0 && `${messageInput.length} chars`}
                  </div>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!messageInput.trim() || isSending}
                  className={`p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform ${
                    messageInput.trim() && !isSending
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:scale-110 shadow-lg hover:shadow-xl active:scale-95'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Typing indicator hint with WebSocket status */}
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>Press Enter to send • Shift+Enter for new line</span>
                <span className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
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
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
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
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        /* Custom scrollbar */
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

        /* Auto-resize textarea */
        textarea {
          field-sizing: content;
        }
      `}</style>
    </>
  );
};

export default InboxChatDrawer;