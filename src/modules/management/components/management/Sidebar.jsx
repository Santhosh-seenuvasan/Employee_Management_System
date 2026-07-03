import React from 'react';
import { Sidebar as SharedSidebar } from '../../../../../shared-components/Sidebar.jsx';

export default function Sidebar({ collapsed, unreadCount = 0, onLogout }) {  
  return (
    <SharedSidebar
      role="manager"
      unreadCount={unreadCount}
      onLogout={onLogout}
      variant="vanilla"
      collapsed={collapsed}
    />
  );
}