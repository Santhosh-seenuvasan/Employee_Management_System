import { useCallback, useEffect, useMemo, useState, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from '../../../../shared-components/Sidebar.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import AttendanceCard from './AttendanceCard.jsx';

const DASH = "\u2014";
const RUPEE = "\u20b9";

function apiBase() {
  return window.EMS_API?.LOGIN || window.location.origin;
}

function authHeaders() {
  return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
}

function employeeCode() {
  return window.Auth?.employeeCode ? window.Auth.employeeCode() : "";
}

function notify(type, message) {
  const toast = window.EMS_Toast;
  if (toast && typeof toast[type] === "function") toast[type](message);
}

function navTo(key, fallback) {
  if (typeof window.EMS_navTo === "function") { window.EMS_navTo(key); return; }
  window.location.href = fallback;
}

async function fetchJsonSafe(url) {
  if (typeof window.fetchJson === "function") return window.fetchJson(url);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeProfile(profileResponse) {
  const source = Array.isArray(profileResponse) ? profileResponse[0] || {} : profileResponse?.profile || profileResponse?.employee || profileResponse || {};
  const firstName = firstDefined(source.first_name, source.firstName, source.first);
  const lastName = firstDefined(source.last_name, source.lastName, source.last);
  const fullName = firstDefined(source.full_name, source.fullName, source.name, source.employee_name, firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName);
  return {
    ...source,
    fullName,
    full_name: fullName,
    employee_code: firstDefined(source.employee_code, source.employeeCode, source.code, source.emp_code),
    department: firstDefined(source.department, source.department_name, source.departmentName, source.dept, source.department_title),
    designation: firstDefined(source.designation, source.designation_name, source.designationName, source.job_title, source.jobTitle, source.position, source.role),
    date_of_joining: firstDefined(source.date_of_joining, source.dateOfJoining, source.joinDate, source.joining_date)
  };
}

function mergeProfile(dashboardProfile, profileResponse) {
  return normalizeProfile({ ...(dashboardProfile || {}), ...(normalizeProfile(profileResponse) || {}) });
}

function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

function formatINR(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return RUPEE + DASH;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function profileName(profile) {
  return normalizeProfile(profile).fullName || "User";
}

function profileInitial(profile) {
  return profileName(profile).substring(0, 1).toUpperCase() || "U";
}

function leaveInfo(balance, totalKey, usedKey) {
  const total = Number(balance?.[totalKey] || 0);
  const used = Number(balance?.[usedKey] || 0);
  return {
    remaining: balance ? total - used : DASH,
    subtitle: balance ? `${used} used of ${total}` : "Loading...",
    width: total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0
  };
}

function taskStatusClass(status) {
  if (status === "Completed") return "bg-green-100 text-green-800";
  if (status === "In Progress") return "bg-blue-100 text-blue-800";
  return "bg-yellow-100 text-yellow-800";
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

function assetUrl(path) {
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return (window.EMS_API?.LOGIN || window.location.origin) + (String(path).startsWith('/') ? path : '/' + path);
}

const Header = memo(function Header({ onToggleSidebar }) {
  const { logout: authLogout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [user, setUser] = useState(() => {
    const fn = window.Auth?.fullName?.() || window.Auth?.email?.() || '';
    return { name: fn || '\u2014', role: window.Auth?.role?.() || '\u2014', photo: null, initials: fn ? fn.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') : 'NA' };
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

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
        if (fn || photoRel) setUser({ name: fn || user.name, role: p.role || p.designation || p.department || user.role, photo: photoRel ? assetUrl(photoRel) + '?t=' + Date.now() : null, initials: fn ? fn.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') : user.initials });
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
        <h1 className="header-title" id="page-header-title">Employee Dashboard</h1>
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



function ProfileCard({ profile }) {
    const photoUrl = profile?.photo_url || profile?.photoUrl || profile?.photo;
    const resolvedPhoto = photoUrl ? (window.EMS_API?.LOGIN || window.location.origin) + (String(photoUrl).startsWith('/') ? photoUrl : '/' + photoUrl) : "";

    return (
      <div className="col-span-12 lg:col-span-3">
        <div className="info-card">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {resolvedPhoto ? (
                <img id="emp-profile-avatar" src={resolvedPhoto} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg" />
              ) : (
                <div id="emp-profile-avatar" className="w-28 h-28 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-4xl border-4 border-blue-100 shadow-lg">
                  {profile ? profileInitial(profile) : DASH}
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <h2 id="emp-profile-name" className="text-2xl font-black mt-5">{profile ? profileName(profile) : DASH}</h2>
            <p id="emp-profile-designation" className="text-blue-600 font-semibold mt-1">{profile?.designation || DASH}</p>
            <div className="mt-4 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <Icon className="text-base">business_center</Icon>
              <span id="emp-profile-dept">{profile?.department || DASH}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

function PayrollCard({ payroll, onDownload }) {
  const p = payroll || {};
  const netPay = p.net_salary ?? p.netSalary ?? p.net_pay;
  const payPeriod = p.payroll_month ?? p.payPeriod;

  return (
    <div className="col-span-12">
      <div className="info-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Payslip</h3>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{payPeriod || "Current"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-semibold text-slate-500">Component</th>
                <th className="text-right py-2 font-semibold text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 pr-4 text-slate-700">Basic Salary</td>
                <td className="text-right py-2 font-mono font-medium">{formatINR(p.basic_salary)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-slate-700">HRA</td>
                <td className="text-right py-2 font-mono font-medium">{formatINR(p.hra)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-slate-700">Allowances</td>
                <td className="text-right py-2 font-mono font-medium">{formatINR(p.allowances)}</td>
              </tr>
              <tr className="border-t border-slate-300">
                <td className="py-2 pr-4 font-semibold text-slate-700">Gross Salary</td>
                <td className="text-right py-2 font-mono font-bold">{formatINR((p.basic_salary || 0) + (p.hra || 0) + (p.allowances || 0))}</td>
              </tr>
              <tr className="text-red-600">
                <td className="py-2 pr-4 text-slate-700">PF Deduction</td>
                <td className="text-right py-2 font-mono font-medium">-{formatINR(p.pf_deduction)}</td>
              </tr>
              <tr className="text-red-600">
                <td className="py-2 pr-4 text-slate-700">Tax Deduction</td>
                <td className="text-right py-2 font-mono font-medium">-{formatINR(p.tax_deduction)}</td>
              </tr>
              <tr className="text-red-600">
                <td className="py-2 pr-4 text-slate-700">Other Deductions</td>
                <td className="text-right py-2 font-mono font-medium">-{formatINR(p.other_deductions)}</td>
              </tr>
              <tr className="border-t-2 border-indigo-500 bg-indigo-50">
                <td className="py-3 pr-4 font-bold text-indigo-700">Net Salary</td>
                <td className="text-right py-3 font-mono font-black text-indigo-700 text-lg">{formatINR(netPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>Currency: {p.currency_code || "INR"}</span>
          <span className="mx-2">|</span>
          <span>Status: {p.status || "-"}</span>
          {p.generated_at && <><span className="mx-2">|</span><span>Generated: {p.generated_at}</span></>}
        </div>
        <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 w-full" onClick={onDownload}>
          <Icon>download</Icon>Download Payslip
        </button>
      </div>
    </div>
  );
}

function LeaveCard({ iconName, title, info, countId, subId, barId, iconBoxClass, barClass }) {
  return (
    <div className="info-card">
      <div className="flex items-center justify-between">
        <div className={iconBoxClass}><Icon className="text-3xl">{iconName}</Icon></div>
        <h2 id={countId} className="text-4xl font-black">{info.remaining}</h2>
      </div>
      <h3 className="font-bold text-lg mt-6">{title}</h3>
      <p id={subId} className="text-slate-500 mt-1 text-sm">{info.subtitle}</p>
      <div className="progress-bar mt-5">
        <div id={barId} className={barClass} style={{ width: `${info.width}%` }}></div>
      </div>
    </div>
  );
}

function LeaveCards({ balance }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <LeaveCard iconName="flight_takeoff" title="Annual Leave" info={leaveInfo(balance, "annual_leave", "used_annual")} countId="leave-annual-count" subId="leave-annual-sub" barId="leave-annual-bar" iconBoxClass="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600" barClass="progress-fill bg-blue-500" />
      <LeaveCard iconName="medical_services" title="Sick Leave" info={leaveInfo(balance, "sick_leave", "used_sick")} countId="leave-sick-count" subId="leave-sick-sub" barId="leave-sick-bar" iconBoxClass="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600" barClass="progress-fill bg-red-500" />
      <LeaveCard iconName="spa" title="Casual Leave" info={leaveInfo(balance, "casual_leave", "used_casual")} countId="leave-casual-count" subId="leave-casual-sub" barId="leave-casual-bar" iconBoxClass="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600" barClass="progress-fill bg-amber-500" />
    </div>
  );
}

function TasksCard({ tasks }) {
  return (
    <div className="col-span-12 xl:col-span-8">
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="text-2xl font-bold">Priority Tasks</h3>
          <button className="text-blue-600 font-semibold flex items-center gap-1" onClick={() => navTo("notifications", "../notifications/code.html")}>
            View All <Icon className="text-base">chevron_right</Icon>
          </button>
        </div>
        <div className="divide-y divide-slate-100" id="tasks-container">
          {tasks?.length ? tasks.map((task, index) => (
            <div className="border border-gray-200 rounded-xl p-4 mb-3" key={task.id || index}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg">{task.title || "Untitled Task"}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${taskStatusClass(task.status)}`}>{task.status || "Pending"}</span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{task.description || "No description"}</p>
              <div className="text-xs text-gray-500"><Icon className="align-middle">calendar_today</Icon> Due: {task.due_date || "No due date"}</div>
            </div>
          )) : <p className="p-8 text-slate-500 text-center">Loading tasks...</p>}
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }) {
  return (
    <div className="col-span-12 xl:col-span-4">
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="text-2xl font-bold">Manager Feedback</h3>
        </div>
        <p className="p-8 text-slate-500 text-center">No feedback yet.</p>
      </div>
    </div>
  );
}

function DashboardContent({ data, code, loadingAction, onAttendance, onBreakStart, onBreakStop, breakRunning, liveSeconds, onDownload }) {
  const profile = data?.profile;
  const payroll = data?.payroll || data?.salary || data?.payslip;

  return (
    <div className="corporate-content">

      <div className="grid grid-cols-12 gap-6">
        <ProfileCard profile={profile} />
        <AttendanceCard attendance={data?.todayAttendance} loadingAction={loadingAction} onAttendance={onAttendance} onBreakStart={onBreakStart} onBreakStop={onBreakStop} breakRunning={breakRunning} liveSeconds={liveSeconds} />
        <PayrollCard payroll={payroll} onDownload={onDownload} />
      </div>
      <LeaveCards balance={data?.leaveBalance} />
      <div className="grid grid-cols-12 gap-6 mt-6">
        <TasksCard tasks={data?.tasks} />
        <FeedbackCard feedback={data?.feedback} />
      </div>
    </div>
  );
}

function EmployeeDashboardApp() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ems_sidebar_collapsed') !== 'false');
  useEffect(() => { localStorage.setItem('ems_sidebar_collapsed', collapsed); }, [collapsed]);
  const [data, setData] = useState({});
  const [loadingAction, setLoadingAction] = useState("");
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);
  const code = useMemo(() => employeeCode(), []);

  function handleLogout() {
    const keys = ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    keys.forEach(k => { try { sessionStorage.removeItem(k); } catch (_) {} });
    logout();
  }

  function toggleSidebar() {
    setCollapsed(prev => !prev);
  }

  const loadDashboard = useCallback(async () => {
    const effectiveCode = code;
    try {
      const [dashboardData, profileData] = await Promise.all([
        fetchJsonSafe(`${apiBase()}/api/employees/${encodeURIComponent(effectiveCode)}/dashboard`),
        fetchJsonSafe(`${apiBase()}/api/employees/${encodeURIComponent(effectiveCode)}/profile`).catch(() => ({}))
      ]);
      setData({
        ...(dashboardData || {}),
        profile: mergeProfile(dashboardData?.profile, profileData)
      });
      window.EMS_refreshHeader?.();

      const att = dashboardData?.todayAttendance;
      if (att?.check_in && !att?.check_out) {
        const checkIn = String(att.check_in);
        const [hh, mm, ss] = checkIn.split(":").map(Number);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, ss || 0);
        const diff = Math.floor((now - start) / 1000);
        setLiveSeconds(diff);
      } else if (att?.check_in && att?.check_out) {
        const [cih, cim, cis] = String(att.check_in).split(":").map(Number);
        const [coh, com, cos] = String(att.check_out).split(":").map(Number);
        const checkInSecs = (cih || 0) * 3600 + (cim || 0) * 60 + (cis || 0);
        const checkOutSecs = (coh || 0) * 3600 + (com || 0) * 60 + (cos || 0);
        setLiveSeconds(Math.max(0, checkOutSecs - checkInSecs));
      } else {
        setLiveSeconds(0);
      }

      setBreakRunning((dashboardData?.todayBreaks || []).some((b) => b && !b.breakEnd));
    } catch (error) {
      console.error("Failed to load employee dashboard data:", error);
    }
  }, [code]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refreshDashboard = () => loadDashboard();
    window.addEventListener("ems-profile-updated", refreshDashboard);
    return () => window.removeEventListener("ems-profile-updated", refreshDashboard);
  }, [loadDashboard]);

  useEffect(() => {
    if (data.unreadNotifications === undefined) return;
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.textContent = data.unreadNotifications;
      badge.style.display = data.unreadNotifications > 0 ? "flex" : "none";
    }
    window.EMS_refreshSidebarBadges?.(data.unreadNotifications);
  }, [data.unreadNotifications]);

  useEffect(() => {
    if (data.todayAttendance?.check_in && !data.todayAttendance?.check_out) {
      const timer = setInterval(() => {
        setLiveSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data.todayAttendance?.check_in, data.todayAttendance?.check_out]);

  const submitAttendanceAction = useCallback(async (action, notes = "") => {
    const attendanceCode = code;
    setLoadingAction(action);
    try {
      const body = ["check-in"].includes(action) ? {} : { notes: notes || null };
      const response = await fetch(`${apiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/${action}`, {
        method: "POST",
        headers: authHeaders(),
        body: ["check-in"].includes(action) ? undefined : JSON.stringify(body)
      });
      if (!response.ok) throw new Error(String(response.status));
      notify("success", `${action === "check-in" ? "Checked in" : "Checked out"} at ${new Date().toLocaleTimeString()}`);
      await loadDashboard();
    } catch (error) {
      notify("error", `Could not ${action === "check-in" ? "check in" : "check out"}. Please try again.`);
      console.error("Attendance action failed:", error);
    } finally {
      setLoadingAction("");
    }
  }, [code, loadDashboard]);

  const breakStart = useCallback(async () => {
    const attendanceCode = code;
    try {
      await fetch(`${apiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/break/start`, {
        method: "POST",
        headers: authHeaders()
      });
      notify("info", "Break started");
      setBreakRunning(true);
    } catch (error) {
      notify("error", "Could not start break");
    }
  }, [code]);

  const breakStop = useCallback(async () => {
    const attendanceCode = code;
    try {
      await fetch(`${apiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/break/stop`, {
        method: "POST",
        headers: authHeaders()
      });
      notify("success", "Break ended");
      setBreakRunning(false);
    } catch (error) {
      notify("error", "Could not stop break");
    }
  }, [code]);

  const downloadPayslip = useCallback(async () => {
    const payCode = code;
    notify("info", "Downloading payslip...");
    try {
      const response = await fetch(`${apiBase()}/api/payroll/${encodeURIComponent(payCode)}/pdf`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `payslip_${code}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      notify("success", "Payslip PDF downloaded successfully!");
    } catch (error) {
      console.error(error);
      notify("error", "Failed to download payslip PDF.");
    }
  }, [code]);

  return (
    <div className="corporate-page">
      <Sidebar variant="vanilla" onLogout={handleLogout} collapsed={collapsed} />
      <div className={`corporate-main${collapsed ? ' sidebar-collapsed' : ''}`} id="main-content">
        <Header onToggleSidebar={toggleSidebar} />
        <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" style={{ display: "none" }}></div>
        <DashboardContent
          data={data}
          code={code}
          loadingAction={loadingAction}
          onAttendance={submitAttendanceAction}
          onDownload={downloadPayslip}
          onBreakStart={breakStart}
          onBreakStop={breakStop}
          breakRunning={breakRunning}
          liveSeconds={liveSeconds}
        />
      </div>
    </div>
  );
}

export default EmployeeDashboardApp;
