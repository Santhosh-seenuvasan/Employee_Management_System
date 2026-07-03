import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from '../../../../shared-components/Sidebar.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
const DASH = "\u2014";

  function Icon({ children, className = "" }) {
    return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
  }

  function apiUrl(path) {
    const base = window.EMS_API?.LOGIN || window.location.origin;
    return `${base}${path}`;
  }

  function assetUrl(path) {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    const origin = window.EMS_API?.LOGIN || window.location.origin;
    return origin + (String(path).startsWith("/") ? path : `/${path}`);
  }

  function authHeaders() {
    if (window.Auth?.headers) return window.Auth.headers();
    const token = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  function employeeCode() {
    try {
      const code = window.Auth?.employeeCode?.();
      if (code) return code;
    } catch (_) {}
    try {
      return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode') || "";
    } catch (_) {
      return "";
    }
  }

  function authEmail() {
    return window.Auth?.email ? window.Auth.email() : "";
  }

  function showToast(message, type = "success") {
    const toast = window.EMS_Toast;
    if (toast && typeof toast[type] === "function") {
      toast[type](message);
    }
  }

  function formatDateInput(value) {
    return value ? String(value).slice(0, 10) : "";
  }

  function formatDisplayDate(value) {
    if (!value) return DASH;
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (_) {
      return String(value);
    }
  }

  function initials(name) {
    return String(name || "AR")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "AR";
  }

  function documentIcon(type, name) {
    const lowerName = String(name || "").toLowerCase();
    if (lowerName.endsWith(".pdf")) return "picture_as_pdf";
    if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "description";
    if (/image|photo|png|jpg/i.test(type)) return "image";
    return "folder";
  }

  function formatFileSize(bytes) {
    const num = Number(bytes);
    if (!num || num < 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = num;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function userInitials(name) {
    if (!name) return 'U';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'U';
  }

  const Header = memo(function Header({ onToggleSidebar }) {
    const navigate = useNavigate();
    const { logout: authLogout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const [user, setUser] = useState(() => {
      const fn = (() => { try { return localStorage.getItem('ems_fullName') || sessionStorage.getItem('ems_fullName') || ''; } catch (_) { return ''; } })();
      return {
        name: fn || (() => { try { return localStorage.getItem('ems_email') || sessionStorage.getItem('ems_email') || '\u2014'; } catch (_) { return '\u2014'; } })(),
        role: (() => { try { return localStorage.getItem('ems_role') || sessionStorage.getItem('ems_role') || '\u2014'; } catch (_) { return '\u2014'; } })(),
        photo: null,
        initials: userInitials(fn)
      };
    });

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const codeFromStorage = (() => { try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode') || ''; } catch (_) { return ''; } })();

    useEffect(() => {
      if (!codeFromStorage) return;
      fetch(apiUrl('/api/employees/' + encodeURIComponent(codeFromStorage) + '/profile'), { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const p = data.profile || data;
          const fn = p.fullName || p.full_name || p.name || user.name;
          const photoRel = p.photo || null;
          setUser({
            name: fn,
            role: p.role || p.designation || p.department || user.role,
            photo: photoRel ? assetUrl(photoRel) : null,
            initials: userInitials(fn)
          });
        })
        .catch(() => {});
    }, [codeFromStorage]);

    useEffect(() => {
      if (!codeFromStorage) return;
      fetch(apiUrl('/api/employees/' + encodeURIComponent(codeFromStorage) + '/notifications'), { headers: authHeaders() })
        .then(r => r.ok ? r.json() : { today: [], thisWeek: [] })
        .then(data => {
          const all = [...(data.today || []), ...(data.thisWeek || [])];
          setNotifications(all);
          setUnreadCount(all.filter(n => !n.read).length);
        })
        .catch(() => {});
    }, [codeFromStorage]);

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

    function handleHelpClick() {
      const msg = document.createElement('div');
      msg.setAttribute('role', 'status');
      msg.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;';
      msg.textContent = 'EMS support: contact your administrator.';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2600);
    }

    function handleLogout() {
      if (!window.confirm('Are you sure you want to logout?')) return;
      ['ems_token','ems_role','ems_employeeCode','ems_email','ems_fullName'].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
        try { sessionStorage.removeItem(k); } catch (_) {}
      });
      authLogout();
      navigate('/login');
    }

    function formatNotifDate(dateStr) {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return diffMin + 'm ago';
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return diffHr + 'h ago';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } catch (_) { return dateStr; }
    }

    const userName = user.name;
    const userRole = user.role;
    const initials = user.initials;
    const photoUrl = user.photo;

    return (
      <header className="corporate-header">
        <div className="header-left">
          <button id="sidebarToggle" className="header-toggle-btn" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
            <Icon>menu</Icon>
          </button>
          <h1 className="header-title" id="page-header-title">My Profile</h1>
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
                <button className="notification-dropdown-clear" id="markAllReadBtn" onClick={() => { fetch(apiBase() + '/api/notifications/read-all', { method: 'PUT', headers: authHeaders() }).catch(() => {}); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0); }}>Mark all read</button>
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
          <button className="header-icon-btn" aria-label="Help" onClick={handleHelpClick}><Icon>help</Icon></button>
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
                <span id="headerProfileFallback">{initials}</span>
              )}
            </button>
            <div id="profileDropdown" className={`profile-dropdown${profileOpen ? ' show' : ''}`}>
              <div className="profile-dropdown-header">
                {photoUrl ? (
                  <img id="dropdownAvatar" src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="profile-dropdown-avatar" id="dropdownAvatar">{initials}</div>
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



  function ProfileHero({ profile, onPhotoChange }) {
    const name = profile.fullName || profile.full_name || "Loading...";
    const designation = profile.designation || "Employee";
    const department = profile.department || "Employee Portal";
    const photoRel = profile.photo;
    const resolvedPhoto = photoRel ? assetUrl(photoRel) : "";

    return (
      <div className="content-card mb-6">
        <div className="p-8 flex items-center gap-6">
          <div className="relative">
            {resolvedPhoto ? (
              <img id="profile-avatar" src={resolvedPhoto} alt="Profile" className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-50 shadow-lg" />
            ) : (
              <div id="profile-avatar" className="w-24 h-24 rounded-3xl bg-blue-100 border-4 border-blue-50 flex items-center justify-center text-3xl font-bold text-blue-700">
                {initials(name)}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
              <Icon>photo_camera</Icon>
              <input type="file" id="photoInput" className="hidden" accept="image/*" onChange={onPhotoChange} />
            </label>
          </div>
          <div>
            <h2 id="profile-hero-name" className="text-2xl font-bold">{name}</h2>
            <p id="profile-page-subtitle" className="text-slate-500 mt-1">{designation}</p>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{department}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function TabButton({ active, icon, label, onClick }) {
    return (
      <button className={`tab-btn btn btn-secondary justify-start ${active ? "active" : ""}`} onClick={onClick} type="button">
        <Icon>{icon}</Icon>{label}
      </button>
    );
  }

  function PersonalInfoTab({ form, setForm, onSave }) {
    function updateField(field, value) {
      setForm((current) => ({ ...current, [field]: value }));
    }

    return (
      <div id="tab-personal" className="tab-section active">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Personal Information</h3>
          </div>
          <form id="profile-form" className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={onSave}>
            <div>
              <label className="form-label">Employee Code</label>
              <input id="employeeCode" className="form-input mt-2 bg-slate-50" type="text" value={form.employeeCode} readOnly />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <input id="fullName" className="form-input mt-2" type="text" placeholder="Enter your name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input id="designation" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter your designation" value={form.designation} readOnly />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input id="department" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter your department" value={form.department} readOnly />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input id="email" className="form-input mt-2" type="email" placeholder="email@company.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input id="phone" className="form-input mt-2" type="tel" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Date of Birth</label>
              <input id="dob" className="form-input mt-2" type="date" value={form.dob} onChange={(event) => updateField("dob", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Date of Joining</label>
              <input id="dateOfJoining" className="form-input mt-2 bg-slate-50" type="date" value={form.dateOfJoining} readOnly />
            </div>
            <div>
              <label className="form-label">Work Location</label>
              <input id="workLocation" className="form-input mt-2 bg-slate-50" type="text" placeholder="Enter work location" value={form.workLocation} readOnly />
            </div>
            <div>
              <label className="form-label">Emergency Contact Name</label>
              <input id="emergencyContactName" className="form-input mt-2" type="text" placeholder="Emergency contact name" value={form.emergencyContactName} onChange={(event) => updateField("emergencyContactName", event.target.value)} />
            </div>
            <div>
              <label className="form-label">Emergency Contact Phone</label>
              <input id="emergencyContactPhone" className="form-input mt-2" type="tel" placeholder="Emergency contact phone" value={form.emergencyContactPhone} onChange={(event) => updateField("emergencyContactPhone", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Residential Address</label>
              <textarea id="address" className="form-textarea mt-2" placeholder="Your address" value={form.address} onChange={(event) => updateField("address", event.target.value)}></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button id="savePersonalBtn" type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function DocumentsTab({ documents, onUpload, onDelete, employeeCode }) {
    return (
      <div id="tab-documents" className="tab-section active">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Employee Documents</h3>
            <label className="btn btn-secondary cursor-pointer">
              <Icon>upload_file</Icon>Upload New
              <input type="file" id="docUpload" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={onUpload} />
            </label>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="docTable">
                {documents.length ? documents.map((doc) => {
                  const type = doc.document_type || doc.documentType || "General";
                  const name = doc.document_name || doc.documentName || "Document";
                  const path = doc.file_path || doc.filePath || (doc.id && employeeCode ? `/api/employees/${encodeURIComponent(employeeCode)}/documents/${doc.id}/download` : "");
                  const uploaded = formatDisplayDate(doc.uploaded_at || doc.uploadedAt);
                  const rawSize = doc.size || doc.document_size || doc.file_size || doc.fileSize;
                  const size = rawSize ? formatFileSize(rawSize) : '—';
                  return (
                    <tr className="hover:bg-surface-container-lowest transition-colors" data-type={type} data-id={doc.id} key={doc.id || name}>
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-3">
                          <Icon className="text-blue-600">{documentIcon(type, name)}</Icon>
                          <span className="font-body-md font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-lg py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded uppercase">{type}</span></td>
                      <td className="px-lg py-4 text-on-surface-variant text-sm">{size}</td>
                      <td className="px-lg py-4 text-on-surface-variant text-sm">{uploaded}</td>
                      <td className="px-lg py-4 text-right flex items-center justify-end gap-3">
                        <a href={assetUrl(path)} target="_blank" rel="noopener" className="doc-download text-blue-600 hover:underline font-label-md text-sm">Download</a>
                        <button type="button" className="doc-delete text-red-400 hover:text-red-600 font-label-md text-sm" onClick={() => onDelete(doc.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="5" className="text-center py-8 text-slate-400">No documents found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function ProfileSettingsApp() {
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ems_sidebar_collapsed') !== 'false');
    useEffect(() => { localStorage.setItem('ems_sidebar_collapsed', collapsed); }, [collapsed]);
    const code = useMemo(() => employeeCode(), []);

    function handleLogout() {
      const keys = ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
      keys.forEach(k => { try { sessionStorage.removeItem(k); } catch (_) {} });
      logout();
    }

    function handleToggleSidebar() {
      setCollapsed(prev => !prev);
    }

    const [activeTab, setActiveTab] = useState("personal");
    const [profile, setProfile] = useState({});
    const [documents, setDocuments] = useState([]);
    const [form, setForm] = useState({
      employeeCode: "",
      fullName: "",
      email: "",
      phone: "",
      dob: "",
      address: "",
      department: "",
      designation: "",
      dateOfJoining: "",
      workLocation: "",
      emergencyContactName: "",
      emergencyContactPhone: ""
    });

    const loadProfile = useCallback(async () => {
      if (!code) {
        console.warn("Employee code not available - skipping profile load");
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile`), {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const p = data.profile || {};

        setProfile(p);
        setDocuments(data.documents || []);
        setForm({
          employeeCode: p.employee_code || p.employeeCode || code || "",
          fullName: p.full_name || p.fullName || "",
          email: p.email || p.username || authEmail(),
          phone: p.phone_number || p.phoneNumber || "",
          dob: formatDateInput(p.date_of_birth || p.dateOfBirth),
          address: p.residential_address || p.residentialAddress || "",
          department: p.department || "",
          designation: p.designation || "",
          dateOfJoining: formatDateInput(p.date_of_joining || p.dateOfJoining),
          workLocation: p.work_location || p.workLocation || "",
          emergencyContactName: p.emergency_contact_name || p.emergencyContactName || "",
          emergencyContactPhone: p.emergency_contact_phone || p.emergencyContactPhone || ""
        });
      } catch (error) {
        console.error(error);
        showToast("Could not load profile from server", "error");
      }
    }, [code]);

    useEffect(() => {
      loadProfile();
    }, [loadProfile]);

    async function savePersonal(event) {
      event.preventDefault();
      if (!code) return;

      const payload = {
        fullName: form.fullName.trim(),
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        phone_number: form.phone.trim(),
        dateOfBirth: form.dob || null,
        date_of_birth: form.dob || null,
        residentialAddress: form.address.trim(),
        residential_address: form.address.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        dateOfJoining: form.dateOfJoining || null,
        date_of_joining: form.dateOfJoining || null,
        workLocation: form.workLocation.trim(),
        work_location: form.workLocation.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergency_contact_name: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        emergency_contact_phone: form.emergencyContactPhone.trim()
      };

      if (!payload.fullName) {
        showToast("Full name is required", "error");
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile`), {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
        showToast("save changes updated");
        await loadProfile();
        window.EMS_refreshHeader?.();
        window.dispatchEvent(new Event("ems-profile-updated"));
      } catch (_) {
        showToast("failed to updated", "error");
      }
    }

    async function uploadPhoto(event) {
      const file = event.target.files?.[0];
      if (!file || !code) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("Photo max 5 MB", "error");
        return;
      }

      const upload = new FormData();
      upload.append("photo", file);

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile-photo`), {
          method: "POST",
          headers: { Authorization: authHeaders().Authorization },
          body: upload
        });
        if (!response.ok) throw new Error(String(response.status));
        showToast("Profile photo uploaded");
        await loadProfile();
        window.EMS_refreshHeader?.();
        window.dispatchEvent(new Event("ems-profile-updated"));
      } catch (_) {
        showToast("Photo upload failed", "error");
      }
    }

    async function uploadDocument(event) {
      const file = event.target.files?.[0];
      if (!file || !code) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast("File max 10 MB", "error");
        return;
      }

      const type = prompt("Document type (Identity / Legal / Insurance / General)", "General") || "General";
      const upload = new FormData();
      upload.append("file", file);
      upload.append("documentType", type);

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/documents`), {
          method: "POST",
          headers: { Authorization: authHeaders().Authorization },
          body: upload
        });
        if (!response.ok) throw new Error(await response.text());
        showToast("Document uploaded");
        event.target.value = "";
        await loadProfile();
      } catch (_) {
        showToast("Upload failed - use PDF, DOC, DOCX, or image", "error");
      }
    }

    async function deleteDocument(id) {
      if (!id || !code || !confirm("Delete this document permanently?")) return;

      try {
        const response = await fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/documents/${id}`), {
          method: "DELETE",
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(String(response.status));
        showToast("Document deleted");
        await loadProfile();
      } catch (_) {
        showToast("Delete failed", "error");
      }
    }

    return (
      <div className="corporate-page">
        <Sidebar variant="vanilla" onLogout={handleLogout} collapsed={collapsed} />
        <div className={`corporate-main${collapsed ? ' sidebar-collapsed' : ''}`} id="main-content">
          <Header onToggleSidebar={handleToggleSidebar} />
          <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" style={{ display: "none" }}></div>
          <div className="corporate-content">
            <ProfileHero profile={profile} onPhotoChange={uploadPhoto} />

            <div className="flex flex-col lg:flex-row gap-6">
              <nav className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
                <TabButton active={activeTab === "personal"} icon="person_edit" label="Personal Info" onClick={() => setActiveTab("personal")} />
                <TabButton active={activeTab === "documents"} icon="description" label="Documents" onClick={() => setActiveTab("documents")} />
              </nav>

              <div className="flex-1 space-y-6">
                {activeTab === "personal" && <PersonalInfoTab form={form} setForm={setForm} onSave={savePersonal} />}
                {activeTab === "documents" && <DocumentsTab documents={documents} onUpload={uploadDocument} onDelete={deleteDocument} employeeCode={code} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
export default ProfileSettingsApp;