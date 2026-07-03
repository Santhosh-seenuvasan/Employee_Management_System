import { useLocation, Link } from 'react-router-dom';
import { hrMenuItems } from './menu.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function Sidebar({ collapsed }) {
  const location = useLocation();
  const { logout } = useAuth();

  function handleLogout() {
    const keys = ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    keys.forEach(k => { try { sessionStorage.removeItem(k); } catch (_) {} });
    logout();
  }

  return (
    <>
      <aside id="sidebar" className={`corporate-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span className="material-symbols-outlined">business_center</span>
          </div>
          <div className="sidebar-logo-text">
            <h2>Corporate EMS</h2>
            <p id="sidebar-role-label">HR Administration</p>
          </div>
        </div>

        <ul className="sidebar-nav" id="sidebar-menu">
          {hrMenuItems.map((item) => {
            const active = item.match ? location.pathname.startsWith(item.match) : location.pathname === item.path;
            return (
              <li key={item.path} className={`sidebar-nav-item ${active ? 'active' : ''}`}>
                <Link to={item.path} aria-current={active ? 'page' : undefined}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="sidebar-nav-text">{item.text}</span>
                  {item.text === 'Notifications' && <span className="sidebar-nav-badge" data-unread-count-badge style={{ display: 'none' }} />}
                </Link>
              </li>
            );
          })}

          <li className="sidebar-nav-item" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--ems-border)' }}>
            <button onClick={handleLogout} className="logout-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, height: 48, width: '100%', border: 'none', cursor: 'pointer', padding: '0 16px', fontSize: 14, fontWeight: 500 }}>
              <span className="material-symbols-outlined">logout</span>
              <span className="sidebar-nav-text">Logout</span>
            </button>
          </li>
        </ul>
      </aside>
      <div id="sidebarOverlay" className="sidebar-overlay" />
    </>
  );
}
