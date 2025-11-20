import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  User,
  Users,  // NEW: Icon for Sales Managers
  TrendingUp,
  ShieldCheck,
  Settings,
  LogOut,
  GitBranch,
  CheckSquare,  // NEW: Icon for Tasks
  ChevronRight,
  X,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { logoutUser } from '../../services/authService';
import { filterMenuByRole, SIDEBAR_MENU_CONFIG, ROUTES } from '@/config/roleConfig';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Icon mapping - Added new icons for Tasks and Sales Managers
  const iconMap = {
    Home,
    User,
    Users,  // NEW: For Sales Managers
    TrendingUp,
    GitBranch,
    ShieldCheck,
    Settings,
    CheckSquare,  // NEW: For Tasks
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
    
    // Convert config to menu items format
    const menuItems = SIDEBAR_MENU_CONFIG.map(item => ({
      label: item.label,
      icon: iconMap[item.icon],
      href: item.route,
      route: item.route, // ⭐ IMPORTANT: Add route property for filtering
    }));
    
    console.log('📋 All menu items:', menuItems);
    
    const filtered = filterMenuByRole(menuItems, userRole);
    
    console.log('✅ Filtered menu items:', filtered);
    console.log('📊 Filtered count:', filtered.length);
    
    return filtered;
  }, [userRole]);

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setOpenMenus({});
  };

  const bottomMenuItems = [
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-all duration-300 overflow-hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-[#BBA473] text-black rounded-md shadow-lg hover:bg-[#d4bc89] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#BBA473' }}
        className={`fixed inset-y-0 left-0 bg-[#BBA473] text-black p-3 border-r border-[#8E7D5A]/30
        overflow-y-auto flex flex-col h-screen transform transition-all duration-500 ease-in-out z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-1 -right-0.5 lg:hidden p-2 hover:bg-[#685A3D] rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <X className="text-white" size={24} />
        </button>

        {/* Logo with Animation */}
        <div className={`mb-12 transition-all duration-700 delay-150 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <div className="absolute inset-0 bg-[#a38239] rounded transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#BBA473]/50"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 bg-[#1A1A1A] rounded-tl-lg transition-all duration-300"></div>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-medium text-white transition-all duration-300 group-hover:text-[#E8D5A3]">Save In GOLD</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow">
          <ul className="space-y-1">
            {filteredMenuItems.map((item, index) => (
              <li
                key={index}
                className={`space-y-1 transition-all duration-700 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
                  }`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                {item.submenu ? (
                  <>
                    {/* Menu with Submenu */}
                    <button
                      onClick={() => !isCollapsed && toggleMenu(item.label)}
                      className="w-full flex justify-between cursor-pointer items-center py-2 px-4 rounded transition-all duration-300
                        hover:bg-gradient-to-r hover:from-[#685A3D] hover:to-[#8E7D5A] hover:text-white
                        hover:shadow-md group"
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon size={18} className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronRight
                          size={16}
                          className={`transition-all duration-300 ${openMenus[item.label] ? 'rotate-90' : ''
                            } group-hover:scale-110`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${openMenus[item.label]
                            ? 'max-h-96 opacity-100'
                            : 'max-h-0 opacity-0'
                          }`}
                      >
                        <ul className="pl-6 space-y-1 py-1">
                          {item.submenu.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <a
                                href={subItem.href}
                                className={`block py-1.5 px-4 rounded transition-all duration-300
                                  hover:bg-gradient-to-r hover:from-[#685A3D] hover:to-[#8E7D5A] hover:text-white
                                  hover:shadow-md hover:translate-x-1 group
                                  ${isLinkActive(subItem.href) ? 'bg-gradient-to-r from-[#685A3D] to-[#8E7D5A] text-white shadow-md' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <subItem.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                                  <span>{subItem.label}</span>
                                </div>
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
                    className={`flex items-center py-2 px-4 rounded transition-all duration-300
                      hover:bg-gradient-to-r hover:from-[#685A3D] hover:to-[#8E7D5A]
                      hover:shadow-md group
                      ${isLinkActive(item.href) ? 'bg-gradient-to-r from-[#685A3D] to-[#8E7D5A] text-white shadow-md' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={18} className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Menu Items (Settings & Logout) */}
        <div className="mt-auto pt-4 border-t border-[#685A3D]/30 space-y-1">
          {bottomMenuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center py-2 px-4 rounded transition-all duration-500
              hover:bg-gradient-to-r hover:from-[#685A3D] hover:to-[#8E7D5A]
              hover:shadow-md group
              ${isLinkActive(item.href) ? 'bg-gradient-to-r from-[#685A3D] to-[#8E7D5A] text-white shadow-md' : ''}
              ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${(filteredMenuItems.length + index + 1) * 100}ms` }}
              title={isCollapsed ? item.label : ''}
            >
              <div className="flex items-center gap-2">
                <item.icon size={18} className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </a>
          ))}

          {[{
            label: 'Logout',
            icon: LogOut,
            href: '/logout',
          },].map((item, index) => (
            <div
              key={index}
              onClick={() => {
                logoutUser()
                navigate('/');
              }}
              className={`flex items-center py-2 px-4 rounded transition-all duration-500
                hover:bg-gradient-to-r hover:from-[#685A3D] hover:to-[#8E7D5A]
                hover:shadow-md group cursor-pointer
                ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${(filteredMenuItems.length + index + 1) * 100}ms` }}
              title={isCollapsed ? item.label : ''}
            >
              <div className="flex items-center gap-2">
                <item.icon size={18} className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </div>
          ))}

          {/* Collapse Button */}
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center justify-center py-2 px-4 bg-[#685A3D] hover:bg-[#5A4D35] 
              text-white rounded transition-all duration-500 hover:shadow-md group cursor-pointer
              ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: `${(filteredMenuItems.length + bottomMenuItems.length + 1) * 100}ms` }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <div className="flex items-center gap-2">
              <ArrowLeft
                size={16}
                className={`transform transition-all duration-500 ${isCollapsed ? 'rotate-180' : 'rotate-0'
                  } group-hover:scale-110`}
              />
              {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;