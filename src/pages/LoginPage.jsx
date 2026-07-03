import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../modules/login/pages/Login.jsx';

export default function LoginPageWrapper() {
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleLoginSuccess(data) {
    login({
      ems_token: data.token,
      ems_role: data.role,
      ems_employeeCode: data.employeeCode,
      ems_email: data.email,
      ems_fullName: data.fullName,
      ems_userId: String(data.userId || ''),
      ems_department: data.department || '',
      ems_permissions: data.permissions || '',
      ems_rememberMe: data.rememberMe ? 'true' : 'false',
    });
    navigate('/dashboard');
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
