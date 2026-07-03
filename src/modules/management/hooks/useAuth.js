// Auth hook - mirrors utils.js Auth object from the original HTML pages

const GATEWAY = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8080`;
  }
  return 'http://localhost:8080';
})();

export const EMS_API = {
  LOGIN: GATEWAY,
  HR: GATEWAY,
  MGMT: GATEWAY,
};

const EMS_STORAGE = {
  get(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  },
};

export const Auth = {
  save(response) {
    EMS_STORAGE.set('ems_token', response.token);
    EMS_STORAGE.set('ems_role', response.role);
    EMS_STORAGE.set('ems_employeeCode', response.employeeCode);
    EMS_STORAGE.set('ems_email', response.email);
    if (response.fullName) EMS_STORAGE.set('ems_fullName', response.fullName);
  },
  clear() {
    ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'].forEach(k =>
      EMS_STORAGE.remove(k)
    );
  },
  token() { return EMS_STORAGE.get('ems_token'); },
  role() { return EMS_STORAGE.get('ems_role'); },
  employeeCode() { return EMS_STORAGE.get('ems_employeeCode'); },
  email() { return EMS_STORAGE.get('ems_email'); },
  fullName() { return EMS_STORAGE.get('ems_fullName'); },
  isLoggedIn() { return !!this.token(); },
  headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token()}`,
    };
  },
  initials() {
    const name = this.fullName() || this.email() || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() || '')
      .join('') || 'NA';
  },
};

export async function fetchJson(url) {
  const response = await fetch(url, { headers: Auth.headers() });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

export default Auth;
