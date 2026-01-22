import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteMultipleNotifications } from '../../services/notificationRESTservice';
import NotificationComponent from '../../components/NotificationComponent';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const tabs = ['All', 'Unread', 'Read'];
  const perPageOptions = [10, 20, 30, 50];

  // Fetch notifications from backend with tab filter
  const fetchNotifications = useCallback(async (filter = 'All') => {
    try {
      setLoading(true);
      const data = await getNotifications(filter);
      
      console.log('🔍 Raw API data:', data);
      
      // Transform backend data to match component format
      const transformedData = data.map(notification => {
        // Extract notification type from notificationData or default to 'general'
        const notificationType = notification.notificationData?.type?.toLowerCase().replace(/\s+/g, '_') || 'general';
        
        return {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notificationType,
          time: notification.createdAt || notification.updatedAt,
          unread: !notification.isRead,
          icon: getIconByType(notificationType),
          // Additional information from API
          topic: notification.topic,
          notificationDataId: notification.notificationData?.id,
          userId: notification.userId?._id,
          userFirstName: notification.userId?.firstName,
          userEmail: notification.userId?.email,
          userPhone: notification.userId?.phoneNumber,
          // Store original data for reference
          originalData: notification
        };
      });
      
      console.log('✅ Transformed notifications:', transformedData);
      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count separately for badge display
  const fetchUnreadCount = useCallback(async () => {
    try {
      const unreadData = await getNotifications('Unread');
      setUnreadCount(unreadData.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications(activeTab);
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle new notifications from Firebase
  const handleNotificationReceived = useCallback((payload) => {
    console.log('New notification received:', payload);
    
    // Refresh notifications list and unread count
    fetchNotifications(activeTab);
    fetchUnreadCount();
  }, [activeTab, fetchNotifications, fetchUnreadCount]);

  const getIconByType = (type) => {
    const icons = {
      // Existing types
      interested: '👍',
      not_interested: '👎',
      hot_lead: '🔥',
      demo: '🎮',
      real: '💼',
      deposit: '💰',
      not_answered: '📞',
      warm_lead: '🌡️',
      assignment: '👤',
      reminder: '🔔',
      commission: '💵',
      follow_up: '⏰',
      verification: '✅',
      cold_lead: '❄️',
      target: '🎯',
      message: '💬',
      system: '⚙️',
      training: '📚',
      withdrawal: '💸',
      report: '📊',
      lead: '👤',
      task: '📋',
      meeting: '📅',
      protocol: '📋',
      
      // New types from your API
      login: '🔐',
      'user-login': '🔐',
      'password_updated': '🔑',
      'sales_crm': '💼',
      'user-lead': '👤',
      general: '🔔'
    };
    return icons[type] || '🔔';
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, unread: false } : n
      ));
      // Refresh unread count
      fetchUnreadCount();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Refresh current view and unread count
      fetchNotifications(activeTab);
      fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotif = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      // Refresh unread count
      fetchUnreadCount();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('No notifications selected');
      return;
    }
    
    try {
      // Use bulk delete API with all selected IDs
      await deleteMultipleNotifications(selectedNotifications);
      setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      // Refresh unread count
      fetchUnreadCount();
      toast.success(`${selectedNotifications.length} notification(s) deleted`);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const toggleSelectNotification = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationTypeColor = (type) => {
    const colors = {
      // Existing colors...
      interested: 'from-green-500/20 to-green-600/20 border-green-500/30',
      not_interested: 'from-red-500/20 to-red-600/20 border-red-500/30',
      hot_lead: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      demo: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      real: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      deposit: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      not_answered: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      warm_lead: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
      assignment: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
      reminder: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
      commission: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
      follow_up: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
      verification: 'from-teal-500/20 to-teal-600/20 border-teal-500/30',
      cold_lead: 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
      target: 'from-violet-500/20 to-violet-600/20 border-violet-500/30',
      message: 'from-sky-500/20 to-sky-600/20 border-sky-500/30',
      system: 'from-zinc-500/20 to-zinc-600/20 border-zinc-500/30',
      training: 'from-lime-500/20 to-lime-600/20 border-lime-500/30',
      withdrawal: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
      report: 'from-fuchsia-500/20 to-fuchsia-600/20 border-fuchsia-500/30',
      lead: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      task: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      meeting: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      protocol: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
      
      // New types from your API
      login: 'from-green-500/20 to-green-600/20 border-green-500/30',
      'user-login': 'from-green-500/20 to-green-600/20 border-green-500/30',
      'password_updated': 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      'sales_crm': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      'user-lead': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      general: 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    };
    return colors[type] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Pagination
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);
  const showingFrom = notifications.length > 0 ? startIndex + 1 : 0;
  const showingTo = Math.min(endIndex, notifications.length);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedNotifications([]);
    // Fetch notifications with the new filter
    fetchNotifications(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BBA473] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Firebase Notification Component */}
      <NotificationComponent onNotificationReceived={handleNotificationReceived} />
      
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 rounded-xl border border-[#BBA473]/30">
                <Bell className="w-8 h-8 text-[#BBA473]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-400 mt-2">
                  Stay updated with your leads and activities
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border border-[#BBA473]/30 hover:border-[#BBA473]/50 transition-all duration-300"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Mark All Read</span>
                </button>
              )}
              
              {selectedNotifications.length > 0 && (
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete Selected ({selectedNotifications.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden border border-[#BBA473]/20 animate-fadeIn">
          {/* Select All Header */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 bg-[#1A1A1A] border-b border-[#BBA473]/30">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#BBA473]/30 bg-[#1A1A1A] text-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/50 cursor-pointer"
                />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Select All ({notifications.length})
                </span>
              </label>

              <div className="text-sm text-gray-400">
                {selectedNotifications.length > 0 && (
                  <span>{selectedNotifications.length} selected</span>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="divide-y divide-[#BBA473]/10">
            {currentNotifications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#BBA473]/10 mb-4">
                  <Bell className="w-8 h-8 text-[#BBA473]/50" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Notifications</h3>
                <p className="text-gray-500">
                  {activeTab === 'Unread' 
                    ? "You're all caught up! No unread notifications." 
                    : "No notifications found."}
                </p>
              </div>
            ) : (
              currentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative px-6 py-4 hover:bg-[#3A3A3A] transition-all duration-300 ${
                    notification.unread ? 'bg-[#BBA473]/5' : ''
                  } ${selectedNotifications.includes(notification.id) ? 'bg-[#BBA473]/10' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelectNotification(notification.id)}
                        className="w-4 h-4 rounded border-[#BBA473]/30 bg-[#1A1A1A] text-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/50 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${getNotificationTypeColor(notification.type)} border flex items-center justify-center text-xl`}>
                      {notification.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold text-sm group-hover:text-[#BBA473] transition-colors">
                              {notification.title}
                            </h3>
                            {notification.unread && (
                              <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {notification.message}
                          </p>
                        </div>

                        {/* Type Badge */}
                        <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold border uppercase ${getNotificationTypeColor(notification.type)}`}>
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#BBA473]/70 text-xs">
                          {formatTime(notification.time)}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {notification.unread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 rounded-lg bg-[#BBA473]/20 hover:bg-[#BBA473]/30 text-[#BBA473] transition-all duration-300"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotif(notification.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all duration-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {notifications.length > 0 && (
            <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-gray-400 text-sm">
                  Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
                  <span className="text-white font-semibold">{showingTo}</span> of{' '}
                  <span className="text-white font-semibold">{notifications.length}</span> notifications
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
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slideDown {
            animation: slideDown 0.2s ease-out;
          }
        `}</style>
      </div>
    </>
  );
};

export default NotificationsPage;