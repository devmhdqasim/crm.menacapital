import React from 'react';
import { X, Search, Bell, Info, Phone, ChevronLeft } from 'lucide-react';

const ChatHeader = ({
  contact,
  isConnected,
  showMessageSearch,
  setShowMessageSearch,
  setShowReminderModal,
  showProfileSidebar,
  setShowProfileSidebar,
  onClose,
  messageSearchQuery,
  setMessageSearchQuery,
  searchResults,
  currentSearchIndex,
  activeTab,
  handleMessageSearch,
  navigateSearch,
}) => {
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  return (
    <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 shadow-lg flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0 group">
            {contact.avatar ? (
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] shadow-lg ring-2 ring-[#BBA473]/20 transition-transform duration-300 group-hover:scale-110">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-full h-full rounded-full object-cover border-2 border-[#1A1A1A]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg ring-2 ring-[#BBA473]/20 transition-transform duration-300 group-hover:scale-110">
                <span className="text-2xl font-bold text-white">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
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
        
        {/* Header Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowMessageSearch(!showMessageSearch)}
            className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              showMessageSearch 
                ? 'bg-[#BBA473] text-black' 
                : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
            }`}
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowReminderModal(true)}
            className="p-2.5 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300 hover:scale-110"
            title="Set Reminder"
          >
            <Bell className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowProfileSidebar(!showProfileSidebar)}
            className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              showProfileSidebar 
                ? 'bg-[#BBA473] text-black' 
                : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
            }`}
            title="Contact Info"
          >
            <Info className="w-5 h-5" />
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

      {/* Message Search Bar */}
      {showMessageSearch && activeTab === 'chat' && handleMessageSearch && (
        <div className="mt-4 animate-slideDown">
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg p-2 border border-[#BBA473]/30">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search in messages..."
              value={messageSearchQuery}
              onChange={(e) => handleMessageSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
            />
            {searchResults && searchResults.length > 0 && (
              <>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearch('prev')}
                  className="p-1 rounded bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateSearch('next')}
                  className="p-1 rounded bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setShowMessageSearch(false);
                setMessageSearchQuery('');
              }}
              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;