import { useCallback, useEffect, useMemo, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";

  function apiBase() {
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

  function formatDate(value) {
    if (!value) return "--";
    try {
      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (_) {
      return value;
    }
  }

  function monthTitle() {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " Attendance Log";
  }

  function AttendanceRow({ record }) {
    const date = record.workDate || record.work_date || "";
    const checkIn = record.checkIn || record.check_in || "--:--";
    const checkOut = record.checkOut || record.check_out || "--:--";
    const hours = record.totalHours || record.total_hours || 0;
    const status = record.status || "Unknown";
    const statusClass = status === "On Time" || status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700";

    return (
      <tr className="hover:bg-slate-50">
        <td className="px-8 py-5">{formatDate(date)}</td>
        <td className="px-8 py-5">{checkIn}</td>
        <td className="px-8 py-5">{checkOut}</td>
        <td className="px-8 py-5 font-medium">{hours ? `${hours} hrs` : "--"}</td>
        <td className="px-8 py-5"><span className={`px-4 py-1 rounded-full text-xs ${statusClass}`}>{status}</span></td>
      </tr>
    );
  }

  function AttendanceViewApp() {
    const [summary, setSummary] = useState({});
    const [records, setRecords] = useState([]);
    const [query, setQuery] = useState("");

    const loadAttendance = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;

      try {
        const response = await fetch(`${apiBase()}/api/employees/${encodeURIComponent(code)}/attendance`, {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error("Failed to load attendance");
        const data = await response.json();
        setSummary(data || {});
        setRecords(data.records || []);
      } catch (error) {
        console.error("Error loading attendance:", error);
        window.EMS_Toast?.error?.("Could not load attendance data");
      }
    }, []);

    useEffect(() => {
      loadAttendance();
    }, [loadAttendance]);

    const filteredRecords = useMemo(() => {
      const value = query.trim().toLowerCase();
      if (!value) return records;
      return records.filter((record) => {
        const date = String(record.workDate || record.work_date || "").toLowerCase();
        const status = String(record.status || "").toLowerCase();
        return date.includes(value) || status.includes(value);
      });
    }, [records, query]);

    return (
      <CorporateShell title="Corporate EMS">
        <div className="p-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 font-medium">Current Streak</p>
                <p className="text-5xl font-bold">{summary.currentStreak || 0} Days</p>
              </div>
              <Icon className="text-6xl text-emerald-500">local_fire_department</Icon>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <p className="text-slate-500">Present Days</p>
              <p className="text-5xl font-bold mt-4">{summary.presentDays || 0}</p>
              <p className="text-emerald-600 text-sm">out of 22 working days</p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <p className="text-slate-500">Late Days</p>
              <p className="text-5xl font-bold mt-4 text-orange-600">{summary.lateDays || 0}</p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <p className="text-slate-500">Avg. Check-in</p>
              <p className="text-5xl font-bold mt-4">{summary.averageCheckIn || "--:-- AM"}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 border-b bg-slate-50 font-medium">{monthTitle()}</div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
              <Icon className="text-slate-400 text-xl">search</Icon>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setQuery("")}>
                <Icon className="text-lg">close</Icon>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-8 py-5">Date</th>
                    <th className="text-left px-8 py-5">Check In</th>
                    <th className="text-left px-8 py-5">Check Out</th>
                    <th className="text-left px-8 py-5">Hours</th>
                    <th className="text-left px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.length ? filteredRecords.map((record, index) => (
                    <AttendanceRow record={record} key={record.id || index} />
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center text-slate-500">No attendance records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default AttendanceViewApp;
