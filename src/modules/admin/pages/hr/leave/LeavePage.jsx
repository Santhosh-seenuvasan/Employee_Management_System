import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [stats, setStats] = useState({ onLeave: 0, pending: 0, coverage: '0%', trend: 'Low' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/leaves/stats`, { headers: getHeaders() }),
      fetch(`${base}/api/leaves`, { headers: getHeaders() }),
      fetch(`${base}/api/leaves/balances`, { headers: getHeaders() }),
    ])
      .then(([statsRes, leavesRes, balRes]) =>
        Promise.all([
          statsRes.ok ? statsRes.json() : Promise.resolve(null),
          leavesRes.ok ? leavesRes.json() : Promise.resolve([]),
          balRes.ok ? balRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, l, b]) => {
        if (s) setStats(s);
        setLeaves(Array.isArray(l) ? l : []);
        setBalances(Array.isArray(b) ? b : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLeaves = leaves.filter(lv => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (lv.employeeName || lv.employee || lv.fullName || '').toLowerCase();
    const type = (lv.leaveType || lv.type || '').toLowerCase();
    return name.includes(q) || type.includes(q);
  });

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Leave Management</h1>
          <p>Monitor department absences and manage employee requests.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">event_busy</span></span>
          </div>
          <p className="stat-card-label">TOTAL ON LEAVE</p>
          <h3 className="stat-card-value text-blue-600">{stats.onLeave}</h3>
          <p className="text-sm text-slate-500 mt-2">Currently out of office</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">pending_actions</span></span>
          </div>
          <p className="stat-card-label">PENDING REQUESTS</p>
          <h3 className="stat-card-value text-amber-500">{stats.pending}</h3>
          <p className="text-sm text-slate-500 mt-2">Awaiting HR approval</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">group_work</span></span>
          </div>
          <p className="stat-card-label">TEAM COVERAGE</p>
          <h3 className="stat-card-value text-emerald-600">{stats.coverage}</h3>
          <p className="text-sm text-slate-500 mt-2">Sufficient staff</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-purple-50 text-purple-600"><span className="material-symbols-outlined">trending_down</span></span>
          </div>
          <p className="stat-card-label">SICK LEAVE TREND</p>
          <h3 className="stat-card-value text-emerald-600">{stats.trend}</h3>
          <p className="text-sm text-slate-500 mt-2">Consistent with average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Pending Requests</h3>
              <button className="btn btn-secondary">View History</button>
            </div>
            <div className="p-6">
              <div className="table-search">
                <span className="material-symbols-outlined">search</span>
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="leaveTableBody">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500">Loading leave requests...</td></tr>
                  ) : filteredLeaves.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500">No pending requests</td></tr>
                  ) : (
                    filteredLeaves.map((lv, i) => (
                      <tr key={lv.id || i}>
                        <td className="px-6 py-4 font-medium">{lv.employeeName || lv.employee || lv.fullName}</td>
                        <td className="px-6 py-4">{lv.leaveType || lv.type || '—'}</td>
                        <td className="px-6 py-4">{lv.duration || lv.days || lv.totalDays || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${(lv.status || 'pending').toLowerCase() === 'approved' ? 'present' : (lv.status || '').toLowerCase() === 'rejected' ? 'absent' : 'pending'}`}>
                            {lv.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-primary">Approve</button>
                            <button className="btn btn-sm btn-secondary">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="content-card mt-6">
            <div className="content-card-header">
              <h3 className="content-card-title">Leave Balances</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Annual</th>
                    <th>Sick</th>
                    <th>Casual</th>
                    <th>Used</th>
                    <th>Remaining</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="leaveBalancesTableBody">
                  {balances.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-slate-500">No balance data available</td></tr>
                  ) : (
                    balances.map((b, i) => (
                      <tr key={b.id || i}>
                        <td className="px-6 py-4 font-medium">{b.employeeName || b.employee || b.fullName}</td>
                        <td className="px-6 py-4">{b.annual || b.annualLeave || 0}</td>
                        <td className="px-6 py-4">{b.sick || b.sickLeave || 0}</td>
                        <td className="px-6 py-4">{b.casual || b.casualLeave || 0}</td>
                        <td className="px-6 py-4">{b.used || b.usedLeaves || 0}</td>
                        <td className="px-6 py-4 font-semibold">{b.remaining || b.remainingLeaves || 0}</td>
                        <td className="px-6 py-4"><button className="btn btn-sm btn-secondary">View</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl hover:bg-slate-100"><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                  <div key={idx} className="font-semibold text-slate-400">{d}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i + 1} className={`p-3 rounded-xl ${i + 1 === new Date().getDate() ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="content-card" style={{ background: '#2563eb', color: 'white' }}>
            <div className="content-card-header">
              <h3 className="text-xl font-bold" style={{ color: 'white' }}>Leave Utilization</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-blue-100 mb-6">Engineering department has the highest leave utilization this month.</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engineering</span>
                    <span>78%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[78%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Marketing</span>
                    <span id="marketing-coverage">—</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

LeavePage.pageTitle = "Leave Management";
