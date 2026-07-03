import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const deptIcons = ['business', 'groups', 'account_balance', 'support_agent', 'campaign', 'code'];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({ totalDepartments: 0, totalEmployees: 0, departmentHeads: 0, averageDepartmentSize: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', head: '' });
  const [submitting, setSubmitting] = useState(false);
  const [headOptions, setHeadOptions] = useState([]);

  async function loadDepartments() {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, deptsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/departments/summary`, { headers: getHeaders() }),
        fetch(`${getApiBase()}/api/departments`, { headers: getHeaders() }),
      ]);
      if (!summaryRes.ok || !deptsRes.ok) throw new Error('Unable to load departments');
      const s = await summaryRes.json();
      setSummary(s);
      setDepartments(await deptsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHeads() {
    try {
      const res = await fetch(`${getApiBase()}/api/employees`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      const emps = await res.json();
      setHeadOptions(Array.isArray(emps) ? emps : []);
    } catch (_) {
      setHeadOptions([]);
    }
  }

  useEffect(() => { loadDepartments(); loadHeads(); }, []);

  function openModal() { setShowModal(true); }
  function closeModal() { setShowModal(false); setForm({ name: '', description: '', head: '' }); }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/api/departments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: form.name, description: form.description, headEmployeeCode: form.head }),
      });
      if (!res.ok) throw new Error('Could not create department');
      closeModal();
      await loadDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Department Management</h1>
          <p>Organize and manage company departments and teams</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary">
            <span className="material-symbols-outlined">download</span> Export
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <span className="material-symbols-outlined">add</span> Add Department
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">business</span></span>
          </div>
          <p className="stat-card-label">Total Departments</p>
          <h3 className="stat-card-value">{summary.totalDepartments}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">groups</span></span>
          </div>
          <p className="stat-card-label">Total Employees</p>
          <h3 className="stat-card-value">{summary.totalEmployees}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-purple-50 text-purple-600"><span className="material-symbols-outlined">leaderboard</span></span>
          </div>
          <p className="stat-card-label">Department Heads</p>
          <h3 className="stat-card-value">{summary.departmentHeads}</h3>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">trending_up</span></span>
          </div>
          <p className="stat-card-label">Avg. Dept. Size</p>
          <h3 className="stat-card-value">{summary.averageDepartmentSize}</h3>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No departments found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((dept, index) => (
            <div key={dept.id || index} className="info-card dept-card" style={{ transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="info-card-header">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-2xl">{deptIcons[index % deptIcons.length]}</span>
                </div>
                <span className="status-badge present">Active</span>
              </div>
              <h3 className="info-card-title">{escapeHtml(dept.name)}</h3>
              <p className="info-card-subtitle">{escapeHtml(dept.code || dept.shortName || '')}</p>
              <div className="info-card-meta">
                <span className="material-symbols-outlined">groups</span>
                {Number(dept.employeeCount || 0)} employees
              </div>
              <div className="info-card-footer">
                <p className="info-card-footer-text">Head: {escapeHtml(dept.headName || dept.head || 'No data available')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div id="addDeptModal" className="modal-overlay show" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Department</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <form id="addDeptForm" className="space-y-4" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Department Name</label>
                  <input type="text" name="name" className="form-input" placeholder="e.g., Engineering" required
                    value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" rows="3" className="form-textarea" placeholder="Brief description of the department..."
                    value={form.description} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department Head</label>
                  <select name="head" className="form-select" value={form.head} onChange={handleChange}>
                    <option value="">Select department head...</option>
                    {headOptions.map(emp => {
                      const code = emp.id || emp.employeeCode || emp.employee_code || '';
                      const name = emp.name || emp.fullName || emp.full_name || code;
                      return <option key={code} value={code}>{escapeHtml(name)}</option>;
                    })}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="submit" form="addDeptForm" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DepartmentsPage.pageTitle = "Departments";
