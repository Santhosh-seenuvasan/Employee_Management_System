import { useState, useEffect } from 'react';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';

export default function LeaveRequests() {
  const [data, setData] = useState({ pending: [], approved: [], stats: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function handleAction(request, action) {
    try {
      const res = await fetch(`${EMS_API.LOGIN}/api/approvals/${request.id}/${action}`, {
        method: 'PUT',
        headers: Auth.headers(),
        body: JSON.stringify({ comments: action === 'approve' ? 'Approved' : 'Rejected' }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setData(d => ({
        ...d,
        pending: d.pending.filter(r => r.id !== request.id),
        approved: action === 'approve' ? [request, ...d.approved] : d.approved,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/leave/requests`)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data.stats || [];
  const PENDING_REQUESTS = data.pending || [];
  const APPROVED_RECENT = data.approved || [];

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20">
        <div className="mx-auto max-w-[1400px] space-y-8">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Team Leave Requests</h1>
              <p className="text-slate-500">Review and approve leave requests from your team members.</p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary btn-sm">View Calendar</button>
              <button className="btn btn-primary btn-sm">Export Report</button>
            </div>
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {(stats.length ? stats : []).map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-3 ${s.bg} ${s.color} rounded-2xl text-3xl`}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </span>
                </div>
                <p className="text-slate-500">{s.label}</p>
                <h3 className="text-3xl font-bold mt-1">{s.value}</h3>
              </div>
            ))}
          </section>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input type="text" placeholder="Search by employee name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">All Types</option>
                <option value="sick">Sick Leave</option>
                <option value="vacation">Vacation</option>
                <option value="personal">Personal Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                <span className="material-symbols-outlined text-slate-600">filter_list</span>
              </button>
            </div>
          </div>

          {/* Pending Requests */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              Pending Approval
              <span className="ml-auto text-slate-500 text-sm font-normal">{PENDING_REQUESTS.length} requests</span>
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {PENDING_REQUESTS.map((req, i) => (
                <div key={req.name + i} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${req.bg} flex items-center justify-center font-bold ${req.text}`}>
                        {req.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{req.name}</h3>
                        <p className="text-slate-500 text-sm">{req.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`${req.typeClass} px-3 py-1 rounded-full text-xs font-medium`}>{req.type}</span>
                          <span className="text-slate-500 text-sm">{req.dates}</span>
                          <span className="text-slate-500 text-sm">• {req.days}</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-2">{req.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAction(req, 'approve')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check</span> Approve
                      </button>
                      <button onClick={() => handleAction(req, 'reject')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">close</span> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Approved */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                Recently Approved
              </h2>
              <a href="#" className="text-blue-600 font-semibold hover:underline text-sm">View All</a>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {APPROVED_RECENT.map((r, i) => (
                <div key={r.name + i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${r.bg} flex items-center justify-center font-bold ${r.text} text-sm`}>
                      {r.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-sm text-slate-500">{r.detail}</p>
                    </div>
                  </div>
                  <span className="leave-status-approved px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#dcfce7', color: '#166534' }}>
                    Approved
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
  );
}