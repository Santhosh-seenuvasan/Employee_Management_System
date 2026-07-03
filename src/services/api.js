export const API_HOST = (() => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname || 'localhost'}:8080`;
  }
  return 'http://localhost:8080';
})();

const AUTH_KEYS = [
  'ems_token', 'ems_role', 'ems_employeeCode', 'ems_email',
  'ems_fullName', 'ems_userId', 'ems_department', 'ems_permissions', 'ems_rememberMe'
];

function getToken() {
  try {
    const flag = localStorage.getItem('ems_rememberMe');
    if (flag === 'true') return localStorage.getItem('ems_token');
    if (flag === 'false') return sessionStorage.getItem('ems_token');
    return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token') || '';
  } catch (_) { return ''; }
}

function clearAuth() {
  AUTH_KEYS.forEach(key => {
    try { localStorage.removeItem(key); } catch (_) {}
    try { sessionStorage.removeItem(key); } catch (_) {}
  });
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

async function handleResponse(response) {
  if (response.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Session expired. Please login again.');
  }
  if (response.status === 403) {
    throw new Error('Forbidden. You do not have permission.');
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `${response.status} ${response.url}`);
  }
  return response.json();
}

export async function get(path) {
  const response = await fetch(`${API_HOST}${path}`, { headers: authHeaders() });
  return handleResponse(response);
}

export async function post(path, body) {
  const response = await fetch(`${API_HOST}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function put(path, body) {
  const response = await fetch(`${API_HOST}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function del(path) {
  const response = await fetch(`${API_HOST}${path}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse(response);
}

export async function upload(path, formData) {
  const headers = { 'Authorization': `Bearer ${getToken()}` };
  const response = await fetch(`${API_HOST}${path}`, { method: 'POST', headers, body: formData });
  return handleResponse(response);
}

export async function downloadBlob(path) {
  const response = await fetch(`${API_HOST}${path}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return response.blob();
}

export const api = { get, post, put, del, upload, downloadBlob };
export default api;