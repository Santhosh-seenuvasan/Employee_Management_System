import { useState, useEffect } from 'react';
import { fetchJson, Auth, EMS_API } from '../hooks/useAuth';
import useSort, { SortTh } from '../hooks/useSort';

export default function Meetings() {
  const [meetings, setMeetings] = useState({ today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchJson(`${EMS_API.LOGIN}/api/meetings`)
      .then(data => setMeetings(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const todayMeetings = meetings.today || [];
  const upcomingMeetings = meetings.upcoming || [];

  const filteredUpcoming = upcomingMeetings.filter(m =>
    (!search || m.title.toLowerCase().includes(search.toLowerCase()))
    && (!filterDate || (m.dateTime || m.date || '').startsWith(filterDate))
  );

  const { sorted, sortKey, sortDir, toggleSort } = useSort(filteredUpcoming);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
<>
      <div className="p-8 space-y-8">

        {/* Today's Meetings */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100">
          <h3 className="font-semibold mb-6">Today's Meetings</h3>
          <div className="space-y-6">
            {todayMeetings.length === 0 && <p className="text-slate-500 text-sm">No meetings scheduled today.</p>}
            {todayMeetings.map((m, i) => (
              <div key={m.id || i} className="flex gap-6 items-center border-l-4 border-primary pl-6">
                <div className="text-center">
                  <p className="text-sm">{m.time}</p>
                  <p className="text-xs text-slate-500">{m.ampm || ''}</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-slate-500">{m.description}</p>
                </div>
                {m.joinable !== false && <button className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm">Join</button>}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100">
          <h3 className="font-semibold mb-6">Upcoming This Week ({sorted.length})</h3>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  id="list-search-input"
                  placeholder="Search meetings..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <SortTh label="Date &amp; Time" sortKey="dateTime" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left py-4" />
                <SortTh label="Meeting" sortKey="title" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left py-4" />
                <SortTh label="Participants" sortKey="participants" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="text-left py-4" />
                <th className="text-right py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-slate-500">No upcoming meetings.</td></tr>
              )}
              {sorted.map((m, i) => (
                <tr key={m.id || i} className="hover:bg-slate-50">
                  <td className="py-5">{m.dateTime || m.date}</td>
                  <td className="py-5 font-medium">{m.title}</td>
                  <td className="py-5 text-slate-500">{m.participants}</td>
                  <td className="py-5 text-right">
                    <button className="hover:underline" style={{ color: 'var(--ems-primary)' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
</>
  );
}
