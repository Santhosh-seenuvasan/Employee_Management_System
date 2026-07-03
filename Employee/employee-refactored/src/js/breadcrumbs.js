// ====================== EMS BREADCRUMB NAVIGATION ======================

/**
 * EMS Breadcrumb Navigation System
 * Generates dynamic breadcrumb navigation based on current page path
 */

(function() {
    'use strict';

    // Breadcrumb route definitions
    const breadcrumbRoutes = {
        // Admin HR routes
        'admin_hr_dashboard': ['Dashboard'],
        'employee_directory': ['Employees'],
        'departments': ['Departments'],
        'recruitment_management': ['Recruitment'],
        'employee_onboarding': ['Onboarding'],
        'attendance_management': ['Attendance'],
        'leave_management': ['Leave Management'],
        'payroll_page': ['Payroll'],
        'performance': ['Performance'],
        'training': ['Training'],
        'asset_management': ['Asset Management'],
        'notifications': ['Notifications'],
        'reports_dashboard': ['Reports'],
        'settings': ['Settings'],
        'profile_settings': ['Profile'],
        'onboarding_tracking': ['Onboarding', 'Tracker'],
        'document_management': ['Documents'],

        // Management routes
        'management_dashboard': ['Overview'],
        'employees': ['Employees'],
        'teams': ['Teams'],
        'attendance': ['Attendance'],
        'leave_requests': ['Leave Requests'],
        'performance_reviews': ['Performance', 'Reviews'],
        'approvals': ['Approvals'],
        'projects': ['Projects'],
        'meetings': ['Meetings'],
        'department_reports': ['Reports', 'Department'],
        'team_analytics': ['Analytics', 'Team'],

        // Employee routes
        'employee_dashboard': ['My Dashboard'],
        'attendance_view': ['Attendance'],
        'apply_leave': ['Apply Leave'],
        'salary_slips': ['Salary Slips'],
        'documents': ['Documents']
    };

    // Role-based parent routes
    const roleParents = {
        'admin_hr': 'Dashboard',
        'manager': 'Overview',
        'employee': 'My Dashboard'
    };

    function detectRole(path) {
        const p = path.toLowerCase();
        if (p.includes('/management/')) return 'manager';
        if (p.includes('/employee/')) return 'employee';
        return 'admin_hr';
    }

    function getCurrentPageKey(path) {
        const segs = path.split('/').filter(s => s.length > 0);
        if (segs.length >= 2) {
            return segs[segs.length - 2].toLowerCase();
        }
        return '';
    }

    function getBreadcrumbPath(path) {
        const role = detectRole(path);
        const pageKey = getCurrentPageKey(path);
        const route = breadcrumbRoutes[pageKey] || [pageKey];
        const parent = roleParents[role];

        // Build breadcrumb array: [Home/Role Dashboard, ...route parts, Current Page]
        const crumbs = [];

        // Add home/dashboard link
        const dashboardPaths = {
            'admin_hr': '../admin_hr_dashboard/code.html',
            'manager': '../management_dashboard/code.html',
            'employee': '../employee_dashboard/code.html'
        };

        crumbs.push({
            label: parent,
            href: dashboardPaths[role],
            isLast: false
        });

        // Add intermediate route parts (if any)
        for (let i = 0; i < route.length - 1; i++) {
            crumbs.push({
                label: route[i],
                href: null, // Could be a link to a parent page
                isLast: false
            });
        }

        // Add current page (last item)
        crumbs.push({
            label: route[route.length - 1],
            href: null,
            isLast: true
        });

        return crumbs;
    }

    function renderBreadcrumbs(container, crumbs) {
        if (!container || crumbs.length === 0) return;

        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Breadcrumb');
        nav.className = 'ems-breadcrumb';

        const ol = document.createElement('ol');
        ol.className = 'flex items-center gap-2 text-sm';
        ol.setAttribute('itemscope', '');
        ol.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');

        crumbs.forEach((crumb, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2';
            li.setAttribute('itemscope', '');
            li.setAttribute('itemprop', 'itemListElement');
            li.setAttribute('itemtype', 'https://schema.org/ListItem');

            if (index > 0) {
                const separator = document.createElement('span');
                separator.className = 'text-slate-400';
                separator.setAttribute('aria-hidden', 'true');
                separator.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
                ol.appendChild(separator);
            }

            if (crumb.href && !crumb.isLast) {
                const a = document.createElement('a');
                a.href = crumb.href;
                a.className = 'text-slate-500 hover:text-blue-600 transition-colors font-medium';
                a.setAttribute('itemprop', 'url');
                a.innerHTML = `<span itemprop="name">${escapeHtml(crumb.label)}</span>`;
                li.appendChild(a);
            } else {
                const span = document.createElement('span');
                span.className = crumb.isLast ? 'text-slate-900 font-semibold' : 'text-slate-500';
                span.setAttribute('itemprop', 'name');
                span.textContent = crumb.label;
                li.appendChild(span);
            }

            const meta = document.createElement('meta');
            meta.setAttribute('itemprop', 'position');
            meta.setAttribute('content', String(index + 1));
            li.appendChild(meta);

            ol.appendChild(li);
        });

        nav.appendChild(ol);
        container.appendChild(nav);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize breadcrumbs on page load
    function initBreadcrumbs() {
        // Find all breadcrumb containers
        const containers = document.querySelectorAll('[data-breadcrumbs]');
        if (containers.length === 0) return;

        const path = window.location.pathname;
        const crumbs = getBreadcrumbPath(path);

        containers.forEach(container => {
            // Clear existing content
            container.innerHTML = '';
            renderBreadcrumbs(container, crumbs);
        });
    }

    // Expose global function for dynamic breadcrumb updates
    window.EMS_updateBreadcrumbs = function(customCrumbs) {
        const containers = document.querySelectorAll('[data-breadcrumbs]');
        containers.forEach(container => {
            container.innerHTML = '';
            if (customCrumbs) {
                renderBreadcrumbs(container, customCrumbs);
            } else {
                const path = window.location.pathname;
                const crumbs = getBreadcrumbPath(path);
                renderBreadcrumbs(container, crumbs);
            }
        });
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBreadcrumbs);
    } else {
        initBreadcrumbs();
    }

})();