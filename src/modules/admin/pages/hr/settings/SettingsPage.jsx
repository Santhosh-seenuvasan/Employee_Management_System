import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    notify_attendance: false, notify_leave: false,
    digest_frequency: 'instant', theme: 'light', language: 'en',
  });
  const [company, setCompany] = useState({ name: '', email: '', phone: '', address: '', timezone: '', currency: 'INR' });
  const [attendance, setAttendance] = useState({ workingHours: '8', shiftStart: '09:00', shiftEnd: '18:00', lateThreshold: '15' });
  const [leave, setLeave] = useState({ annual: '12', sick: '6', casual: '6' });
  const [security, setSecurity] = useState({ sessionTimeout: '30' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/settings`, { headers: getHeaders() }),
      fetch(`${base}/api/settings/company`, { headers: getHeaders() }),
      fetch(`${base}/api/settings/attendance`, { headers: getHeaders() }),
      fetch(`${base}/api/settings/leave`, { headers: getHeaders() }),
      fetch(`${base}/api/settings/security`, { headers: getHeaders() }),
    ])
      .then(([prefRes, coRes, attRes, levRes, secRes]) =>
        Promise.all([
          prefRes.ok ? prefRes.json() : Promise.resolve(null),
          coRes.ok ? coRes.json() : Promise.resolve(null),
          attRes.ok ? attRes.json() : Promise.resolve(null),
          levRes.ok ? levRes.json() : Promise.resolve(null),
          secRes.ok ? secRes.json() : Promise.resolve(null),
        ])
      )
      .then(([p, c, a, l, s]) => {
        if (p) setPreferences(f => ({ ...f, ...p }));
        if (c) setCompany(f => ({ ...f, ...c }));
        if (a) setAttendance(f => ({ ...f, ...a }));
        if (l) setLeave(f => ({ ...f, ...l }));
        if (s) setSecurity(f => ({ ...f, ...s }));
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const base = getApiBase();
      await Promise.all([
        fetch(`${base}/api/settings`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(preferences) }),
        fetch(`${base}/api/settings/company`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(company) }),
        fetch(`${base}/api/settings/attendance`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(attendance) }),
        fetch(`${base}/api/settings/leave`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(leave) }),
        fetch(`${base}/api/settings/security`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(security) }),
      ]);
    } catch (_) {}
    setSaving(false);
  }

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Application Settings</h1>
          <p>Database-backed company, attendance, leave, security, and notification settings.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">User Preferences</h3></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="form-label">Appearance</label>
              <div className="flex gap-3 mt-2">
                {[{ key: 'light', icon: 'light_mode', label: 'Light' }, { key: 'dark', icon: 'dark_mode', label: 'Dark' }, { key: 'system', icon: 'computer', label: 'System' }].map(opt => (
                  <button key={opt.key} type="button"
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${preferences.theme === opt.key ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    onClick={() => setPreferences(f => ({ ...f, theme: opt.key }))}>
                    <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Language</label>
              <select className="form-select mt-2" value={preferences.language}
                onChange={e => setPreferences(f => ({ ...f, language: e.target.value }))}>
                <option value="en">English</option>
                <option value="es">Espanol</option>
                <option value="fr">Francais</option>
                <option value="de">Deutsch</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">Company Settings</h3></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="form-label">Company Name</label>
              <input type="text" className="form-input" value={company.name} onChange={e => setCompany(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={company.email} onChange={e => setCompany(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={company.phone} onChange={e => setCompany(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows="2" value={company.address} onChange={e => setCompany(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Timezone</label>
                <input type="text" className="form-input" value={company.timezone} onChange={e => setCompany(f => ({ ...f, timezone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <input type="text" className="form-input" value={company.currency} onChange={e => setCompany(f => ({ ...f, currency: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Logo</label>
                <input type="file" className="form-input text-sm py-1.5" accept="image/*" />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">Attendance Settings</h3></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="form-label">Working Hours / Day</label>
              <input type="number" className="form-input" value={attendance.workingHours} onChange={e => setAttendance(f => ({ ...f, workingHours: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Shift Start</label>
                <input type="time" className="form-input" value={attendance.shiftStart} onChange={e => setAttendance(f => ({ ...f, shiftStart: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Shift End</label>
                <input type="time" className="form-input" value={attendance.shiftEnd} onChange={e => setAttendance(f => ({ ...f, shiftEnd: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Late Mark Threshold (min)</label>
              <input type="number" className="form-input" value={attendance.lateThreshold} onChange={e => setAttendance(f => ({ ...f, lateThreshold: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">Leave Settings</h3></div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Annual Leave</label>
                <input type="number" className="form-input" value={leave.annual} onChange={e => setLeave(f => ({ ...f, annual: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Sick Leave</label>
                <input type="number" className="form-input" value={leave.sick} onChange={e => setLeave(f => ({ ...f, sick: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Casual Leave</label>
                <input type="number" className="form-input" value={leave.casual} onChange={e => setLeave(f => ({ ...f, casual: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">Security Settings</h3></div>
          <div className="p-6">
            <div>
              <label className="form-label">Session Timeout (minutes)</label>
              <input type="number" className="form-input" value={security.sessionTimeout} onChange={e => setSecurity(f => ({ ...f, sessionTimeout: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3 className="content-card-title">Notification Preferences</h3></div>
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600"
                checked={preferences.notify_attendance} onChange={e => setPreferences(f => ({ ...f, notify_attendance: e.target.checked }))} />
              <span className="text-sm font-medium text-slate-700">Attendance Reminders</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600"
                checked={preferences.notify_leave} onChange={e => setPreferences(f => ({ ...f, notify_leave: e.target.checked }))} />
              <span className="text-sm font-medium text-slate-700">Leave Updates</span>
            </label>
            <div className="pt-4">
              <label className="form-label">Digest Frequency</label>
              <select className="form-select mt-2" value={preferences.digest_frequency}
                onChange={e => setPreferences(f => ({ ...f, digest_frequency: e.target.value }))}>
                <option value="instant">Instant</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

SettingsPage.pageTitle = "Settings";
