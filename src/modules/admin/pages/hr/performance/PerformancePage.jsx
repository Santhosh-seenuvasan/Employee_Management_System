import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function PerformancePage() {
  const [stats, setStats] = useState({ total: 0, average: '0.0', quarterly: 0, annual: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [form, setForm] = useState({
    employeeId: '', employeeName: '', reviewerId: '', reviewerName: '',
    performanceRating: '', reviewPeriod: '', strengths: '', areasForImprovement: '', overallComments: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/performance/stats`, { headers: getHeaders() }),
      fetch(`${base}/api/performance/reviews`, { headers: getHeaders() }),
    ])
      .then(([statRes, revRes]) =>
        Promise.all([
          statRes.ok ? statRes.json() : Promise.resolve(null),
          revRes.ok ? revRes.json() : Promise.resolve([]),
        ])
      )
      .then(([s, revs]) => {
        if (s) setStats(s);
        const list = Array.isArray(revs) ? revs : (revs?.members ?? []);
        setReviews(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredReviews = reviews.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      const emp = (r.employeeName || r.employee || '').toLowerCase();
      const rev = (r.reviewerName || r.reviewer || '').toLowerCase();
      const period = (r.period || '').toLowerCase();
      if (!emp.includes(q) && !rev.includes(q) && !period.includes(q)) return false;
    }
    if (periodFilter && (r.period || '').toLowerCase() !== periodFilter.toLowerCase()) return false;
    return true;
  });

  function handleFormChange(e) {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  }

  async function handleCreateReview(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${getApiBase()}/api/performance/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      setForm({ employeeId: '', employeeName: '', reviewerId: '', reviewerName: '', performanceRating: '', reviewPeriod: '', strengths: '', areasForImprovement: '', overallComments: '' });
    } catch (_) {}
    setSaving(false);
  }

  return (
    <div className="corporate-content">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="portal-card rounded-[2rem] p-8">
          <span className="portal-kicker">HR section</span>
          <h2 className="mt-4 text-3xl font-black text-slate-900">Performance management</h2>
          <p className="mt-3 text-slate-600 max-w-3xl">Employee reviews, ratings, and period-based performance records pulled from the database.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="portal-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total reviews</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>
          <div className="portal-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average rating</p>
            <p className="mt-2 text-3xl font-black">{stats.average}</p>
          </div>
          <div className="portal-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quarterly</p>
            <p className="mt-2 text-3xl font-black">{stats.quarterly}</p>
          </div>
          <div className="portal-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Annual</p>
            <p className="mt-2 text-3xl font-black">{stats.annual}</p>
          </div>
        </section>

        <section className="portal-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold">Review records</h3>
              <p className="text-sm text-slate-500">Search and review the database-backed entries.</p>
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Search employee, reviewer, period..." className="form-input w-56"
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-select" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
                <option value="">All periods</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 uppercase text-xs">
                <tr>
                  <th className="py-3 pr-4">Employee</th>
                  <th className="pr-4">Reviewer</th>
                  <th className="pr-4">Rating</th>
                  <th className="pr-4">Period</th>
                  <th>Next Review</th>
                </tr>
              </thead>
              <tbody id="reviewsTable" className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-400">Loading reviews...</td></tr>
                ) : filteredReviews.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-400">No reviews found</td></tr>
                ) : (
                  filteredReviews.map((r, i) => {
                    const rating = Number(r.performanceRating || r.rating || r.ratingScore || 0);
                    return (
                      <tr key={r.id || i}>
                        <td className="py-4 pr-4 font-medium">{r.employeeName || r.employee}</td>
                        <td className="py-4 pr-4 text-slate-500">{r.reviewerName || r.reviewer}</td>
                        <td className="py-4 pr-4">
                          <span className={`font-semibold ${rating >= 7 ? 'text-emerald-600' : rating >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                            {rating}/10
                          </span>
                        </td>
                        <td className="py-4 pr-4">{r.reviewPeriod || r.period || '—'}</td>
                        <td className="py-4 text-slate-500">{r.nextReview || r.next_review || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="portal-card rounded-[2rem] p-6">
          <h3 className="text-xl font-bold mb-4">Create review</h3>
          <form id="create-review-form" className="space-y-3" onSubmit={handleCreateReview}>
            <input id="employeeId" className="form-input" placeholder="Employee ID"
              value={form.employeeId} onChange={handleFormChange} />
            <input id="employeeName" className="form-input" placeholder="Employee name"
              value={form.employeeName} onChange={handleFormChange} />
            <input id="reviewerId" className="form-input" placeholder="Reviewer ID"
              value={form.reviewerId} onChange={handleFormChange} />
            <input id="reviewerName" className="form-input" placeholder="Reviewer name"
              value={form.reviewerName} onChange={handleFormChange} />
            <div className="grid grid-cols-2 gap-3">
              <input id="performanceRating" type="number" min="1" max="10" className="form-input" placeholder="Rating"
                value={form.performanceRating} onChange={handleFormChange} />
              <input id="reviewPeriod" className="form-input" placeholder="Quarterly / Annual"
                value={form.reviewPeriod} onChange={handleFormChange} />
            </div>
            <textarea id="strengths" className="form-textarea" rows="3" placeholder="Strengths"
              value={form.strengths} onChange={handleFormChange} />
            <textarea id="areasForImprovement" className="form-textarea" rows="3" placeholder="Areas for improvement"
              value={form.areasForImprovement} onChange={handleFormChange} />
            <textarea id="overallComments" className="form-textarea" rows="3" placeholder="Overall comments"
              value={form.overallComments} onChange={handleFormChange} />
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

PerformancePage.pageTitle = "Performance";
