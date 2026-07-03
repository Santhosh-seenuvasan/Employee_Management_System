import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import api from '../../../services/api';

Chart.register(...registerables);

function formatNumber(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(num) {
  if (num == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

function QuickCreateModal({ title, fields, onSave, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map(f => [f.name, f.value || '']))
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSave(values);
    onClose();
  }

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 99998,
          background: 'rgba(15,23,42,.45)',
          display: 'grid', placeItems: 'center', padding: '18px',
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          width: 'min(520px,100%)', background: '#fff', borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(15,23,42,.25)', padding: '22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ font: '800 20px Inter,system-ui,sans-serif', color: '#0f172a', margin: 0 }}>{title}</h2>
            <button type="button" onClick={onClose}
              style={{ border: 0, background: '#f1f5f9', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer' }}>
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            {fields.map(f => (
              <label key={f.name} style={{ display: 'grid', gap: '6px', font: '600 13px Inter,system-ui,sans-serif', color: '#475569' }}>
                {f.label}
                <input
                  name={f.name} type={f.type || 'text'} required
                  value={values[f.name]}
                  onChange={e => setValues(v => ({ ...v, [e.target.name]: e.target.value }))}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 14px', font: '500 14px Inter,system-ui,sans-serif' }}
                />
              </label>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={onClose}
                style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '12px', padding: '11px 16px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit"
                style={{ border: 0, background: '#2563eb', color: '#fff', borderRadius: '12px', padding: '11px 16px', fontWeight: 800, cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [dashError, setDashError] = useState(null);
  const [modal, setModal] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const prodChartRef = useRef(null);
  const prodChartInstance = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, perf, dept, projects] = await Promise.all([
          api.get('/api/dashboard/metrics').catch(() => null),
          api.get('/api/performance/reviews').catch(() => ({ members: [] })),
          api.get('/api/dashboard/attendance-statistics').catch(() => []),
          api.get('/api/projects').catch(() => []),
        ]);
        setMetrics(m);
        setTeamMembers(perf.members || []);
        setDeptStats(Array.isArray(dept) ? dept : []);
        setProjectsData(Array.isArray(projects) ? projects : []);
      } catch (err) {
        setDashError('Failed to load some dashboard data');
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (prodChartInstance.current) prodChartInstance.current.destroy();
    if (!deptStats.length || !prodChartRef.current) return;
    prodChartInstance.current = new Chart(prodChartRef.current, {
      type: 'bar',
      data: {
        labels: deptStats.map(d => d.department),
        datasets: [
          { label: 'Present', data: deptStats.map(d => d.presentCount || 0), backgroundColor: 'rgba(16,185,129,0.6)', borderColor: '#10b981', borderWidth: 1 },
          { label: 'Absent', data: deptStats.map(d => d.absentCount || 0), backgroundColor: 'rgba(239,68,68,0.6)', borderColor: '#ef4444', borderWidth: 1 },
          { label: 'Late', data: deptStats.map(d => d.lateCount || 0), backgroundColor: 'rgba(245,158,11,0.6)', borderColor: '#f59e0b', borderWidth: 1 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
    return () => { if (prodChartInstance.current) prodChartInstance.current.destroy(); };
  }, [deptStats]);

  function showToast(msg, type = 'success') {
    const colors = {
      success: ['#ecfdf5', '#047857', '#a7f3d0'],
      error: ['#fef2f2', '#b91c1c', '#fecaca'],
      info: ['#eff6ff', '#1d4ed8', '#bfdbfe'],
    };
    const [bg, fg, border] = colors[type] || colors.info;
    let host = document.getElementById('ems-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ems-toast-host';
      host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 32px));';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;`;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'all .2s ease'; setTimeout(() => t.remove(), 220); }, 2600);
  }

  async function handleNewTask(values) {
    try {
      await api.post('/api/tasks', { title: values.title, assignedTo: values.assignedTo, dueDate: values.dueDate, status: 'Pending' });
      showToast('Task created successfully');
    } catch { showToast('Failed to create task', 'error'); }
  }

  function openNewTaskModal() {
    setModal({
      title: 'New Task',
      fields: [
        { name: 'title', label: 'Task Title', type: 'text' },
        { name: 'assignedTo', label: 'Assigned To', type: 'text' },
        { name: 'dueDate', label: 'Due Date', type: 'date' },
      ],
      onSave: handleNewTask,
    });
  }

  const m = metrics;

  return (
    <>

      <div className="page-header">
        <div className="page-header-content">
          <h1>Management Dashboard</h1>
          <p>Key metrics, project status, and team performance at a glance.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => showToast('Export feature coming soon', 'info')}>
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
          <button className="btn btn-primary" onClick={openNewTaskModal}>
            <span className="material-symbols-outlined">add</span>
            New Task
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/employees')}>
          <div className="stat-card-header">
            <span className="stat-card-icon blue">
              <span className="material-symbols-outlined">group</span>
            </span>
          </div>
          <p className="stat-card-label">Total Employees</p>
          <h3 className="stat-card-value">{formatNumber(m?.employees?.count)}</h3>
          <p className="text-emerald-600 text-sm mt-2 font-semibold">+12 this month</p>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/employees')}>
          <div className="stat-card-header">
            <span className="stat-card-icon green">
              <span className="material-symbols-outlined">check_circle</span>
            </span>
          </div>
          <p className="stat-card-label">Active Employees</p>
          <h3 className="stat-card-value">{formatNumber(m?.employees?.count)}</h3>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/employees')}>
          <div className="stat-card-header">
            <span className="stat-card-icon purple">
              <span className="material-symbols-outlined">person_add</span>
            </span>
          </div>
          <p className="stat-card-label">New Joiners</p>
          <h3 className="stat-card-value">{formatNumber(m?.employees?.newJoiners30Days)}</h3>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/leave-requests')}>
          <div className="stat-card-header">
            <span className="stat-card-icon red">
              <span className="material-symbols-outlined">pending_actions</span>
            </span>
          </div>
          <p className="stat-card-label">Pending Leaves</p>
          <h3 className="stat-card-value text-red-600">{formatNumber(m?.leave?.pending)}</h3>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/approvals')}>
          <div className="stat-card-header">
            <span className="stat-card-icon amber">
              <span className="material-symbols-outlined">fact_check</span>
            </span>
          </div>
          <p className="stat-card-label">Pending Approvals</p>
          <h3 className="stat-card-value">{formatNumber(m?.approvals?.pending)}</h3>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon cyan">
              <span className="material-symbols-outlined">work</span>
            </span>
          </div>
          <p className="stat-card-label">Open Positions</p>
          <h3 className="stat-card-value">{formatNumber(m?.recruitment?.openPositions)}</h3>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon green">
              <span className="material-symbols-outlined">payments</span>
            </span>
          </div>
          <p className="stat-card-label">Monthly Payroll</p>
          <h3 className="stat-card-value">{formatCurrency(m?.payroll?.latestNet)}</h3>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/management/attendance')}>
          <div className="stat-card-header">
            <span className="stat-card-icon blue">
              <span className="material-symbols-outlined">schedule</span>
            </span>
          </div>
          <p className="stat-card-label">Attendance Rate</p>
          <h3 className="stat-card-value">{m?.attendance?.attendancePercentage != null ? `${m.attendance.attendancePercentage}%` : '0%'}</h3>
        </div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="content-card xl:col-span-2">
          <div className="content-card-header">
            <div>
              <h3 className="text-xl font-semibold">Team Productivity</h3>
              <p className="text-slate-500 mt-1">Weekly department performance</p>
            </div>
            <div className="text-emerald-600 font-bold">+12.4%</div>
          </div>
            <div className="h-72"><canvas ref={prodChartRef}></canvas></div>
        </div>

        <div className="space-y-6">
          <div className="content-card">
            <div className="content-card-header">
              <h4 className="font-bold">Projects</h4>
            </div>
            <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
              {projectsData.length === 0 ? (
                <p className="text-sm text-slate-500">{dashError || 'No projects found'}</p>
              ) : (
                projectsData.slice(0, 5).map(p => {
                  const statusColor = p.status === 'on_track' ? '#059669' :
                    p.status === 'at_risk' ? '#d97706' :
                    p.status === 'delayed' ? '#dc2626' : '#64748b';
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{p.projectManager || '—'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${p.progress || 0}%`, height: '100%', background: statusColor, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{p.progress || 0}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Last Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                  {dashError || 'No team data available'}
                </td>
              </tr>
            ) : teamMembers.map(m => (
              <tr key={m.id || m.name}>
                <td className="px-6 py-4 font-medium">{m.name}</td>
                <td className="px-6 py-4 text-slate-500">{m.role}</td>
                <td className="px-6 py-4 text-slate-500">{m.lastReview || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    m.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{m.statusLabel || m.status || 'Active'}</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <QuickCreateModal
          title={modal.title}
          fields={modal.fields}
          onSave={modal.onSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}