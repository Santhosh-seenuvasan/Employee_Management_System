import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ForbiddenPage() {
  const { role } = useAuth();

  const dashboardMap = {
    ADMIN: '/admin-dashboard',
    HR: '/admin-dashboard',
    MANAGEMENT: '/management-dashboard',
    MANAGER: '/management-dashboard',
    EMPLOYEE: '/employee-dashboard',
  };

  const fallback = dashboardMap[role] || '/employee-dashboard';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '32px',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{ fontSize: '96px', fontWeight: 'bold', color: '#ef4444', lineHeight: 1 }}>
        403
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#0f172a', margin: '16px 0 8px' }}>
        Access Forbidden
      </h1>
      <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '480px', marginBottom: '32px' }}>
        You do not have the required permissions to access this page.
        If you believe this is a mistake, please contact your administrator.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to={fallback}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
          }}>
          Go to Dashboard
        </Link>
        <Link to="/"
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#64748b',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
          }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}