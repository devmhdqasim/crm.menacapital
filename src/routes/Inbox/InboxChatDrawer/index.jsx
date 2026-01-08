import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendWatiMessage, getWatiMessages, markWatiMessagesAsRead, createWatiContact } from '../../../services/inboxService';

const InboxChatDrawer = ({ isOpen, onClose, contact, refreshContacts }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages from Wati when contact is selected
  useEffect(() => {
    if (contact) {
      fetchWatiMessages();
    }
  }, [contact]);

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
          .filter(msg => msg.eventType === 'message') // Only process actual messages
          .map((msg) => {
            // Parse timestamp - Wati returns Unix timestamp in seconds
            const timestamp = msg.timestamp ? parseInt(msg.timestamp) * 1000 : new Date(msg.created).getTime();
            const date = new Date(timestamp);
            
            // Format time as HH:MM
            const timeString = date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            
            return {
              id: msg.id,
              text: msg.text || (msg.type === 'image' ? '[Image]' : msg.type === 'document' ? '[Document]' : msg.type === 'audio' ? '[Audio]' : '[Media]'),
              sender: msg.owner ? 'user' : 'contact',
              timestamp: timeString,
              sortTimestamp: timestamp, // Use for sorting
              status: msg.statusString ? msg.statusString.toLowerCase() : 'sent',
              type: msg.type || 'text',
              mediaUrl: msg.data?.url || null,
            };
          });
        
        // Sort messages by actual timestamp (oldest first)
        transformedMessages.sort((a, b) => a.sortTimestamp - b.sortTimestamp);
        
        console.log('✅ Transformed messages:', transformedMessages);
        setMessages(transformedMessages);
        
        // Mark messages as read
        await markWatiMessagesAsRead(contact.phone);
      } else if (result.info && result.info.includes('Contact not found')) {
        // Contact not found in Wati
        setContactNotFound(true);
        console.log('⚠️ Contact not found in Wati:', contact.phone);
        
        // Fallback to showing initial remarks if available
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
        // Fallback to showing initial remarks if available
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

  // Auto-scroll to bottom when messages change
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
        // Refresh messages
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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !contact) return;

    setIsSending(true);
    
    try {
      // Send message via Wati API
      const result = await sendWatiMessage(contact.phone, messageInput);
      
      if (result.success) {
        const newMessage = {
          id: Date.now(),
          text: messageInput,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          sortTimestamp: Date.now(),
          status: 'sent',
        };

        setMessages([...messages, newMessage]);
        setMessageInput('');
        setContactNotFound(false);
        
        toast.success('Message sent successfully!');
        
        // Simulate status updates
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
        
        // Refresh contacts list to update last message
        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        console.error('❌ Failed to send message:', result.message);
        
        // Handle contact not found error
        if (result.contactNotFound) {
          setContactNotFound(true);
          toast.error(result.message);
        } else {
          toast.error(result.message || 'Failed to send message. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status) => {
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[600px] bg-[#1A1A1A] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {contact && (
          <>
            {/* Header */}
            <div className="bg-[#2A2A2A] border-b border-[#BBA473]/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2A2A2A]"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{capitalizeWords(contact.name)}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {formatPhoneDisplay(contact.phone)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contact Info Bar */}
            <div className="bg-[#2A2A2A]/50 border-b border-[#BBA473]/10 p-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <span>📧</span>
                    {contact.email}
                  </span>
                )}
                {contact.nationality && (
                  <span className="flex items-center gap-1">
                    <span>🌍</span>
                    {contact.nationality}
                  </span>
                )}
                {contact.agent && contact.agent !== 'Not Assigned' && (
                  <span className="flex items-center gap-1">
                    <span>👤</span>
                    Agent: {capitalizeWords(contact.agent)}
                  </span>
                )}
                {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    contact.kioskLeadStatus === 'Demo' 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : contact.kioskLeadStatus === 'Real'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {contact.kioskLeadStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Not Found Warning */}
            {contactNotFound && (
              <div className="bg-yellow-500/10 border-y border-yellow-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-yellow-400 font-semibold mb-1">Contact Not Found in Wati</h4>
                    <p className="text-xs text-gray-300 mb-3">
                      This contact hasn't been added to your Wati WhatsApp Business account yet. 
                      The contact needs to message your WhatsApp Business number first, or you can add them manually.
                    </p>
                    <button
                      onClick={handleCreateContact}
                      disabled={isSending}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? 'Adding Contact...' : 'Add Contact to Wati'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1A1A1A]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
                  <span className="text-gray-400 mt-3">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center mb-6 animate-pulse-slow">
                      <svg className="w-12 h-12 text-[#BBA473]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
                  <p className="text-gray-400 text-sm max-w-xs mb-6">
                    Start a conversation by sending a message below
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-ping"></div>
                    <span>Ready to chat</span>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black'
                          : 'bg-[#2A2A2A] text-white border border-[#BBA473]/20'
                      } transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-xs ${message.sender === 'user' ? 'text-black/70' : 'text-gray-400'}`}>
                          {message.timestamp}
                        </span>
                        {message.sender === 'user' && (
                          <span className="ml-1">{getMessageStatusIcon(message.status)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-[#2A2A2A] border-t border-[#BBA473]/20 p-4">
              <div className="flex items-center gap-3">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows="1"
                  className="flex-1 px-4 py-3 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white resize-none transition-all duration-300"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className={`p-3 rounded-lg flex-shrink-0 transition-all duration-300 ${
                    messageInput.trim() && !isSending
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:scale-110'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
          animation-fill-mode: both;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
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