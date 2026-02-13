import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, HardDrive, LogOut, Bell, ShoppingCart, Activity, MessageSquare, Award, ShieldCheck, Shield, Volume2, VolumeX, Image as ImageIcon, Ticket, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import Logo from '../assets/Spark.png';
import { apiFetch, config } from '../config';
import { useNotifications } from '../context/NotificationContext';
import AdminSearchBar from './AdminSearchBar';
import { useImageUrl } from '../hooks/useImageUrl';

// Simple notification sound (short beep)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."; // Placeholder, will use a real one below

// Permission-based menu items - Organized professionally
const MENU_ITEMS = [
  // Core Dashboard
  { to: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard", permission: "view_dashboard" },
  
  // Content Management
  { to: "/admin/courses", icon: <BookOpen size={20} />, label: "Courses", permission: "view_courses" },
  { to: "/admin/certificates", icon: <ShieldCheck size={20} />, label: "Certificates", permission: "view_certificates" },
  { to: "/admin/badges", icon: <Award size={20} />, label: "Badges", permission: "view_badges" },
  
  // Commerce & Sales
  { to: "/admin/orders", icon: <ShoppingCart size={20} />, label: "Orders", permission: "view_orders" },
  { to: "/admin/coupons", icon: <Ticket size={20} />, label: "Coupons", permission: "view_coupons" },
  
  // User Management
  { to: "/admin/users", icon: <Users size={20} />, label: "Users", permission: "view_users" },
  
  // Resources & Media
  { to: "/admin/drive", icon: <HardDrive size={20} />, label: "Resources", permission: "view_drive" },
  { to: "/admin/gallery", icon: <ImageIcon size={20} />, label: "Gallery", permission: "view_gallery" },
  
  // Communication
  { to: "/admin/contacts", icon: <MessageSquare size={20} />, label: "Contacts", permission: "view_contacts" },
  
  // System & Settings
  { to: "/admin/activity", icon: <Activity size={20} />, label: "Activity Log", permission: "view_activity" },
  { to: "/admin/roles", icon: <Shield size={20} />, label: "Roles", permission: "view_roles" },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, clearAll, addNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('admin_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const notifRef = useRef(null);
  
  // Get user role and permissions
  const [userRole, setUserRole] = useState('super_admin');
  const [userEmail, setUserEmail] = useState('admin');
  const [userName, setUserName] = useState('Sajid Ali');
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  
  // Use hook to get properly resolved profile picture URL
  const profilePictureUrl = useImageUrl(userProfilePicture);

  useEffect(() => {
    const loadUserData = () => {
      const role = localStorage.getItem('admin_role') || 'super_admin';
      const email = localStorage.getItem('admin_email') || 'admin';
      const name = localStorage.getItem('admin_name') || 'Sajid Ali';
      let profilePicture = localStorage.getItem('admin_profile_picture') || null;
      if (profilePicture && profilePicture.includes('localhost:')) {
        profilePicture = profilePicture.substring(profilePicture.indexOf('/uploads/'));
      }
      const permissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
      
      setUserRole(role);
      setUserEmail(email);
      setUserName(name);
      setUserProfilePicture(profilePicture);
      setUserPermissions(permissions);
    };

    // Load initial data
    loadUserData();

    // Listen for storage changes (when profile is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_profile_picture' || e.key === 'admin_name') {
        loadUserData();
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Check if user has permission
  const hasPermission = (permission) => {
    if (userRole === 'super_admin') return true;
    return userPermissions.includes(permission);
  };

  // Filter menu items based on permissions
  const visibleMenuItems = MENU_ITEMS.filter(item => 
    hasPermission(item.permission)
  );

  // Track last log time to avoid duplicate notifications on reload
  const [lastLogTime, setLastLogTime] = useState(Date.now());

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for new activity logs (only if has permission)
  useEffect(() => {
    if (!hasPermission('view_activity')) return;

    let isMounted = true;
    
    const checkActivity = async () => {
      try {
        const res = await apiFetch('/api/admin/activity-logs', {
           headers: { "x-admin-token": localStorage.getItem("admin_token") }
        });
        const data = await res.json();
        
        if (data.ok && data.logs && data.logs.length > 0) {
          const newLogs = data.logs.filter(log => new Date(log.time).getTime() > lastLogTime);
          
          if (newLogs.length > 0) {
            const newestTime = Math.max(...newLogs.map(l => new Date(l.time).getTime()));
            setLastLogTime(newestTime);

            // Play sound
            try {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.1;
                osc.start();
                setTimeout(() => osc.stop(), 200);
              }
            } catch (e) {
              console.error("Audio play failed", e);
            }

            // Add notifications
            newLogs.forEach(log => {
              let link = '/admin/activity';
              if (log.type === 'order') link = '/admin/orders';
              if (log.type === 'login') link = '/admin/users';
              
              addNotification({
                type: 'info',
                title: log.title,
                message: log.message,
                link: link
              });
            });
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const initialSync = async () => {
       try {
        const res = await apiFetch('/api/admin/activity-logs', {
           headers: { "x-admin-token": localStorage.getItem("admin_token") }
        });
        const data = await res.json();
        if (data.ok && data.logs.length > 0) {
           const newestTime = Math.max(...data.logs.map(l => new Date(l.time).getTime()));
           setLastLogTime(newestTime);
        }
       } catch (e) {}
    };
    
    initialSync();

    const interval = setInterval(checkActivity, 10000);
    return () => clearInterval(interval);
  }, [lastLogTime, addNotification, userPermissions]);

  const isActive = (path) => location.pathname === path;

  function getPageTitle(path) {
    if (path === '/admin') return 'Dashboard';
    if (path === '/admin/courses') return 'Course Management';
    if (path === '/admin/certificates') return 'Certificate Management';
    if (path === '/admin/orders') return 'Order Management';
    if (path === '/admin/users') return 'User Management';
    if (path === '/admin/drive') return 'Resources Library';
    if (path === '/admin/contacts') return 'Contact Submissions';
    if (path === '/admin/activity') return 'Activity Log';
    if (path === '/admin/badges') return 'Badge Management';
    if (path === '/admin/roles') return 'Roles & Permissions';
    if (path === '/admin/gallery') return 'Gallery Management';
    if (path === '/admin/coupons') return 'Coupon Management';
    return 'Admin Panel';
  }

  function getRoleDisplayName(role) {
    const names = {
      super_admin: 'Super Admin',
      content_manager: 'Content Manager',
      instructor: 'Instructor',
      support_staff: 'Support Staff',
      finance_manager: 'Finance Manager'
    };
    return names[role] || 'Admin';
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_permissions");
    navigate("/admin/login");
  }

  function handleNotificationClick() {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-[#1c1d1f] text-white flex flex-col shrink-0 transition-all duration-300 cursor-pointer">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-700 py-2">
          <img src={Logo} alt="Spark Trainings" className="h-12 w-auto hidden md:block" />
          <img src={Logo} alt="S" className="h-12 w-auto md:hidden" />
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {visibleMenuItems.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              active={isActive(item.to)} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-50">
          <div className="flex items-center gap-4 flex-1">
             <h2 className="text-xl font-semibold text-gray-800">
               {getPageTitle(location.pathname)}
             </h2>
          </div>
          
          <div className="flex items-center gap-4 md:gap-4">
            <div className="hidden md:flex items-center">
              <AdminSearchBar />
            </div>

            <Link to="/" target="_blank" className="hidden md:flex items-center gap-2 text-sm font-medium text-[#0d9c06] hover:py-2 hover:px-2 px-2 hover:bg-[#daffd8] hover:text-[#0d9c06] rounded-md transition-all ease-in-out duration-300 cursor-pointer">
              <span>Visit Website</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </Link>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={handleNotificationClick}
                className="text-gray-600 hover:text-[#0d9c06] hover:bg-[#daffd8] py-2 px-2 rounded-md transition-all ease-in-out duration-300 hover:py-2 hover:px-2 cursor-pointer relative group"
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/2 -translate-y-1/2 animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[400px] bg-white/90 backdrop-blur-2xl rounded-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-black/5 overflow-hidden z-100 transform transition-all origin-top-right animate-in fade-in zoom-in-95 duration-200">
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-gray-100/50 flex items-center justify-between bg-linear-to-b from-gray-50/80 to-transparent">
                    <div className="flex items-center gap-3">
                       <h3 className="font-bold text-gray-800 tracking-tight">Notifications</h3>
                       {unreadCount > 0 && (
                         <div className="flex items-center gap-1.5 bg-[#0d9c06]/10 text-[#0d9c06] px-2.5 py-0.5 rounded-full ring-1 ring-[#0d9c06]/20">
                           <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9c06] opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d9c06]"></span>
                           </span>
                           <span className="text-[11px] font-bold uppercase tracking-wider">{unreadCount} New</span>
                         </div>
                       )}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAll} 
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50 transition-all font-medium cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Notifications List */}
                  <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 scroll-smooth">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-gray-50/50">
                           <CheckCircle size={28} className="text-gray-300" />
                        </div>
                        <p className="text-base font-semibold text-gray-900">All caught up!</p>
                        <p className="text-xs text-gray-500 mt-1">No new notifications to show.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (notif.link) {
                                navigate(notif.link);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-4 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer group relative flex gap-4 ${!notif.read ? 'bg-blue-50/40' : 'bg-transparent'}`}
                          >
                            {!notif.read && (
                               <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#0d9c06] rounded-r-md shadow-[0_0_10px_rgba(13,156,6,0.3)]" />
                            )}
                            
                            {/* Icon Container */}
                            <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/50 ${
                                notif.type === 'order' ? 'bg-linear-to-br from-green-100 to-green-50 text-green-600 ring-1 ring-green-100' : 
                                notif.type === 'error' ? 'bg-linear-to-br from-red-100 to-red-50 text-red-600 ring-1 ring-red-100' : 
                                'bg-linear-to-br from-blue-100 to-blue-50 text-blue-600 ring-1 ring-blue-100'
                              }`}>
                                {notif.type === 'order' ? <ShoppingCart size={18} className="drop-shadow-sm" /> : 
                                 notif.type === 'error' ? <Shield size={18} className="drop-shadow-sm" /> : 
                                 <Activity size={18} className="drop-shadow-sm" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5 group-hover:translate-x-1 transition-transform duration-300">
                              <p className={`text-sm font-semibold tracking-tight ${!notif.read ? 'text-gray-900' : 'text-gray-700'} truncate group-hover:text-[#0d9c06] transition-colors`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-2.5 flex items-center gap-2">
                                <span>{new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <span>{new Date(notif.time).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Dropdown Footer (Optional actions) */}
                  <div className="p-2 border-t border-gray-100/50 bg-gray-50/30 text-center">
                    <button 
                      onClick={() => {
                        navigate('/admin/activity');
                        setShowNotifications(false);
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-[#0d9c06] transition-colors w-full py-1 cursor-pointer flex items-center justify-center gap-1"
                    >
                      View All Activity <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sound Toggle Button */}
            <button
              onClick={() => {
                const newValue = !soundEnabled;
                setSoundEnabled(newValue);
                localStorage.setItem('admin_sound_enabled', newValue.toString());
                localStorage.setItem('notification_sound_enabled', newValue.toString());
              }}
              className="text-gray-600 hover:text-[#0d9c06] hover:bg-[#daffd8] py-2 px-2 rounded-md transition-all ease-in-out duration-300 cursor-pointer"
              title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            
            <button 
              onClick={() => navigate('/admin/profile')}
              className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</p>
              </div>
              <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shadow-md ring-2 ring-white">
                {profilePictureUrl ? (
                  <img 
                    src={profilePictureUrl} 
                    alt={userName} 
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      console.error('Failed to load profile picture:', profilePictureUrl);
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="h-full w-full bg-linear-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center text-white font-bold">${userName.charAt(0).toUpperCase()}</div>`;
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center text-white font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
          
          <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Spark Trainings. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 mx-2 rounded transition-colors ${
        active 
          ? 'bg-gray-700 text-white border-l-4 border-[#0d9c06]' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <div className={`${active ? '-ml-1' : ''}`}>{icon}</div>
      <span className="hidden md:block font-medium">{label}</span>
    </Link>
  );
}
