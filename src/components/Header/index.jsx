import { useState, useEffect } from "react";
import { Menu, Bell, LogOut, Key, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from '../../services/authService';
import { getNotifications, markAllNotificationsAsRead } from '../../services/notificationService';
import toast from 'react-hot-toast';

export default function Header() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDetails, setUserDetails] = useState('');
  const [branchDetails, setBranchDetails] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  };

  useEffect(() => {
    const userInfo = getUserInfo();
    setUserDetails(userInfo?.firstName?.en ?? userInfo?.email);
    setBranchDetails(userInfo?.branchName ?? userInfo?.branchUsername);
    setUserRole(userInfo?.roleName);
  }, []);

  // Fetch notifications from backend when dropdown opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  // Refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (notificationsOpen) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [notificationsOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      
      // Transform backend data to match component format
      const transformedData = data.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.body || notification.message,
        type: notification.type || 'general',
        time: formatTime(notification.timestamp || notification.createdAt),
        unread: !notification.read,
        icon: getIconByType(notification.type),
        priority: notification.priority || 'medium'
      }));
      
      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Keep existing notifications on error
    } finally {
      setLoading(false);
    }
  };

  const getIconByType = (type) => {
    const icons = {
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
      meeting: '📅'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileOpen && !event.target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
      if (notificationsOpen && !event.target.closest('.notifications-dropdown')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen, notificationsOpen]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationTypeColor = (type) => {
    const colors = {
      interested: 'from-green-500/20 to-green-600/20 border-green-500/30',
      not_interested: 'from-red-500/20 to-red-600/20 border-red-500/30',
      hot_lead: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      demo: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      real: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      deposit: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      not_answered: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      warm_lead: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
      lead: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      task: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      meeting: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
    };
    return colors[type] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-[#1A1A1A] border-b border-[#BBA473]/20 relative z-50">
      {/* Mobile Menu Button */}
      <button className="flex items-center space-x-2 text-white font-medium md:block lg:hidden hover:text-[#BBA473] transition-colors duration-300">
        <Menu className="w-6 h-6" />
        <span>Menu</span>
      </button>

      {/* Right Section */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Notifications */}
        <div className="relative notifications-dropdown">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50 group"
          >
            <Bell className="w-5 h-5 text-gray-300 group-hover:text-[#BBA473] transition-colors duration-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 overflow-hidden animate-slideDown z-50">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#BBA473]/10 to-transparent border-b border-[#BBA473]/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#BBA473]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-[#BBA473] hover:text-[#d4bc89] transition-colors duration-300 font-medium"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BBA473] mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`group relative px-4 py-3 hover:bg-[#3A3A3A] transition-all duration-300 cursor-pointer ${
                        notification.unread ? 'bg-[#BBA473]/5' : ''
                      } ${index !== Math.min(notifications.length, 8) - 1 ? 'border-b border-[#BBA473]/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getNotificationTypeColor(notification.type)} border flex items-center justify-center text-lg`}>
                          {notification.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-white font-semibold text-sm group-hover:text-[#BBA473] transition-colors duration-300">
                              {notification.title}
                            </h4>
                            {notification.unread && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#BBA473] mt-1"></div>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-[#BBA473]/70 text-xs mt-1 block">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-[#1A1A1A] border-t border-[#BBA473]/30">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-[#BBA473] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all duration-300"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative profile-dropdown">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="hover:opacity-90 transition-all duration-300 flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-[#2A2A2A]"
          >
            <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] rounded-full cursor-pointer shadow-lg">
              <span className="font-bold text-black">
                {userDetails ? userDetails.charAt(0).toUpperCase() : 'M'}
                {branchDetails ? branchDetails.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <h4 className="text-gray-50 font-semibold text-sm">
                {userDetails ?? branchDetails ?? 'Anonymous'}
              </h4>
              {branchDetails ? '' : (
                <p className="text-gray-400 text-xs">{userRole ?? 'Anonymous'}</p>
              )}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 overflow-hidden animate-slideDown z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                    console.log("Update Password clicked");
                    setProfileOpen(false);
                    navigate('/update-password');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#3A3A3A] transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-[#BBA473]/20 group-hover:bg-[#BBA473]/30 transition-colors duration-300">
                    <Key className="w-4 h-4 text-[#BBA473]" />
                  </div>
                  <span className="text-sm font-medium">Update Password</span>
                </button>
                
                <div className="mx-4 my-1 border-t border-[#BBA473]/20"></div>
                
                <button
                  onClick={() => {
                    logoutUser();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-red-500/20 transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-red-400 group-hover:text-red-300">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
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

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #BBA473;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4bc89;
        }
      `}</style>
    </nav>
  );
}