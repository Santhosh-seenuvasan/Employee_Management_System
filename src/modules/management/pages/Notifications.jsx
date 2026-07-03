import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function Notifications() {
  const [form, setForm] = useState({
    recipientType: 'INDIVIDUAL', recipientRole: 'EMPLOYEE', recipientCode: '',
    title: '', subject: '', priority: 'MEDIUM', category: '',
    sendDate: '', expiryDate: '', channel: 'IN_APP', message: '',
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/api/notifications?page=0&size=20');
        const items = data.items || [];
        setNotifications(items);
        setNotificationCount(data.totalElements || items.length);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/api/notifications', form);
      setForm({
        recipientType: 'INDIVIDUAL', recipientRole: 'EMPLOYEE', recipientCode: '',
        title: '', subject: '', priority: 'MEDIUM', category: '',
        sendDate: '', expiryDate: '', channel: 'IN_APP', message: '',
      });
      const data = await api.get('/api/notifications?page=0&size=20');
      setNotifications(data.items || []);
      setNotificationCount(data.totalElements || 0);
      showToast('Notification sent', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  }

  function showToast(msg, type) {
    const bg = type === 'error' ? '#fef2f2' : '#ecfdf5';
    const fg = type === 'error' ? '#dc2626' : '#047857';
    const border = type === 'error' ? '#fecaca' : '#a7f3d0';
    let host = document.getElementById('ems-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ems-toast-host';
      host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 16px 36px rgba(15,23,42,.14);`;
    host.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const filteredList = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'read' && !n.read) return false;
    if (search && !(n.title || '').toLowerCase().includes(search.toLowerCase()) && !(n.message || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="corporate-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading notifications...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="corporate-content">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Notifications</h1>
          <p>Send messages to employees, teams, or departments. Track inbox, sent items, and the feed.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => {
            api.put('/api/notifications/read-all').catch(() => {});
            setNotifications(n => n.map(x => ({ ...x, read: true, status: 'READ' })));
            setUnreadCount(0);
            showToast('All marked as read', 'success');
          }}>
            <span className="material-symbols-outlined">mark_email_read</span>
            Mark All Read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Total', value: notificationCount, color: '#2563eb' },
          { label: 'Unread', value: unreadCount, color: '#d97706' },
          { label: 'Read', value: notificationCount - unreadCount, color: '#059669' },
          { label: 'Sent', value: notifications.filter(n => n.senderCode).length, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="content-card">
            <div style={{ padding: 'var(--ems-space-lg)' }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-card mb-6">
        <div style={{ padding: 'var(--ems-space-md) var(--ems-space-xl)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 200 }}>
            <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: 20 }}>search</span>
            <input
              type="search"
              placeholder="Search title, message..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#334155', background: 'transparent' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff' }}
          >
            <option value="all">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              api.get('/api/notifications?page=0&size=20')
                .then(data => {
                  setNotifications(data.items || []);
                  setNotificationCount(data.totalElements || 0);
                  setUnreadCount(data.unreadCount || 0);
                })
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
            style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#475569', background: '#fff', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4" style={{ minWidth: 0 }}>
          <div className="content-card" style={{ overflow: 'hidden' }}>
            <div className="content-card-header">
              <div>
                <h3>Compose Message</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Send to employees or management groups</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ems-space-md)', minWidth: 0 }}>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="recipientType">Recipient type</label>
                  <select id="recipientType" name="recipientType" className="form-select" value={form.recipientType} onChange={handleChange}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="TEAM">Team</option>
                    <option value="ALL">All employees</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="recipientRole">Role</label>
                  <select id="recipientRole" name="recipientRole" className="form-select" value={form.recipientRole} onChange={handleChange}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                    <option value="ALL">All</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="recipientCode">Employee code</label>
                <input id="recipientCode" name="recipientCode" className="form-input" placeholder="Leave blank for group sends" value={form.recipientCode} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Title</label>
                <input id="title" name="title" className="form-input" placeholder="Notification title" value={form.title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject</label>
                <input id="subject" name="subject" className="form-input" placeholder="Short subject line" value={form.subject} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ems-space-md)', minWidth: 0 }}>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="priority">Priority</label>
                  <select id="priority" name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="category">Category</label>
                  <input id="category" name="category" className="form-input" placeholder="HR, Payroll, Attendance..." value={form.category} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ems-space-md)', minWidth: 0 }}>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="sendDate">Send date</label>
                  <input id="sendDate" name="sendDate" type="date" className="form-input" value={form.sendDate} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label" htmlFor="expiryDate">Expiry date</label>
                  <input id="expiryDate" name="expiryDate" type="date" className="form-input" value={form.expiryDate} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="channel">Channel</label>
                <select id="channel" name="channel" className="form-select" value={form.channel} onChange={handleChange}>
                  <option value="IN_APP">In app</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea id="message" name="message" className="form-textarea" rows={4} placeholder="Write the message content" value={form.message} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          {[
            { id: 'notification-inbox', title: 'Inbox', sub: 'Received messages' },
            { id: 'notification-sent', title: 'Sent', sub: 'Messages you sent' },
            { id: 'notification-feed', title: 'Feed', sub: 'Announcements and company activity' },
          ].map(s => (
            <div key={s.id} className="content-card">
              <div className="content-card-header">
                <div>
                  <h3>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.sub}</p>
                </div>
              </div>
              <div style={{ padding: 'var(--ems-space-xl)', display: 'grid', gap: 'var(--ems-space-md)' }}>
                {error ? (
                  <p style={{ color: '#dc2626', fontSize: 14 }}>Error: {error}</p>
                ) : filteredList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14, border: '1px dashed #e2e8f0', borderRadius: 12 }}>
                    No messages yet.
                  </div>
                ) : (
                  filteredList.slice(0, 5).map((n, i) => (
                    <div key={n.id || i} style={{
                      padding: 16, borderRadius: 12,
                      background: !n.read ? '#f0f9ff' : 'transparent',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                    }}
                      onClick={() => {
                        if (!n.read) {
                          api.put(`/api/notifications/${n.id}/read`).catch(() => {});
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true, status: 'READ' } : x));
                          setUnreadCount(c => Math.max(0, c - 1));
                        }
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.title || n.subject || 'Notification'}
                          </p>
                          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.message || n.body}
                          </p>
                          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                            {n.senderName ? `${n.senderName} • ` : ''}{formatDate(n.createdAt)}
                          </p>
                        </div>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
