import { useState, useEffect } from 'react';

function getApiBase() {
  return window.EMS_API?.HR || window.location.origin;
}

function getHeaders() {
  const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
  return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('inbox');
  const [composeForm, setComposeForm] = useState({
    recipientType: '', recipientRole: '', employeeCode: '', title: '', subject: '',
    priority: 'Medium', category: '', sendDate: '', expiryDate: '', channel: 'In App', message: '',
  });

  useEffect(() => {
    const code = (() => { try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode'); } catch (_) { return ''; } })();
    if (!code) { setLoading(false); return; }
    fetch(`${getApiBase()}/api/employees/${encodeURIComponent(code)}/notifications`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : { today: [], thisWeek: [] })
      .then(d => {
        const all = [...(d.today || []), ...(d.thisWeek || [])];
        setNotifications(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const all = notifications;
  const unreadCount = all.filter(n => !n.is_read && !n.isRead).length;

  const visible = all.filter(n => {
    if (search) {
      const matches = [n.title, n.subject, n.message, n.body, n.category].some(f => String(f || '').toLowerCase().includes(search.toLowerCase()));
      if (!matches) return false;
    }
    if (filter === 'unread' && (n.is_read || n.isRead)) return false;
    if (filter === 'read' && !n.is_read && !n.isRead) return false;
    return true;
  });

  function handleComposeChange(e) {
    const { name, value } = e.target;
    setComposeForm(f => ({ ...f, [name]: value }));
  }

  async function handleSend(e) {
    e.preventDefault();
    try {
      await fetch(`${getApiBase()}/api/notifications/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(composeForm),
      });
      setComposeForm({ recipientType: '', recipientRole: '', employeeCode: '', title: '', subject: '', priority: 'Medium', category: '', sendDate: '', expiryDate: '', channel: 'In App', message: '' });
    } catch (_) {}
  }

  return (
    <div className="corporate-content">
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 rounded-2xl overflow-hidden mb-6">
        <div className="p-8 text-white">
          <span className="text-xs uppercase tracking-[0.2em] text-blue-200 font-semibold">HR Notification Center</span>
          <h1 className="text-3xl font-black mt-2">HR Notification Center</h1>
          <p className="text-blue-200 mt-2 max-w-2xl">Send messages to employees, teams, or departments, and keep inbox activity, sent items, and the feed in one place.</p>
          <div className="flex gap-6 mt-6">
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{all.length}</p>
              <p className="text-xs text-blue-200">Total Notifications</p>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-blue-200">Unread</p>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold">{all.length - unreadCount}</p>
              <p className="text-xs text-blue-200">Read</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" placeholder="Search title, message, sender, category..." className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="rounded-xl border border-slate-200 px-4 py-3 outline-none" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-colors"
            onClick={() => { setSearch(''); setFilter('all'); }}>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-4">Compose Message</h3>
            <form className="space-y-3" onSubmit={handleSend}>
              <select name="recipientType" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" value={composeForm.recipientType} onChange={handleComposeChange}>
                <option value="">Recipient Type</option>
                <option value="Individual">Individual</option>
                <option value="Department">Department</option>
                <option value="Team">Team</option>
                <option value="All">All</option>
              </select>
              <select name="recipientRole" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" value={composeForm.recipientRole} onChange={handleComposeChange}>
                <option value="">Recipient Role</option>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR</option>
                <option value="All">All</option>
              </select>
              <input name="employeeCode" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" placeholder="Specific employee code"
                value={composeForm.employeeCode} onChange={handleComposeChange} />
              <input name="title" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" placeholder="Title"
                value={composeForm.title} onChange={handleComposeChange} />
              <input name="subject" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" placeholder="Subject"
                value={composeForm.subject} onChange={handleComposeChange} />
              <select name="priority" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" value={composeForm.priority} onChange={handleComposeChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <input name="category" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" placeholder="Category"
                value={composeForm.category} onChange={handleComposeChange} />
              <div className="grid grid-cols-2 gap-3">
                <input name="sendDate" type="date" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none"
                  value={composeForm.sendDate} onChange={handleComposeChange} />
                <input name="expiryDate" type="date" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none"
                  value={composeForm.expiryDate} onChange={handleComposeChange} />
              </div>
              <select name="channel" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" value={composeForm.channel} onChange={handleComposeChange}>
                <option value="In App">In App</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
              <textarea name="message" rows="4" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" placeholder="Message..."
                value={composeForm.message} onChange={handleComposeChange} />
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">Send Message</button>
              <p className="text-xs text-slate-400 text-center">All fields are required for delivery</p>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {['inbox', 'sent', 'feed'].map(tab => (
                <button key={tab} className={`flex-1 px-6 py-4 text-sm font-semibold capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab === 'inbox' ? 'Received Messages' : tab === 'sent' ? 'Messages You Sent' : 'Announcements & Activity'}
                </button>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <p className="p-6 text-slate-500 text-center">Loading notifications...</p>
              ) : visible.length === 0 ? (
                <p className="p-6 text-slate-500 text-center">No notifications found.</p>
              ) : (
                visible.map((n, i) => {
                  const isRead = n.is_read || n.isRead;
                  return (
                    <div key={n.id || i} className={`p-5 flex gap-4 ${isRead ? '' : 'bg-blue-50/50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRead ? 'bg-slate-200' : 'bg-blue-100'}`}>
                        <span className="material-symbols-outlined text-base text-blue-600">notifications</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-sm ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                            {n.title || n.subject || 'Notification'}
                          </p>
                          {n.category && <span className="text-xs text-slate-400">({n.category})</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{n.message || n.body || ''}</p>
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at || n.createdAt)}</p>
                      </div>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

NotificationsPage.pageTitle = "HR Notifications";
