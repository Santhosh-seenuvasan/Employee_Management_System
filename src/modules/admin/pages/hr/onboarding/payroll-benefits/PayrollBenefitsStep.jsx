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

export default function PayrollBenefitsStep() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    annualSalary: '', frequency: 'Monthly', currency: 'INR',
    accountHolder: '', bankName: '', accountNumber: '', ifscCode: '',
    healthInsurance: true, providentFund: true, retirementContribution: 5, notes: '',
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBase()}/api/onboarding/steps/payroll`, { headers: getHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(`${getApiBase()}/api/currencies`, { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
    ])
      .then(([saved, curs]) => {
        if (saved) setForm(f => ({ ...f, ...saved }));
        setCurrencies(Array.isArray(curs) && curs.length ? curs : ['INR', 'USD', 'EUR', 'GBP']);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleRange(e) {
    setForm(f => ({ ...f, retirementContribution: Number(e.target.value) }));
  }

  async function handleNext() {
    setSaving(true);
    setError('');
    try {
      const r = await fetch(`${getApiBase()}/api/onboarding/steps/payroll`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error('Save failed');
      navigate('/admin-dashboard/onboarding/documents');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBack() {
    setSaving(true);
    try {
      await fetch(`${getApiBase()}/api/onboarding/steps/payroll`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
    } catch (_) {}
    setSaving(false);
    navigate('/admin-dashboard/onboarding/job-role');
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
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2">Payroll & Benefits</h1>
            <p className="text-slate-500 text-lg">Configure salary structure, benefits, and banking details.</p>
          </div>
          <div className="text-right">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">Step 3 of 5</span>
          </div>
        </div>

        <Stepper current={3} />

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="content-card">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">payments</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Compensation</h2>
                  <p className="text-slate-500">Configure employee salary structure</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Annual Base Salary</label>
                  <div className="relative mt-2">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">₹</span>
                    <input name="annualSalary" type="number" className="w-full pl-12 pr-5 py-5 rounded-2xl border border-slate-300 text-3xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="1200000" value={form.annualSalary} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Payment Frequency</label>
                  <select name="frequency" className="form-select mt-2" value={form.frequency} onChange={handleChange}>
                    <option>Monthly</option>
                    <option>Bi-weekly</option>
                    <option>Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Currency</label>
                  <select name="currency" className="form-select mt-2" value={form.currency} onChange={handleChange}>
                    {currencies.map(c => <option key={c.code || c} value={c.code || c}>{c.code || c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">account_balance</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Bank Details</h2>
                  <p className="text-slate-500">Secure employee payroll account information</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Account Holder</label>
                  <input name="accountHolder" type="text" className="form-input mt-2" placeholder="Full Name" value={form.accountHolder} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input name="bankName" type="text" className="form-input mt-2" placeholder="State Bank of India" value={form.bankName} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">Account Number</label>
                  <input name="accountNumber" type="text" className="form-input mt-2" placeholder="XXXX XXXX XXXX" value={form.accountNumber} onChange={handleChange} />
                </div>
                <div>
                  <label className="form-label">IFSC Code</label>
                  <input name="ifscCode" type="text" className="form-input mt-2" placeholder="SBIN0000456" value={form.ifscCode} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="content-card">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">redeem</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Benefits</h2>
                  <p className="text-slate-500">Employee benefit configuration</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                  <input name="healthInsurance" type="checkbox" className="mt-1 w-5 h-5 accent-blue-600" checked={form.healthInsurance} onChange={handleChange} />
                  <div>
                    <h4 className="font-semibold">Health Insurance</h4>
                    <p className="text-sm text-slate-500 mt-1">Premium corporate medical plan coverage</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                  <input name="providentFund" type="checkbox" className="mt-1 w-5 h-5 accent-blue-600" checked={form.providentFund} onChange={handleChange} />
                  <div>
                    <h4 className="font-semibold">Provident Fund</h4>
                    <p className="text-sm text-slate-500 mt-1">Employee PF contribution enabled</p>
                  </div>
                </label>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between mb-4">
                    <label className="font-semibold">Retirement Contribution</label>
                    <span className="font-bold text-blue-600">{form.retirementContribution}%</span>
                  </div>
                  <input type="range" min="0" max="20" className="w-full accent-blue-600" value={form.retirementContribution} onChange={handleRange} />
                  <div className="flex justify-between text-xs text-slate-400 mt-2"><span>0%</span><span>20%</span></div>
                </div>
                <div>
                  <label className="form-label">Additional Notes</label>
                  <textarea name="notes" className="form-textarea mt-2" placeholder="Optional notes about compensation or benefits..." rows="4" value={form.notes} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            <div className="content-card" style={{ background: 'var(--ems-primary-light)', borderColor: 'var(--ems-primary-light)' }}>
              <div className="flex gap-4">
                <div className="text-blue-600"><span className="material-symbols-outlined text-3xl">verified_user</span></div>
                <div>
                  <h4 className="font-semibold mb-2">Payroll Security</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">All payroll and banking data is encrypted and protected using enterprise-grade security standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button className="btn btn-secondary flex items-center gap-2" onClick={handleBack} disabled={saving}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-4">
            <button className="btn btn-secondary" style={{ color: 'var(--ems-text-secondary)' }}>Save Draft</button>
            <button className="btn btn-primary flex items-center gap-3" onClick={handleNext} disabled={saving}>
              {saving ? 'Saving...' : 'Next Step'}
              {!saving && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

PayrollBenefitsStep.pageTitle = "Add Employee";
