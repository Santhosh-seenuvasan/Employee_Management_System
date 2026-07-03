export function cleanRoute(pathname = window.location.pathname) {
  let path = pathname.replace(/\/code\.html$/i, '');
  path = path.replace(/\/$/, '');
  return path || '/admin-dashboard/dashboard';
}

export function toReactPath(href) {
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  const url = new URL(href, window.location.href);
  return cleanRoute(url.pathname) + url.search + url.hash;
}

export function navigate(path) {
  const next = toReactPath(path);
  if (!next || next === path && path.startsWith('http')) return;
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
