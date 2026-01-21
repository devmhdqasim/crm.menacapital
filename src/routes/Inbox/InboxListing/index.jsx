import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Clock } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';

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

          <div className="flex flex-col gap-3">
            {/* Agent Filter - Only show for Sales Manager */}
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

            {/* Date Range Filter */}
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
                className="p-4 hover:bg-[#3A3A3A] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2A2A2A]"></div>
                    )}
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{contact.unreadCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate group-hover:text-[#BBA473] transition-colors duration-300">
                        {capitalizeWords(contact.name)}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(contact.lastMessageTime)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 truncate mb-1">{contact.lastMessage}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>📱</span>
                        {formatPhoneDisplay(contact.phone)}
                      </span>
                      {userRole === 'Sales Manager' && contact.agent !== 'Not Assigned' && (
                        <span className="flex items-center gap-1">
                          <span>👤</span>
                          {capitalizeWords(contact.agent)}
                        </span>
                      )}
                      {contact.nationality && (
                        <span>{contact.nationality}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                        contact.kioskLeadStatus === 'Demo' 
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : contact.kioskLeadStatus === 'Real'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
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
                      className={`w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        option === itemsPerPage ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-white'
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
                className={`px-4 py-2 rounded-lg transition-all duration-300 border ${
                  currentPage === page
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