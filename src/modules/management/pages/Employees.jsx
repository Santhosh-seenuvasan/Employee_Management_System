import { useState, useEffect, useMemo } from 'react';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/employees`)
      .then(setEmployees)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  const filtered = employees.filter(e =>
    (!filterDept || e.department === filterDept)
    && (!filterStatus || (e.status || '').toLowerCase() === filterStatus.toLowerCase())
    && (!search
      || (e.name && e.name.toLowerCase().includes(search.toLowerCase()))
      || (e.designation && e.designation.toLowerCase().includes(search.toLowerCase()))
      || (e.department && e.department.toLowerCase().includes(search.toLowerCase())))
  );

  if (loading) return (
    <div className="corporate-content">
      <div className="text-center text-slate-500 py-8">Loading employees...</div>
    </div>
  );

  if (error) return (
    <div className="corporate-content">
      <div className="text-center text-red-500 py-8">Error: {error}</div>
    </div>
  );

  return (
    <div className="corporate-content">

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Team Members ({filtered.length})</h1>
          <p>View and manage your direct reports</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="info-cards-grid" id="employeesGrid">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-8 col-span-full">No employees found.</div>
        ) : (
          filtered.map(emp => (
            <div key={emp.id} className="info-card">
              <div className="info-card-avatar">
                {(emp.name || 'NA').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'NA'}
              </div>
              <div className="info-card-body">
                <h3 className="info-card-name">{emp.name || 'Unknown'}</h3>
                <p className="info-card-detail">{emp.designation || ''}</p>
                <p className="info-card-detail text-slate-400">{emp.department || ''}</p>
              </div>
              <div className="info-card-status">
                <span className={`status-badge ${(emp.status || '').toLowerCase() === 'active' ? 'status-active' : 'status-inactive'}`}>
                  {emp.status || 'N/A'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



