import React, { createContext, useContext, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const roleMenus = {
  hr_admin: [
    { icon: "dashboard",  text: "Dashboard",   path: "/admin-dashboard/dashboard" },
    { icon: "group",      text: "Employees",   path: "/admin-dashboard/employees" },
    { icon: "domain",     text: "Departments", path: "/admin-dashboard/departments" },
    { icon: "work",       text: "Recruitment", path: "/admin-dashboard/recruitment" },
    { icon: "person_add", text: "Onboarding",  path: "/admin-dashboard/onboarding" },
    { icon: "how_to_reg", text: "Attendance",  path: "/admin-dashboard/attendance" },
    { icon: "event_busy", text: "Leave",       path: "/admin-dashboard/leave" },
    { icon: "payments",   text: "Payroll",     path: "/admin-dashboard/payroll" },
    { icon: "workspace_premium", text: "Performance", path: "/admin-dashboard/performance" },
    { icon: "school",     text: "Training",    path: "/admin-dashboard/training" },
    { icon: "inventory_2", text: "Assets",      path: "/admin-dashboard/assets" },
    { icon: "notifications", text: "Notifications", path: "/admin-dashboard/notifications" },
    { icon: "bar_chart",  text: "Reports",     path: "/admin-dashboard/reports" },
    { icon: "settings",   text: "Settings",    path: "/admin-dashboard/settings" },
    { icon: "person",     text: "Profile",     path: "/admin-dashboard/profile" },
    { icon: "track_changes", text: "OB Tracker", path: "/admin-dashboard/onboarding-tracking" }
  ],
  manager: [
    { icon: "dashboard",      text: "Overview",       path: "/management-dashboard/dashboard" },
    { icon: "groups",         text: "Employees",      path: "/management-dashboard/employees" },
    { icon: "group_work",     text: "Teams",          path: "/management-dashboard/teams" },
    { icon: "how_to_reg",     text: "Attendance",     path: "/management-dashboard/attendance" },
    { icon: "event_busy",     text: "Leave Requests", path: "/management-dashboard/leave-requests" },
    { icon: "query_stats",    text: "Performance",    path: "/management-dashboard/performance-reviews" },
    { icon: "notifications",  text: "Notifications",  path: "/management-dashboard/notifications" },
    { icon: "analytics",      text: "Reports",        path: "/management-dashboard/reports" },
    { icon: "person",         text: "Profile",        path: "/management-dashboard/profile-settings" },
    { icon: "settings",       text: "Settings",       path: "/management-dashboard/settings" },
    { icon: "task_alt",       text: "Approvals",      path: "/management-dashboard/approvals" },
    { icon: "folder_special", text: "Projects",       path: "/management-dashboard/projects" },
    { icon: "groups",         text: "Meetings",       path: "/management-dashboard/meetings" },
    { icon: "analytics",      text: "Dept. Reports",  path: "/management-dashboard/department-reports" },
    { icon: "leaderboard",    text: "Team Analytics", path: "/management-dashboard/team-analytics" }
  ],
  employee: [
    { icon: "dashboard",     text: "My Dashboard",  path: "/employee-dashboard/dashboard" },
    { icon: "person",        text: "My Profile",    path: "/employee-dashboard/profile" },
    { icon: "how_to_reg",    text: "Attendance",    path: "/employee-dashboard/attendance" },
    { icon: "event_busy",    text: "Apply Leave",   path: "/employee-dashboard/apply-leave" },
    { icon: "payments",      text: "Salary Slips",  path: "/employee-dashboard/salary-slips" },
    { icon: "trending_up",   text: "Performance",   path: "/employee-dashboard/performance" },
    { icon: "school",        text: "Training",      path: "/employee-dashboard/training" },
    { icon: "notifications", text: "Notifications", path: "/employee-dashboard/notifications" },
    { icon: "folder",        text: "Documents",     path: "/employee-dashboard/documents" },
    { icon: "settings",      text: "Settings",      path: "/employee-dashboard/settings" }
  ]
};

const roleLabels = {
  hr_admin: "HR Administration",
  manager: "Management",
  employee: "Employee Portal"
};

const rootPaths = {
  hr_admin: "/admin-dashboard",
  manager: "/management-dashboard",
  employee: "/employee-dashboard"
};

const SidebarContext = createContext();

export function SidebarProvider({ children, role = 'employee' }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  const value = {
    role,
    collapsed,
    setCollapsed,
    unreadCount,
    setUnreadCount,
    toggle: () => setCollapsed(prev => !prev),
    show: () => setCollapsed(false),
    hide: () => setCollapsed(true)
  };
  
  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

export function getSidebarMenu(role) {
  return roleMenus[role] || roleMenus.employee;
}

export function detectRoleFromPath(path) {
  const p = path.toLowerCase();
  if (p.includes("/management-dashboard/")) return "manager";
  if (p.includes("/employee-dashboard/"))   return "employee";
  return "hr_admin";
}

const ROLE_MAP = {
  admin: 'hr_admin',
  hr: 'hr_admin',
  manager: 'manager',
  management: 'manager',
  employee: 'employee'
};

export function getRoleFromStorage() {
  if (typeof window === 'undefined') return null;

  const forcedRole = String(window.EMS_PORTAL_ROLE || "").toLowerCase();
  if (forcedRole && roleMenus[forcedRole]) return forcedRole;

  const storedRole = localStorage.getItem('ems_role') || sessionStorage.getItem('ems_role');
  if (storedRole) {
    const mapped = ROLE_MAP[storedRole.toLowerCase()];
    if (mapped) return mapped;
  }

  return null;
}

export function useRoleRedirect(defaultRole = 'employee') {
  const navigate = useNavigate();
  const role = getRoleFromStorage() || defaultRole;
  
  const redirectToRoleDashboard = (targetRole) => {
    if (rootPaths[targetRole]) {
      navigate(rootPaths[targetRole]);
    }
  };
  
  return { role, redirectToRoleDashboard };
}

export function Sidebar({ 
  role, 
  unreadCount: propUnreadCount, 
  onLogout,
  variant = 'default',
  showRoleLabel = true,
  sidebarHidden = false,
  collapsed = false
}) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const effectiveRole = role || getRoleFromStorage() || 'employee';
  const effectiveUnreadCount = propUnreadCount ?? 0;
  const menuItems = getSidebarMenu(effectiveRole);
  
  const isActive = (path) => {
    if (effectiveRole === 'manager') {
      if (path === '/management-dashboard/dashboard') {
        return location.pathname === path;
      }
      return location.pathname === path || location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const logoutPath = '/login';

  if (variant === 'vanilla') {
    const sidebarClass = `corporate-sidebar${!sidebarHidden ? ' open' : ''}${sidebarHidden ? ' sidebar-hidden' : ''}${collapsed ? ' collapsed' : ''}`;
    return (
      <>
        <aside id="sidebar" className={sidebarClass}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div className="sidebar-logo-text">
              <h2>Corporate EMS</h2>
              {showRoleLabel && <p id="sidebar-role-label">{roleLabels[effectiveRole]}</p>}
            </div>
          </div>
          <ul className="sidebar-nav" id="sidebar-menu">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const isNotif = item.text === "Notifications";
              return (
                <li key={item.path} className={`sidebar-nav-item${active ? ' active' : ''}`}>
                  <Link to={item.path} aria-current={active ? 'page' : undefined}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="sidebar-nav-text">{item.text}</span>
                    {isNotif && effectiveUnreadCount > 0 && (
                      <span className="sidebar-nav-badge" data-unread-count-badge>
                        {effectiveUnreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="sidebar-nav-item" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--ems-border)' }}>
              <button
                onClick={handleLogout}
                className="logout-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ems-space-md)',
                  height: '48px',
                  padding: '0 var(--ems-space-lg)',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  transition: 'var(--ems-transition-fast)',
                  fontWeight: 500,
                  fontSize: '14px',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="sidebar-nav-text">Logout</span>
              </button>
            </li>
          </ul>
        </aside>
      </>
    );
  }

  const baseStyles = {
    sidebar: {
      width: '260px',
      backgroundColor: '#fff',
      borderRight: '1px solid rgba(226,232,240,0.8)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      zIndex: 40,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px',
      marginBottom: '24px'
    },
    logoIcon: {
      width: '42px',
      height: '42px',
      backgroundColor: '#2563eb',
      color: '#fff',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
      fontFamily: 'Material Symbols Outlined',
      fontSize: '24px',
      flexShrink: 0
    },
    navList: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      margin: 0,
      padding: 0
    },
    navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: '500',
      fontSize: '13px'
    }
  };

  return (
    <aside style={baseStyles.sidebar}>
      <div style={baseStyles.logo}>
        <div style={baseStyles.logoIcon}>
          corporate_fare
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Corporate EMS</h2>
          {showRoleLabel && (
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', margin: 0 }}>
              {roleLabels[effectiveRole]}
            </p>
          )}
        </div>
      </div>
      
      <ul style={baseStyles.navList}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const isNotif = item.text === "Notifications";
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  ...baseStyles.navLink,
                  color: active ? '#2563eb' : '#64748b',
                  backgroundColor: active ? '#dbeafe' : 'transparent',
                  fontWeight: active ? '700' : '500'
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span style={{
                  fontFamily: 'Material Symbols Outlined',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {item.icon}
                </span>
                <span className="sidebar-nav-text">{item.text}</span>
                {isNotif && effectiveUnreadCount > 0 && (
                  <span className="sidebar-nav-badge" data-unread-count-badge>
                    {effectiveUnreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all .2s'
          }}
        >
          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '20px' }}>logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}