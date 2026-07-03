import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function PerformanceReviews() {
  const [data, setData] = useState({ cycle: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    api.get('/api/performance/reviews')
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cycle = data.cycle || {};
  const members = data.members || [];
  const roles = [...new Set(members.map(m => m.role).filter(Boolean))];

  const filtered = members.filter(m =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()))
    && (!filterStatus || (m.status === filterStatus || m.statusLabel === filterStatus))
    && (!filterRole || m.role === filterRole)
  );

  if (loading) {
    return (
      <div className="corporate-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading performance reviews...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Performance Reviews</h1>
          <p>Review cycles, team evaluations, and performance tracking.</p>
        </div>
      </div>

      <div className="content-card mb-6">
        <div style={{ padding: 'var(--ems-space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="font-semibold">{cycle.title || 'Performance Review Cycle'}</h3>
            <p className="text-slate-500 text-sm mt-1">
              {cycle.deadline ? `Deadline: ${cycle.deadline}` : ''}
              {cycle.deadline && cycle.pending != null ? ' • ' : ''}
              {cycle.pending != null ? `${cycle.pending} reviews pending` : ''}
            </p>
          </div>
          <span className={`px-5 py-2 rounded-2xl text-sm font-medium ${
            cycle.status === 'In Progress' || cycle.status === 'in_progress'
              ? 'bg-amber-100 text-amber-700'
              : cycle.status === 'Completed' || cycle.status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {cycle.statusLabel || cycle.status || 'In Progress'}
          </span>
        </div>
      </div>

      <div className="content-card">
        <div style={{ padding: 'var(--ems-space-lg) var(--ems-space-xl)', borderBottom: '1px solid var(--ems-border)', background: 'var(--ems-bg-subtle)', fontWeight: 600, fontSize: 14 }}>
          Team Members ({filtered.length} of {members.length})
        </div>

        <div style={{ padding: 'var(--ems-space-md) var(--ems-space-xl)', borderBottom: '1px solid var(--ems-border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px', minWidth: 180 }}>
              <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: 20 }}>search</span>
              <input
                type="text"
                placeholder="Search members..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#334155', background: 'transparent' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              )}
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', background: '#fff' }}
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', background: '#fff' }}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Review</th>
                <th style={{ textAlign: 'left', padding: '14px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '14px 24px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    No performance reviews found.
                  </td>
                </tr>
              )}
              {filtered.map(m => (
                <tr key={m.id || m.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: 14 }}>{m.name}</td>
                  <td style={{ padding: '14px 24px', color: '#64748b', fontSize: 14 }}>{m.role || '—'}</td>
                  <td style={{ padding: '14px 24px', color: '#64748b', fontSize: 14 }}>{m.lastReview || 'N/A'}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: m.status === 'completed' ? '#d1fae5' : m.status === 'in_progress' ? '#fef3c7' : '#f1f5f9',
                      color: m.status === 'completed' ? '#065f46' : m.status === 'in_progress' ? '#92400e' : '#475569',
                    }}>
                      {m.statusLabel || m.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <button style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
