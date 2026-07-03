import { useState, useEffect, useCallback } from 'react';
import { Auth, fetchJson, EMS_API } from '../hooks/useAuth';

function assetUrl(path) {
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return (window.EMS_API?.LOGIN || window.location.origin) + (String(path).startsWith('/') ? path : '/' + path);
}

function showToast(msg, type = 'success') {
  const toast = window.EMS_Toast;
  if (toast && typeof toast[type] === 'function') { toast[type](msg); return; }
  const colors = { success: ['#ecfdf5','#047857','#a7f3d0'], error: ['#fef2f2','#b91c1c','#fecaca'], info: ['#eff6ff','#1d4ed8','#bfdbfe'] };
  const [bg, fg, border] = colors[type] || colors.info;
  let host = document.getElementById('ems-toast-host');
  if (!host) { host = document.createElement('div'); host.id = 'ems-toast-host'; host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 32px));'; document.body.appendChild(host); }
  const t = document.createElement('div'); t.textContent = msg;
  t.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;`;
  host.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'all .2s ease'; setTimeout(() => t.remove(), 220); }, 2600);
}

export default function ProfileSettings() {
  const [form, setForm] = useState({
    fullName: Auth.fullName() || '',
    email: Auth.email() || '',
    phoneNumber: '',
    department: '',
    designation: '',
    workLocation: '',
    reportingManagerCode: '',
    dateOfBirth: '',
    dateOfJoining: '',
    photoUrl: '',
    residentialAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    digestFrequency: 'realtime',
    emailAlerts: false,
    pushAlerts: false,
    payrollAlerts: false,
  });

  const [emailNotif, setEmailNotif] = useState(true);
  const [inappNotif, setInappNotif] = useState(true);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);

  const code = Auth.employeeCode();

  const loadProfile = useCallback(() => {
    if (!code) return;
    fetchJson(`${EMS_API.LOGIN}/api/employees/${encodeURIComponent(code)}/profile`)
      .then(data => {
        const p = data.profile || {};
        setForm(f => ({
          ...f,
          fullName: p.full_name || f.fullName,
          email: p.email || f.email,
          phoneNumber: p.phone_number || '',
          department: p.department || '',
          designation: p.designation || '',
          workLocation: p.work_location || '',
          reportingManagerCode: p.reporting_manager_code || '',
          dateOfBirth: p.date_of_birth || '',
          dateOfJoining: p.date_of_joining || '',
          photoUrl: p.photo || '',
          residentialAddress: p.residential_address || '',
          emergencyContactName: p.emergency_contact_name || '',
          emergencyContactPhone: p.emergency_contact_phone || '',
        }));
        if (p.photo) setPhotoPreview(assetUrl(p.photo));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const initials = Auth.initials();

  function profileInitial() {
    const name = form.fullName || Auth.fullName() || '';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'NA';
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !code) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo max 5 MB'); return; }

    const upload = new FormData();
    upload.append('photo', file);

    const token = Auth.token();
    try {
      const response = await fetch(`${EMS_API.LOGIN}/api/employees/${encodeURIComponent(code)}/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: upload
      });
      if (!response.ok) throw new Error(String(response.status));
      alert('Profile photo uploaded');
      event.target.value = '';
      await loadProfile();
      window.EMS_refreshHeader?.();
      window.dispatchEvent(new Event('ems-profile-updated'));
    } catch (_) {
      alert('Photo upload failed');
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = Auth.employeeCode();
    if (!code) return;
    try {
      await fetch(`${EMS_API.LOGIN}/api/employees/${encodeURIComponent(code)}/profile`, {
        method: 'PUT',
        headers: Auth.headers(),
        body: JSON.stringify(form),
      });
      showToast('save changes updated');
      await loadProfile();
      window.EMS_refreshHeader?.();
      window.dispatchEvent(new Event('ems-profile-updated'));
    } catch (err) {
      showToast('failed to updated', 'error');
    }
  }

  return (
<>
      {/* Profile Header Card */}
      <div className="content-card mb-6" style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}>
        <div className="p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {photoPreview ? (
                <img id="profile-avatar" src={photoPreview} alt="Profile"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-lg" />
              ) : (
                <div id="profile-avatar"
                  className="w-24 h-24 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-black text-white">
                  {profileInitial()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>photo_camera</span>
                <input type="file" id="photoInput" className="hidden" accept="image/*" onChange={uploadPhoto} />
              </label>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <h2 id="profile-hero-name" className="text-3xl font-bold text-white">
                {form.fullName || 'Loading profile...'}
              </h2>
              <p id="profile-page-subtitle" className="text-white/80 mt-1">
                Manage your personal information and preferences.
              </p>
              <div className="flex gap-2 mt-3">
                <span id="profile-hero-role" className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">
                  Management
                </span>
                <span id="profile-hero-dept" className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">
                  Management
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Profile Details</h3>
            </div>
            <form id="profile-form" className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <label className="form-label">Full Name</label>
                <input id="fullName" name="fullName" type="text" className="form-input" placeholder="Enter your display name" value={form.fullName} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input id="email" name="email" type="email" className="form-input" placeholder="name@company.com" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input id="phoneNumber" name="phoneNumber" type="text" className="form-input" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input id="department" name="department" type="text" className="form-input" placeholder="Management" value={form.department} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Designation</label>
                <input id="designation" name="designation" type="text" className="form-input" placeholder="Manager" value={form.designation} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Work Location</label>
                <input id="workLocation" name="workLocation" type="text" className="form-input" placeholder="Bengaluru" value={form.workLocation} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Reporting Manager Code</label>
                <input id="reportingManagerCode" name="reportingManagerCode" type="text" className="form-input" placeholder="D001" value={form.reportingManagerCode} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Date of Joining</label>
                <input id="dateOfJoining" name="dateOfJoining" type="date" className="form-input" value={form.dateOfJoining} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Residential Address</label>
                <textarea id="residentialAddress" name="residentialAddress" className="form-textarea" placeholder="Street, city, state, and postal code" value={form.residentialAddress} onChange={handleChange}></textarea>
              </div>
              <div>
                <label className="form-label">Emergency Contact Name</label>
                <input id="emergencyContactName" name="emergencyContactName" type="text" className="form-input" placeholder="Contact person" value={form.emergencyContactName} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Emergency Contact Phone</label>
                <input id="emergencyContactPhone" name="emergencyContactPhone" type="text" className="form-input" placeholder="+91 90000 00000" value={form.emergencyContactPhone} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label">Notification Digest</label>
                <select id="digestFrequency" name="digestFrequency" className="form-select" value={form.digestFrequency} onChange={handleChange}>
                  <option value="realtime">Realtime</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { name: 'emailAlerts', label: 'Email alerts' },
                    { name: 'pushAlerts', label: 'Push alerts' },
                    { name: 'payrollAlerts', label: 'Payroll alerts' },
                  ].map(cb => (
                    <label key={cb.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                      <input type="checkbox" name={cb.name} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" checked={form[cb.name]} onChange={handleChange} />
                      <span className="text-sm font-semibold text-slate-700">{cb.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-secondary">Cancel</button>
                <button id="profile-save-btn" type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        {/* Communication panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">Communication</h3>
            </div>
            <div className="p-6 space-y-4" id="profile-stats">
              {[
                { id: 'email-notifications', label: 'Email Notifications', checked: emailNotif, setter: setEmailNotif },
                { id: 'inapp-notifications', label: 'In-App Notifications', checked: inappNotif, setter: setInappNotif },
              ].map(toggle => (
                <div key={toggle.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{toggle.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id={toggle.id} className="sr-only peer"
                      checked={toggle.checked} onChange={e => toggle.setter(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
</>
  );
}




