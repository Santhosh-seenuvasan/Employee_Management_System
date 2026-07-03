import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchJson, EMS_API } from '../hooks/useAuth';
import useSort, { SortTh } from '../hooks/useSort';

Chart.register(...registerables);

export default function Attendance() {
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({ present: 0, absent: 0, late: 0, remote: 0, leave: 0, percentage: '0%' });
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [trends, setTrends] = useState([]);

  const { sorted: sortedRecords, sortKey: sortKeyR, sortDir: sortDirR, toggleSort: toggleSortR } = useSort(records);
  const { sorted: sortedCorrections, sortKey: sortKeyC, sortDir: sortDirC, toggleSort: toggleSortC } = useSort(corrections);

  const trendsChartRef = useRef(null);
  const lateChartRef = useRef(null);
  const chartInstances = useRef([]);

  useEffect(() => {
    Promise.all([
      fetchJson(`${EMS_API.LOGIN}/api/attendance/summary`),
      fetchJson(`${EMS_API.LOGIN}/api/management/attendance`),
      fetchJson(`${EMS_API.LOGIN}/api/attendance/corrections`),
      fetchJson(`${EMS_API.LOGIN}/api/management/attendance/trends?days=30`),
    ])
      .then(([metricsData, recordsData, correctionsData, trendsData]) => {
        setMetrics(metricsData);
        setRecords(Array.isArray(recordsData) ? recordsData : recordsData.content || []);
        setCorrections(Array.isArray(correctionsData) ? correctionsData : []);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];
    if (trends.length === 0) return;
    const labels = trends.map(t => t.date);
    const present = trends.map(t => t.present || 0);
    const absent = trends.map(t => t.absent || 0);
    const late = trends.map(t => t.late || 0);
    const onLeave = trends.map(t => t.on_leave || 0);

    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    if (trendsChartRef.current) {
      chartInstances.current.push(new Chart(trendsChartRef.current, {
        type: 'line',
        data: { labels, datasets: [
          { label: 'Present', data: present, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 },
          { label: 'Absent', data: absent, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 },
          { label: 'Late', data: late, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3 },
          { label: 'On Leave', data: onLeave, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3 },
        ]},
        options: { ...commonOpts, scales: { y: { beginAtZero: true } } },
      }));
    }

    if (lateChartRef.current) {
      chartInstances.current.push(new Chart(lateChartRef.current, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Late Arrivals', data: late, backgroundColor: 'rgba(245,158,11,0.6)', borderColor: '#f59e0b', borderWidth: 1 },
        ]},
        options: { ...commonOpts, scales: { y: { beginAtZero: true } } },
      }));
    }
  }, [trends]);

  if (loading) return <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20"><div className="loading">Loading...</div></main>;
  if (error) return <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20"><div className="error">Error: {error}</div></main>;

  const filteredRecords = sortedRecords.filter(r =>
    (!searchEmployee || (r.employeeName || '').toLowerCase().includes(searchEmployee.toLowerCase()))
    && (!filterDepartment || r.department === filterDepartment)
    && (!filterStatus || (r.status || '').toLowerCase() === filterStatus.toLowerCase())
    && (!filterDate || (r.date || '').startsWith(filterDate))
  );

  return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20">
        <div className="w-full max-w-none">

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {[
              { label: 'Present', value: metrics.present, color: 'text-emerald-600', icon: 'check_circle', iconColor: 'text-emerald-500' },
              { label: 'Absent',  value: metrics.absent,  color: 'text-red-600',     icon: 'cancel',       iconColor: 'text-red-500' },
              { label: 'Late',    value: metrics.late,    color: 'text-amber-600',   icon: 'schedule',     iconColor: 'text-amber-500' },
              { label: 'Remote',  value: metrics.remote,  color: 'text-blue-600',    icon: 'wifi_home',    iconColor: 'text-blue-500' },
              { label: 'On Leave',value: metrics.leave,   color: 'text-purple-600',  icon: 'event_busy',   iconColor: 'text-purple-500' },
              { label: 'Attendance %', value: metrics.percentage, color: 'text-slate-800', icon: 'analytics', iconColor: 'text-slate-500' },
            ].map(m => (
              <div key={m.label} className="attendance-card bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{m.label}</p>
                    <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                  <span className={`material-symbols-outlined ${m.iconColor} text-3xl`}>{m.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text" placeholder="Search employee..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchEmployee}
                  onChange={e => setSearchEmployee(e.target.value)}
                />
              </div>
              <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>
              <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="remote">Remote</option>
                <option value="leave">On Leave</option>
              </select>
              <input type="date" className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Attendance Records ({filteredRecords.length})</h3>
              <div className="flex items-center gap-2">
                {['picture_as_pdf', 'table_chart', 'download', 'print'].map(icon => (
                  <button key={icon} className="action-btn btn-view">
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <SortTh label="Employee" sortKey="employeeName" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Department" sortKey="department" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Date" sortKey="date" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Check-In" sortKey="checkIn" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Check-Out" sortKey="checkOut" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Work Hours" sortKey="workHours" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Status" sortKey="status" currentKey={sortKeyR} dir={sortDirR} onToggle={toggleSortR} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan="8" className="px-6 py-16 text-center text-slate-500">No attendance records found.</td></tr>
                  ) : filteredRecords.map((record, i) => (
                    <tr key={record.id || i}>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.checkIn || '--'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.checkOut || '--'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.workHours || '--'}</td>
                      <td className="px-6 py-4">
                        <span className={`status-badge status-${(record.status || '').toLowerCase()}`}>
                          {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="action-btn btn-view">
                          <span className="material-symbols-outlined text-sm">visibility</span> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Attendance Trends (30 days)</h3>
              <div className="h-72"><canvas ref={trendsChartRef}></canvas></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Late Arrival Trends</h3>
              <div className="h-72"><canvas ref={lateChartRef}></canvas></div>
            </div>
          </div>

          {/* Correction Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Correction Requests ({sortedCorrections.length})</h3>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">
                Bulk Approve Selected
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                      <input type="checkbox" />
                    </th>
                    <SortTh label="Employee" sortKey="employeeName" currentKey={sortKeyC} dir={sortDirC} onToggle={toggleSortC} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Date" sortKey="date" currentKey={sortKeyC} dir={sortDirC} onToggle={toggleSortC} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Request Type" sortKey="requestType" currentKey={sortKeyC} dir={sortDirC} onToggle={toggleSortC} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <SortTh label="Reason" sortKey="reason" currentKey={sortKeyC} dir={sortDirC} onToggle={toggleSortC} className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider" />
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedCorrections.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No correction requests.</td></tr>
                  ) : sortedCorrections.map((c, i) => (
                    <tr key={c.id || i}>
                      <td className="px-6 py-4"><input type="checkbox" /></td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.requestType}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{c.reason}</td>
                      <td className="px-6 py-4">
                        <button className="action-btn btn-view">
                          <span className="material-symbols-outlined text-sm">visibility</span> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
  );
}
