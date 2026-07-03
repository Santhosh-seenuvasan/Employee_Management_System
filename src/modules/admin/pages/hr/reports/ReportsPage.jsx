import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function formatNumber(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

const headerLabels = {
  employee_code: 'Employee ID', full_name: 'Name', email: 'Email',
  phone_number: 'Phone', department: 'Department', designation: 'Designation',
  date_of_joining: 'Join Date', salary: 'Salary', status: 'Status',
  name: 'Name', code: 'Code', head_name: 'Head', employee_count: 'Employees',
  total_gross: 'Gross Pay', total_deductions: 'Deductions', total_net: 'Net Pay',
  work_date: 'Date', check_in: 'Check In', check_out: 'Check Out',
  total_hours: 'Hours', leave_type: 'Leave Type', reason: 'Reason',
  applied_on: 'Applied On', start_date: 'Start', end_date: 'End',
};

export default function ReportsPage() {
  const [kpis, setKpis] = useState({ totalEmployees: 0, attendanceRate: '0%', pendingLeave: 0, openPositions: 0 });
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, late: 0, absent: 0, percentage: '0%' });
  const [leaveStats, setLeaveStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('employees');
  const [exportFormat, setExportFormat] = useState('csv');
  const [previewData, setPreviewData] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/reports/kpis`, { headers: getHeaders() }),
      fetch(`${base}/api/attendance/summary`, { headers: getHeaders() }),
      fetch(`${base}/api/dashboard/metrics`, { headers: getHeaders() }),
    ])
      .then(([kpiRes, attRes, dashRes]) => Promise.all([
        kpiRes.ok ? kpiRes.json() : null,
        attRes.ok ? attRes.json() : null,
        dashRes.ok ? dashRes.json() : null,
      ]))
      .then(([kpi, att, dash]) => {
        if (kpi) setKpis(kpi);
        if (att) setAttendanceStats(att);
        if (dash?.leave) setLeaveStats(dash.leave);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function deriveHeaders(data) {
    if (!Array.isArray(data) || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map(k => headerLabels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  }

  useEffect(() => {
    const base = getApiBase();
    fetch(`${base}/api/reports/${reportType}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : { headers: [], rows: [] })
      .then(d => {
        const data = Array.isArray(d.rows || d) ? (d.rows || d) : [];
        setPreviewHeaders(d.headers || deriveHeaders(data));
        setPreviewData(data);
      })
      .catch(() => {});
  }, [reportType]);

  const filteredPreview = previewData.filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Reports & Analytics</h1>
          <p>Comprehensive insights and HR metrics dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-shadow hover:-translate-y-1" style={{ transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <p className="text-sm text-slate-500">Total Employees</p>
          <p className="text-5xl font-bold mt-2">{formatNumber(kpis.totalEmployees)}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-shadow hover:-translate-y-1" style={{ transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <p className="text-sm text-slate-500">Attendance Rate</p>
          <p className="text-5xl font-bold mt-2">{kpis.attendanceRate}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-shadow hover:-translate-y-1" style={{ transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <p className="text-sm text-slate-500">Pending Leave</p>
          <p className="text-5xl font-bold mt-2">{formatNumber(kpis.pendingLeave)}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-shadow hover:-translate-y-1" style={{ transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <p className="text-sm text-slate-500">Open Positions</p>
          <p className="text-5xl font-bold mt-2">{formatNumber(kpis.openPositions)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-semibold mb-4">Attendance Summary</h3>
          <div className="h-48 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 w-20">Present</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full flex items-center px-3 text-xs text-white font-semibold" style={{ width: `${Math.min(100, attendanceStats.present * 7)}%` }}>{attendanceStats.present}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 w-20">Late</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full flex items-center px-3 text-xs text-white font-semibold" style={{ width: `${Math.min(100, attendanceStats.late * 20)}%` }}>{attendanceStats.late}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 w-20">Absent</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div className="bg-red-400 h-full rounded-full flex items-center px-3 text-xs text-white font-semibold" style={{ width: `${Math.max(4, attendanceStats.absent * 25)}%` }}>{attendanceStats.absent}</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Rate: <span className="font-semibold text-slate-700">{attendanceStats.percentage}</span></p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-semibold mb-4">Leave Breakdown</h3>
          <div className="h-48 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm text-slate-500 flex-1">Approved</span>
              <span className="font-semibold">{leaveStats.approved}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-sm text-slate-500 flex-1">Pending</span>
              <span className="font-semibold">{leaveStats.pending}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="text-sm text-slate-500 flex-1">Rejected</span>
              <span className="font-semibold">{leaveStats.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg mb-4">Report Center</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-sm flex-1"
              value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="employees">Employee Directory</option>
              <option value="departments">Department Master</option>
              <option value="recruitment">Recruitment Funnel</option>
              <option value="payroll">Payroll Runs</option>
              <option value="attendance">Attendance Records</option>
              <option value="leaves">Leave Requests</option>
            </select>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {['csv', 'excel', 'pdf'].map(fmt => (
                <button key={fmt} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${exportFormat === fmt ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setExportFormat(fmt)}>{fmt.toUpperCase()}</button>
              ))}
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              <span className="material-symbols-outlined text-sm mr-1">download</span> Export
            </button>
            <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">
              <span className="material-symbols-outlined text-sm mr-1">print</span> Print
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input type="text" placeholder="Search in report preview..." className="flex-1 bg-transparent border-none outline-none text-sm"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {previewHeaders.length > 0 ? previewHeaders.map((h, i) => (
                  <th key={i} className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                )) : (
                  Array.from({ length: 4 }, (_, i) => <th key={i} className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Column {i + 1}</th>)
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPreview.length === 0 ? (
                <tr><td colSpan={previewHeaders.length || 4} className="px-6 py-12 text-center text-slate-400">No data to preview</td></tr>
              ) : (
                filteredPreview.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-6 py-4">{String(val ?? '—')}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

ReportsPage.pageTitle = "Reports & Analytics";
