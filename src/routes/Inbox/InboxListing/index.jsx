import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Clock, FileText, Timer } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';
import InboxTemplateManager from '../InboxTemplateManager';
import { useWhatsAppSession } from '../../../hooks/useWhatsAppSession';

const ContactTimer = ({ phone }) => {
  const { isSessionOpen, formattedTimeLeft, colors } = useWhatsAppSession(phone);

  if (!isSessionOpen || !formattedTimeLeft) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} backdrop-blur-sm`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colors.dot}`}></span>
      </span>
      <Timer className={`w-3 h-3 ${colors.text}`} />
      <span className={`text-xs font-mono font-bold ${colors.text} tabular-nums`}>
        {formattedTimeLeft}
      </span>
    </div>
  );
};

const InboxListing = ({
  contacts,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalContacts,
  loading,
  isLoaded,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleContactClick,
  userRole,
  agents,
  selectedAgentFilter,
  setSelectedAgentFilter,
}) => {
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const perPageOptions = [10, 20, 30, 50, 100];

  const totalPages = Math.ceil(totalContacts / itemsPerPage);
  const showingFrom = totalContacts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min((currentPage - 1) * itemsPerPage + contacts.length, totalContacts);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handlePerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setShowPerPageDropdown(false);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }
    return pages;
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="mb-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
              Inbox
            </h1>
            <p className="text-gray-400 mt-2">
              {userRole === 'Sales Manager'
                ? 'Manage conversations with all leads'
                : 'Manage conversations with your assigned leads'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateManager(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Manage Templates
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {userRole === 'Sales Manager' && (
            <div className="flex items-center gap-4 ml-auto">
              <label className="text-[#E8D5A3] font-medium text-sm whitespace-nowrap">
                Filter by Agent:
              </label>
              <div className="relative w-full max-w-xs min-w-64">
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
                >
                  <option value="">All Agents</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 bg-[#1a1a1a] transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            maxDate={new Date()}
            isClearable={true}
          />
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, nationality, residency, or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
          />
        </div>
      </div>

      {/* Contacts Grid/List */}
      <div className="bg-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden border border-[#BBA473]/20 animate-fadeIn">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
              <span>Loading contacts...</span>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No contacts found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="divide-y divide-[#BBA473]/10">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="p-5 hover:bg-gradient-to-r hover:from-[#2A2A2A] hover:to-[#252525] transition-all duration-300 cursor-pointer group relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#BBA473] to-[#8E7D5A] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="flex items-start gap-4 pl-1">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {contact.avatar ? (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 p-0.5">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full rounded-2xl object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full rounded-2xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                        <span className="text-2xl font-bold text-white">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2A2A2A] animate-pulse"></div>
                    )}
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 rounded-full flex items-center justify-center px-1.5 shadow-lg">
                        <span className="text-xs font-bold text-white">{contact.unreadCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#BBA473] transition-colors duration-300">
                        {capitalizeWords(contact.name)}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {/* ✅ Real Firebase timer - only shows if session isOpen */}
                        <ContactTimer phone={contact.phone} />
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#1A1A1A] px-2 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">{formatTimeAgo(contact.lastMessageTime)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 truncate mb-2 leading-relaxed">
                      {contact.lastMessage}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
                        <span className="text-base">📱</span>
                        <span className="font-medium">{formatPhoneDisplay(contact.phone)}</span>
                      </span>
                      {userRole === 'Sales Manager' && contact.agent !== 'Not Assigned' && (
                        <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
                          <span className="text-base">👤</span>
                          <span className="font-medium">{capitalizeWords(contact.agent)}</span>
                        </span>
                      )}
                      {contact.nationality && (
                        <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
                          <span className="text-base">🌍</span>
                          <span className="font-medium">{contact.nationality}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border shadow-sm ${contact.kioskLeadStatus === 'Demo'
                          ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-yellow-500/30'
                          : contact.kioskLeadStatus === 'Real'
                            ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border-green-500/30'
                            : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30'
                        }`}>
                        {contact.kioskLeadStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-gray-400 text-sm">
              Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
              <span className="text-white font-semibold">{showingTo}</span> of{' '}
              <span className="text-white font-semibold">{totalContacts}</span> contacts
            </div>
            <div className="relative">
              <button
                onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30"
              >
                <span className="text-sm">{itemsPerPage} per page</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPerPageDropdown && (
                <div className="absolute bottom-full mb-2 right-0 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg shadow-xl z-10 min-w-[150px]">
                  {perPageOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => handlePerPageChange(option)}
                      className={`w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors first:rounded-t-lg last:rounded-b-lg ${option === itemsPerPage ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-white'
                        }`}
                    >
                      {option} per page
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {currentPage > 2 && totalPages > 3 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                >
                  1
                </button>
                {currentPage > 3 && <span className="text-gray-400">...</span>}
              </>
            )}

            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 border ${currentPage === page
                    ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black border-[#BBA473] font-semibold shadow-lg'
                    : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] border-[#BBA473]/30 hover:border-[#BBA473]'
                  }`}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages - 1 && totalPages > 3 && (
              <>
                {currentPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <InboxTemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        body{
          background-color: #000;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InboxListing;