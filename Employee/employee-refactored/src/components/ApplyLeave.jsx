import { useCallback, useEffect, useMemo, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";
const DASH = "\u2014";

  function loginApi() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function notify(type, message) {
    const toast = window.EMS_Toast;
    if (toast && typeof toast[type] === "function") toast[type](message);
  }

  async function fetchJsonSafe(url) {
    if (typeof window.fetchJson === "function") return window.fetchJson(url);
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  function daysBetween(start, end) {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return "";
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  }

  function statValue(total, used) {
    if (total == null) return DASH;
    const remaining = Math.max(0, Number(total || 0) - Number(used || 0));
    return <>{remaining} <span className="text-sm font-medium text-slate-400">/ {total}</span></>;
  }

  function statusClass(status) {
    const value = String(status || "Pending").toLowerCase();
    if (value === "approved") return "approved";
    if (value === "rejected") return "rejected";
    return "pending";
  }

  function statusBackground(status) {
    const value = String(status || "Pending").toLowerCase();
    if (value === "approved") return "bg-green-50";
    if (value === "rejected") return "bg-red-50";
    return "bg-slate-50";
  }

  function LeaveTypeButton({ type, active, onSelect }) {
    const code = type.typeCode || type.type_code || type.type_name || type.typeName || "";
    const name = type.typeName || type.type_name || code;
    const quota = type.annualQuota ?? type.annual_quota;
    const paid = type.isPaid ?? type.is_paid;

    return (
      <button
        type="button"
        className={`leave-type-btn border rounded-2xl px-5 py-4 text-left transition ${active ? "border-primary ring-2 ring-blue-100 bg-blue-50 text-primary" : "border-slate-300 hover:border-slate-400 bg-white"}`}
        onClick={() => onSelect({ code, name })}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-slate-500 mt-1">{paid ? "Paid leave" : "Unpaid leave"}{quota != null ? ` - ${quota} days/year` : ""}</div>
          </div>
          <Icon className={`text-base ${active ? "text-primary" : "text-slate-400"}`}>{active ? "check_circle" : "radio_button_unchecked"}</Icon>
        </div>
      </button>
    );
  }

  function RecentRequest({ request }) {
    const start = request.startDate || request.start_date || "-";
    const end = request.endDate || request.end_date || "-";
    const days = request.numberOfDays || request.number_of_days || request.days || request.duration || 1;

    return (
      <div className={`p-4 ${statusBackground(request.status)} rounded-xl`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className={`status-badge ${statusClass(request.status)} text-xs`}>{request.status || "Pending"}</span>
            <h4 className="font-semibold mt-2">{request.leaveType || request.leave_type || "Leave"}</h4>
            <p className="text-sm text-slate-500">{start}{end !== start ? ` - ${end}` : ""}</p>
          </div>
          <span className="text-sm font-bold text-slate-700">{days} day{days > 1 ? "s" : ""}</span>
        </div>
        <p className="text-sm text-slate-600">{request.reason || ""}</p>
      </div>
    );
  }

  /* Default leave types used as fallback when the API returns nothing */
  const DEFAULT_LEAVE_TYPES = [
    { typeCode: "CL", typeName: "Casual Leave",    annualQuota: 12, isPaid: true  },
    { typeCode: "SL", typeName: "Sick Leave",       annualQuota: 12, isPaid: true  },
    { typeCode: "PL", typeName: "Privilege Leave",  annualQuota: 15, isPaid: true  },
    { typeCode: "LOP", typeName: "Loss of Pay",     annualQuota: null, isPaid: false },
  ];

  function ApplyLeaveApp() {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [balance, setBalance] = useState({});
    const [requests, setRequests] = useState([]);
    const [form, setForm] = useState({ startDate: "", endDate: "", duration: "full", reason: "", fileName: "No file selected" });
    const [submitting, setSubmitting] = useState(false);
    const days = useMemo(() => daysBetween(form.startDate, form.endDate), [form.startDate, form.endDate]);

    /* ── Leave types: employee backend /api/leave/types, fallback to defaults ── */
    const loadLeaveTypes = useCallback(async () => {
      try {
        const response = await fetch(`${loginApi()}/api/leave/types`, { headers: authHeaders() });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const types = await response.json();
        if (!Array.isArray(types) || !types.length) throw new Error("empty");
        setLeaveTypes(types);
        setSelectedType((current) => current || {
          code: types[0].typeCode || types[0].type_code || types[0].typeName || "",
          name: types[0].typeName || types[0].type_name || types[0].typeCode || ""
        });
      } catch {
        /* Fall back to built-in defaults so the form is still usable */
        setLeaveTypes(DEFAULT_LEAVE_TYPES);
        setSelectedType({ code: DEFAULT_LEAVE_TYPES[0].typeCode, name: DEFAULT_LEAVE_TYPES[0].typeName });
      }
    }, []);

    /* ── Leave balance + recent requests via employee dashboard endpoint ── */
    const loadLeaveData = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;
      try {
        /* Primary: GET /api/employees/{code}/leave  (returns {balance, requests}) */
        const leaveData = await fetchJsonSafe(
          `${loginApi()}/api/employees/${encodeURIComponent(code)}/leave`
        ).catch(() => null);

        if (leaveData) {
          setBalance(leaveData.balance || {});
          const reqs = Array.isArray(leaveData.requests) ? leaveData.requests : [];
          if (reqs.length) setRequests(reqs.slice(0, 5));
          return;
        }

        /* Fallback: pull balance from dashboard summary */
        const dash = await fetchJsonSafe(
          `${loginApi()}/api/employees/${encodeURIComponent(code)}/dashboard`
        ).catch(() => null);
        if (dash) {
          setBalance(dash.leaveBalance || {});
        }
      } catch (error) {
        console.error("Failed to load leave data", error);
      }
    }, []);

    useEffect(() => {
      loadLeaveTypes();
      loadLeaveData();
    }, [loadLeaveTypes, loadLeaveData]);

    function updateForm(field, value) {
      setForm((current) => ({ ...current, [field]: value }));
    }

    async function submitLeaveRequest(event) {
      event.preventDefault();
      const code = employeeCode();

      if (!code) return notify("error", "No employee code found for this session.");
      if (!selectedType) return notify("warning", "Please select a leave type.");
      if (!form.startDate || !form.endDate) return notify("warning", "Please choose a start and end date.");
      if (new Date(form.endDate) < new Date(form.startDate)) return notify("warning", "End date cannot be before start date.");
      if (!form.reason.trim()) return notify("warning", "Please add a reason for your leave.");

      setSubmitting(true);
      try {
        /* POST /api/employees/{code}/leave on the employee backend (8085) */
        const response = await fetch(`${loginApi()}/api/employees/${encodeURIComponent(code)}/leave`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            leaveType: selectedType.name,
            startDate: form.startDate,
            endDate: form.endDate,
            reason: form.reason.trim()
          })
        });

        if (!response.ok) throw new Error(await response.text());
        notify("success", "Leave request submitted successfully.");
        await loadLeaveData();
        setForm({ startDate: "", endDate: "", duration: "full", reason: "", fileName: "No file selected" });
      } catch (error) {
        console.error("Leave submit failed", error);
        notify("error", "Could not submit leave request.");
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <CorporateShell title="Apply Leave">
        <div className="max-w-7xl mx-auto">
          <div className="page-header">
            <div className="page-header-content">
              <h1>Apply for Leave</h1>
              <p>Request time off and view your leave balance</p>
            </div>
          </div>

          <div className="stats-grid mb-8">
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon blue"><Icon>sunny</Icon></span></div>
              <p className="stat-card-label">Casual Leave</p>
              <h3 className="stat-card-value">{statValue(balance.casual_leave, balance.used_casual)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon green"><Icon>spa</Icon></span></div>
              <p className="stat-card-label">Sick Leave</p>
              <h3 className="stat-card-value">{statValue(balance.sick_leave, balance.used_sick)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon purple"><Icon>celebration</Icon></span></div>
              <p className="stat-card-label">Privilege Leave</p>
              <h3 className="stat-card-value">{statValue(balance.privilege_leave || balance.annual_leave, balance.used_privilege || balance.used_annual)}</h3>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><span className="stat-card-icon amber"><Icon>schedule</Icon></span></div>
              <p className="stat-card-label">Pending Requests</p>
              <h3 className="stat-card-value">{requests.filter((r) => String(r.status || "").toLowerCase() === "pending").length || DASH}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="content-card">
                <div className="content-card-header">
                  <h3 className="content-card-title"><Icon className="text-blue-600 mr-2">edit_calendar</Icon>New Leave Request</h3>
                </div>
                <form className="space-y-6" onSubmit={submitLeaveRequest}>
                  <div>
                    <label className="form-label">Leave Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {leaveTypes.map((type, index) => {
                        const code = type.typeCode || type.type_code || type.typeName || "";
                        return <LeaveTypeButton key={code || index} type={type} active={selectedType?.code === code} onSelect={setSelectedType} />;
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-input mt-2" required value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-input mt-2" required value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Duration (days)</label>
                      <input type="number" className="form-input mt-2" value={days} readOnly />
                    </div>
                    <div>
                      <label className="form-label">Duration Type</label>
                      <select className="form-select mt-2" value={form.duration} onChange={(e) => updateForm("duration", e.target.value)}>
                        <option value="full">Full Day</option>
                        <option value="first_half">First Half</option>
                        <option value="second_half">Second Half</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Reason</label>
                    <textarea rows="4" className="form-textarea mt-2" placeholder="Please provide a reason for your leave request..." required value={form.reason} onChange={(e) => updateForm("reason", e.target.value)}></textarea>
                  </div>

                  <div>
                    <label className="form-label">Attach Documents (Optional)</label>
                    <div className="mt-2 flex items-center gap-4">
                      <label className="btn btn-secondary cursor-pointer">
                        <Icon>attach_file</Icon>
                        <span>Upload</span>
                        <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => updateForm("fileName", e.target.files?.[0]?.name || "No file selected")} />
                      </label>
                      <span className="text-sm text-slate-500">{form.fileName}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" className="btn btn-secondary" onClick={() => { setForm({ startDate: "", endDate: "", duration: "full", reason: "", fileName: "No file selected" }); setSelectedType(leaveTypes[0] ? { code: leaveTypes[0].typeCode || leaveTypes[0].typeName, name: leaveTypes[0].typeName } : null); }}>Reset</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      <Icon>send</Icon>{submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="content-card">
                <div className="content-card-header">
                  <h3 className="content-card-title">Recent Requests</h3>
                </div>
                <div className="space-y-4">
                  {requests.length ? requests.map((request, index) => <RecentRequest request={request} key={request.id || index} />) : (
                    <p className="text-sm text-slate-500">No recent requests found.</p>
                  )}
                </div>
              </div>

              <div className="content-card">
                <div className="content-card-header">
                  <h3 className="content-card-title"><Icon className="text-blue-600 mr-2">info</Icon>Leave Policy</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    "Casual leave must be applied at least 2 days in advance",
                    "Sick leave requires medical certificate for 3+ days",
                    "Privilege leave requires 7 days advance notice",
                    "Maximum 5 consecutive days per request"
                  ].map((item) => (
                    <div className="flex items-start gap-3" key={item}>
                      <Icon className="text-slate-400 text-sm mt-0.5">circle</Icon>
                      <p className="text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default ApplyLeaveApp;
