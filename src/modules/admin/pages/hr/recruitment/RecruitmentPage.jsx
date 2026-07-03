import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

export default function RecruitmentPage() {
  const [counts, setCounts] = useState({ applied: 0, screened: 0, interviewed: 0, offered: 0, hired: 0 });
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/api/recruitment/counts`, { headers: getHeaders() }),
      fetch(`${base}/api/recruitment`, { headers: getHeaders() }),
    ])
      .then(([cntRes, reqRes]) =>
        Promise.all([
          cntRes.ok ? cntRes.json() : Promise.resolve(null),
          reqRes.ok ? reqRes.json() : Promise.resolve([]),
        ])
      )
      .then(([c, reqs]) => {
        if (c) setCounts(c);
        setRequisitions(Array.isArray(reqs) ? reqs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredReqs = requisitions.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const position = (r.position || r.title || r.jobTitle || '').toLowerCase();
    const dept = (r.department || '').toLowerCase();
    return position.includes(q) || dept.includes(q);
  });

  return (
    <div className="corporate-content">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recruitment Management</h1>
        <p className="text-slate-500">Live recruitment records from the database.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <p className="text-slate-500">{loading ? 'Loading live recruitment data...' : `${requisitions.length} active requisitions`}</p>
        <button className="inline-flex items-center gap-2 self-start rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Candidate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500">Applied</p>
          <p className="text-4xl font-bold mt-3">{counts.applied}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500">Screened</p>
          <p className="text-4xl font-bold mt-3 text-blue-600">{counts.screened}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500">Interviewed</p>
          <p className="text-4xl font-bold mt-3 text-amber-600">{counts.interviewed}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500">Offered</p>
          <p className="text-4xl font-bold mt-3 text-emerald-600">{counts.offered}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500">Hired</p>
          <p className="text-4xl font-bold mt-3 text-emerald-600">{counts.hired}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        <h3 className="font-semibold mb-6">Active Job Requisitions</h3>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setSearch('')}>
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4">Position</th>
              <th className="text-left py-4">Department</th>
              <th className="text-left py-4">Candidates</th>
              <th className="text-left py-4">Posted</th>
              <th className="text-right py-4">Status</th>
            </tr>
          </thead>
          <tbody id="recruitmentTableBody" className="divide-y">
            {loading ? (
              <tr><td colSpan="5" className="py-8 text-center text-slate-400">Loading records...</td></tr>
            ) : filteredReqs.length === 0 ? (
              <tr><td colSpan="5" className="py-8 text-center text-slate-400">No requisitions found</td></tr>
            ) : (
              filteredReqs.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="py-4 font-medium">{r.position || r.title || r.jobTitle}</td>
                  <td className="py-4 text-slate-500">{r.department || '—'}</td>
                  <td className="py-4">{r.candidates || r.candidateCount || 0}</td>
                  <td className="py-4 text-slate-500">{r.postedDate || r.posted || r.createdAt || '—'}</td>
                  <td className="py-4 text-right">
                    <span className={`status-badge ${(r.status || 'active').toLowerCase() === 'active' ? 'present' : 'pending'}`}>
                      {r.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

RecruitmentPage.pageTitle = "Recruitment Management";
