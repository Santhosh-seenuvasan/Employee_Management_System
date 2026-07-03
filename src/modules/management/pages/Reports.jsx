import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import api from '../../../services/api';

Chart.register(...registerables);

export default function Reports() {
  const [reportData, setReportData] = useState({ general: [], department: [], analytics: [] });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchProject, setSearchProject] = useState('');
  const [filterProjStatus, setFilterProjStatus] = useState('');
  const [searchReview, setSearchReview] = useState('');

  const statusChartRef = useRef(null);
  const statusChartInstance = useRef(null);
  const analyticsChartRef = useRef(null);
  const analyticsChartInstance = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/reports'),
      api.get('/api/projects'),
    ])
      .then(([reports, projectsData]) => {
        setReportData(reports);
        setProjects(projectsData || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const { analytics: anal } = reportData;

    if (statusChartRef.current) {
      if (statusChartInstance.current) statusChartInstance.current.destroy();

      const statusCounts = {};
      projects.forEach(p => {
        const s = (p.status || 'Unknown').toLowerCase();
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const labels = Object.keys(statusCounts);
      const data = Object.values(statusCounts);
      const colorMap = {
        completed: '#10b981', 'in progress': '#3b82f6', planning: '#f59e0b',
        pending: '#f59e0b', rejected: '#ef4444', cancelled: '#94a3b8',
      };
      const colors = labels.map(l => colorMap[l] || '#94a3b8');

      statusChartInstance.current = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
          cutout: '70%',
        },
      });
    }

    if (analyticsChartRef.current && anal.length) {
      if (analyticsChartInstance.current) analyticsChartInstance.current.destroy();

      analyticsChartInstance.current = new Chart(analyticsChartRef.current, {
        type: 'bar',
        data: {
          labels: anal.map(a => a.metric),
          datasets: [{
            label: 'Value',
            data: anal.map(a => typeof a.value === 'number' ? a.value : 0),
            backgroundColor: 'rgba(59,130,246,0.5)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    return () => {
      if (statusChartInstance.current) statusChartInstance.current.destroy();
      if (analyticsChartInstance.current) analyticsChartInstance.current.destroy();
    };
  }, [reportData]);

  if (loading) {
    return (
      <div className="corporate-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading reports...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="corporate-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#ef4444' }}>error_outline</span>
          <p style={{ color: '#ef4444', fontSize: 14, marginTop: 12 }}>{error}</p>
        </div>
      </div>
    );
  }

  const { general, department, analytics } = reportData;
  const projectCount = projects.length;
  const completedCount = general.filter(r => r.status === 'Completed').length;

  const filteredProjects = projects.filter(p =>
    (!filterProjStatus || (p.status || '').toLowerCase() === filterProjStatus.toLowerCase())
    && (!searchProject || (p.name || '').toLowerCase().includes(searchProject.toLowerCase()))
  );

  const filteredReviews = analytics.filter(r =>
    !searchReview || (r.metric || '').toLowerCase().includes(searchReview.toLowerCase())
  );

  const stats = [
    { label: 'Projects', value: projectCount, icon: 'folder_special', color: 'blue' },
    { label: 'Meetings', value: department.length, icon: 'groups', color: 'purple' },
    { label: 'Approvals', value: analytics.length, icon: 'task_alt', color: 'amber' },
    { label: 'Reviews', value: completedCount, icon: 'stars', color: 'green' },
  ];

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Reports & Analytics</h1>
          <p>Live database summary across projects, meetings, approvals, and performance reviews.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-header">
              <div className={`stat-card-icon ${s.color}`}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
            </div>
            <p className="stat-card-label">{s.label}</p>
            <p className="stat-card-value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        <div className="content-card">
          <div className="content-card-header">
            <h3>Project Status</h3>
          </div>
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={statusChartRef}></canvas>
          </div>
        </div>
        <div className="content-card">
          <div className="content-card-header">
            <h3>Analytics Summary</h3>
          </div>
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={analyticsChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="content-card">
          <div className="content-card-header">
            <h3>Recent projects ({filteredProjects.length})</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', pointerEvents: 'none' }}>search</span>
                <input
                  type="text" placeholder="Search projects..."
                  className="form-input" style={{ paddingLeft: 36 }}
                  value={searchProject}
                  onChange={e => setSearchProject(e.target.value)}
                />
              </div>
            </div>
            <select
              value={filterProjStatus}
              onChange={e => setFilterProjStatus(e.target.value)}
              className="form-select" style={{ width: 'auto' }}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredProjects.length === 0 ? (
              <div className="portal-empty" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#cbd5e1' }}>search_off</span>
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>No projects found.</p>
              </div>
            ) : (
              filteredProjects.map(p => {
                const s = (p.status || '').toLowerCase();
                const badgeClass = s === 'completed' ? 'present' : s === 'in progress' || s === 'planning' || s === 'pending' ? 'late' : '';
                const dateStr = p.startDate ? new Date(p.startDate).toLocaleDateString() : '';
                return (
                  <div key={p.id} className="table-container" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{dateStr} {p.projectManager ? '| ' + p.projectManager : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.progress != null && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{p.progress}%</span>
                      )}
                      <span className={`status-badge ${badgeClass}`}>{p.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Performance reviews ({filteredReviews.length})</h3>
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', pointerEvents: 'none' }}>search</span>
              <input
                type="text" placeholder="Search reviews..."
                className="form-input" style={{ paddingLeft: 36 }}
                value={searchReview}
                onChange={e => setSearchReview(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredReviews.length === 0 ? (
              <div className="portal-empty" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#cbd5e1' }}>search_off</span>
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>No reviews found.</p>
              </div>
            ) : (
              filteredReviews.map((item, idx) => (
                <div key={idx} className="table-container" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{item.metric}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.change}</p>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}