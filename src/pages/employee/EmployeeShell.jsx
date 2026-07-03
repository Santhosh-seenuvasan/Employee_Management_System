import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import EmployeeDashboard from '../../modules/employee/components/EmployeeDashboard.jsx';
import ApplyLeave from '../../modules/employee/components/ApplyLeave.jsx';
import AttendanceView from '../../modules/employee/components/AttendanceView.jsx';
import SalarySlips from '../../modules/employee/components/SalarySlips.jsx';
import Performance from '../../modules/employee/components/Performance.jsx';
import ProfileSettings from '../../modules/employee/components/ProfileSettings.jsx';
import Notifications from '../../modules/employee/components/Notifications.jsx';
import Documents from '../../modules/employee/components/Documents.jsx';
import Settings from '../../modules/employee/components/Settings.jsx';
import Training from '../../modules/employee/components/Training.jsx';
import '../../modules/employee/styles/app.css';

const EMPLOYEE_ROUTES = [
  { path: '/', element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <EmployeeDashboard /> },
  { path: 'profile', element: <ProfileSettings /> },
  { path: 'profile-settings', element: <ProfileSettings /> },
  { path: 'attendance', element: <AttendanceView /> },
  { path: 'attendance-view', element: <AttendanceView /> },
  { path: 'apply-leave', element: <ApplyLeave /> },
  { path: 'leave', element: <ApplyLeave /> },
  { path: 'salary', element: <SalarySlips /> },
  { path: 'salary-slips', element: <SalarySlips /> },
  { path: 'performance', element: <Performance /> },
  { path: 'training', element: <Training /> },
  { path: 'notifications', element: <Notifications /> },
  { path: 'documents', element: <Documents /> },
  { path: 'settings', element: <Settings /> },
  { path: '*', element: <Navigate to="dashboard" replace /> },
];

export default function EmployeeShell() {
  return (
    <Routes>
      {EMPLOYEE_ROUTES.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}
