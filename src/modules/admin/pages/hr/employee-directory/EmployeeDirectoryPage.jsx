import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function EmployeeDirectoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/employees`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEmployees(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(emp => {
    const name = (emp.fullName || emp.name || emp.full_name || '').toLowerCase();
    const role = (emp.role || emp.designation || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const q = search.toLowerCase();
    if (search && !name.includes(q) && !role.includes(q) && !dept.includes(q) && !email.includes(q)) return false;
    if (statusFilter) {
      const s = (emp.status || 'active').toLowerCase();
      if (s !== statusFilter.toLowerCase()) return false;
    }
    if (deptFilter) {
      if (dept !== deptFilter.toLowerCase()) return false;
    }
    return true;
  });

  const deptBreakdown = employees.reduce((acc, emp) => {
    const d = emp.department || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Employee Directory</h1>
          <p>Manage your team members.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/admin-dashboard/onboarding/personal-details'}>
            <span className="material-symbols-outlined">person_add</span>
            Add New Employee
          </button>
        </div>
      </div>

      <div className="content-card mb-9">
        <div className="p-6 flex flex-col sm:flex-row gap-3">
          <div className="table-search flex-1 h-12">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search by name, role, department, email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select flex-1" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="form-select flex-1" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {Object.keys(deptBreakdown).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role & Dept</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="empTableBody">
            {loading ? (
              <tr id="loadingRow">
                <td colSpan="6" className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                    <p className="text-sm">Loading employees...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500">No employees found</td>
              </tr>
            ) : (
              filtered.map((emp, i) => (
                <tr key={emp.id || i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {((emp.fullName || emp.name || emp.full_name || '')[0] || '?').toUpperCase()}
                      </div>
                      <span className="font-medium">{emp.fullName || emp.name || emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">{emp.role || emp.designation || '—'}</p>
                    <p className="text-xs text-slate-400">{emp.department || '—'}</p>
                  </td>
                  <td className="px-6 py-4">{emp.joinDate || emp.join_date || emp.joiningDate || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${(emp.status || 'active').toLowerCase() === 'active' ? 'present' : 'absent'}`}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{emp.email || '—'}</td>
                  <td className="px-6 py-4">
                    <button className="btn btn-sm btn-secondary">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-actions">
          <p className="text-sm text-slate-500">Showing {filtered.length} employees</p>
          <div className="flex gap-2" id="paginationBtns">
            <button className="btn btn-sm btn-secondary">Previous</button>
            <button className="btn btn-sm btn-primary">Next</button>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Department Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(deptBreakdown).map(([dept, count]) => (
              <div key={dept} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-700">{count}</p>
                <p className="text-xs text-slate-500 mt-1">{dept}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

EmployeeDirectoryPage.pageTitle = "Employee Directory";