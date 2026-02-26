import { useState, useEffect, useMemo } from "react";
import { Menu, Bell, LogOut, Key, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from '../../services/authService';
import { getNotifications, markAllNotificationsAsRead } from '../../services/notificationRESTservice';
import toast from 'react-hot-toast';
import { useFirebaseNotifications } from '../../context/FirebaseNotificationContext';

// Deterministic dummy avatars based on user initials
const DUMMY_AVATARS = [
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=44',
  'https://i.pravatar.cc/150?img=53',
  'https://i.pravatar.cc/150?img=60',
  'https://i.pravatar.cc/150?img=68',
  'https://i.pravatar.cc/150?img=36',
];

function getAvatarForUser(name) {
  if (!name) return DUMMY_AVATARS[0];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DUMMY_AVATARS[hash % DUMMY_AVATARS.length];
}

export default function Header() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userDetails, setUserDetails] = useState('');
  const [branchDetails, setBranchDetails] = useState('');
  const [restNotifications, setRestNotifications] = useState([]);
  const [restUnreadCount, setRestUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    firebaseNotifications,
    unreadFirebaseCount,
    markAllFirebaseAsRead,
    isFirebaseNotificationRead,
  } = useFirebaseNotifications();

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

  // Fetch unread count on component mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
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

  // Fetch only unread count (lightweight)
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications('Unread');
      setRestUnreadCount(data.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      
      console.log('🔍 Raw API data in Header:', data);
      
      // Transform backend data to match component format
      const transformedData = data.map(notification => {
        // Extract notification type from notificationData or default to 'general'
        const notificationType = notification.notificationData?.type?.toLowerCase().replace(/\s+/g, '_') || 'general';
        
        return {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notificationType,
          time: formatTime(notification.createdAt || notification.updatedAt),
          unread: !notification.isRead, // Note: API uses 'isRead', not 'read'
          icon: getIconByType(notificationType),
          priority: notification.priority || 'medium',
          // Store original data for reference
          originalData: notification
        };
      });
      
      setRestNotifications(transformedData);

      const newUnreadCount = transformedData.filter(n => n.unread).length;
      setRestUnreadCount(newUnreadCount);
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
      meeting: '📅',
      
      // New types from your API
      login: '🔐',
      'password_updated': '🔑',
      'sales_crm': '💼',
      general: '🔔'
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

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setRestNotifications(restNotifications.map(n => ({ ...n, unread: false })));
      setRestUnreadCount(0);
      markAllFirebaseAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Merge REST + Firebase notifications, sorted by time descending
  const notifications = useMemo(() => {
    const firebaseMapped = firebaseNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      time: formatTime(n.createdAt),
      unread: !isFirebaseNotificationRead(n.id),
      icon: getIconByType(n.type),
      priority: n.priority,
      source: 'firebase',
      createdAt: n.createdAt,
    }));
    const restMapped = restNotifications.map((n) => ({
      ...n,
      source: 'rest',
      createdAt: n.originalData?.createdAt ? new Date(n.originalData.createdAt).getTime() : 0,
    }));
    return [...firebaseMapped, ...restMapped].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [firebaseNotifications, restNotifications, isFirebaseNotificationRead]);

  const unreadCount = restUnreadCount + unreadFirebaseCount;

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
      meeting: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      
      // New types from your API
      login: 'from-green-500/20 to-green-600/20 border-green-500/30',
      'password_updated': 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      'sales_crm': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      general: 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    };
    return colors[type] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  return (
    <nav className="flex items-center justify-between py-3 px-6 bg-[#0C0C0C]/95 backdrop-blur-xl border-b border-[#BBA473]/10 sticky top-0 z-40">
      {/* Subtle top shine line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#BBA473]/20 to-transparent"></div>

      {/* Mobile Menu Button */}
      <button className="flex items-center space-x-2 text-white font-medium md:block lg:hidden hover:text-[#BBA473] transition-colors duration-300">
        <Menu className="w-6 h-6" />
        <span>Menu</span>
      </button>

      {/* Right Section */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Notifications */}
        <div className="relative notifications-dropdown">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2.5 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] transition-all duration-300 border border-[#BBA473]/10 hover:border-[#BBA473]/30 group"
          >
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-[#BBA473] transition-colors duration-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black text-[8px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-[#141414] rounded-xl shadow-2xl border border-[#BBA473]/15 overflow-hidden animate-slideDown z-50">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#BBA473]/8 to-transparent border-b border-[#BBA473]/15">
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
                      className={`group relative px-4 py-3 hover:bg-[#1E1E1E] transition-all duration-300 cursor-pointer ${
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
              <div className="p-3 bg-[#0C0C0C] border-t border-[#BBA473]/15">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-[#BBA473] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-all duration-300"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[#BBA473]/10"></div>

        {/* Profile Dropdown */}
        <div className="relative profile-dropdown">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="transition-all duration-300 flex items-center space-x-3 cursor-pointer p-1.5 rounded-xl hover:bg-[#161616] group"
          >
            {/* Avatar with photo + hover initials */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#BBA473]/20 group-hover:ring-[#BBA473]/50 transition-all duration-300">
              {/* Dummy profile photo - default visible */}
              <img
                src={getAvatarForUser(userDetails || branchDetails)}
                alt="Profile"
                className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {/* Initials overlay - visible on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="font-bold text-black text-sm">
                  {userDetails ? userDetails.charAt(0).toUpperCase() : 'M'}
                  {branchDetails ? branchDetails.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            </div>
            <div className="text-left hidden lg:block">
              <h4 className="text-gray-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                {userDetails ?? branchDetails ?? 'Anonymous'}
              </h4>
              {branchDetails ? '' : (
                <p className="text-gray-500 text-[11px]">{userRole ?? 'Anonymous'}</p>
              )}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-[#141414] rounded-xl shadow-2xl border border-[#BBA473]/15 overflow-hidden animate-slideDown z-50">
              {/* Profile info header */}

              <div className="py-1.5">
                <button
                  onClick={() => {
                    console.log("Update Password clicked");
                    setProfileOpen(false);
                    navigate('/update-password');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white hover:bg-[#1E1E1E] transition-all duration-300 group"
                >
                  <div className="p-1.5 rounded-lg bg-[#BBA473]/10 group-hover:bg-[#BBA473]/20 transition-colors duration-300">
                    <Key className="w-4 h-4 text-[#BBA473]" />
                  </div>
                  <span className="text-sm font-medium">Update Password</span>
                </button>

                <div className="mx-4 my-1 border-t border-[#BBA473]/10"></div>

                <button
                  onClick={() => {
                    logoutUser();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white hover:bg-red-500/10 transition-all duration-300 group"
                >
                  <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors duration-300">
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
          background: #0C0C0C;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(187, 164, 115, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(187, 164, 115, 0.5);
        }
      `}</style>
    </nav>
  );
}