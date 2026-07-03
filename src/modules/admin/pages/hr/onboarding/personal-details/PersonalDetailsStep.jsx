import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../../../shared/Stepper.jsx';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function PersonalDetailsStep() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', gender: '', contactNumber: '', personalEmail: '', address: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${getApiBase()}/api/onboarding/steps/personal`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : Promise.resolve(null))
      .then(data => {
        if (data) setForm(f => ({ ...f, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  }

  async function handleNext() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        fd.append('data', JSON.stringify(payload));
        const r = await fetch(`${getApiBase()}/api/onboarding/steps/personal`, { method: 'POST', headers: { ...getHeaders(), 'Content-Type': undefined }, body: fd });
        if (!r.ok) throw new Error('Save failed');
      } else {
        const r = await fetch(`${getApiBase()}/api/onboarding/steps/personal`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Save failed');
      }
      navigate('/admin-dashboard/onboarding/job-role');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="corporate-content">
        <div className="max-w-7xl mx-auto py-20 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="corporate-content">
      <div className="max-w-7xl mx-auto">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Add New Employee</h1>
            <p>Onboard a new member to the corporate ecosystem.</p>
          </div>
        </div>

        <Stepper current={1} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="content-card">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <span className="material-symbols-outlined">info</span>
                <h3 className="text-xl font-bold">Step 1 Details</h3>
              </div>
              <p className="text-slate-500 leading-relaxed text-sm">
                Please ensure all personal information matches government-issued identification. This data is required for compliance and employee records.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-sm mt-1">check_circle</span>
                  <span className="text-sm text-slate-600">Secure employee onboarding</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-sm mt-1">check_circle</span>
                  <span className="text-sm text-slate-600">Real-time field validation</span>
                </div>
              </div>
            </div>

            <div className="content-card flex flex-col items-center justify-center text-center gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[48px]">account_circle</span>
                )}
              </div>
              <div>
                <label className="text-blue-600 font-semibold hover:underline cursor-pointer">
                  Upload Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
                </label>
                <p className="text-[12px] text-slate-400 mt-1">Min 400x400px, JPG/PNG</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="content-card">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-3xl text-blue-600">account_circle</span>
                <div>
                  <h2 className="text-2xl font-bold">Personal Information</h2>
                  <p className="text-slate-500">Step 1 of 4</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="col-span-2">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="fullName" placeholder="Enter full name" className="form-input mt-2" value={form.fullName} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" name="dateOfBirth" className="form-input mt-2" value={form.dateOfBirth} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select name="gender" className="form-select mt-2" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Contact Number</label>
                  <input type="tel" name="contactNumber" placeholder="+91 9876543210" className="form-input mt-2" value={form.contactNumber} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Personal Email</label>
                  <input type="email" name="personalEmail" placeholder="employee@example.com" className="form-input mt-2" value={form.personalEmail} onChange={handleChange} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Residential Address</label>
                  <textarea name="address" rows="3" placeholder="Enter full residential address" className="form-textarea mt-2" value={form.address} onChange={handleChange} />
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>Cancel</button>
                <button className="btn btn-primary" onClick={handleNext} disabled={saving}>
                  {saving ? 'Saving...' : 'Next Step'}
                  {!saving && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'work', title: 'Job & Role', desc: 'Department, designation, and reporting hierarchy details.' },
            { icon: 'account_balance', title: 'Payroll & Benefits', desc: 'Bank accounts, tax details, and compensation structure.' },
            { icon: 'visibility', title: 'Review', desc: 'Final review before employee database submission.' },
          ].map((card, i) => (
            <div key={i} className="content-card opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-slate-400">{card.icon}</span>
                <h4 className="font-bold text-slate-500 uppercase tracking-tight text-xs">{card.title}</h4>
              </div>
              <p className="text-xs text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

PersonalDetailsStep.pageTitle = "Add Employee";
