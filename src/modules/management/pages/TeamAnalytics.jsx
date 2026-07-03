import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchJson, EMS_API } from '../hooks/useAuth';

Chart.register(...registerables);

export default function TeamAnalytics() {
  const [data, setData] = useState({ topPerformers: [], charts: [], kpis: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const canvasRefs = useRef([]);
  const chartInstances = useRef([]);

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/team/analytics`)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];
    if (!data.charts || data.charts.length === 0) return;
    data.charts.forEach((c, idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas || !c.data) return;
      chartInstances.current.push(new Chart(canvas, {
        type: c.type || 'bar',
        data: c.data,
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
      }));
    });
    return () => chartInstances.current.forEach(c => c.destroy());
  }, [data.charts]);

  const CHARTS = data.charts || [];
  const KPIS = data.kpis || [];
  const allPerformers = data.topPerformers || [];

  const filteredPerformers = allPerformers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.title || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <>
      <div className="p-8 space-y-8">
        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input
            type="text"
            placeholder="Search performers..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {KPIS.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <p className="text-slate-500">{kpi.label}</p>
              <p className={`text-5xl font-bold mt-4 ${kpi.extraClass || ''}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHARTS.map((c, idx) => (
            <div key={c.id || idx} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-lg mb-6">{c.title}</h3>
              <div className="h-80">
                <canvas ref={el => canvasRefs.current[idx] = el}></canvas>
              </div>
            </div>
          ))}
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h3 className="font-semibold mb-6">Top Performers This Month ({filteredPerformers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPerformers.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-full text-center py-4">No performers found.</p>
            ) : filteredPerformers.map(p => (
              <div key={p.name} className="border border-slate-100 rounded-3xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-full ${p.bg || 'bg-blue-100'} flex items-center justify-center font-bold ${p.text || 'text-blue-600'} text-lg mb-3`}>
                  {p.initials}
                </div>
                <p className="font-bold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400 mt-1">{p.title}</p>
                <span className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  Score: {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
