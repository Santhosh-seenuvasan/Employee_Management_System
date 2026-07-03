import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const AUTH_KEYS = [
  'ems_token', 'ems_role', 'ems_employeeCode', 'ems_email',
  'ems_fullName', 'ems_userId', 'ems_department', 'ems_permissions', 'ems_rememberMe'
];

function getStorage() {
  const flag = (() => {
    try { return localStorage.getItem('ems_rememberMe'); } catch (_) { return null; }
  })();
  if (flag === 'true') return localStorage;
  if (flag === 'false') return sessionStorage;
  return localStorage;
}

function getAllAuth() {
  const data = {};

  AUTH_KEYS.forEach(key => {
    try { data[key] = localStorage.getItem(key); } catch (_) { data[key] = null; }
    if (!data[key]) {
      try { data[key] = sessionStorage.getItem(key); } catch (_) { data[key] = null; }
    }
  });

  return data;
}

function clearAllStorage() {
  AUTH_KEYS.forEach(key => {
    try { localStorage.removeItem(key); } catch (_) {}
    try { sessionStorage.removeItem(key); } catch (_) {}
  });
}

function saveToStorage(session) {
  const storage = session.ems_rememberMe === 'true' ? localStorage : sessionStorage;

  AUTH_KEYS.forEach(key => {
    if (session[key] !== undefined) {
      try { storage.setItem(key, session[key]); } catch (_) {}
    }
  });
}

function buildWindowAuth() {
  return {
    token()        { return getFromStorage('ems_token'); },
    role()         { return getFromStorage('ems_role'); },
    employeeCode() { return getFromStorage('ems_employeeCode'); },
    email()        { return getFromStorage('ems_email'); },
    fullName()     { return getFromStorage('ems_fullName'); },
    userId()       { return getFromStorage('ems_userId'); },
    department()   { return getFromStorage('ems_department'); },
    isLoggedIn()   { return !!this.token(); },
    headers() {
      const t = this.token();
      return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
    }
  };
}

function getFromStorage(key) {
  try {
    const flag = localStorage.getItem('ems_rememberMe');
    if (flag === 'true') return localStorage.getItem(key);
    if (flag === 'false') return sessionStorage.getItem(key);
    const val = localStorage.getItem(key);
    if (val) return val;
    return sessionStorage.getItem(key);
  } catch (_) { return null; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = getAllAuth();
    window.Auth = buildWindowAuth();
    return stored;
  });

  const login = useCallback((session) => {
    saveToStorage(session);
    window.Auth = buildWindowAuth();
    setAuth(getAllAuth());
  }, []);

  const logout = useCallback(() => {
    clearAllStorage();
    window.Auth = buildWindowAuth();
    setAuth(getAllAuth());
  }, []);

  const isLoggedIn = !!auth.ems_token;
  const role = (auth.ems_role || '').toUpperCase();
  const rememberMe = auth.ems_rememberMe === 'true';

  const allowedRoles = useCallback((roles) => {
    if (!roles || roles.length === 0) return true;
    const upper = roles.map(r => r.toUpperCase());
    return upper.includes(role) || (role === 'MANAGER' && upper.includes('MANAGEMENT'));
  }, [role]);

  return (
    <AuthContext.Provider value={{
      ...auth, isLoggedIn, role, rememberMe,
      login, logout, allowedRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);
}

export function getToken() {
  return getFromStorage('ems_token');
}

export function getAuthHeaders() {
  const t = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': t ? `Bearer ${t}` : ''
  };
}