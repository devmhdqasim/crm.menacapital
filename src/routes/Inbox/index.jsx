import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, Search, Paperclip, Smile, Check, CheckCheck, Clock, X, ChevronLeft, User, Image as ImageIcon, FileText, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const WhatsAppMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef(null);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Simulate loading conversations
    setTimeout(() => {
      setConversations([
        {
          id: 1,
          name: 'Ahmed Hassan',
          phone: '+971 50 123 4567',
          lastMessage: 'Thanks for the information!',
          timestamp: '10:30 AM',
          unreadCount: 2,
          avatar: null,
          isOnline: true,
        },
        {
          id: 2,
          name: 'Sarah Al-Mansoori',
          phone: '+971 52 987 6543',
          lastMessage: 'Can we schedule a call?',
          timestamp: 'Yesterday',
          unreadCount: 0,
          avatar: null,
          isOnline: false,
        },
        {
          id: 3,
          name: 'Mohammed Ali',
          phone: '+971 55 456 7890',
          lastMessage: 'Great! I will check it out',
          timestamp: '2 days ago',
          unreadCount: 1,
          avatar: null,
          isOnline: true,
        },
      ]);
      setIsLoaded(true);
    }, 500);
  }, []);

  // Mock messages - Replace with actual API calls
  useEffect(() => {
    if (selectedConversation) {
      // Simulate loading messages
      setMessages([
        {
          id: 1,
          text: 'Hello! I would like to know more about your services.',
          sender: 'contact',
          timestamp: '10:15 AM',
          status: 'read',
        },
        {
          id: 2,
          text: 'Hello Ahmed! Thank you for reaching out. I would be happy to help you with that.',
          sender: 'user',
          timestamp: '10:16 AM',
          status: 'read',
        },
        {
          id: 3,
          text: 'We offer comprehensive CRM solutions tailored to your business needs.',
          sender: 'user',
          timestamp: '10:17 AM',
          status: 'read',
        },
        {
          id: 4,
          text: 'That sounds interesting. Can you provide more details?',
          sender: 'contact',
          timestamp: '10:20 AM',
          status: 'read',
        },
        {
          id: 5,
          text: 'Of course! Our CRM includes lead management, task tracking, team collaboration, and analytics.',
          sender: 'user',
          timestamp: '10:22 AM',
          status: 'delivered',
        },
        {
          id: 6,
          text: 'Thanks for the information!',
          sender: 'contact',
          timestamp: '10:30 AM',
          status: 'read',
        },
      ]);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    setIsSending(true);
    
    try {
      // TODO: Replace with actual API call to send WhatsApp message
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

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone.includes(searchQuery)
  );

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
    return phone.replace(/(\+\d{1,4})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  };

  return (
    <>
      <Toaster position="top-right" />
      
      <div className={`min-h-screen bg-[#1A1A1A] text-white transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#BBA473]/10 to-transparent border-b border-[#BBA473]/20 p-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                  WhatsApp Messages
                </h1>
                <p className="text-gray-400 mt-1">Manage your WhatsApp conversations</p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473]/30 transition-all duration-300 border border-[#BBA473]/30">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473]/30 transition-all duration-300 border border-[#BBA473]/30">
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className={`${showConversationList ? 'w-full md:w-96' : 'hidden md:block md:w-96'} bg-[#2A2A2A] border-r border-[#BBA473]/20 flex flex-col transition-all duration-300`}>
              {/* Search */}
              <div className="p-4 border-b border-[#BBA473]/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                  />
                </div>
              </div>

              {/* Conversation Items */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowConversationList(false);
                      }}
                      className={`p-4 border-b border-[#BBA473]/10 cursor-pointer transition-all duration-300 hover:bg-[#3A3A3A] ${
                        selectedConversation?.id === conv.id ? 'bg-[#3A3A3A] border-l-4 border-l-[#BBA473]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          {conv.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2A2A2A]"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.timestamp}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-[#BBA473] text-black text-xs font-bold rounded-full flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatPhoneDisplay(conv.phone)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${showConversationList ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#1A1A1A]`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-[#2A2A2A] border-b border-[#BBA473]/20 p-4 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowConversationList(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        {selectedConversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2A2A2A]"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{selectedConversation.name}</h3>
                        <p className="text-xs text-gray-400">
                          {selectedConversation.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                        <Phone className="w-5 h-5 text-[#BBA473]" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                        <Video className="w-5 h-5 text-[#BBA473]" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300">
                        <MoreVertical className="w-5 h-5 text-[#BBA473]" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black'
                              : 'bg-[#2A2A2A] text-white border border-[#BBA473]/20'
                          } transition-all duration-300 hover:scale-[1.02]`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
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
                    ))}
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
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center animate-fadeIn">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                      <Phone className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#BBA473] mb-2">Select a Conversation</h3>
                    <p className="text-gray-400">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
          animation-fill-mode: both;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        ::-webkit-scrollbar-thumb {
          background: #BBA473;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #d4bc89;
        }

        /* Auto-resize textarea */
        textarea {
          field-sizing: content;
        }
      `}</style>
    </>
  );
};

export default WhatsAppMessages;