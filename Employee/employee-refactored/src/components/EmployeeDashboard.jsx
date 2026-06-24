import { useCallback, useEffect, useMemo, useState, memo } from "react";

const DASH = "\u2014";
const RUPEE = "\u20b9";

function apiBase() {
  return window.EMS_API?.LOGIN || window.location.origin;
}

function authHeaders() {
  return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
}

const DEV_EMPLOYEE_CODE = "EMP-IT-001";

function employeeCode() {
  return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "") || DEV_EMPLOYEE_CODE;
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

function formatToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
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

function to12Hour(timeValue) {
  if (!timeValue) return DASH;
  // Handles TIME or LocalTime objects from backend
  let str = String(timeValue);
  // If backend sends e.g. "09:15:00" or "14:30:00"
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeValue;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

function formatCheckInTime(attendance) {
  if (!attendance?.check_in) return DASH;
  return to12Hour(attendance.check_in);
}

function formatCheckOutTime(attendance) {
  if (!attendance?.check_out) return DASH;
  return to12Hour(attendance.check_out);
}

function attendanceStatus(attendance) {
  if (attendance?.check_out) {
    return { label: "Completed", className: "bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold" };
  }
  if (attendance?.check_in) {
    const now = new Date();
    const checkInOut = attendance.check_in + "";
    // Basic logic to determine if late is shown separately
    return { label: "Active Session", className: "bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold" };
  }
  return { label: "Not Started", className: "bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold" };
}

function isLateCheckIn(attendance) {
  if (!attendance?.check_in) return false;
  const str = String(attendance.check_in);
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  return hour >= 6 || (hour === 5 && minute >= 30);
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

const Header = memo(function Header() {
  return (
    <header className="corporate-header">
      <div className="header-left">
        <button id="sidebarToggle" className="header-toggle-btn" aria-label="Toggle sidebar">
          <Icon>menu</Icon>
        </button>
        <h1 className="header-title" id="page-header-title">Employee Dashboard</h1>
      </div>
      <div className="header-right">
        <div className="table-search" id="header-search" style={{ display: "none" }}>
          <Icon>search</Icon>
          <input type="text" placeholder="Search..." id="header-search-input" />
        </div>
        <div className="relative">
          <button id="notificationBtn" className="header-icon-btn" aria-label="Notifications" aria-haspopup="dialog" aria-expanded="false">
            <Icon>notifications</Icon>
            <span id="notificationBadge" className="header-badge" style={{ display: "none" }}>3</span>
          </button>
          <div id="notificationDropdown" className="notification-dropdown">
            <div className="notification-dropdown-header">
              <span className="notification-dropdown-title">Notifications</span>
              <button className="notification-dropdown-clear" id="markAllReadBtn">Mark all read</button>
            </div>
            <div className="notification-dropdown-list" id="notificationList"></div>
            <div className="notification-dropdown-footer">
              <a href="../notifications/code.html">View All Notifications</a>
            </div>
          </div>
        </div>
        <button className="header-icon-btn" aria-label="Help">
          <Icon>help</Icon>
        </button>
        <div className="header-divider"></div>
          <div className="header-profile">
            <div className="header-profile-info">
              <p id="header-name" className="header-profile-name">{DASH}</p>
              <p id="header-role" className="header-profile-role">{DASH}</p>
            </div>
            <button id="profileBtn" className="header-profile-avatar" aria-label="Profile menu" aria-haspopup="menu" aria-expanded="false">
              <img src="" alt="" id="headerProfileImg" style={{ display: "none" }} className="w-full h-full object-cover" />
              <span id="headerProfileFallback">{DASH}</span>
            </button>
            <div id="profileDropdown" className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar" id="dropdownAvatar">{DASH}</div>
              <div>
                <p id="dropdownName" className="font-bold text-slate-900">{DASH}</p>
                <p id="dropdownRole" className="text-sm text-slate-500">{DASH}</p>
              </div>
            </div>
            <div className="profile-dropdown-menu">
              <a href="../profile_settings/code.html" className="profile-dropdown-item" data-nav="profile"><Icon>person</Icon>My Profile</a>
              <a href="../settings/code.html" className="profile-dropdown-item" data-nav="settings"><Icon>settings</Icon>Settings</a>
              <a href="../notifications/code.html" className="profile-dropdown-item" data-nav="notifications"><Icon>notifications</Icon>Notifications</a>
              <div className="profile-dropdown-divider"></div>
              <button id="logoutBtn" className="profile-dropdown-item profile-dropdown-logout"><Icon>logout</Icon>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

const Sidebar = memo(function Sidebar() {
  return (
    <>
      <aside id="sidebar" className="corporate-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Icon>business_center</Icon></div>
          <div className="sidebar-logo-text">
            <h2>Corporate EMS</h2>
            <p id="sidebar-role-label">Employee Portal</p>
          </div>
        </div>
        <ul className="sidebar-nav" id="sidebar-menu"></ul>
      </aside>
      <div id="sidebarOverlay" className="sidebar-overlay"></div>
    </>
  );
});

function PageHeader({ profile, code }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1>Welcome back, <span id="emp-welcome-name">{profile ? profileName(profile) : DASH}</span></h1>
        <p id="emp-hero-subtitle">{profile ? "Employee Portal" : "Loading your profile..."}</p>
      </div>
      <div className="page-header-actions">
        <div className="content-card" style={{ padding: "12px 24px", margin: 0 }}>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Employee ID</p>
              <h4 id="emp-id-card" className="font-black">{profile?.employee_code || code || DASH}</h4>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div>
              <p className="text-xs text-slate-500">Joined</p>
              <h4 id="emp-join-date" className="font-black">{profile?.date_of_joining || profile?.joinDate || DASH}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  function ProfileCard({ profile }) {
    const photoUrl = profile?.photo_url || profile?.photoUrl;
    const resolvedPhoto = photoUrl ? (window.EMS_API?.LOGIN || window.location.origin) + photoUrl : "";

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

function AttendanceCard({ attendance, loadingAction, onAttendance, liveSeconds, onBreakStart, onBreakStop, breakRunning }) {
  const [notes, setNotes] = useState("");
  const status = attendanceStatus(attendance);
  const checkedIn = !!attendance?.check_in;
  const checkedOut = !!attendance?.check_out;
  const late = isLateCheckIn(attendance);

  const hours = Math.floor(liveSeconds / 3600);
  const minutes = Math.floor((liveSeconds % 3600) / 60);
  const seconds = liveSeconds % 60;
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(seconds).padStart(2, "0");
  const timerDisplay = `${hoursStr}:${minutesStr}:${secondsStr}`;

  return (
    <div className="col-span-12 lg:col-span-6">
      <div className="info-card">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold">Daily Attendance</h3>
            <p className="text-slate-500 mt-1" id="today-date">{formatToday()}</p>
          </div>
          <div className={status.className} id="session-status">
            {status.label}
            {late && <span className="ml-2 inline-flex items-center gap-1 text-amber-700"><Icon className="text-base">warning</Icon>Late</span>}
          </div>
        </div>
        <div className="text-center py-6">
          {checkedIn && !checkedOut ? (
            <>
              <h1 className="text-5xl font-black tracking-tight font-mono text-emerald-600" id="today-hours">{timerDisplay}</h1>
              <p className="text-slate-500 mt-3">Working time today</p>
            </>
          ) : (
            <>
              <h1 className="text-6xl font-black tracking-tight font-mono text-slate-900" id="today-hours">{attendance?.hours_worked || 0}h</h1>
              <p className="text-slate-500 mt-3">Current working hours today</p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-xs text-slate-500">Check In</p>
            <p id="today-check-in" className="font-semibold text-lg">{formatCheckInTime(attendance)}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-xs text-slate-500">Check Out</p>
            <p id="today-check-out" className="font-semibold text-lg">{formatCheckOutTime(attendance)}</p>
          </div>
        </div>
        {checkedIn && !checkedOut && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">Notes for today</p>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-2 text-sm"
              id="attendance-notes"
              rows="2"
              placeholder="Add any notes for today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}
        {checkedIn && !checkedOut && (
          <div className="mb-4">
            <button
              id="breakBtn"
              className="btn btn-outline w-full"
              onClick={breakRunning ? onBreakStop : onBreakStart}
            >
              <Icon>{breakRunning ? "timer_off" : "timer"}</Icon>
              {breakRunning ? "Stop Break" : "Break (1:00 PM)"}
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <button id="checkInBtn" className="btn btn-primary flex-1" disabled={loadingAction === "check-in" || checkedIn || checkedOut} onClick={() => onAttendance("check-in")}>
            <Icon>login</Icon>{loadingAction === "check-in" ? "Working..." : "Check In"}
          </button>
          <button id="checkOutBtn" className="btn btn-secondary flex-1" disabled={loadingAction === "check-out" || checkedOut} onClick={() => onAttendance("check-out", notes)}>
            <Icon>schedule</Icon>{loadingAction === "check-out" ? "Working..." : "Check Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollCard({ payroll, onDownload }) {
  const netPay = payroll?.netSalary ?? payroll?.net_salary ?? payroll?.net_pay;
  const payDate = payroll?.paymentDate || payroll?.payment_date || payroll?.payPeriod;

  return (
    <div className="col-span-12 lg:col-span-3">
      <div className="info-card" style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <div className="flex items-center justify-between">
            <Icon className="text-4xl text-white/80">account_balance_wallet</Icon>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Current Month</span>
          </div>
          <p className="mt-10 text-white/70 text-sm">Most Recent Deposit</p>
          <h1 id="emp-net-salary" className="text-5xl font-black mt-2 text-white">{formatINR(netPay)}</h1>
          <div className="mt-5 flex items-center gap-2 text-white/80 text-sm">
            <Icon className="text-base">calendar_today</Icon>
            <span id="emp-pay-date">{payDate ? `Paid on ${payDate}` : "Loading payroll..."}</span>
          </div>
        </div>
        <button className="mt-10 bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 w-full" onClick={onDownload}>
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

function DashboardContent({ data, code, loadingAction, onAttendance, onBreakStart, onBreakStop, breakRunning, liveSeconds }) {
  const profile = data?.profile;
  const payroll = data?.payroll || data?.salary || data?.payslip;

  return (
    <div className="corporate-content">
      <PageHeader profile={profile} code={code} />
      <div className="grid grid-cols-12 gap-6">
        <ProfileCard profile={profile} />
        <AttendanceCard attendance={data?.todayAttendance} loadingAction={loadingAction} onAttendance={onAttendance} onBreakStart={onBreakStart} onBreakStop={onBreakStop} breakRunning={breakRunning} liveSeconds={liveSeconds} />
        <PayrollCard payroll={payroll} onDownload={() => {}} />
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
  const [data, setData] = useState({});
  const [loadingAction, setLoadingAction] = useState("");
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);
  const code = useMemo(() => employeeCode(), []);

  const loadDashboard = useCallback(async () => {
    const effectiveCode = code || DEV_EMPLOYEE_CODE;
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
      } else {
        setLiveSeconds(0);
      }

      setBreakRunning((dashboardData?.todayBreaks || []).some((b) => b && !b.break_end));
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
    const attendanceCode = code || DEV_EMPLOYEE_CODE;
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
      setNotes("");
    }
  }, [code, loadDashboard]);

  const breakStart = useCallback(async () => {
    const attendanceCode = code || DEV_EMPLOYEE_CODE;
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
    const attendanceCode = code || DEV_EMPLOYEE_CODE;
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
    const payCode = code || DEV_EMPLOYEE_CODE;
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
      <Sidebar />
      <div className="corporate-main" id="main-content">
        <Header />
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
