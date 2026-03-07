import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Clock, FileText, Timer, Pin, PinOff, BellOff, Bell, MoreVertical, LayoutGrid, LayoutList, User, Eye } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';
import InboxTemplateManager from '../InboxTemplateManager';
import { useWhatsAppSession } from '../../../hooks/useWhatsAppSession';
import toast from 'react-hot-toast';

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

// Wrapper to check session and apply row styling
const useContactSession = (phone) => {
  const { isSessionOpen } = useWhatsAppSession(phone);
  return isSessionOpen;
};

const ContactRow = ({ contact, handleContactClick, capitalizeWords, formatPhoneDisplay, formatTimeAgo, userRole, isPinned, isMuted, onTogglePin, onToggleMute, onMarkUnread }) => {
  const hasActiveSession = useContactSession(contact.phone);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = React.useRef(null);

  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div
      onClick={() => handleContactClick(contact)}
      className={`p-5 transition-all duration-300 cursor-pointer group relative ${
        isPinned
          ? 'bg-[#BBA473]/[0.03] border-l-2 border-l-[#BBA473]/30 hover:bg-[#BBA473]/[0.08]'
          : hasActiveSession
            ? 'bg-[#BBA473]/[0.04] hover:bg-[#BBA473]/[0.09] border-l-2 border-l-[#BBA473]/40'
            : 'hover:bg-gradient-to-r hover:from-[#2A2A2A] hover:to-[#252525]'
      }`}
    >
      {!hasActiveSession && !isPinned && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#BBA473] to-[#8E7D5A] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}

      <div className="flex items-start gap-4 pl-1">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {contact.avatar ? (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 p-0.5 ${isMuted ? 'opacity-60' : ''}`}>
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
                  {(contact.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 ${isMuted ? 'opacity-60' : ''}`}>
              <span className="text-2xl font-bold text-white">
                {(contact.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {contact.isOnline && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2A2A2A] animate-pulse"></div>
          )}
          {contact.unreadCount > 0 && !isMuted && (
            <div className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-red-500 rounded-full flex items-center justify-center px-1.5 shadow-lg">
              <span className="text-xs font-bold text-white">{contact.unreadCount}</span>
            </div>
          )}
          {contact.unreadCount > 0 && isMuted && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gray-600 rounded-full flex items-center justify-center px-1 shadow-lg">
              <span className="text-[10px] font-bold text-gray-300">{contact.unreadCount}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`text-lg font-semibold truncate group-hover:text-[#BBA473] transition-colors duration-300 ${isMuted ? 'text-gray-400' : 'text-white'}`}>
                {capitalizeWords(contact.name)}
              </h3>
              {isPinned && (
                <Pin className="w-3.5 h-3.5 text-[#BBA473]/60 flex-shrink-0 rotate-45" />
              )}
              {isMuted && (
                <BellOff className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <ContactTimer phone={contact.phone} />
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#1A1A1A] px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{formatTimeAgo(contact.lastMessageTime)}</span>
              </div>

              {/* Actions Menu */}
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-[#BBA473] hover:bg-[#BBA473]/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#2A2A2A] border border-[#BBA473]/20 rounded-xl shadow-2xl z-30 overflow-hidden" style={{ animation: 'scaleIn 0.15s ease-out' }}>
                    <div className="p-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(contact.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                      >
                        {isPinned ? <PinOff className="w-4 h-4 text-[#BBA473]" /> : <Pin className="w-4 h-4 text-[#BBA473]" />}
                        {isPinned ? 'Unpin' : 'Pin to Top'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMute(contact.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                      >
                        {isMuted ? <Bell className="w-4 h-4 text-[#BBA473]" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkUnread?.(contact.id);
                          setShowActions(false);
                          toast.success('Marked as unread', { duration: 1500 });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                      >
                        <Eye className="w-4 h-4 text-[#BBA473]" />
                        Mark as Unread
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className={`text-sm truncate mb-2 leading-relaxed ${isMuted ? 'text-gray-500' : 'text-gray-300'}`}>
            {contact.lastMessage}
          </p>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
              <span className="text-base">📱</span>
              <span className="font-medium">{formatPhoneDisplay(contact.phone)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">{contact.leadAgentName ? capitalizeWords(contact.leadAgentName) : 'Lead Not Assigned'}</span>
            </span>
            {contact.nationality && contact.nationality !== '-' && (
              <span className="flex items-center gap-1.5 text-gray-400 bg-[#1A1A1A] px-2.5 py-1 rounded-md">
                <span className="text-base">🌍</span>
                <span className="font-medium">{contact.nationality}</span>
              </span>
            )}
            {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
              <span className="text-xs"><span className="text-gray-400">Kiosk: </span><span className="text-white font-medium">{contact.kioskLeadStatus}</span></span>
            )}
            {contact.status && contact.status !== '-' && (
              <span className="text-xs"><span className="text-gray-400">Lead: </span><span className="text-white font-medium">{contact.status}</span></span>
            )}
            {contact.lastTaskStatus && contact.lastTaskStatus !== '-' && (
              <span className="text-xs"><span className="text-gray-400">Task: </span><span className="text-white font-medium">{contact.lastTaskStatus}</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ contact, handleContactClick, capitalizeWords, formatPhoneDisplay, formatTimeAgo, userRole, isPinned, isMuted, onTogglePin, onToggleMute, onMarkUnread }) => {
  const hasActiveSession = useContactSession(contact.phone);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = React.useRef(null);

  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div
      onClick={() => handleContactClick(contact)}
      className={`p-4 rounded-xl transition-all duration-300 cursor-pointer group relative border ${
        isPinned
          ? 'bg-[#BBA473]/[0.03] border-[#BBA473]/30 hover:bg-[#BBA473]/[0.08]'
          : hasActiveSession
            ? 'bg-[#BBA473]/[0.04] border-[#BBA473]/40 hover:bg-[#BBA473]/[0.09]'
            : 'bg-[#2A2A2A] border-[#BBA473]/10 hover:border-[#BBA473]/30'
      }`}
    >
      {/* Header: Avatar + Name + Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            {contact.avatar ? (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg p-0.5 ${isMuted ? 'opacity-60' : ''}`}>
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-full h-full rounded-xl object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full rounded-xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {(contact.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg ${isMuted ? 'opacity-60' : ''}`}>
                <span className="text-lg font-bold text-white">
                  {(contact.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {contact.unreadCount > 0 && !isMuted && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-lg">
                <span className="text-[10px] font-bold text-white">{contact.unreadCount}</span>
              </div>
            )}
            {contact.unreadCount > 0 && isMuted && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gray-600 rounded-full flex items-center justify-center px-1 shadow-lg">
                <span className="text-[9px] font-bold text-gray-300">{contact.unreadCount}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-sm font-semibold truncate group-hover:text-[#BBA473] transition-colors ${isMuted ? 'text-gray-400' : 'text-white'}`}>
                {capitalizeWords(contact.name)}
              </h3>
              {isPinned && <Pin className="w-3 h-3 text-[#BBA473]/60 flex-shrink-0 rotate-45" />}
              {isMuted && <BellOff className="w-3 h-3 text-gray-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-400 truncate">{formatPhoneDisplay(contact.phone)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0 ml-2" ref={actionsRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#BBA473] hover:bg-[#BBA473]/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#2A2A2A] border border-[#BBA473]/20 rounded-xl shadow-2xl z-30 overflow-hidden" style={{ animation: 'scaleIn 0.15s ease-out' }}>
              <div className="p-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin(contact.id); setShowActions(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                >
                  {isPinned ? <PinOff className="w-4 h-4 text-[#BBA473]" /> : <Pin className="w-4 h-4 text-[#BBA473]" />}
                  {isPinned ? 'Unpin' : 'Pin to Top'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleMute(contact.id); setShowActions(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                >
                  {isMuted ? <Bell className="w-4 h-4 text-[#BBA473]" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkUnread?.(contact.id);
                    setShowActions(false);
                    toast.success('Marked as unread', { duration: 1500 });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#BBA473]/10 text-gray-300 hover:text-white"
                >
                  <Eye className="w-4 h-4 text-[#BBA473]" />
                  Mark as Unread
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Message */}
      <p className={`text-xs truncate mb-3 leading-relaxed ${isMuted ? 'text-gray-500' : 'text-gray-300'}`}>
        {contact.lastMessage || 'No messages yet'}
      </p>

      {/* Footer: Timer + Time + Agent + Statuses */}
      <div className="flex items-center gap-2 flex-wrap">
        <ContactTimer phone={contact.phone} />
        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-[#1A1A1A] px-2 py-0.5 rounded">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(contact.lastMessageTime)}</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-[#1A1A1A] px-2 py-0.5 rounded">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{contact.leadAgentName ? capitalizeWords(contact.leadAgentName) : 'Lead Not Assigned'}</span>
        </span>
        {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
          <span className="text-[10px]"><span className="text-gray-400">Kiosk: </span><span className="text-white font-medium">{contact.kioskLeadStatus}</span></span>
        )}
        {contact.status && contact.status !== '-' && (
          <span className="text-[10px]"><span className="text-gray-400">Lead: </span><span className="text-white font-medium">{contact.status}</span></span>
        )}
        {contact.lastTaskStatus && contact.lastTaskStatus !== '-' && (
          <span className="text-[10px]"><span className="text-gray-400">Task: </span><span className="text-white font-medium">{contact.lastTaskStatus}</span></span>
        )}
      </div>
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
  onMarkUnread,
}) => {
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('inbox_view_mode') || 'list'; }
    catch { return 'list'; }
  });

  // Pin & Mute state (persisted in localStorage)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inbox_pinned') || '[]');
    } catch { return []; }
  });
  const [mutedIds, setMutedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inbox_muted') || '[]');
    } catch { return []; }
  });

  const handleTogglePin = useCallback((contactId) => {
    setPinnedIds(prev => {
      const next = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      localStorage.setItem('inbox_pinned', JSON.stringify(next));
      toast.success(prev.includes(contactId) ? 'Unpinned' : 'Pinned to top', { duration: 1500 });
      return next;
    });
  }, []);

  const handleToggleMute = useCallback((contactId) => {
    setMutedIds(prev => {
      const next = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      localStorage.setItem('inbox_muted', JSON.stringify(next));
      toast.success(prev.includes(contactId) ? 'Unmuted' : 'Muted', { duration: 1500 });
      return next;
    });
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try { localStorage.setItem('inbox_view_mode', mode); } catch {}
  }, []);

  // Sort: pinned contacts first, then original order
  const sortedContacts = useMemo(() => {
    const pinned = contacts.filter(c => pinnedIds.includes(c.id));
    const rest = contacts.filter(c => !pinnedIds.includes(c.id));
    return [...pinned, ...rest];
  }, [contacts, pinnedIds]);

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
            {/* Layout Toggle */}
            <div className="flex items-center bg-[#2A2A2A] rounded-lg p-1 border border-[#BBA473]/20">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-gray-400 hover:text-white'}`}
                title="List view"
              >
                <LayoutList className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange('cards')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'cards' ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-gray-400 hover:text-white'}`}
                title="Card view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

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
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {sortedContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                handleContactClick={handleContactClick}
                capitalizeWords={capitalizeWords}
                formatPhoneDisplay={formatPhoneDisplay}
                formatTimeAgo={formatTimeAgo}
                userRole={userRole}
                isPinned={pinnedIds.includes(contact.id)}
                isMuted={mutedIds.includes(contact.id)}
                onTogglePin={handleTogglePin}
                onToggleMute={handleToggleMute}
                onMarkUnread={onMarkUnread}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#BBA473]/10">
            {/* Pinned section divider */}
            {sortedContacts.some(c => pinnedIds.includes(c.id)) && sortedContacts.some(c => !pinnedIds.includes(c.id)) && (
              <div className="sr-only">Pinned contacts above</div>
            )}
            {sortedContacts.map((contact, idx) => {
              const isPinned = pinnedIds.includes(contact.id);
              const nextIsPinned = sortedContacts[idx + 1] ? pinnedIds.includes(sortedContacts[idx + 1].id) : true;
              return (
                <React.Fragment key={contact.id}>
                  <ContactRow
                    contact={contact}
                    handleContactClick={handleContactClick}
                    capitalizeWords={capitalizeWords}
                    formatPhoneDisplay={formatPhoneDisplay}
                    formatTimeAgo={formatTimeAgo}
                    userRole={userRole}
                    isPinned={isPinned}
                    isMuted={mutedIds.includes(contact.id)}
                    onTogglePin={handleTogglePin}
                    onToggleMute={handleToggleMute}
                    onMarkUnread={onMarkUnread}
                  />
                  {/* Visual divider between pinned and unpinned sections */}
                  {isPinned && !nextIsPinned && (
                    <div className="flex items-center gap-3 px-6 py-1.5 bg-[#1A1A1A]">
                      <div className="flex-1 h-px bg-[#BBA473]/15"></div>
                      <span className="text-[10px] text-[#BBA473]/40 font-medium uppercase tracking-widest flex items-center gap-1.5">
                        <Pin className="w-2.5 h-2.5 rotate-45" /> Pinned
                      </span>
                      <div className="flex-1 h-px bg-[#BBA473]/15"></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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