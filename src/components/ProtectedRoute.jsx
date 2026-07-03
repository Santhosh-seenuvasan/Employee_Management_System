import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, allowedRoles: checkRoles } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !checkRoles(allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}