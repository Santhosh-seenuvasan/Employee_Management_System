import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function OnboardingTrackingPage() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/onboarding/stats`, { headers: getHeaders() }),
      fetch(`${base}/api/onboarding`, { headers: getHeaders() }),
    ])
      .then(([statRes, recRes]) =>
        Promise.all([
          statRes.ok ? statRes.json() : Promise.resolve(null),
          recRes.ok ? recRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, recs]) => {
        if (s) setStats(s);
        setRecords(Array.isArray(recs) ? recs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    if (filter !== 'all') {
      const status = (r.status || '').toLowerCase();
      if (filter === 'pending' && status !== 'pending') return false;
      if (filter === 'inProgress' && status !== 'inprogress' && status !== 'in_progress') return false;
      if (filter === 'completed' && status !== 'completed') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = (r.employeeName || r.employee || r.fullName || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      const id = (r.employeeCode || r.employeeId || '').toLowerCase();
      if (!name.includes(q) && !dept.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  const progressWidth = p => {
    const val = Number(p || 0);
    return val >= 100 ? 'w-full' : val > 0 ? `w-[${val}%]` : 'w-0';
  };

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Employee Onboarding Tracker</h1>
          <p>Monitor onboarding progress and manage employee setup steps</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/admin-dashboard/onboarding/personal-details'}>
            <span className="material-symbols-outlined">person_add</span>
            Add Onboarding Record
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">group</span></span></div>
          <p className="stat-card-label">Total</p>
          <h3 className="stat-card-value">{stats.total}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">pending</span></span></div>
          <p className="stat-card-label">Pending</p>
          <h3 className="stat-card-value">{stats.pending}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-purple-50 text-purple-600"><span className="material-symbols-outlined">sync</span></span></div>
          <p className="stat-card-label">In Progress</p>
          <h3 className="stat-card-value">{stats.inProgress}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">check_circle</span></span></div>
          <p className="stat-card-label">Completed</p>
          <h3 className="stat-card-value">{stats.completed}</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap mb-6">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input type="text" placeholder="Search by name, ID, department..." className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px]"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'inProgress', label: 'In Progress' }, { key: 'completed', label: 'Completed' }].map(btn => (
            <button key={btn.key} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === btn.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setFilter(btn.key)}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Joining Date</th>
              <th>Current Step</th>
              <th>Progress</th>
              <th>Assigned HR</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="onboardingTableBody">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-16 text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin inline-block">progress_activity</span>
                  <p className="text-sm mt-2">Loading onboarding records...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-12 text-slate-500">No onboarding records found</td></tr>
            ) : (
              filtered.map((r, i) => {
                const p = Number(r.progress || r.progressPercentage || 0);
                const statusClass = (r.status || '').toLowerCase() === 'completed' ? 'present' : (r.status || '').toLowerCase() === 'inprogress' || (r.status || '').toLowerCase() === 'in_progress' ? 'pending' : 'absent';
                return (
                  <tr key={r.id || i}>
                    <td className="px-6 py-4 font-medium">{r.employeeName || r.employee || r.fullName}</td>
                    <td className="px-6 py-4">{r.department || '—'}</td>
                    <td className="px-6 py-4">{r.joiningDate || r.joinDate || r.join_date || '—'}</td>
                    <td className="px-6 py-4">{r.currentStep || r.step || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{p}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{r.assignedHR || r.hrRepresentative || '—'}</td>
                    <td className="px-6 py-4"><span className={`status-badge ${statusClass}`}>{r.status || 'Pending'}</span></td>
                    <td className="px-6 py-4"><button className="btn btn-sm btn-secondary">View</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="table-actions">
          <p className="text-sm text-slate-500">Showing {filtered.length} records</p>
          <div className="flex gap-2" id="paginationBtns">
            <button className="btn btn-sm btn-secondary">Previous</button>
            <button className="btn btn-sm btn-primary">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

OnboardingTrackingPage.pageTitle = "HR Pulse - Onboarding Tracking";
