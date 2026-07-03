import { useState } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="corporate-page">
      <Sidebar collapsed={collapsed} />
      <div id="main-content" className={`corporate-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title={title} onToggleSidebar={() => setCollapsed((value) => !value)} />
        <div id="breadcrumb-container" data-breadcrumbs="true" className="breadcrumb" />
        {children}
      </div>
    </div>
  );
}
