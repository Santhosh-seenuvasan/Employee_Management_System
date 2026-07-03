import { useCallback, useEffect, useMemo, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";
const RUPEE = "\u20b9";

  function apiBase() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function apiUrl(path) {
    return `${apiBase()}${path}`;
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function assetUrl(path) {
    if (!path) return "#";
    if (String(path).startsWith("http")) return path;
    return apiBase() + (String(path).startsWith("/") ? path : `/${path}`);
  }

  function showToast(message, type = "success") {
    const toast = window.EMS_Toast;
    if (toast && typeof toast[type] === "function") toast[type](message);
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount).replace("\u20b9", RUPEE);
  }

  function slipDate(slip) {
    return new Date(slip.paymentDate || slip.createdAt || Date.now());
  }

  function SalarySlipsApp() {
    const [slips, setSlips] = useState([]);
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadSalarySlips = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;

      setLoading(true);
      setError("");
      try {
        const [slipsRes, profileRes] = await Promise.all([
          fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/payslips`), { headers: authHeaders() }),
          fetch(apiUrl(`/api/employees/${encodeURIComponent(code)}/profile`), { headers: authHeaders() })
        ]);

        if (!slipsRes.ok) throw new Error(`Payslips server returned ${slipsRes.status}`);
        const loadedSlips = await slipsRes.json();
        setSlips((Array.isArray(loadedSlips) ? loadedSlips : []).sort((a, b) => slipDate(b) - slipDate(a)));

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile || profileData || {});
        }
      } catch (error) {
        console.error("Error loading salary slips:", error);
        setError("Error loading data. Please try again later.");
        showToast("Could not load salary slips from the server", "error");
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      loadSalarySlips();
    }, [loadSalarySlips]);

    const stats = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const yearSlips = slips.filter((slip) => slipDate(slip).getFullYear() === currentYear);
      const latest = slips[0] || {};
      return {
        monthlySalary: latest.netSalary || latest.amount || 0,
        ytd: yearSlips.reduce((sum, slip) => sum + Number(slip.netSalary || slip.amount || 0), 0),
        pf: yearSlips.reduce((sum, slip) => sum + Number(slip.pfAmount || slip.pfContribution || 0), 0),
        count: slips.length
      };
    }, [slips]);

    const base = Number(profile.baseSalary || 0);
    const hra = Number(profile.hra || 0);
    const allowance = Number(profile.specialAllowance || 0);

    return (
      <CorporateShell title="Salary Slips">
        <div className="max-w-7xl mx-auto">
          <div className="page-header">
            <div className="page-header-content">
              <h1>Salary Slips</h1>
              <p>View and download your monthly payslips</p>
            </div>
            <div className="page-header-actions">
              <button className="btn btn-secondary">
                <Icon>download</Icon> Download All
              </button>
            </div>
          </div>

          <div className="stats-grid mb-8">
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon blue"><Icon>account_balance_wallet</Icon></span></div>
              <p className="stat-card-label">Current Monthly Salary</p>
              <h3 className="stat-card-value">{formatMoney(stats.monthlySalary)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon green"><Icon>trending_up</Icon></span></div>
              <p className="stat-card-label">YTD Earnings</p>
              <h3 className="stat-card-value">{formatMoney(stats.ytd)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon purple"><Icon>savings</Icon></span></div>
              <p className="stat-card-label">PF Contribution (YTD)</p>
              <h3 className="stat-card-value">{formatMoney(stats.pf)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon amber"><Icon>description</Icon></span></div>
              <p className="stat-card-label">Available Payslips</p>
              <h3 className="stat-card-value">{stats.count}</h3>
            </div>
          </div>

          <div className="content-card mb-8">
            <div className="content-card-header">
              <h3 className="content-card-title">Current Salary Structure (Monthly)</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold text-slate-800">{formatMoney(base)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-semibold text-slate-800">{formatMoney(hra)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-semibold text-slate-800">{formatMoney(allowance)}</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl flex flex-col justify-center">
                  <p className="text-blue-700 text-sm font-medium mb-1">Gross Monthly Salary</p>
                  <h2 className="text-3xl font-bold text-blue-900">{formatMoney(base + hra + allowance)}</h2>
                  <p className="text-blue-600/60 text-xs mt-2">* Deductions like PF, PT, and TDS will be applied based on actuals.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title"><Icon className="text-primary mr-2">receipt_long</Icon>Payslip History</h3>
              <div className="flex gap-3">
                <select className="form-select">
                  <option>All Years</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Payslip</th>
                    <th className="text-left px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Period</th>
                    <th className="text-left px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Gross Salary</th>
                    <th className="text-left px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Net Salary</th>
                    <th className="text-left px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Status</th>
                    <th className="text-right px-6 py-4 text-xs uppercase text-slate-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr><td colSpan="6" className="px-6 py-10 text-center">Loading payslips...</td></tr>
                  )}
                  {!loading && error && (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-red-500 font-medium">{error}</td></tr>
                  )}
                  {!loading && !error && !slips.length && (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No salary slips found for your account.</td></tr>
                  )}
                  {!loading && !error && slips.map((slip, index) => {
                    const date = slipDate(slip);
                    const monthYear = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                    return (
                      <tr className="hover:bg-slate-50 transition border-b border-slate-100" key={slip.id || index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <Icon className="text-blue-600">receipt</Icon>
                            </div>
                            <div>
                              <p className="font-semibold">{monthYear}</p>
                              <p className="text-xs text-slate-500">Generated: {date.toLocaleDateString("en-IN")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{monthYear}</td>
                        <td className="px-6 py-4 font-semibold">{formatMoney(slip.grossSalary || 0)}</td>
                        <td className="px-6 py-4 font-semibold">{formatMoney(slip.netSalary || slip.amount || 0)}</td>
                        <td className="px-6 py-4"><span className="status-badge status-approved">Paid</span></td>
                        <td className="px-6 py-4 text-right">
                          <a href={assetUrl(slip.file_path || slip.filePath)} target="_blank" rel="noopener" className="btn btn-primary btn-sm">
                            <Icon>download</Icon>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-actions flex justify-between items-center px-6 py-4 border-t">
              <p className="text-sm text-slate-500">Showing {slips.length ? `1-${slips.length}` : "0"} of {slips.length} payslips</p>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-secondary" disabled>Previous</button>
                <button className="btn btn-sm btn-secondary">Next</button>
              </div>
            </div>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default SalarySlipsApp;
