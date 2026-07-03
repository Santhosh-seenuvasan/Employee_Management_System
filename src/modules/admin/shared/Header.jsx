import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';

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

function userInitials() {
  const name = (() => { try { return localStorage.getItem('ems_fullName') || sessionStorage.getItem('ems_fullName'); } catch (_) { return ''; } })();
  if (!name) return 'U';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'U';
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

export default function Header({ title, onToggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [user, setUser] = useState(() => ({
    name: (() => { try { return localStorage.getItem('ems_fullName') || sessionStorage.getItem('ems_fullName') || ''; } catch (_) { return ''; } })() || (() => { try { return localStorage.getItem('ems_email') || sessionStorage.getItem('ems_email') || ''; } catch (_) { return ''; } })() || '\u2014',
    role: (() => { try { return localStorage.getItem('ems_role') || sessionStorage.getItem('ems_role') || ''; } catch (_) { return ''; } })() || '\u2014',
    photo: null,
    initials: userInitials(),
  }));

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function fetchProfile() {
    const code = (() => { try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return ''; } })();
    if (!code) return;
    fetch(apiBase() + '/api/employees/' + encodeURIComponent(code) + '/profile', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const p = data.profile || data;
        const fn = p.fullName || p.full_name || p.name || '';
        const photoRel = p.photo || null;
        if (fn || photoRel) setUser(prev => ({ ...prev, name: fn || prev.name, role: p.role || p.designation || p.department || prev.role, photo: photoRel ? assetUrl(photoRel) + '?t=' + Date.now() : null }));
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchProfile();
    window.EMS_refreshHeader = fetchProfile;
    window.addEventListener('ems-profile-updated', fetchProfile);
    return () => {
      window.removeEventListener('ems-profile-updated', fetchProfile);
      if (window.EMS_refreshHeader === fetchProfile) delete window.EMS_refreshHeader;
    };
  }, []);

  useEffect(() => {
    const code = (() => { try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return ''; } })();
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
    const code = (() => { try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return ''; } })();
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
    logout();
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

  return (
    <header className="corporate-header">
      <div className="header-left">
        <button id="sidebarToggle" className="header-toggle-btn" type="button" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="header-title" id="page-header-title">{title || 'Corporate EMS'}</h1>
      </div>

      <div className="header-right">
        <div className="relative" ref={notifRef}>
          <button id="notificationBtn" className="header-icon-btn" type="button" aria-label="Notifications" aria-haspopup="dialog" aria-expanded={notifOpen}
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
            <span className="material-symbols-outlined">notifications</span>
            <span id="notificationBadge" className="header-badge" style={{ display: unreadCount > 0 ? 'flex' : 'none' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          </button>
          <div id="notificationDropdown" className={`notification-dropdown${notifOpen ? ' show' : ''}`}>
            <div className="notification-dropdown-header">
              <span className="notification-dropdown-title">Notifications</span>
                <button className="notification-dropdown-clear" id="markAllReadBtn" type="button" onClick={() => {
                fetch(apiBase() + '/api/notifications/read-all', { method: 'PUT', headers: authHeaders() }).catch(() => {});
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
              }}>Mark all read</button>
            </div>
            <div className="notification-dropdown-list" id="notificationList">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}>notifications_none</span>
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
              <Link to="/admin-dashboard/notifications" onClick={() => setNotifOpen(false)}>View All Notifications</Link>
            </div>
          </div>
        </div>

        <button className="header-icon-btn" type="button" aria-label="Help" onClick={handleHelpClick}>
          <span className="material-symbols-outlined">help</span>
        </button>

        <div className="header-divider" />

        <div className="header-profile" ref={profileRef}>
          <div className="header-profile-info">
            <p id="header-name" className="header-profile-name">{user.name}</p>
            <p id="header-role" className="header-profile-role">{user.role}</p>
          </div>
          <button id="profileBtn" className="header-profile-avatar" type="button" aria-label="Profile menu" aria-haspopup="menu" aria-expanded={profileOpen}
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}>
            {user.photo ? (
              <img id="headerProfileImg" src={user.photo} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span id="headerProfileFallback">{user.initials}</span>
            )}
          </button>

          <div id="profileDropdown" className={`profile-dropdown${profileOpen ? ' show' : ''}`}>
            <div className="profile-dropdown-header">
              {user.photo ? (
                <img id="dropdownAvatar" src={user.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="profile-dropdown-avatar" id="dropdownAvatar">{user.initials}</div>
              )}
              <div>
                <p id="dropdownName" className="font-bold text-slate-900">{user.name}</p>
                <p id="dropdownRole" className="text-sm text-slate-500">{user.role}</p>
              </div>
            </div>
            <div className="profile-dropdown-menu">
              <Link to="/admin-dashboard/profile" className="profile-dropdown-item" data-nav="profile" onClick={() => setProfileOpen(false)}>
                <span className="material-symbols-outlined">person</span>My Profile
              </Link>
              <Link to="/admin-dashboard/settings" className="profile-dropdown-item" data-nav="settings" onClick={() => setProfileOpen(false)}>
                <span className="material-symbols-outlined">settings</span>Settings
              </Link>
              <Link to="/admin-dashboard/notifications" className="profile-dropdown-item" data-nav="notifications" onClick={() => setProfileOpen(false)}>
                <span className="material-symbols-outlined">notifications</span>Notifications
              </Link>
              <div className="profile-dropdown-divider" />
              <button id="logoutBtn" className="profile-dropdown-item profile-dropdown-logout" type="button" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
