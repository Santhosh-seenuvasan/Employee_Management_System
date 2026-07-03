import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function AttendancePage() {
  const [summary, setSummary] = useState({ present: 0, onLeave: 0, late: 0, absent: 0, total: 0, rate: '0%' });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/attendance/summary`, { headers: getHeaders() }),
      fetch(`${base}/api/attendance`, { headers: getHeaders() }),
      fetch(`${base}/api/departments`, { headers: getHeaders() }),
    ])
      .then(([sumRes, attRes, deptRes]) =>
        Promise.all([
          sumRes.ok ? sumRes.json() : Promise.resolve(null),
          attRes.ok ? attRes.json() : Promise.resolve([]),
          deptRes.ok ? deptRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, att, depts]) => {
        if (s) setSummary({
          present: s.present ?? 0,
          onLeave: s.leave ?? s.onLeave ?? 0,
          late: s.late ?? 0,
          absent: s.absent ?? 0,
          total: s.total ?? ((s.present ?? 0) + (s.absent ?? 0) + (s.late ?? 0) + (s.leave ?? 0)),
          rate: s.percentage != null ? (String(s.percentage).includes('%') ? s.percentage : s.percentage + '%') : s.rate ?? '0%',
        });
        setRecords(Array.isArray(att) ? att : []);
        setDepartments(Array.isArray(depts) ? depts.map(d => d.name || d) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    const name = (r.employeeName || r.employee || r.fullName || '').toLowerCase();
    const q = search.toLowerCase();
    if (search && !name.includes(q)) return false;
    if (filterDept && (r.department || '').toLowerCase() !== filterDept.toLowerCase()) return false;
    if (filterStatus && (r.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="corporate-content">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-slate-500">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} &bull; Overall Attendance: <span className="font-semibold">{summary.rate}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-100">
          <p className="text-sm text-slate-500">Present</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{summary.present}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100">
          <p className="text-sm text-slate-500">On Leave</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">{summary.onLeave}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100">
          <p className="text-sm text-slate-500">Late</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{summary.late}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100">
          <p className="text-sm text-slate-500">Absent</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{summary.absent}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap mb-8">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 min-w-[150px]"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="On Leave">On Leave</option>
        </select>
        <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); }}>
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold">Today's Attendance</h3>
          <div className="text-sm text-slate-500">{summary.total} Total Employees</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                {['Employee', 'Employee ID', 'Check-in', 'Check-out', 'Hours', 'Status'].map(h => (
                  <th key={h} className="text-left px-8 py-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr id="loading-row">
                  <td colSpan="6" className="px-8 py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                    <p className="text-sm">Loading attendance records...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="px-8 py-16 text-center text-slate-400">No attendance records found</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="px-8 py-4 font-medium">{r.employeeName || r.employee || r.fullName}</td>
                    <td className="px-8 py-4 text-slate-500">{r.employeeId || r.employeeCode || r.employee_code || '—'}</td>
                    <td className="px-8 py-4">{r.checkIn || r.check_in || '—'}</td>
                    <td className="px-8 py-4">{r.checkOut || r.check_out || '—'}</td>
                    <td className="px-8 py-4">{r.hours || r.totalHours || r.workHours || '—'}</td>
                    <td className="px-8 py-4">
                      <span className={`status-badge ${(r.status || '').toLowerCase() === 'present' ? 'present' : (r.status || '').toLowerCase() === 'late' ? 'pending' : 'absent'}`}>
                        {r.status || '—'}
                      </span>
                    </td>
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

AttendancePage.pageTitle = "Attendance Management";
