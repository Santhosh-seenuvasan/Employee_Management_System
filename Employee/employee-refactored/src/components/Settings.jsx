import { useCallback, useEffect, useState } from "react";
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

  function notify(type, message) {
    const toast = window.EMS_Toast;
    if (toast && typeof toast[type] === "function") toast[type](message);
  }

  function SettingsApp() {
    const [theme, setTheme] = useState("light");
    const [language, setLanguage] = useState("en");
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [prefs, setPrefs] = useState({
      notifyLeaveStatus: false,
      notifyPayslip: false,
      notifyPerformanceReminders: false,
      notifyAnnouncements: false,
      notifyAttendanceReminders: false,
      digestFrequency: "realtime"
    });

    /* Load saved preferences from backend on mount */
    const loadPrefs = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;
      try {
        const res = await fetch(
          `${apiBase()}/api/employees/${encodeURIComponent(code)}/profile`,
          { headers: authHeaders() }
        );
        if (!res.ok) return;
        const data = await res.json();
        const p = data.preferences || {};
        setPrefs({
          notifyLeaveStatus:            !!p.notify_leave_status,
          notifyPayslip:                !!p.notify_payslip,
          notifyPerformanceReminders:   !!p.notify_performance_reminders,
          notifyAnnouncements:          !!p.notify_announcements,
          notifyAttendanceReminders:    !!p.notify_attendance_reminders,
          digestFrequency:              p.digest_frequency || "realtime"
        });
        setLoaded(true);
      } catch (err) {
        console.error("Failed to load preferences", err);
      }
    }, []);

    useEffect(() => { loadPrefs(); }, [loadPrefs]);

    function updatePref(field, value) {
      setPrefs((current) => ({ ...current, [field]: value }));
    }

    /* Persist to PUT /api/employees/{code}/preferences */
    async function savePrefs() {
      const code = employeeCode();
      if (!code) return notify("error", "Not logged in.");
      setSaving(true);
      try {
        const res = await fetch(
          `${apiBase()}/api/employees/${encodeURIComponent(code)}/preferences`,
          {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(prefs)
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        notify("success", "Preferences saved successfully.");
      } catch (err) {
        console.error("Failed to save preferences", err);
        notify("error", "Could not save preferences.");
      } finally {
        setSaving(false);
      }
    }

    function ThemeButton({ value, icon, label }) {
      return (
        <button
          type="button"
          className={`theme-btn btn btn-secondary flex flex-col items-center gap-2 py-4 ${theme === value ? "active" : ""}`}
          onClick={() => {
            setTheme(value);
            /* Apply theme immediately */
            if (value === "dark") document.documentElement.classList.add("dark");
            else if (value === "light") document.documentElement.classList.remove("dark");
            else {
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              document.documentElement.classList.toggle("dark", prefersDark);
            }
          }}
        >
          <Icon>{icon}</Icon>{label}
        </button>
      );
    }

    function Check({ field, label }) {
      return (
        <label className="inline-flex min-w-max cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" checked={prefs[field]} onChange={(e) => updatePref(field, e.target.checked)} />
          {label}
        </label>
      );
    }

    return (
      <CorporateShell title="Settings">
        <div className="page-header max-w-5xl mx-auto">
          <div className="page-header-content">
            <h1>Settings</h1>
            <p>Manage your user preferences and settings</p>
          </div>
        </div>

        <div className="content-card max-w-5xl mx-auto">
          <div className="content-card-header">
            <h3 className="content-card-title">User Preferences</h3>
            {!loaded && <span className="text-xs text-slate-400">Loading...</span>}
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="form-label">Appearance</label>
              <div className="grid grid-cols-3 gap-3">
                <ThemeButton value="light" icon="light_mode" label="Light" />
                <ThemeButton value="dark" icon="dark_mode" label="Dark" />
                <ThemeButton value="system" icon="computer" label="System" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="form-label">Language</label>
              <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Notification Preferences</h4>
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:min-w-0 md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0 text-sm font-medium text-slate-700">Leave & Attendance</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Check field="notifyLeaveStatus" label="Leave status" />
                    <Check field="notifyAttendanceReminders" label="Attendance reminders" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:min-w-0 md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0 text-sm font-medium text-slate-700">Payroll & Performance</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Check field="notifyPayslip" label="Payslip" />
                    <Check field="notifyPerformanceReminders" label="Performance" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:min-w-0 md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0 text-sm font-medium text-slate-700">General</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Check field="notifyAnnouncements" label="Announcements" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:min-w-0 md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0 text-sm font-medium text-slate-700">Digest Frequency</span>
                  <select className="form-select min-w-40 md:min-w-48" value={prefs.digestFrequency} onChange={(e) => updatePref("digestFrequency", e.target.value)}>
                    <option value="realtime">Instant</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button className="btn btn-primary" onClick={savePrefs} disabled={saving}>
                <Icon>save</Icon>{saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default SettingsApp;
