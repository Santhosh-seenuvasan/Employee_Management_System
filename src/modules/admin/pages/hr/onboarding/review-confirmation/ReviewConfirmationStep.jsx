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

export default function ReviewConfirmationStep() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${getApiBase()}/api/onboarding/steps/summary`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setSummary(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleComplete() {
    setCompleting(true);
    setError('');
    try {
      const r = await fetch(`${getApiBase()}/api/onboarding/complete`, { method: 'POST', headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to complete onboarding');
      setCompleted(true);
      setTimeout(() => navigate('/admin-dashboard/onboarding-tracking'), 2000);
    } catch (err) {
      setError(err.message);
      setCompleting(false);
    }
  }

  function handleBack() {
    navigate('/admin-dashboard/onboarding/documents');
  }

  if (completed) {
    return (
      <div className="corporate-content">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-24">
          <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl">celebration</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Onboarding Complete!</h1>
          <p className="text-slate-500 text-lg">Employee has been successfully onboarded.</p>
          <p className="text-sm text-slate-400 mt-2">Redirecting to Onboarding Tracking...</p>
        </div>
      </div>
    );
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

  const s = summary || {};
  const personal = s.personal || {};
  const employment = s.employment || {};
  const payroll = s.payroll || {};
  const initials = personal.fullName ? personal.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '--';

  return (
    <div className="corporate-content">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Review & Confirm</h1>
            <p>Review all employee details before final submission.</p>
          </div>
        </div>

        <Stepper current={5} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4">
            <div className="content-card sticky top-28">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-700">{initials}</div>
                  <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                </div>
                <h2 className="mt-5 text-2xl font-black">{personal.fullName || '—'}</h2>
                <p className="text-blue-600 font-semibold mt-1">{employment.designation || employment.department || '—'}</p>
                <div className="mt-6 w-full space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 justify-center">
                    <span className="material-symbols-outlined">mail</span>
                    <span className="text-sm">{personal.personalEmail || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 justify-center">
                    <span className="material-symbols-outlined">call</span>
                    <span className="text-sm">{personal.contactNumber || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 justify-center">
                    <span className="material-symbols-outlined">location_on</span>
                    <span className="text-sm">{personal.address ? personal.address.split(',').slice(0, 2).join(',') : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-3xl bg-emerald-50 border border-emerald-200 p-5">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">task_alt</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800">Ready to Finalize</h3>
                    <p className="text-sm text-emerald-700 mt-1">All onboarding steps are validated successfully.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="content-card">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Personal Information</h3>
                    <p className="text-sm text-slate-500">Employee identity and contact details</p>
                  </div>
                </div>
                <button className="text-blue-600 font-semibold flex items-center gap-1 hover:opacity-80" onClick={() => navigate('/admin-dashboard/onboarding/personal-details')}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Full Name</p>
                  <p className="font-semibold mt-2">{personal.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Date of Birth</p>
                  <p className="font-semibold mt-2">{personal.dateOfBirth || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Gender</p>
                  <p className="font-semibold mt-2">{personal.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Contact</p>
                  <p className="font-semibold mt-2">{personal.contactNumber || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Address</p>
                  <p className="font-semibold mt-2">{personal.address || '—'}</p>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">work</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Employment Details</h3>
                    <p className="text-sm text-slate-500">Department and organizational hierarchy</p>
                  </div>
                </div>
                <button className="text-blue-600 font-semibold flex items-center gap-1 hover:opacity-80" onClick={() => navigate('/admin-dashboard/onboarding/job-role')}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Department</p>
                  <div className="mt-3"><span className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">{employment.department || '—'}</span></div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Employment Type</p>
                  <p className="font-semibold mt-2">{employment.employmentType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Reporting Manager</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {employment.reportingManager ? employment.reportingManager.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '—'}
                    </div>
                    <span className="font-semibold">{employment.reportingManager || '—'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Joining Date</p>
                  <p className="font-semibold mt-2">{employment.joiningDate || '—'}</p>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Payroll & Banking</h3>
                    <p className="text-sm text-slate-500">Salary, payment frequency and bank details</p>
                  </div>
                </div>
                <button className="text-blue-600 font-semibold flex items-center gap-1 hover:opacity-80" onClick={() => navigate('/admin-dashboard/onboarding/payroll-benefits')}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Annual Base Salary</p>
                  <h2 className="text-4xl font-black text-blue-600 mt-2">{payroll.annualSalary ? `₹${Number(payroll.annualSalary).toLocaleString('en-IN')}` : '—'}</h2>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Payment Frequency</p>
                  <p className="font-semibold mt-3">{payroll.frequency || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-between flex-wrap gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-600">account_balance</span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Primary Bank Account</p>
                        <p className="font-semibold mt-1 tracking-wide">{payroll.bankName || '—'} {payroll.accountNumber ? '•••• •••• •••• ' + payroll.accountNumber.slice(-4) : ''}</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 sticky bottom-0 z-40">
          <div className="content-card flex flex-col md:flex-row gap-5 items-center justify-between">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 transition font-semibold" onClick={handleBack}>
              <span className="material-symbols-outlined">arrow_back</span>Back to Documents
            </button>
            <div className="flex items-center gap-4">
              <button className="btn btn-secondary">Save as Draft</button>
              <button className="btn btn-primary flex items-center gap-2" onClick={handleComplete} disabled={completing}>
                {completing ? (
                  <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Completing...</>
                ) : (
                  <>Complete Onboarding<span className="material-symbols-outlined">rocket_launch</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReviewConfirmationStep.pageTitle = "Add Employee";
