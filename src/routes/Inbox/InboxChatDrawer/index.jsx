import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Smile, Phone, Video, MoreVertical, Check, CheckCheck, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const InboxChatDrawer = ({ isOpen, onClose, contact, refreshContacts }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock messages - Replace with actual API call to fetch conversation history
  useEffect(() => {
    if (contact) {
      setIsLoading(true);
      // Simulate loading messages
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            text: contact.remarks || 'Hello! I would like to know more about your services.',
            sender: 'contact',
            timestamp: new Date(contact.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          },
          {
            id: 2,
            text: contact.latestRemarks || 'Thank you for reaching out. How can I help you today?',
            sender: 'user',
            timestamp: new Date(contact.lastMessageTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [contact]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !contact) return;

    setIsSending(true);
    
    try {
      // TODO: Replace with actual API call to send message
      const newMessage = {
        id: messages.length + 1,
        text: messageInput,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };

      setMessages([...messages, newMessage]);
      setMessageInput('');
      
      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);

      toast.success('Message sent successfully!');
      
      // Refresh contacts list to update last message
      if (refreshContacts) {
        refreshContacts();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
                  <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {formatPhoneDisplay(contact.phone)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                  <Phone className="w-5 h-5 text-[#BBA473]" />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                  <Video className="w-5 h-5 text-[#BBA473]" />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                  <MoreVertical className="w-5 h-5 text-[#BBA473]" />
                </button>
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
                    Agent: {contact.agent}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1A1A1A]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
                  <span className="text-gray-400 mt-3">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation!</p>
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
              <div className="flex items-end gap-3">
                <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300 flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-[#BBA473]" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows="1"
                    className="w-full px-4 py-3 pr-12 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white resize-none transition-all duration-300"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button className="absolute right-3 bottom-3 p-1 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                    <Smile className="w-5 h-5 text-[#BBA473]" />
                  </button>
                </div>
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

        /* Auto-resize textarea */
        textarea {
          field-sizing: content;
        }
      `}</style>
    </>
  );
};

export default InboxChatDrawer;