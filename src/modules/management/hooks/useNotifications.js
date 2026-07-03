import { useState, useCallback } from 'react';
import { Auth, EMS_API } from './useAuth';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${EMS_API.LOGIN}/api/notifications/latest`, {
        headers: Auth.headers(),
      });
      if (!res.ok) throw new Error('Failed');
      let list = await res.json();
      if (!Array.isArray(list)) list = list.items || list.content || [];
      const mapped = list.map(n => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        senderName: n.senderName || n.sender || 'System',
        category: n.category || n.type || 'General',
        createdAt: n.createdAt || 'just now',
        read: Boolean(n.read) || n.status === 'READ',
        route: n.route || n.targetPage,
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch(`${EMS_API.LOGIN}/api/notifications/read-all`, {
        method: 'PUT',
        headers: Auth.headers(),
      });
    } catch { /* ignore */ }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const toggleRead = useCallback(async (id, read) => {
    try {
      await fetch(`${EMS_API.LOGIN}/api/notifications/${encodeURIComponent(id)}/read`, {
        method: read ? 'PUT' : 'DELETE',
        headers: Auth.headers(),
      });
    } catch { /* ignore */ }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read } : n))
    );
    setUnreadCount(prev => (read ? Math.max(0, prev - 1) : prev + 1));
  }, []);

  return { notifications, unreadCount, load, markAllRead, toggleRead };
}
