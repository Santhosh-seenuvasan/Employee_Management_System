import { useState, useEffect } from 'react';
import { api } from '../../../../../services/api.js';

function getAuth() {
  try {
    return {
      token: localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token') || '',
      role: localStorage.getItem('ems_role') || sessionStorage.getItem('ems_role') || '',
      employeeCode: localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode') || '',
      email: localStorage.getItem('ems_email') || sessionStorage.getItem('ems_email') || '',
      fullName: localStorage.getItem('ems_fullName') || sessionStorage.getItem('ems_fullName') || '',
    };
  } catch (_) { return { token: '', role: '', employeeCode: '', email: '', fullName: '' }; }
}

function getInitials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || 'NA';
}

export default function ProfilePage() {
  const auth = getAuth();
  const [form, setForm] = useState({
    fullName: auth.fullName || '',
    email: auth.email || '',
    phoneNumber: '',
    department: '',
    designation: '',
    workLocation: '',
    dateOfBirth: '',
    residentialAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!auth.employeeCode) { setLoading(false); return; }
    api.get(`/api/employees/${encodeURIComponent(auth.employeeCode)}/profile`)
      .then(d => {
        const p = d.profile || {};
        setForm(f => ({
          ...f,
          fullName: p.full_name || f.fullName,
          email: p.email || f.email,
          phoneNumber: p.phone_number || '',
          department: p.department || '',
          designation: p.designation || '',
          workLocation: p.work_location || '',
          dateOfBirth: p.date_of_birth || '',
          residentialAddress: p.residential_address || '',
          emergencyContactName: p.emergency_contact_name || '',
          emergencyContactPhone: p.emergency_contact_phone || '',
        }));
        if (p.photo) {
          const origin = window.EMS_API?.LOGIN || window.location.origin;
          const url = String(p.photo).startsWith('http') ? p.photo : origin + p.photo;
          setPhotoUrl(url + '?t=' + Date.now());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.employeeCode]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!auth.employeeCode) return;
    setSaving(true);
    try {
      await api.put(`/api/employees/${encodeURIComponent(auth.employeeCode)}/profile`, form);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !auth.employeeCode) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo max 5 MB'); return; }
    const fd = new FormData();
    fd.append('photo', file);
    setUploadingPhoto(true);
    try {
      const result = await api.upload(`/api/employees/${encodeURIComponent(auth.employeeCode)}/profile-photo`, fd);
      if (result.photo) {
        const origin = window.EMS_API?.LOGIN || window.location.origin;
        const url = String(result.photo).startsWith('http') ? result.photo : origin + result.photo;
        setPhotoUrl(url + '?t=' + Date.now());
      }
      window.EMS_refreshHeader?.();
      window.dispatchEvent(new Event('ems-profile-updated'));
    } catch (_) {
      alert('Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="content-card" style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}>
        <div className="p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {photoUrl ? (
                <img id="profile-avatar" src={photoUrl} alt="Profile"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white/30 shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                  {getInitials(form.fullName)}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <span className="material-symbols-outlined">{uploadingPhoto ? 'sync' : 'photo_camera'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} />
              </label>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{form.fullName || 'Profile'}</h2>
              <p className="text-white/80 mt-1">Manage your personal information and preferences.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header"><h3 className="content-card-title">Profile Details</h3></div>
        <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="form-label">Full Name</label>
            <input name="fullName" type="text" className="form-input" value={form.fullName} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <input name="phoneNumber" type="text" className="form-input" value={form.phoneNumber} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Department</label>
            <input name="department" type="text" className="form-input" value={form.department} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Designation</label>
            <input name="designation" type="text" className="form-input" value={form.designation} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Work Location</label>
            <input name="workLocation" type="text" className="form-input" value={form.workLocation} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Date of Birth</label>
            <input name="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Residential Address</label>
            <textarea name="residentialAddress" className="form-textarea" value={form.residentialAddress} onChange={handleChange}></textarea>
          </div>
          <div>
            <label className="form-label">Emergency Contact Name</label>
            <input name="emergencyContactName" type="text" className="form-input" value={form.emergencyContactName} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Emergency Contact Phone</label>
            <input name="emergencyContactPhone" type="text" className="form-input" value={form.emergencyContactPhone} onChange={handleChange} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProfilePage.pageTitle = "Profile Settings";
