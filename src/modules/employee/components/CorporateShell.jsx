import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar as SharedSidebar } from '../../../../shared-components/Sidebar.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

  function apiBase() { return window.EMS_API?.LOGIN || window.location.origin; }
  function authHeaders() {
    if (window.Auth?.headers) return window.Auth.headers();
    const token = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
  }

  function getInitials(name) {
    return name ? name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') : 'NA';
  }

  function assetUrl(path) {
    if (!path) return '';
    if (String(path).startsWith('http')) return path;
    return (window.EMS_API?.LOGIN || window.location.origin) + (String(path).startsWith('/') ? path : '/' + path);
  }

  function formatNotifDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const diffMin = Math.floor((Date.now() - d) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return diffMin + 'm ago';
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return diffHr + 'h ago';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch (_) { return dateStr; }
  }

  function Icon({ children, className = "", ...props }) {
    return <span className={`material-symbols-outlined ${className}`.trim()} {...props}>{children}</span>;
  }

  const Header = memo(function Header({ title, onToggleSidebar }) {
    const navigate = useNavigate();
    const { logout: authLogout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const [user, setUser] = useState(() => {
      const fn = window.Auth?.fullName?.() || window.Auth?.email?.() || '';
      return { name: fn || '\u2014', role: window.Auth?.role?.() || '\u2014', photo: null, initials: getInitials(fn) };
    });

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      const code = window.Auth?.employeeCode?.();
      if (!code) return;
      fetch(apiBase() + '/api/employees/' + encodeURIComponent(code) + '/profile', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const p = data.profile || data;
          const fn = p.fullName || p.full_name || p.name || '';
          const photoRel = p.photo || null;
          if (fn || photoRel) setUser({ name: fn || user.name, role: p.role || p.designation || p.department || user.role, photo: photoRel ? assetUrl(photoRel) : null, initials: getInitials(fn || user.name) });
        })
        .catch(() => {});
    }, []);

    useEffect(() => {
      const code = window.Auth?.employeeCode?.();
      if (!code) return;
      fetch(apiBase() + '/api/employees/' + encodeURIComponent(code) + '/notifications', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : { today: [], thisWeek: [] })
        .then(data => {
          const all = [...(data.today || []), ...(data.thisWeek || [])];
          setNotifications(all);
          setUnreadCount(all.filter(n => !n.read).length);
        })
        .catch(() => {});
    }, []);

    useEffect(() => {
      if (!notifOpen) return;
      const code = window.Auth?.employeeCode?.();
      if (!code) return;
      fetch(apiBase() + '/api/employees/' + encodeURIComponent(code) + '/notifications', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : { today: [], thisWeek: [] })
        .then(data => {
          const all = [...(data.today || []), ...(data.thisWeek || [])];
          setNotifications(all);
          setUnreadCount(all.filter(n => !n.read).length);
        })
        .catch(() => {});
    }, [notifOpen]);

    useEffect(() => {
      const badge = document.getElementById('notificationBadge');
      if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount || '';
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
      }
    }, [unreadCount]);

    useEffect(() => {
      function handleClick(e) {
        if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleLogout() {
      if (!window.confirm('Are you sure you want to logout?')) return;
      ['ems_token','ems_role','ems_employeeCode','ems_email','ems_fullName'].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
        try { sessionStorage.removeItem(k); } catch (_) {}
      });
      authLogout();
      navigate('/login');
    }

    function handleHelpClick() {
      const msg = document.createElement('div');
      msg.setAttribute('role', 'status');
      msg.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;';
      msg.textContent = 'EMS support: contact your administrator.';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2600);
    }

    const { name: userName, role: userRole, initials: userInitials, photo: photoUrl } = user;
    return (
      <header className="corporate-header">
        <div className="header-left">
          <button id="sidebarToggle" className="header-toggle-btn" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
            <Icon>menu</Icon>
          </button>
          <h1 className="header-title" id="page-header-title">{title}</h1>
        </div>

        <div className="header-right">
          <div className="relative" ref={notifRef}>
            <button id="notificationBtn" className="header-icon-btn" aria-label="Notifications" aria-haspopup="dialog" aria-expanded={notifOpen}
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
              <Icon>notifications</Icon>
              <span id="notificationBadge" className="header-badge" style={{ display: unreadCount > 0 ? 'flex' : 'none' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            </button>
            <div id="notificationDropdown" className={`notification-dropdown${notifOpen ? ' show' : ''}`}>
              <div className="notification-dropdown-header">
                <span className="notification-dropdown-title">Notifications</span>
                <button className="notification-dropdown-clear" id="markAllReadBtn" onClick={() => {
                  fetch(apiBase() + '/api/notifications/read-all', { method: 'PUT', headers: authHeaders() }).catch(() => {});
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  setUnreadCount(0);
                }}>Mark all read</button>
              </div>
              <div className="notification-dropdown-list" id="notificationList">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Icon style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}>notifications_none</Icon>
                    <p>No messages</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer${!n.read ? ' bg-blue-50/50' : ''}`}
                      onClick={() => { if (!n.read) { fetch(apiBase() + '/api/notifications/' + n.id + '/read', { method: 'PUT', headers: authHeaders() }).catch(() => {}); setNotifications(prev => prev.map(m => m.id === n.id ? { ...m, read: true } : m)); setUnreadCount(c => Math.max(0, c - 1)); } }}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm truncate">{n.title || n.message || 'Notification'}</p>
                            {n.category && <span className="text-slate-500" style={{ fontSize: '10px' }}>{n.category}</span>}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{n.message || n.title || ''}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatNotifDate(n.createdAt || n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="notification-dropdown-footer">
                <a href="#" onClick={(e) => { e.preventDefault(); setNotifOpen(false); navigate('/employee-dashboard/notifications'); }}>View All Notifications</a>
              </div>
            </div>
          </div>

          <button className="header-icon-btn" aria-label="Help" onClick={handleHelpClick}>
            <Icon>help</Icon>
          </button>
          <div className="header-divider"></div>

          <div className="header-profile" ref={profileRef}>
            <div className="header-profile-info">
              <p id="header-name" className="header-profile-name">{userName}</p>
              <p id="header-role" className="header-profile-role">{userRole}</p>
            </div>
            <button id="profileBtn" className="header-profile-avatar" aria-label="Profile menu" aria-haspopup="menu" aria-expanded={profileOpen}
              onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}>
              {photoUrl ? (
                <img id="headerProfileImg" src={photoUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span id="headerProfileFallback">{userInitials}</span>
              )}
            </button>
            <div id="profileDropdown" className={`profile-dropdown${profileOpen ? ' show' : ''}`}>
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
                <a href="#" className="profile-dropdown-item" data-nav="profile" onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigate('/employee-dashboard/profile'); }}><Icon>person</Icon>My Profile</a>
                <a href="#" className="profile-dropdown-item" data-nav="settings" onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigate('/employee-dashboard/settings'); }}><Icon>settings</Icon>Settings</a>
                <a href="#" className="profile-dropdown-item" data-nav="notifications" onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigate('/employee-dashboard/notifications'); }}><Icon>notifications</Icon>Notifications</a>
                <div className="profile-dropdown-divider"></div>
                <button id="logoutBtn" className="profile-dropdown-item profile-dropdown-logout" onClick={handleLogout}><Icon>logout</Icon>Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  });

  function CorporateShell({ title, children }) {
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ems_sidebar_collapsed') !== 'false');
    useEffect(() => { localStorage.setItem('ems_sidebar_collapsed', collapsed); }, [collapsed]);
    function handleToggleSidebar() {
      setCollapsed(prev => !prev);
    }
    function handleLogout() {
      const keys = ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
      keys.forEach(k => { try { sessionStorage.removeItem(k); } catch (_) {} });
      logout();
    }
    return (
      <div className="corporate-page">
        <SharedSidebar variant="vanilla" collapsed={collapsed} onLogout={handleLogout} />
        <div className={`corporate-main${collapsed ? ' sidebar-collapsed' : ''}`} id="main-content">
          <Header title={title} onToggleSidebar={handleToggleSidebar} />
          <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" style={{ display: "none" }}></div>
          <div className="corporate-content">{children}</div>
        </div>
      </div>
    );
  }
export { CorporateShell, Header, Icon };
