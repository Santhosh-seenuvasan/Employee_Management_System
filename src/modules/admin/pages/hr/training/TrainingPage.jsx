import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function escapeHtml(v) {
  if (v == null) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function TrainingPage() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, activeEnrollments: 0, pendingCompletions: 0, completionRate: '0%' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/training/stats`, { headers: getHeaders() }),
      fetch(`${base}/api/training`, { headers: getHeaders() }),
    ])
      .then(([statRes, courseRes]) =>
        Promise.all([
          statRes.ok ? statRes.json() : Promise.resolve(null),
          courseRes.ok ? courseRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, c]) => {
        if (s) setStats(s);
        setCourses(Array.isArray(c) ? c : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const name = (c.name || c.title || c.courseName || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (categoryFilter && (c.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter && (c.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Training Management</h1>
          <p>Manage training catalog, employee enrollments, and completion tracking</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary"><span className="material-symbols-outlined">download</span> Export Report</button>
          <button className="btn btn-primary"><span className="material-symbols-outlined">add</span> Add Training</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">school</span></span>
            <span className="text-emerald-600 font-medium flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-base">trending_up</span>+8%
            </span>
          </div>
          <p className="stat-card-label">Total Courses</p>
          <h3 className="stat-card-value">{stats.totalCourses}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">group</span></span></div>
          <p className="stat-card-label">Active Enrollments</p>
          <h3 className="stat-card-value">{stats.activeEnrollments}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">pending_actions</span></span>
            <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded">Action</span>
          </div>
          <p className="stat-card-label">Pending Completions</p>
          <h3 className="stat-card-value">{stats.pendingCompletions}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><span className="stat-card-icon bg-purple-50 text-purple-600"><span className="material-symbols-outlined">verified</span></span></div>
          <p className="stat-card-label">Completion Rate</p>
          <h3 className="stat-card-value">{stats.completionRate}</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap mb-6">
        <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
        <input type="text" placeholder="Search training programs..." className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px]"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Onboarding">Onboarding</option>
          <option value="Compliance">Compliance</option>
          <option value="Skills Development">Skills Development</option>
          <option value="Leadership">Leadership</option>
        </select>
        <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
        <button className="text-slate-400 hover:text-slate-600" onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}>
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin inline-block">progress_activity</span>
          <p className="text-sm mt-3">Loading courses...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4 block">school</span>
              <p>No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c, i) => (
                <div key={c.id || i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{escapeHtml(c.name || c.title || c.courseName)}</h4>
                      <p className="text-xs text-slate-400">{c.category || 'General'}</p>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{escapeHtml(c.description)}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{c.enrollments || c.enrolledCount || 0} enrolled</span>
                    <span className={`status-badge ${(c.status || 'active').toLowerCase() === 'active' ? 'present' : (c.status || '').toLowerCase() === 'draft' ? 'pending' : 'absent'}`}>
                      {c.status || 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

TrainingPage.pageTitle = "Training";
