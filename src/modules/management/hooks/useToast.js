// Simple toast utility — mirrors EMS_Toast from utils.js
let toastHost = null;

function getHost() {
  if (toastHost && document.body.contains(toastHost)) return toastHost;
  toastHost = document.getElementById('ems-toast-host');
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.id = 'ems-toast-host';
    toastHost.style.cssText =
      'position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 32px));';
    document.body.appendChild(toastHost);
  }
  return toastHost;
}

const COLORS = {
  success: ['#ecfdf5', '#047857', '#a7f3d0'],
  error:   ['#fef2f2', '#b91c1c', '#fecaca'],
  warning: ['#fffbeb', '#b45309', '#fde68a'],
  info:    ['#eff6ff', '#1d4ed8', '#bfdbfe'],
};

function show(message, type = 'info') {
  const [bg, fg, border] = COLORS[type] || COLORS.info;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.textContent = message;
  el.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;`;
  getHost().appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    el.style.transition = 'all .2s ease';
    setTimeout(() => el.remove(), 220);
  }, 2600);
}

export const Toast = {
  success: (msg) => show(msg, 'success'),
  error:   (msg) => show(msg, 'error'),
  warning: (msg) => show(msg, 'warning'),
  info:    (msg) => show(msg, 'info'),
};
