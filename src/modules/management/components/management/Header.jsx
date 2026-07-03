import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../hooks/useAuth';
import { useAuth } from '../../../../context/AuthContext';

function apiBase() {
  return window.EMS_API?.LOGIN || window.location.origin;
}
function authHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}
function assetUrl(path) {
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return (window.EMS_API?.LOGIN || window.location.origin) + (String(path).startsWith('/') ? path : '/' + path);
}

export default function Header({
  pageTitle = 'Corporate EMS',
  onToggleSidebar,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onToggleRead,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [photoUrl, setPhotoUrl] = useState(null);
  const userName = Auth.fullName() || Auth.email() || '—';
  const userRole = Auth.role() || '—';
  const userInitials = Auth.initials();

  useEffect(() => {
    function fetchPhoto() {
      const code2 = Auth.employeeCode();
      if (!code2) return;
      fetch(apiBase() + '/api/employees/' + encodeURIComponent(code2) + '/profile', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const p = data.profile || data;
          const photoRel = p.photo || null;
          setPhotoUrl(photoRel ? assetUrl(photoRel) + '?t=' + Date.now() : null);
        })
        .catch(() => {});
    }
    fetchPhoto();
    window.EMS_refreshHeader = fetchPhoto;
    window.addEventListener('ems-profile-updated', fetchPhoto);
    return () => {
      window.removeEventListener('ems-profile-updated', fetchPhoto);
      if (window.EMS_refreshHeader === fetchPhoto) delete window.EMS_refreshHeader;
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  }

  function handleHelpClick() {
    // Mirror original help button behaviour
    const msg = document.createElement('div');
    msg.setAttribute('role', 'status');
    msg.style.cssText =
      'position:fixed;right:18px;bottom:18px;z-index:99999;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;';
    msg.textContent = 'EMS support: contact your administrator.';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2600);
  }

  return (
    <header className="corporate-header">
      <div className="header-left">
        <button
          id="sidebarToggle"
          className="header-toggle-btn"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="header-title" id="page-header-title">
          {pageTitle}
        </h1>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notificationBtn"
            className="header-icon-btn"
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={notifOpen}
            onClick={() => {
              setNotifOpen(o => !o);
              setProfileOpen(false);
            }}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span
              id="notificationBadge"
              className="header-badge"
              style={{ display: unreadCount > 0 ? 'flex' : 'none' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </button>

          <div
            id="notificationDropdown"
            className={`notification-dropdown${notifOpen ? ' show' : ''}`}
          >
            <div className="notification-dropdown-header">
              <span className="notification-dropdown-title">Notifications</span>
              <button
                className="notification-dropdown-clear"
                id="markAllReadBtn"
                onClick={onMarkAllRead}
              >
                Mark all read
              </button>
            </div>

            <div className="notification-dropdown-list" id="notificationList">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}
                  >
                    notifications_none
                  </span>
                  <p>No messages</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer${!notif.read ? ' bg-blue-50/50' : ''}`}
                    data-notif-id={notif.id}
                    onClick={() => {
                      onToggleRead && onToggleRead(notif.id, true);
                      setNotifOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm truncate">
                            {notif.title}
                          </p>
                          <span className="text-slate-500" style={{ fontSize: '10px' }}>
                            {notif.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{notif.createdAt}</p>
                      </div>
                      <button
                        type="button"
                        className={`text-xs font-semibold ${notif.read ? 'text-slate-500' : 'text-primary'}`}
                        style={{ color: notif.read ? '#6B7280' : '#2563EB' }}
                        onClick={e => {
                          e.stopPropagation();
                          onToggleRead && onToggleRead(notif.id, !notif.read);
                        }}
                      >
                        {notif.read ? 'Mark unread' : 'Mark read'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

<div className="notification-dropdown-footer">
               <Link to="/management-dashboard/notifications" onClick={() => setNotifOpen(false)}>
                 View All Notifications
               </Link>
             </div>
          </div>
        </div>

        {/* Help */}
        <button className="header-icon-btn" aria-label="Help" onClick={handleHelpClick}>
          <span className="material-symbols-outlined">help</span>
        </button>

        <div className="header-divider"></div>

        {/* Profile Dropdown */}
        <div className="header-profile" ref={profileRef}>
          <div className="header-profile-info">
            <p id="header-name" className="header-profile-name">{userName}</p>
            <p id="header-role" className="header-profile-role">{userRole}</p>
          </div>

          <button
            id="profileBtn"
            className="header-profile-avatar"
            aria-label="Profile menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen(o => !o);
              setNotifOpen(false);
            }}
          >
            {photoUrl ? (
              <img id="headerProfileImg" src={photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span id="headerProfileFallback">{userInitials}</span>
            )}
          </button>

          <div
            id="profileDropdown"
            className={`profile-dropdown${profileOpen ? ' show' : ''}`}
          >
            <div className="profile-dropdown-header">
              {photoUrl ? (
                <img id="dropdownAvatar" src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="profile-dropdown-avatar" id="dropdownAvatar">{userInitials}</div>
              )}
              <div>
                <p id="dropdownName" className="font-bold text-slate-900">{userName}</p>
                <p id="dropdownRole" className="text-sm text-slate-500">{userRole}</p>
              </div>
            </div>

            <div className="profile-dropdown-menu">
<Link
                 to="/management-dashboard/profile-settings"
                 className="profile-dropdown-item"
                 data-nav="profile"
                 onClick={() => setProfileOpen(false)}
               >
                 <span className="material-symbols-outlined">person</span>
                 My Profile
               </Link>
               <Link
                 to="/management-dashboard/settings"
                 className="profile-dropdown-item"
                 data-nav="settings"
                 onClick={() => setProfileOpen(false)}
               >
                 <span className="material-symbols-outlined">settings</span>
                 Settings
               </Link>
               <Link
                 to="/management-dashboard/notifications"
                 className="profile-dropdown-item"
                 data-nav="notifications"
                 onClick={() => setProfileOpen(false)}
               >
                 <span className="material-symbols-outlined">notifications</span>
                 Notifications
               </Link>

              <div className="profile-dropdown-divider"></div>

              <button
                id="logoutBtn"
                className="profile-dropdown-item profile-dropdown-logout"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
