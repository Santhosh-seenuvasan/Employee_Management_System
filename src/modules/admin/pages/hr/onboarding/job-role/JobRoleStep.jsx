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

export default function JobRoleStep() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employeeId: '', department: '', designation: '', joiningDate: '', employmentType: 'Full-time',
    primaryOffice: '', floorSuite: '', remoteEligible: true,
    reportingManager: '', functionalManager: '',
  });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBase()}/api/onboarding/steps/job-role`, { headers: getHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(`${getApiBase()}/api/departments`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${getApiBase()}/api/designations`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${getApiBase()}/api/employees/managers`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${getApiBase()}/api/offices`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
    ])
      .then(([saved, depts, desigs, mgrs, offs]) => {
        if (saved) setForm(f => ({ ...f, ...saved }));
        setDepartments(Array.isArray(depts) ? depts : []);
        setDesignations(Array.isArray(desigs) ? desigs : []);
        setManagers(Array.isArray(mgrs) ? mgrs : []);
        setOffices(Array.isArray(offs) ? offs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleNext() {
    setSaving(true);
    setError('');
    try {
      const r = await fetch(`${getApiBase()}/api/onboarding/steps/job-role`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error('Save failed');
      navigate('/admin-dashboard/onboarding/payroll-benefits');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBack() {
    setSaving(true);
    try {
      await fetch(`${getApiBase()}/api/onboarding/steps/job-role`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
    } catch (_) {}
    setSaving(false);
    navigate('/admin-dashboard/onboarding/personal-details');
  }

  if (loading) {
    return (
      <div className="corporate-content">
        <div className="max-w-6xl mx-auto py-20 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="corporate-content">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Add New Employee</h1>
            <p>Configure job role and employment details.</p>
          </div>
        </div>

        <Stepper current={2} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-7 shadow-soft border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Step 2 Details</h3>
                  <p className="text-sm text-slate-500">Organization setup</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-7">Configure employee department, reporting hierarchy, employment type, and work location details.</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                  <div><h4 className="font-semibold text-sm">Permission Sync</h4><p className="text-xs text-slate-500">Auto assigns access based on role.</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                  <div><h4 className="font-semibold text-sm">Workflow Automation</h4><p className="text-xs text-slate-500">Managers are linked automatically.</p></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                <span className="material-symbols-outlined text-blue-600 mb-3">work</span>
                <h4 className="font-bold mb-2">Role Configuration</h4>
                <p className="text-sm text-slate-600">Departments define permissions and employee workflows.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <span className="material-symbols-outlined text-indigo-600 mb-3">home_work</span>
                <h4 className="font-bold mb-2">Remote Policy</h4>
                <p className="text-sm text-slate-600">Remote eligibility impacts taxation and equipment logistics.</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-[32px] shadow-soft border border-slate-200 overflow-hidden">
              <form className="p-10 space-y-12" onSubmit={e => e.preventDefault()}>
                <section>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">badge</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Employment Details</h2>
                      <p className="text-sm text-slate-500">Employee role and department configuration</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Employee ID</label>
                      <input className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-500 cursor-not-allowed" disabled type="text" value={form.employeeId} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Department</label>
                      <select name="department" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.department} onChange={handleChange}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id || d} value={d.id || d}>{d.name || d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Designation</label>
                      <select name="designation" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.designation} onChange={handleChange}>
                        <option value="">Select Designation</option>
                        {designations.map(d => <option key={d.id || d} value={d.id || d}>{d.name || d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Joining Date</label>
                      <input name="joiningDate" type="date" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.joiningDate} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mt-8">
                    <label className="block text-sm font-semibold mb-4">Employment Type</label>
                    <div className="grid md:grid-cols-3 gap-5">
                      {['Full-time', 'Part-time', 'Contract'].map(type => (
                        <label key={type} className="radio-card cursor-pointer">
                          <input type="radio" name="employmentType" className="hidden" checked={form.employmentType === type} onChange={handleChange} value={type} />
                          <div className={`border-2 rounded-3xl p-5 transition-all duration-300 ${form.employmentType === type ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold">{type}</h4>
                                <p className="text-sm text-slate-500 mt-1">{type === 'Full-time' ? '40 hrs / week' : type === 'Part-time' ? 'Flexible hours' : 'Fixed duration'}</p>
                              </div>
                              <span className={`material-symbols-outlined ${form.employmentType === type ? 'text-blue-600' : 'text-transparent'} check-icon`}>check_circle</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Work Location</h2>
                      <p className="text-sm text-slate-500">Configure office and remote work access</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Primary Office</label>
                      <select name="primaryOffice" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.primaryOffice} onChange={handleChange}>
                        <option value="">Select Office</option>
                        {offices.map(o => <option key={o.id || o} value={o.id || o}>{o.name || o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Floor / Suite</label>
                      <input name="floorSuite" type="text" placeholder="4th Floor, Suite 402" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.floorSuite} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mt-7 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">home_work</span>
                      </div>
                      <div>
                        <h4 className="font-bold">Remote Work Eligibility</h4>
                        <p className="text-sm text-slate-500 mt-1">Enable hybrid or remote work permissions</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input name="remoteEligible" type="checkbox" className="sr-only peer" checked={form.remoteEligible} onChange={handleChange} />
                      <div className="w-14 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7"></div>
                    </label>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">account_tree</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Reporting Structure</h2>
                      <p className="text-sm text-slate-500">Assign reporting and functional managers</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Reporting Manager</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
                        <input name="reportingManager" type="text" placeholder="Search manager..." className="w-full rounded-2xl border border-slate-300 pl-12 pr-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.reportingManager} onChange={handleChange} list="managers-list" />
                        <datalist id="managers-list">
                          {managers.map(m => <option key={m.id || m} value={m.name || m} />)}
                        </datalist>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Functional Manager</label>
                      <select name="functionalManager" className="w-full rounded-2xl border border-slate-300 px-5 py-4 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition" value={form.functionalManager} onChange={handleChange}>
                        <option value="">Select manager</option>
                        {managers.map(m => <option key={m.id || m} value={m.name || m}>{m.name || m}</option>)}
                      </select>
                    </div>
                  </div>
                </section>
              </form>
              <div className="bg-slate-50 border-t border-slate-200 px-10 py-6 flex items-center justify-between">
                <button className="px-7 py-3 rounded-2xl border border-slate-300 font-semibold hover:bg-slate-100 transition flex items-center gap-2" onClick={handleBack}>
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  Back
                </button>
                <div className="flex items-center gap-4">
                  <button className="px-7 py-3 rounded-2xl font-semibold text-slate-600 hover:bg-slate-200 transition">Save Draft</button>
                  <button className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition flex items-center gap-3" onClick={handleNext} disabled={saving}>
                    {saving ? 'Saving...' : 'Next Step'}
                    {!saving && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

JobRoleStep.pageTitle = "Add Employee";
