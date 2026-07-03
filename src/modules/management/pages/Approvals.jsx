import { useState, useEffect } from 'react';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';
import useSort, { SortTh } from '../hooks/useSort';

export default function Approvals() {
  const [allApprovals, setAllApprovals] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      fetchJson(`${EMS_API.LOGIN}/api/approvals`),
      fetchJson(`${EMS_API.LOGIN}/api/approvals/pending`),
    ])
      .then(([all, pend]) => { setAllApprovals(all); setPending(pend); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAction(id, action) {
    try {
      const res = await fetch(`${EMS_API.LOGIN}/api/approvals/${id}/${action}`, {
        method: 'PUT',
        headers: Auth.headers(),
        body: JSON.stringify({ comments: action === 'approve' ? 'Approved' : 'Rejected' }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Monthly expense aggregation ──
  const expenseMonths = {};
  allApprovals.forEach(a => {
    if (!a.createdAt || !a.amount) return;
    const m = new Date(a.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!expenseMonths[m]) expenseMonths[m] = 0;
    expenseMonths[m] += Number(a.amount);
  });
  const monthlyExpenses = Object.entries(expenseMonths)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  // ── Department-wise aggregation (via employee code prefix) ──
  const deptExpenses = {};
  allApprovals.forEach(a => {
    if (!a.requestedBy || !a.amount) return;
    const dept = a.requestedByDepartment || a.requesterDepartment || a.department || 'Unassigned';
    if (!deptExpenses[dept]) deptExpenses[dept] = 0;
    deptExpenses[dept] += Number(a.amount);
  });
  const departmentTotals = Object.entries(deptExpenses).sort((a, b) => b[1] - a[1]);

  const filtered = pending.filter(a =>
    (!filterType || a.requestType === filterType)
    && (!filterStatus || a.status === filterStatus)
    && (!search
      || (a.requestedBy && a.requestedBy.toLowerCase().includes(search.toLowerCase()))
      || (a.requestType && a.requestType.toLowerCase().includes(search.toLowerCase()))
      || (a.description && a.description.toLowerCase().includes(search.toLowerCase())))
  );

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered);

  if (loading) return (
    <div className="p-8">
      <div className="text-center text-slate-500 py-8">Loading approvals...</div>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="text-center text-red-500 py-8">Error: {error}</div>
    </div>
  );

  const totalExpenses = allApprovals.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  // ── Export helpers ──
  function exportCSV() {
    const headers = ['Requester', 'Type', 'Details', 'Amount', 'Submitted', 'Status'];
    const rows = allApprovals.map(a => [
      a.requestedBy, a.requestType, `"${(a.description || '').replace(/"/g, '""')}"`,
      a.amount || '', a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '', a.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'approvals_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const headers = ['Requester', 'Type', 'Details', 'Amount', 'Submitted', 'Status'];
    const rows = allApprovals.map(a => [
      a.requestedBy, a.requestType, a.description || '',
      a.amount || '', a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '', a.status
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob(['\uFEFF' + tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'approvals_report.xls'; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = allApprovals.map(a => `<tr><td>${a.requestedBy}</td><td>${a.requestType}</td><td>${a.description || ''}</td><td>${a.amount ? '₹'+Number(a.amount).toLocaleString() : '-'}</td><td>${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</td><td>${a.status}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>Approvals Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}
      h1{font-size:18px;margin-bottom:10px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#f0f0f0}
      </style></head>
      <body><h1>Approvals Report</h1>
      <table><thead><tr><th>Requester</th><th>Type</th><th>Details</th><th>Amount</th><th>Submitted</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:20px;font-size:11px;color:#666">Generated on ${new Date().toLocaleString()}</p>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div className="p-8 space-y-8">

      {/* ── Expense Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pending Approvals</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pending.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{allApprovals.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Departments</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{departmentTotals.length}</p>
        </div>
      </div>

      {/* ── Monthly Expenses & Department Wise ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Monthly Expenses</h3>
          <div className="space-y-3">
            {monthlyExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">No expense data.</p>
            ) : (
              monthlyExpenses.map(([month, total]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{month}</span>
                  <span className="text-sm font-semibold">₹{total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Department Wise</h3>
          <div className="space-y-3">
            {departmentTotals.length === 0 ? (
              <p className="text-sm text-slate-400">No department data.</p>
            ) : (
              departmentTotals.map(([dept, total]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{dept}</span>
                  <span className="text-sm font-semibold">₹{total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Pending Approvals Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b bg-slate-50 flex items-center justify-between">
          <span className="font-medium">Leave &amp; Expense Requests ({sorted.length})</span>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span> CSV
            </button>
            <button onClick={exportExcel} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span> Excel
            </button>
            <button onClick={exportPDF} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span> PDF
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 mx-6 my-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
            >
              <option value="">All Types</option>
              <option value="Leave">Leave</option>
              <option value="Expense">Expense</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <SortTh label="Requester" sortKey="requestedBy" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              <SortTh label="Type" sortKey="requestType" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              <SortTh label="Details" sortKey="description" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              <SortTh label="Amount" sortKey="amount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              <SortTh label="Submitted" sortKey="createdAt" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left px-8 py-5" />
              <th className="text-right px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-8 py-16 text-center text-slate-500">No approvals found.</td>
              </tr>
            ) : (
              sorted.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-8 py-5">{a.requestedBy}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {a.requestType}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500">{a.description}</td>
                  <td className="px-8 py-5 font-medium">
                    {a.amount ? `₹${Number(a.amount).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-8 py-5 text-slate-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(a.id, 'approve')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'reject')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}




