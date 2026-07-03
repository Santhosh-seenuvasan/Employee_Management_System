import { useState, useEffect, useCallback } from 'react';
import AttendanceCard from '../../../../employee/components/AttendanceCard.jsx';

function formatNumber(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(num) {
  if (num == null) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num);
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-600' },
};

function StatCard({ icon, color, label, value, trend, badge }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className={`stat-card-icon ${c.bg} ${c.icon}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        {trend && <span className="text-emerald-600 font-medium flex items-center gap-1 text-sm">
          <span className="material-symbols-outlined text-base">trending_up</span>{trend}
        </span>}
        {badge && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">{badge}</span>}
      </div>
      <p className="stat-card-label">{label}</p>
      <h3 className="stat-card-value">{value}</h3>
    </div>
  );
}

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function notify(type, message) {
  const toast = window.EMS_Toast;
  if (toast && typeof toast[type] === "function") toast[type](message);
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeProfile(profileData) {
  const source = Array.isArray(profileData) ? profileData[0] || {} : profileData?.profile || profileData?.employee || profileData || {};
  const fullName = firstDefined(source.full_name, source.fullName, source.name, source.employee_name);
  return {
    ...source,
    fullName,
    full_name: fullName,
    employee_code: firstDefined(source.employee_code, source.employeeCode, source.code, source.emp_code),
    department: firstDefined(source.department, source.department_name, source.departmentName, source.dept, source.department_title),
    designation: firstDefined(source.designation, source.designation_name, source.designationName, source.job_title, source.jobTitle, source.position, source.role),
  };
}

function ProfileCard({ profile }) {
  const photoUrl = profile?.photo_url || profile?.photoUrl || profile?.photo;
  const resolvedPhoto = photoUrl ? (getApiBase() || window.location.origin) + (String(photoUrl).startsWith('/') ? photoUrl : '/' + photoUrl) : "";
  return (
    <div className="col-span-12 lg:col-span-3">
      <div className="info-card">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {resolvedPhoto ? (
              <img src={resolvedPhoto} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-4xl border-4 border-blue-100 shadow-lg">
                {profile ? (profile.fullName || 'U')[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
          </div>
          <h2 className="text-2xl font-black mt-5">{profile?.fullName || '\u2014'}</h2>
          <p className="text-blue-600 font-semibold mt-1">{profile?.designation || '\u2014'}</p>
          <div className="mt-4 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">business_center</span>
            <span>{profile?.department || '\u2014'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [empDashboard, setEmpDashboard] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentHires, setRecentHires] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingAction, setLoadingAction] = useState("");
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);

  const code = (() => {
    try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return null; }
  })();

  const loadEmpDashboard = useCallback(async () => {
    const effectiveCode = code;
    if (!effectiveCode) return;
    try {
      const response = await fetch(`${getApiBase()}/api/employees/${encodeURIComponent(effectiveCode)}/dashboard`, { headers: getHeaders() });
      if (!response.ok) return;
      const dashboardData = await response.json();
      setEmpDashboard(dashboardData);
      const att = dashboardData?.todayAttendance;
      if (att?.check_in && !att?.check_out) {
        const [hh, mm, ss] = String(att.check_in).split(":").map(Number);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, ss || 0);
        setLiveSeconds(Math.floor((now - start) / 1000));
      } else if (att?.check_in && att?.check_out) {
        const [cih, cim, cis] = String(att.check_in).split(":").map(Number);
        const [coh, com, cos] = String(att.check_out).split(":").map(Number);
        setLiveSeconds(Math.max(0, ((coh || 0) * 3600 + (com || 0) * 60 + (cos || 0)) - ((cih || 0) * 3600 + (cim || 0) * 60 + (cis || 0))));
      } else {
        setLiveSeconds(0);
      }
      setBreakRunning((dashboardData?.todayBreaks || []).some((b) => b && !b.breakEnd));
    } catch (_) {}
  }, [code]);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/employees/${encodeURIComponent(code)}/dashboard`, { headers: getHeaders() }),
      fetch(`${base}/api/dashboard/metrics`, { headers: getHeaders() }),
      fetch(`${base}/api/dashboard/summary`, { headers: getHeaders() }),
      fetch(`${base}/api/departments`, { headers: getHeaders() }),
      fetch(`${base}/api/employees/recent-hires`, { headers: getHeaders() }),
      fetch(`${base}/api/activity/recent`, { headers: getHeaders() }),
      fetch(`${base}/api/employees/${encodeURIComponent(code)}/profile`, { headers: getHeaders() }),
    ])
      .then(([empRes, metricsRes, summaryRes, deptRes, hiresRes, activityRes, profileRes]) =>
        Promise.all([
          empRes.ok ? empRes.json() : Promise.resolve(null),
          metricsRes.ok ? metricsRes.json() : Promise.resolve(null),
          summaryRes.ok ? summaryRes.json() : Promise.resolve(null),
          deptRes.ok ? deptRes.json() : Promise.resolve([]),
          hiresRes.ok ? hiresRes.json() : Promise.resolve([]),
          activityRes.ok ? activityRes.json() : Promise.resolve([]),
          profileRes.ok ? profileRes.json() : Promise.resolve(null),
        ])
      )
      .then(([empData, metricsData, summaryData, depts, hires, activity, profileData]) => {
        setEmpDashboard(empData);
        setMetrics(metricsData);
        setSummary(summaryData);
        setDepartments(Array.isArray(depts) ? depts : []);
        setRecentHires(Array.isArray(hires) ? hires : []);
        setRecentActivity(Array.isArray(activity) ? activity : []);
        const dashboardProfile = empData?.profile || {};
        setProfile(normalizeProfile({ ...dashboardProfile, ...normalizeProfile(profileData || {}) }));
        const att = empData?.todayAttendance;
        if (att?.check_in && !att?.check_out) {
          const [hh, mm, ss] = String(att.check_in).split(":").map(Number);
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, ss || 0);
          setLiveSeconds(Math.floor((now - start) / 1000));
        } else if (att?.check_in && att?.check_out) {
          const [cih, cim, cis] = String(att.check_in).split(":").map(Number);
          const [coh, com, cos] = String(att.check_out).split(":").map(Number);
          setLiveSeconds(Math.max(0, ((coh || 0) * 3600 + (com || 0) * 60 + (cos || 0)) - ((cih || 0) * 3600 + (cim || 0) * 60 + (cis || 0))));
        } else {
          setLiveSeconds(0);
        }
        setBreakRunning((empData?.todayBreaks || []).some((b) => b && !b.breakEnd));
      })
      .catch(() => { setEmpDashboard(null); })
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    const att = empDashboard?.todayAttendance;
    if (att?.check_in && !att?.check_out) {
      const timer = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [empDashboard?.todayAttendance?.check_in, empDashboard?.todayAttendance?.check_out]);

  const submitAttendanceAction = useCallback(async (action, notes = "") => {
    const attendanceCode = code;
    setLoadingAction(action);
    try {
      const body = ["check-in"].includes(action) ? {} : { notes: notes || null };
      const response = await fetch(`${getApiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/${action}`, {
        method: "POST",
        headers: getHeaders(),
        body: ["check-in"].includes(action) ? undefined : JSON.stringify(body)
      });
      if (!response.ok) throw new Error(String(response.status));
      notify("success", `${action === "check-in" ? "Checked in" : "Checked out"} at ${new Date().toLocaleTimeString()}`);
      await loadEmpDashboard();
    } catch (error) {
      notify("error", `Could not ${action === "check-in" ? "check in" : "check out"}. Please try again.`);
    } finally {
      setLoadingAction("");
    }
  }, [code, loadEmpDashboard]);

  const breakStart = useCallback(async () => {
    const attendanceCode = code;
    try {
      await fetch(`${getApiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/break/start`, {
        method: "POST",
        headers: getHeaders()
      });
      notify("info", "Break started");
      setBreakRunning(true);
    } catch (_) {
      notify("error", "Could not start break");
    }
  }, [code]);

  const breakStop = useCallback(async () => {
    const attendanceCode = code;
    try {
      await fetch(`${getApiBase()}/api/employees/${encodeURIComponent(attendanceCode)}/attendance/break/stop`, {
        method: "POST",
        headers: getHeaders()
      });
      notify("success", "Break ended");
      setBreakRunning(false);
    } catch (_) {
      notify("error", "Could not stop break");
    }
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="page-header"><h1>Dashboard Overview</h1><p>Loading...</p></div>
        <div className="stats-grid">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="stat-card animate-pulse"><div className="h-8 bg-slate-200 rounded mb-2"></div><div className="h-4 bg-slate-200 rounded w-1/2"></div></div>)}
        </div>
      </div>
    );
  }

  const m = metrics || {};
  const s = summary || {};
  const emp = m.employees || {};
  const att = m.attendance || {};
  const rec = m.recruitment || {};
  const pay = m.payroll || {};
  const appr = m.approvals || {};
  const lev = m.leave || {};

  const chartDepts = departments.length > 0 ? departments : [];

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Dashboard Overview</h1>
          <p>Monitoring organizational health for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">
            <span className="material-symbols-outlined">download</span>
            Export Report
          </button>
          <button className="btn btn-primary" onClick={() => window.location.href = '/admin-dashboard/onboarding/personal-details'}>
            <span className="material-symbols-outlined">person_add</span>
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        <ProfileCard profile={profile} />
        <div className="col-span-12 lg:col-span-9">
          <AttendanceCard
            attendance={empDashboard?.todayAttendance}
            loadingAction={loadingAction}
            onAttendance={submitAttendanceAction}
            onBreakStart={breakStart}
            onBreakStop={breakStop}
            breakRunning={breakRunning}
            liveSeconds={liveSeconds}
          />
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="group" color="blue" label="Total Employees" value={formatNumber(emp.count || s.totalEmployees)} />
        <StatCard icon="check_circle" color="green" label="Active Today" value={formatNumber(att.present || s.presentToday)} />
        <StatCard icon="person_add" color="purple" label="New Joiners" value={formatNumber(emp.newJoiners30Days || s.newJoiners)} />
        <StatCard icon="pending_actions" color="red" label="Pending Leaves" value={formatNumber(lev.pending)} badge="Urgent" />
        <StatCard icon="fact_check" color="amber" label="Pending Approvals" value={formatNumber(appr.pending)} />
        <StatCard icon="work" color="cyan" label="Open Positions" value={formatNumber(rec.openPositions)} />
        <StatCard icon="payments" color="green" label="Monthly Payroll" value={formatCurrency(pay.latestNet)} />
        <StatCard icon="schedule" color="blue" label="Attendance Rate" value={att.attendancePercentage != null ? `${att.attendancePercentage}%` : '0%'} />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="content-card lg:col-span-2">
          <div className="content-card-header">
            <div>
              <h3 className="text-xl font-semibold">Department Distribution</h3>
              <p className="text-slate-500 mt-1">Employee count per department</p>
            </div>
            <select className="form-select">
              <option>All Locations</option>
              <option>Remote</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-6 px-6 pb-6" id="dept-chart-container">
            {chartDepts.length > 0 ? (
              chartDepts.map((dept, i) => {
                const count = dept.employeeCount || dept.count || 0;
                const maxCount = Math.max(...chartDepts.map(d => d.employeeCount || d.count || 0), 1);
                const height = (count / maxCount) * 100;
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500'];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
                    <span className="text-xs font-semibold text-slate-600">{count}</span>
                    <div className={`w-full rounded-t-lg ${colors[i % colors.length]}`} style={{ height: `${Math.max(height, 4)}%`, minHeight: '8px' }}></div>
                    <span className="text-xs text-slate-500 text-center truncate w-full">{dept.name}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 text-center text-slate-400 text-sm py-16">No department data available</div>
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="text-xl font-semibold">Recent Activity</h3>
            </div>
            <button className="text-blue-600 text-sm font-semibold">View All</button>
          </div>
          <div className="p-6 space-y-4 text-sm" id="recent-activity-container">
            {recentActivity.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-4">No recent activity</div>
            ) : (
              recentActivity.slice(0, 6).map((act, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm text-slate-500">{act.icon || 'notifications'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700">{act.title || act.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time || act.timestamp || ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Join Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="recent-hires-tbody">
            {recentHires.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">progress_activity</span>
                  No recent hires
                </td>
              </tr>
            ) : (
              recentHires.slice(0, 5).map((emp, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {((emp.fullName || emp.name || '')[0] || '?').toUpperCase()}
                      </div>
                      <span className="font-medium">{emp.fullName || emp.name || emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{emp.department || '—'}</td>
                  <td className="px-6 py-4">{emp.joinDate || emp.join_date || emp.joiningDate || '—'}</td>
                  <td className="px-6 py-4">
                    <button className="btn btn-sm btn-secondary">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-actions">
          <p className="text-sm text-slate-500">Showing {Math.min(recentHires.length, 5)} employees</p>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-secondary">Previous</button>
            <button className="btn btn-sm btn-primary">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

DashboardPage.pageTitle = "HR Admin Dashboard";
