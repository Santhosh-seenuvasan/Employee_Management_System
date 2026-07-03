import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/management/Sidebar';
import Header from '../components/management/Header';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export default function ManagementLayout({ children, pageTitle }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ems_sidebar_collapsed') !== 'false');
  useEffect(() => { localStorage.setItem('ems_sidebar_collapsed', collapsed); }, [collapsed]);
  const { notifications, unreadCount, load, markAllRead, toggleRead } = useNotifications();

  // Load notifications on mount (no auth guard — direct access)
  useEffect(() => {
    load();
  }, [load]);

  function handleToggleSidebar() {
    setCollapsed(prev => !prev);
  }

  function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  }

  return (
    <div className="corporate-page">
      <Sidebar
        collapsed={collapsed}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      <div
        className={`corporate-main${collapsed ? ' sidebar-collapsed' : ''}`}
        id="main-content"
      >
        <Header
          pageTitle={pageTitle || 'Corporate EMS'}
          onToggleSidebar={handleToggleSidebar}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onToggleRead={toggleRead}
        />

        {/* Breadcrumb placeholder (hidden by default, same as HTML) */}
        <div
          id="breadcrumb-container"
          data-breadcrumbs="true"
          className="breadcrumb"
          style={{ display: 'none' }}
        />

        <div className="corporate-content">
          {children}
        </div>
      </div>
    </div>
  );
}
