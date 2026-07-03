import { useState, useEffect } from 'react';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700' },
  cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-700' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
};

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [minMembers, setMinMembers] = useState('');

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/teams`)
      .then(setTeams)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
    && (!minMembers || (t.memberCount || t.members || 0) >= Number(minMembers))
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
<>
      <div className="p-8 space-y-8">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teams ({filtered.length})</h1>
            <p className="text-slate-500">Manage your team directory and team profiles.</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search teams..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="Min members"
              value={minMembers}
              onChange={e => setMinMembers(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 w-36"
            />
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(team => {
            const cls = COLOR_MAP[team.color] || COLOR_MAP.blue;
            return (
              <div key={team.id || team.name} className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${cls.bg} ${cls.text} flex items-center justify-center font-bold text-xl`}>
                    <span className="material-symbols-outlined">{team.icon || 'group'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{team.name}</h3>
                    <p className="text-sm text-slate-500">{team.memberCount || team.members} Members</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">{team.description || team.desc}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
</>
  );
}




