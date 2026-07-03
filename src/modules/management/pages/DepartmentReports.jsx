import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';
import useSort, { SortTh } from '../hooks/useSort';

Chart.register(...registerables);

export default function DepartmentReports() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [minHeadcount, setMinHeadcount] = useState('');
  const headcountChartRef = useRef(null);
  const attendanceChartRef = useRef(null);
  const chartInstances = useRef([]);

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/dashboard/attendance-statistics`)
      .then(setDepartments)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];
    if (!departments.length) return;
    const labels = departments.map(d => d.department);
    if (headcountChartRef.current) {
      chartInstances.current.push(new Chart(headcountChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Headcount', data: departments.map(d => d.headcount || 0), backgroundColor: 'rgba(99,102,241,0.6)', borderColor: '#6366f1', borderWidth: 1 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      }));
    }
    if (attendanceChartRef.current) {
      chartInstances.current.push(new Chart(attendanceChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Present', data: departments.map(d => d.presentCount || 0), backgroundColor: 'rgba(16,185,129,0.6)', borderColor: '#10b981', borderWidth: 1 },
            { label: 'Absent', data: departments.map(d => d.absentCount || 0), backgroundColor: 'rgba(239,68,68,0.6)', borderColor: '#ef4444', borderWidth: 1 },
            { label: 'Late', data: departments.map(d => d.lateCount || 0), backgroundColor: 'rgba(245,158,11,0.6)', borderColor: '#f59e0b', borderWidth: 1 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } },
      }));
    }
    return () => chartInstances.current.forEach(c => c.destroy());
  }, [departments]);

  const filtered = departments.filter(d =>
    (!search || (d.department || '').toLowerCase().includes(search.toLowerCase()))
    && (!minHeadcount || d.headcount >= Number(minHeadcount))
  );

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <>
      <div className="p-8 space-y-8">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Department Reports</h1>
            <p className="text-slate-500">Department-wise attendance and performance metrics</p>
          </div>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="deptCardsContainer">
          {filtered.map((d, i) => {
            const rate = d.headcount > 0 ? Math.round((d.presentCount / d.headcount) * 100) : 0;
            return (
              <div key={d.department || i} className="card p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow" style={{ cursor: 'pointer' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">corporate_fare</span>
                  <h3 className="font-semibold text-slate-800">{d.department || 'Unassigned'}</h3>
                </div>
                <div className="text-2xl font-bold text-slate-900">{d.headcount}</div>
                <p className="text-sm text-slate-500">{rate}% attendance</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-semibold mb-4">Department Headcount</h3>
            <div className="h-64"><canvas ref={headcountChartRef}></canvas></div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-semibold mb-4">Attendance by Department (30 days)</h3>
            <div className="h-64"><canvas ref={attendanceChartRef}></canvas></div>
          </div>
        </div>

        {/* Detailed Report Table */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8">
          <h3 className="font-semibold mb-6">Department Performance Summary ({sorted.length})</h3>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  id="list-search-input"
                  placeholder="Search departments..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder="Min headcount"
                value={minHeadcount}
                onChange={e => setMinHeadcount(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 w-36"
              />
            </div>
          </div>

          <table className="w-full" id="deptTable">
            <thead>
              <tr className="border-b bg-slate-50">
                <SortTh label="Department" sortKey="department" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
                <SortTh label="Headcount" sortKey="headcount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
                <SortTh label="Present" sortKey="presentCount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
                <SortTh label="Absent" sortKey="absentCount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
                <SortTh label="Late" sortKey="lateCount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              </tr>
            </thead>
            <tbody className="divide-y" id="deptTableBody">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-500">
                    No department data found
                  </td>
                </tr>
              )}
              {sorted.map((d, i) => (
                <tr key={d.department || i} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-4 font-semibold text-slate-800">{d.department || 'Unassigned'}</td>
                  <td className="px-8 py-4 text-slate-600">{d.headcount}</td>
                  <td className="px-8 py-4 text-emerald-600 font-semibold">{d.presentCount}</td>
                  <td className="px-8 py-4 text-red-600 font-semibold">{d.absentCount}</td>
                  <td className="px-8 py-4 text-amber-600 font-semibold">{d.lateCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
