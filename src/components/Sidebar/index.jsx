import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  User,
  Users,
  TrendingUp,
  ShieldCheck,
  Settings,
  LogOut,
  GitBranch,
  CheckSquare,
  Calendar1,
  ChevronRight,
  MessageCircle,
  X,
  Menu,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { logoutUser } from '../../services/authService';
import { filterMenuByRole, SIDEBAR_MENU_CONFIG, ROUTES } from '@/config/roleConfig';
import { useWebSocket } from '../../context/WebSocketContext';
import logo from '@/assets/images/logo.svg';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Unread message count from WebSocket
  const { unreadCount } = useWebSocket();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Icon mapping
  const iconMap = {
    Home,
    User,
    Users,
    TrendingUp,
    GitBranch,
    ShieldCheck,
    Settings,
    CheckSquare,
    Calendar1,
    MessageCircle,
  };

  // Helper function to check if a link is active
  const isLinkActive = (href) => {
    return location.pathname === href;
  };

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    console.log('🔍 Sidebar Debug - User Role:', userRole);

    if (!userRole) {
      console.log('⚠️ No user role found!');
      return [];
    }

    const menuItems = SIDEBAR_MENU_CONFIG.map(item => ({
      label: item.label,
      icon: iconMap[item.icon],
      href: item.route,
      route: item.route,
    }));

    console.log('📋 All menu items:', menuItems);

    const filtered = filterMenuByRole(menuItems, userRole);

    console.log('✅ Filtered menu items:', filtered);
    console.log('📊 Filtered count:', filtered.length);

    return filtered;
  }, [userRole]);

  const toggleMenu = (menuName) => {
    if (isCollapsed) return;
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
    setOpenMenus({});

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const bottomMenuItems = [
    {
      label: 'Settings',
      icon: Settings,
      href: '/update-password',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden animate-fadeIn"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-[#0A0A0A] border border-[#BBA473]/20 text-[#BBA473] rounded-lg shadow-lg hover:bg-[#161616] transition-all duration-300 active:scale-95"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#0A0A0A]/95 backdrop-blur-xl text-gray-300 p-3 border-r border-[#BBA473]/10
        overflow-y-auto overflow-x-hidden flex flex-col h-screen transform transition-all duration-500 ease-in-out z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isLoaded ? 'opacity-100' : 'opacity-0'}
        sidebar-custom-scrollbar shadow-2xl`}
      >
        {/* Subtle right edge glow */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[#BBA473]/20 via-transparent to-[#BBA473]/20 pointer-events-none"></div>
        {/* Close Button (Mobile Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 lg:hidden p-2 hover:bg-[#BBA473]/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-90"
        >
          <X className="text-[#BBA473]" size={20} />
        </button>

        {/* Logo with Enhanced Animation */}
        <div className={`mb-8 transition-all duration-700 delay-150 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} group cursor-pointer overflow-hidden transition-all duration-500`}>
            <div className="relative w-10 h-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 flex-shrink-0">
              <img
                src={logo}
                alt="SaveInGold Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(187,164,115,0.5)]"
              />
            </div>
            <div className={`flex items-baseline overflow-hidden whitespace-nowrap transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
              <span className="text-xl font-bold text-white transition-all duration-300 group-hover:text-[#BBA473] tracking-wide">
                Save In GOLD
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow">
          <ul className="space-y-2">
            {filteredMenuItems.map((item, index) => (
              <li
                key={index}
                className={`space-y-1 transition-all duration-700 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
                style={{ transitionDelay: `${(index + 1) * 50}ms` }}
              >
                {item.submenu ? (
                  <>
                    {/* Menu with Submenu */}
                    <button
                      onClick={() => !isCollapsed && toggleMenu(item.label)}
                      className={`w-full flex justify-between items-center py-3 px-4 rounded-lg transition-all duration-300 active:scale-95 group relative
                        ${isCollapsed ? 'justify-center' : ''}
                        hover:bg-[#BBA473]/10 hover:text-[#BBA473]`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <item.icon
                          size={20}
                          className={`flex-shrink-0 transition-colors duration-300 ${openMenus[item.label] ? 'text-[#BBA473]' : ''}`}
                        />
                        <span className={`font-medium transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                          {item.label}
                        </span>
                      </div>
                      {!isCollapsed && (
                        <ChevronRight
                          size={18}
                          className={`transition-all duration-300 relative z-10 ${openMenus[item.label] ? 'rotate-90 text-[#BBA473]' : ''}`}
                        />
                      )}
                    </button>

                    {/* Submenu with Smooth Animation */}
                    {!isCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${openMenus[item.label]
                          ? 'max-h-96 opacity-100 mt-1'
                          : 'max-h-0 opacity-0'
                          }`}
                      >
                        <ul className="pl-4 space-y-1 py-1">
                          {item.submenu.map((subItem, subIndex) => (
                            <li
                              key={subIndex}
                              className="animate-slideIn"
                              style={{ animationDelay: `${subIndex * 50}ms` }}
                            >
                              <a
                                href={subItem.href}
                                className={`block py-2 px-4 rounded-lg transition-all duration-300 active:scale-95 group relative border border-transparent
                                  ${isLinkActive(subItem.href)
                                    ? 'bg-[#BBA473]/20 text-[#BBA473] border-[#BBA473]/30 shadow-[0_0_15px_rgba(187,164,115,0.1)]'
                                    : 'hover:bg-[#BBA473]/5 hover:text-[#BBA473]'}`}
                              >
                                <div className="flex items-center gap-3 relative z-10">
                                  <subItem.icon size={18} />
                                  <span className="font-medium">{subItem.label}</span>
                                </div>
                                {/* Active Indicator */}
                                {isLinkActive(subItem.href) && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BBA473] rounded-r-full animate-pulse shadow-[0_0_10px_#BBA473]"></div>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  // Regular Menu Item
                  <a
                    href={item.href}
                    className={`flex items-center py-3 px-4 rounded-lg transition-all duration-300 active:scale-95 group relative border border-transparent
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isLinkActive(item.href)
                        ? 'bg-[#BBA473]/20 text-[#BBA473] border-[#BBA473]/30 shadow-[0_0_15px_rgba(187,164,115,0.1)]'
                        : 'hover:bg-[#BBA473]/10 hover:text-[#BBA473]'}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="relative flex-shrink-0">
                        <item.icon
                          size={20}
                          className="flex-shrink-0"
                        />
                        {/* Unread badge on icon (visible when collapsed) */}
                        {/* {item.label === 'Inbox' && isCollapsed && (
                          <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 text-[10px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.4),0_0_6px_rgba(187,164,115,0.2)] ${
                            unreadCount > 0
                              ? 'bg-[#BBA473] text-[#1A1A1A] border border-[#BBA473]'
                              : 'bg-[#2A2A2A] text-[#BBA473] border border-[#BBA473]/50'
                          }`}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )} */}
                      </div>
                      <span className={`font-medium transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Unread badge (visible when expanded) */}
                    {/* {item.label === 'Inbox' && !isCollapsed && (
                      <span className={`ml-auto min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1.5 text-[11px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.4),0_0_6px_rgba(187,164,115,0.2)] relative z-10 ${
                        unreadCount > 0
                          ? 'bg-[#BBA473] text-[#1A1A1A] border border-[#BBA473]'
                          : 'bg-[#2A2A2A] text-[#BBA473] border border-[#BBA473]/50'
                      }`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )} */}

                    {/* Active Indicator */}
                    {isLinkActive(item.href) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BBA473] rounded-r-full animate-pulse shadow-[0_0_10px_#BBA473]"></div>
                    )}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Menu Items (Settings & Logout) with Enhanced Styling */}
        <div className="mt-auto pt-4 border-t border-[#BBA473]/10 space-y-2">
          {bottomMenuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center py-3 px-4 rounded-lg transition-all duration-500 active:scale-95 group relative border border-transparent
                ${isCollapsed ? 'justify-center' : ''}
                ${isLinkActive(item.href)
                  ? 'bg-[#BBA473]/20 text-[#BBA473] border-[#BBA473]/30'
                  : 'hover:bg-[#BBA473]/10 hover:text-[#BBA473]'}
                ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${(filteredMenuItems.length + index + 1) * 50}ms` }}
              title={isCollapsed ? item.label : ''}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`font-medium transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </div>
            </a>
          ))}

          {/* Logout Button */}
          <div
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
            className={`flex items-center py-3 px-4 rounded-lg transition-all duration-500 active:scale-95 group cursor-pointer relative
              ${isCollapsed ? 'justify-center' : ''}
              hover:bg-red-500/10 hover:text-red-400
              ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: `${(filteredMenuItems.length + bottomMenuItems.length + 1) * 50}ms` }}
            title={isCollapsed ? 'Logout' : ''}
          >
            <div className="flex items-center gap-3 relative z-10">
              <LogOut size={20} className="flex-shrink-0" />
              <span className={`font-medium transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                Logout
              </span>
            </div>
          </div>

          {/* Enhanced Collapse Button */}
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} py-3 px-4
              bg-gradient-to-r from-[#BBA473]/10 to-[#8E7D5A]/10 border border-[#BBA473]/20
              text-[#BBA473] rounded-lg transition-all duration-500 active:scale-95
              group cursor-pointer relative overflow-hidden hover:border-[#BBA473]/40
              ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: `${(filteredMenuItems.length + bottomMenuItems.length + 2) * 50}ms` }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="flex items-center gap-3 relative z-10">
              {isCollapsed ? (
                <ArrowRight
                  size={20}
                  className="transition-all duration-500"
                />
              ) : (
                <>
                  <ArrowLeft
                    size={20}
                    className="transition-all duration-500"
                  />
                  <span className="text-sm font-semibold transition-all duration-500">
                    Collapse
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      </aside>

      <style jsx>{`
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

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
        }

        /* Custom Scrollbar */
        .sidebar-custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 10, 10, 0.5);
        }

        .sidebar-custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(187, 164, 115, 0.3);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .sidebar-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(187, 164, 115, 0.6);
        }

        /* Smooth transitions for collapse */
        aside * {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
};

export default Sidebar;