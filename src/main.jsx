import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './styles/app.css';
import './modules/employee/styles/corporate-design-system.css';
import './modules/employee/styles/portal-center.css';
import './modules/employee/styles/auth-modals.css';
import './modules/employee/styles/employee-dashboard.css';
import './modules/employee/styles/profile-settings.css';
import './modules/employee/styles/apply-leave.css';
import './modules/employee/styles/attendance-view.css';
import './modules/employee/styles/salary-slips.css';
import './modules/employee/styles/performance.css';
import './modules/employee/styles/notifications.css';
import './modules/employee/styles/ui-enhancements.css';
import './modules/management/styles/corporate-design-system.css';
import './modules/management/styles/portal-center.css';
import './modules/admin/styles/styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
