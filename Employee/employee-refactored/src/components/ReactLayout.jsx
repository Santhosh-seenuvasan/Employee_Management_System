(function () {
  "use strict";

  const { memo } = React;
  const DASH = "\u2014";

  function Icon({ children, className = "", ...props }) {
    return <span className={`material-symbols-outlined ${className}`.trim()} {...props}>{children}</span>;
  }

  const Header = memo(function Header({ title }) {
    return (
      <header className="corporate-header">
        <div className="header-left">
          <button id="sidebarToggle" className="header-toggle-btn" aria-label="Toggle sidebar">
            <Icon>menu</Icon>
          </button>
          <h1 className="header-title" id="page-header-title">{title}</h1>
        </div>

        <div className="header-right">
          <div className="relative">
            <button id="notificationBtn" className="header-icon-btn" aria-label="Notifications" aria-haspopup="dialog" aria-expanded="false">
              <Icon>notifications</Icon>
              <span id="notificationBadge" className="header-badge" style={{ display: "none" }}>0</span>
            </button>
            <div id="notificationDropdown" className="notification-dropdown">
              <div className="notification-dropdown-header">
                <span className="notification-dropdown-title">Notifications</span>
                <button className="notification-dropdown-clear" id="markAllReadBtn">Mark all read</button>
              </div>
              <div className="notification-dropdown-list" id="notificationList"></div>
              <div className="notification-dropdown-footer">
                <a href="../notifications/code.html">View All Notifications</a>
              </div>
            </div>
          </div>

          <button className="header-icon-btn" aria-label="Help">
            <Icon>help</Icon>
          </button>
          <div className="header-divider"></div>

          <div className="header-profile">
            <div className="header-profile-info">
              <p id="header-name" className="header-profile-name">{DASH}</p>
              <p id="header-role" className="header-profile-role">{DASH}</p>
            </div>
            <button id="profileBtn" className="header-profile-avatar" aria-label="Profile menu" aria-haspopup="menu" aria-expanded="false">
              {DASH}
            </button>
            <div id="profileDropdown" className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar" id="dropdownAvatar">{DASH}</div>
                <div>
                  <p id="dropdownName" className="font-bold text-slate-900">{DASH}</p>
                  <p id="dropdownRole" className="text-sm text-slate-500">{DASH}</p>
                </div>
              </div>
              <div className="profile-dropdown-menu">
                <a href="../profile_settings/code.html" className="profile-dropdown-item" data-nav="profile"><Icon>person</Icon>My Profile</a>
                <a href="../settings/code.html" className="profile-dropdown-item" data-nav="settings"><Icon>settings</Icon>Settings</a>
                <a href="../notifications/code.html" className="profile-dropdown-item" data-nav="notifications"><Icon>notifications</Icon>Notifications</a>
                <div className="profile-dropdown-divider"></div>
                <button id="logoutBtn" className="profile-dropdown-item profile-dropdown-logout"><Icon>logout</Icon>Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  });

  const Sidebar = memo(function Sidebar() {
    return (
      <>
        <aside id="sidebar" className="corporate-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><Icon>badge</Icon></div>
            <div className="sidebar-logo-text">
              <h2>Corporate EMS</h2>
              <p id="sidebar-role-label">Employee Portal</p>
            </div>
          </div>
          <ul className="sidebar-nav" id="sidebar-menu"></ul>
        </aside>
        <div id="sidebarOverlay" className="sidebar-overlay"></div>
      </>
    );
  });

  function CorporateShell({ title, children }) {
    return (
      <div className="corporate-page">
        <Sidebar />
        <div className="corporate-main" id="main-content">
          <Header title={title} />
          <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" style={{ display: "none" }}></div>
          <div className="corporate-content">{children}</div>
        </div>
      </div>
    );
  }

  window.EMSReactLayout = { CorporateShell, Header, Icon, Sidebar };
})();
