import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/api/projects')
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const status = {
    onTrack: projects.filter(p => p.status === 'on_track').length,
    atRisk: projects.filter(p => p.status === 'at_risk').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
  };

  const filtered = projects.filter(p =>
    (!filterStatus || p.status === filterStatus)
    && (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Projects</h1>
          <p>Manage and monitor all active projects.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Search projects..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
          >
            <option value="">All Status</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-emerald-600 font-medium">On Track</p>
          <p className="text-5xl font-bold mt-3">{status.onTrack}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-amber-600 font-medium">At Risk</p>
          <p className="text-5xl font-bold mt-3">{status.atRisk}</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-red-600 font-medium">Delayed</p>
          <p className="text-5xl font-bold mt-3">{status.delayed}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        <h3 className="font-semibold mb-6">Active Projects ({filtered.length})</h3>
        <div className="space-y-6" id="active-projects-container">
          {filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No projects found.</p>}
          {filtered.map(p => (
            <div key={p.id || p.name} className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-slate-500">{p.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                p.status === 'on_track' ? 'bg-emerald-100 text-emerald-700' :
                p.status === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>{p.statusLabel || p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}