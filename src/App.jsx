import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EmployeeShell from './pages/employee/EmployeeShell';
import ManagementShell from './pages/management/ManagementShell';
import AdminShell from './pages/admin/AdminShell';
import ProtectedRoute from './components/ProtectedRoute';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import { useAuth } from './context/AuthContext';

function RoleRedirect() {
  const { role } = useAuth();
  if (role === 'ADMIN' || role === 'HR') return <Navigate to="/admin-dashboard" replace />;
  if (role === 'MANAGEMENT' || role === 'MANAGER') return <Navigate to="/management-dashboard" replace />;
  return <Navigate to="/employee-dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route path="/employee-dashboard/*" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN', 'MANAGEMENT', 'MANAGER']}>
          <EmployeeShell />
        </ProtectedRoute>
      } />

      <Route path="/management-dashboard/*" element={
        <ProtectedRoute allowedRoles={['MANAGEMENT', 'MANAGER']}>
          <ManagementShell />
        </ProtectedRoute>
      } />

      <Route path="/admin-dashboard/*" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
          <AdminShell />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}