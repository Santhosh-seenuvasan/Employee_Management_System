import { useCallback, useEffect, useState } from "react";
import { CorporateShell } from "./CorporateShell.jsx";

  function apiBase() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function categoryIcon(cat) {
    const c = String(cat || "").toLowerCase();
    if (c.includes("leave")) return "event_busy";
    if (c.includes("payroll") || c.includes("salary")) return "payments";
    if (c.includes("attend")) return "fact_check";
    if (c.includes("perf")) return "leaderboard";
    if (c.includes("announce")) return "campaign";
    return "notifications";
  }

  function NotificationCard({ notif, onMarkRead }) {
    const isRead = notif.is_read || notif.isRead;
    return (
      <div className={`flex gap-4 p-4 rounded-xl transition ${isRead ? "bg-slate-50" : "bg-blue-50 border border-blue-100"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRead ? "bg-slate-200" : "bg-blue-100"}`}>
          <span className="material-symbols-outlined text-base text-blue-600">{categoryIcon(notif.category)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm ${isRead ? "text-slate-700" : "text-slate-900"}`}>{notif.title || notif.subject || "Notification"}</p>
            <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(notif.created_at || notif.createdAt)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message || notif.body || ""}</p>
          {!isRead && (
            <button className="mt-2 text-xs text-blue-600 font-semibold hover:underline" onClick={() => onMarkRead(notif.id)}>
              Mark as read
            </button>
          )}
        </div>
      </div>
    );
  }

  function NotificationsApp() {
    const [today, setToday]       = useState([]);
    const [thisWeek, setThisWeek] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [filter, setFilter]     = useState("all");
    const [unreadCount, setUnreadCount] = useState(Number(window.EMS_unreadCount || 0));

    const loadNotifications = useCallback(async () => {
      const code = employeeCode();
      if (!code) { setLoading(false); return; }
      try {
        const res = await fetch(
          `${apiBase()}/api/employees/${encodeURIComponent(code)}/notifications`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setToday(Array.isArray(data.today) ? data.today : []);
        setThisWeek(Array.isArray(data.thisWeek) ? data.thisWeek : []);
        const all = [...(data.today || []), ...(data.thisWeek || [])];
        const unread = all.filter(n => !n.is_read && !n.isRead).length;
        setUnreadCount(unread);
        window.EMS_unreadCount = unread;
        document.dispatchEvent(new Event("ems-unread-updated"));
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      loadNotifications();
      const timer = setInterval(loadNotifications, 15000);
      return () => clearInterval(timer);
    }, [loadNotifications]);

    /* Mark a single notification as read — best-effort (no dedicated endpoint yet) */
    function handleMarkRead(id) {
      setToday(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setThisWeek(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    }

    const allNotifs = [...today, ...thisWeek];

    const visible = allNotifs.filter(n => {
      const matchesSearch = !search || [n.title, n.subject, n.message, n.body, n.category].some(
        f => String(f || "").toLowerCase().includes(search.toLowerCase())
      );
      const read = n.is_read || n.isRead;
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !read) ||
        (filter === "read" && read);
      return matchesSearch && matchesFilter;
    });

    return (
      <CorporateShell title="Corporate EMS">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Hero */}
            <section className="portal-card rounded-[2rem] overflow-hidden">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] p-6 lg:p-8 items-center bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 text-white">
                <div className="space-y-2">
                  <span className="portal-kicker bg-white/10 text-white border-white/10 w-fit">Employee Notification Center</span>
                  <h2 className="text-3xl lg:text-4xl font-black">Your Notifications</h2>
                  <p className="text-white/80 max-w-2xl">Review your inbox, search messages, and keep important updates organized.</p>
                </div>
                <div className="portal-card rounded-3xl p-4 bg-white/10 border-white/15 text-white min-w-[230px]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Unread</p>
                  <p className="mt-2 text-4xl font-black">{unreadCount}</p>
                  <p className="mt-2 text-sm leading-6 text-white/90">Refreshes every 15 seconds.</p>
                </div>
              </div>
            </section>

            {/* Search & filter */}
            <section className="portal-card rounded-[2rem] p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div>
                  <p className="portal-section-title">Search and filter</p>
                  <h3 className="text-2xl font-black text-slate-900">Refine your inbox</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-96">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                      type="search"
                      placeholder="Search title, message, category..."
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-100"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
                    onClick={loadNotifications}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* Notification list */}
            <section className="portal-card rounded-[2rem] p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="portal-section-title">Inbox</p>
                  <h3 className="text-2xl font-black text-slate-900">Received messages</h3>
                </div>
                <span className="portal-pill amber">{unreadCount > 0 ? `${unreadCount} unread` : "All read"}</span>
              </div>

              {loading && (
                <p className="text-slate-500 text-sm py-8 text-center">Loading notifications...</p>
              )}

              {!loading && visible.length === 0 && (
                <p className="text-slate-500 text-sm py-8 text-center">No notifications found.</p>
              )}

              <div className="space-y-3">
                {visible.map((n, i) => (
                  <NotificationCard key={n.id || i} notif={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </CorporateShell>
    );
  }
export default NotificationsApp;
