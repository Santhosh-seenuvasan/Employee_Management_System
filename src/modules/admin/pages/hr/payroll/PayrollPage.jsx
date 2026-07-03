import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function formatCurrency(num) {
  if (num == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
}

export default function PayrollPage() {
  const [payrollData, setPayrollData] = useState({ totalPayroll: 0, taxes: 0, bonus: 0, paidCount: 0, totalCount: 0, processing: 0 });
  const [disbursements, setDisbursements] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/payroll/summary`, { headers: getHeaders() }),
      fetch(`${base}/api/payroll/disbursements`, { headers: getHeaders() }),
    ])
      .then(([sumRes, disRes]) =>
        Promise.all([
          sumRes.ok ? sumRes.json() : Promise.resolve(null),
          disRes.ok ? disRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, dis]) => {
        if (s) setPayrollData({
          totalPayroll: s.total_gross ?? s.totalPayroll ?? 0,
          taxes: s.total_deductions ?? s.taxes ?? 0,
          bonus: s.bonus ?? 0,
          paidCount: s.paidCount ?? s.processedCount ?? 0,
          totalCount: s.totalCount ?? s.employeeCount ?? 0,
          processing: s.processing ?? 0,
        });
        setDisbursements(Array.isArray(dis) ? dis : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = disbursements.filter(d => {
    if (search) {
      const q = search.toLowerCase();
      const name = (d.employeeName || d.employee || d.fullName || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (deptFilter && (d.department || '').toLowerCase() !== deptFilter.toLowerCase()) return false;
    if (statusFilter && (d.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const progress = payrollData.totalCount > 0 ? Math.round((payrollData.paidCount / payrollData.totalCount) * 100) : 0;

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Payroll Overview</h1>
          <p>Manage employee compensation, tax compliance, and monthly disbursements.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Process Monthly Payroll
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-blue-50 text-blue-600"><span className="material-symbols-outlined">payments</span></span>
          </div>
          <p className="stat-card-label">Monthly Total Payroll</p>
          <h3 className="stat-card-value">{formatCurrency(payrollData.totalPayroll)}</h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +0% from last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-purple-50 text-purple-600"><span className="material-symbols-outlined">account_balance</span></span>
          </div>
          <p className="stat-card-label">Calculated Taxes</p>
          <h3 className="stat-card-value">{formatCurrency(payrollData.taxes)}</h3>
          <p className="text-sm text-slate-500 mt-2">Next filing soon</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-amber-50 text-amber-600"><span className="material-symbols-outlined">card_giftcard</span></span>
          </div>
          <p className="stat-card-label">Bonus Distributions</p>
          <h3 className="stat-card-value">{formatCurrency(payrollData.bonus)}</h3>
          <p className="text-sm text-blue-600 mt-2">Quarterly performance cycle</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon bg-green-50 text-green-600"><span className="material-symbols-outlined">group</span></span>
          </div>
          <p className="stat-card-label">Employees Paid</p>
          <h3 className="stat-card-value">
            {payrollData.paidCount} <span className="text-lg font-normal text-slate-500">/ {payrollData.totalCount}</span>
          </h3>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{progress}% processing complete</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Employee Disbursements</h3>
              <div className="flex gap-3 items-center">
                <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">All Departments</option>
                </select>
                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PROCESSING">Processing</option>
                </select>
                <button className="btn btn-secondary">Export CSV</button>
                <button className="btn btn-primary">Bulk Pay</button>
              </div>
            </div>

            <div className="table-search mb-6">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search by employee name..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button className="text-slate-500 hover:text-slate-700" onClick={() => setSearch('')}>
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Base Salary</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="payroll-table-body">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500">Loading payroll data...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500">No disbursements found</td></tr>
                  ) : (
                    filtered.map((d, i) => (
                      <tr key={d.id || i} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedEmployee(d)}>
                        <td className="px-6 py-4 font-medium">{d.employeeName || d.employee || d.fullName}</td>
                        <td className="px-6 py-4">{formatCurrency(d.baseSalary || d.base_salary)}</td>
                        <td className="px-6 py-4">{formatCurrency(d.deductions || 0)}</td>
                        <td className="px-6 py-4 font-semibold">{formatCurrency(d.netPay || d.net_pay || d.netSalary)}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${(d.status || '').toUpperCase() === 'PAID' ? 'present' : 'pending'}`}>
                            {d.status || 'Processing'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="content-card sticky top-24">
            <div className="content-card-header">
              <h3 className="content-card-title">Payslip Preview</h3>
            </div>
            <div id="payslip-preview-pane" className="p-6 text-center text-slate-500">
              {selectedEmployee ? (
                <div className="text-left">
                  <p className="font-bold text-slate-800">{selectedEmployee.employeeName || selectedEmployee.employee}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Base Salary</span><span>{formatCurrency(selectedEmployee.baseSalary || selectedEmployee.base_salary)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="text-red-500">-{formatCurrency(selectedEmployee.deductions || 0)}</span></div>
                    <div className="border-t pt-2 flex justify-between"><span className="font-semibold">Net Pay</span><span className="font-bold text-emerald-600">{formatCurrency(selectedEmployee.netPay || selectedEmployee.net_pay || selectedEmployee.netSalary)}</span></div>
                  </div>
                  <button className="btn btn-primary w-full mt-6">Download Payslip</button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl mb-4 block">receipt_long</span>
                  <p>Select an employee to preview their payslip</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PayrollPage.pageTitle = "Payroll Management";
