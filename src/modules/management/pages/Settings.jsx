import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { getAuthHeaders } from '../../../context/AuthContext';

function showToast(message, type) {
  const host = document.getElementById('ems-toast-host') || (() => {
    const h = document.createElement('div');
    h.id = 'ems-toast-host';
    h.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;';
    document.body.appendChild(h);
    return h;
  })();
  const t = document.createElement('div');
  t.textContent = message;
  const bg = type === 'error' ? '#fef2f2' : '#ecfdf5';
  const color = type === 'error' ? '#dc2626' : '#047857';
  const border = type === 'error' ? '#fecaca' : '#a7f3d0';
  t.style.cssText = `background:${bg};color:${color};border:1px solid ${border};border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 16px 36px rgba(15,23,42,.14);`;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

export default function Settings() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    companyName: '', companyEmail: '', companyPhone: '', companyAddress: '',
    timeZone: '', currency: '', companyLogoUrl: '',
    workingHours: '', shiftStartTime: '', shiftEndTime: '',
    lateMarkThreshold: '', overtimeRules: '', attendancePreferences: '',
    annualLeave: '', sickLeave: '', casualLeave: '', approvalWorkflow: '',
    passwordPolicy: '', sessionTimeout: '', loginRestrictions: '',
    emailNotifications: '', inAppNotifications: '', leaveNotifications: '',
    payrollNotifications: '', themeSettings: '',
    prefEmailAttendance: false, prefEmailLeave: false, prefEmailPayroll: false,
    prefInAppAlerts: false, prefInAppApprovals: false, prefInAppActivities: false,
    digestFrequency: 'instant',
  });

  useEffect(() => {
    const headers = getAuthHeaders();
    const code = (() => {
      try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return null; }
    })();
    if (!code) { setLoading(false); return; }
    api.get(`/api/employees/${encodeURIComponent(code)}/profile`)
      .then(data => {
        const p = data.preferences || {};
        setForm(f => ({
          ...f,
          prefEmailAttendance: !!p.notify_attendance_reminders,
          prefEmailLeave: !!p.notify_leave_status,
          prefEmailPayroll: !!p.notify_payslip,
          digestFrequency: p.digest_frequency || 'instant',
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const code = (() => {
        try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return null; }
      })();
      if (!code) throw new Error('User not found');
      await api.put(`/api/employees/${encodeURIComponent(code)}/preferences`, {
        notify_leave_status: form.prefEmailLeave,
        notify_payslip: form.prefEmailPayroll,
        notify_attendance_reminders: form.prefEmailAttendance,
        digest_frequency: form.digestFrequency,
      });
      showToast('Settings saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="corporate-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading settings...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const themeOptions = [
    { id: 'themeLight', val: 'light', icon: 'light_mode', label: 'Light' },
    { id: 'themeDark', val: 'dark', icon: 'dark_mode', label: 'Dark' },
    { id: 'themeSystem', val: 'system', icon: 'computer', label: 'System' },
  ];

  const notificationEmailPrefs = [
    { id: 'prefEmailAttendance', label: 'Attendance' },
    { id: 'prefEmailLeave', label: 'Leave' },
    { id: 'prefEmailPayroll', label: 'Payroll' },
  ];

  const notificationInAppPrefs = [
    { id: 'prefInAppAlerts', label: 'Alerts' },
    { id: 'prefInAppApprovals', label: 'Approvals' },
    { id: 'prefInAppActivities', label: 'Activities' },
  ];

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Application Settings</h1>
          <p>Company policies, preferences, and global configurations.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="content-card">
          <div className="content-card-header">
            <h3>User Preferences</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-xl)' }}>
            <div className="form-group">
              <label className="form-label">Appearance</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {themeOptions.map(b => (
                  <button key={b.id}
                    className={`btn btn-secondary${theme === b.val ? ' ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px' }}
                    onClick={() => setTheme(b.val)}>
                    <span className="material-symbols-outlined">{b.icon}</span>
                    <span style={{ fontSize: 12 }}>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="languageSelect">Language</label>
              <select id="languageSelect" className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Company Settings</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
            {[
              { id: 'companyName', label: 'Company Name', type: 'text' },
              { id: 'companyEmail', label: 'Company Email', type: 'email' },
              { id: 'companyPhone', label: 'Company Phone', type: 'text' },
              { id: 'companyAddress', label: 'Company Address', type: 'text' },
            ].map(f => (
              <div className="form-group" key={f.id}>
                <label className="form-label" htmlFor={f.id}>{f.label}</label>
                <input id={f.id} name={f.id} type={f.type} className="form-input" value={form[f.id]} onChange={handleChange} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ems-space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="timeZone">Time Zone</label>
                <input id="timeZone" name="timeZone" className="form-input" value={form.timeZone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="currency">Currency</label>
                <input id="currency" name="currency" className="form-input" value={form.currency} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="companyLogoUrl">Logo URL</label>
              <input id="companyLogoUrl" name="companyLogoUrl" className="form-input" value={form.companyLogoUrl} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Attendance Settings</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="workingHours">Working Hours</label>
              <input id="workingHours" name="workingHours" className="form-input" value={form.workingHours} onChange={handleChange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ems-space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="shiftStartTime">Shift Start</label>
                <input id="shiftStartTime" name="shiftStartTime" type="time" className="form-input" value={form.shiftStartTime} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="shiftEndTime">Shift End</label>
                <input id="shiftEndTime" name="shiftEndTime" type="time" className="form-input" value={form.shiftEndTime} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lateMarkThreshold">Late Mark Threshold</label>
              <input id="lateMarkThreshold" name="lateMarkThreshold" className="form-input" value={form.lateMarkThreshold} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="overtimeRules">Overtime Rules</label>
              <textarea id="overtimeRules" name="overtimeRules" className="form-textarea" rows={4} value={form.overtimeRules} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="attendancePreferences">Attendance Preferences</label>
              <textarea id="attendancePreferences" name="attendancePreferences" className="form-textarea" rows={3} value={form.attendancePreferences} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Leave Settings</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--ems-space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="annualLeave">Annual Leave</label>
                <input id="annualLeave" name="annualLeave" className="form-input" value={form.annualLeave} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sickLeave">Sick Leave</label>
                <input id="sickLeave" name="sickLeave" className="form-input" value={form.sickLeave} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="casualLeave">Casual Leave</label>
                <input id="casualLeave" name="casualLeave" className="form-input" value={form.casualLeave} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="approvalWorkflow">Approval Workflow</label>
              <textarea id="approvalWorkflow" name="approvalWorkflow" className="form-textarea" rows={4} value={form.approvalWorkflow} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Security Settings</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="passwordPolicy">Password Policy</label>
              <textarea id="passwordPolicy" name="passwordPolicy" className="form-textarea" rows={4} value={form.passwordPolicy} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sessionTimeout">Session Timeout (minutes)</label>
              <input id="sessionTimeout" name="sessionTimeout" className="form-input" value={form.sessionTimeout} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="loginRestrictions">Login Restrictions</label>
              <textarea id="loginRestrictions" name="loginRestrictions" className="form-textarea" rows={4} value={form.loginRestrictions} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="content-card lg:col-span-2">
          <div className="content-card-header">
            <h3>Notification Preferences</h3>
          </div>
          <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Email Notifications</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {notificationEmailPrefs.map(cb => (
                  <label key={cb.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" id={cb.id} name={cb.id} className="form-input" style={{ width: 16, height: 16 }} checked={form[cb.id]} onChange={handleChange} />
                    {cb.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">In-App Notifications</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {notificationInAppPrefs.map(cb => (
                  <label key={cb.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" id={cb.id} name={cb.id} className="form-input" style={{ width: 16, height: 16 }} checked={form[cb.id]} onChange={handleChange} />
                    {cb.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" htmlFor="digestFrequency" style={{ margin: 0 }}>Digest Frequency</label>
              <select id="digestFrequency" name="digestFrequency" className="form-select" value={form.digestFrequency} onChange={handleChange}>
                <option value="instant">Instant</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}