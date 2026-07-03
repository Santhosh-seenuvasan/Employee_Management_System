// ====================== EMS HEADER CONTROLLER ======================
/**
 * EMS Header Controller
 * Handles notification panel, profile dropdown, theme switching,
 * language selection, and navigation across all portal pages.
 */

(function() {
    'use strict';

    // ====================== CONFIGURATION ======================
    const CONFIG = {
        storageKeys: {
            theme: 'ems_theme_preference',
            language: 'ems_language_preference',
            notifications: 'ems_notification_prefs',
            user: 'ems_user_data'
        },
        navRoutes: {
            hr_admin: {
                profile: 'admin_hr/profile_settings/code.html',
                settings: 'admin_hr/settings/code.html',
                notifications: 'admin_hr/notifications/code.html'
            },
            manager: {
                profile: 'management/profile_settings/code.html',
                settings: 'management/settings/code.html',
                notifications: 'management/notifications/code.html'
            },
            employee: {
                profile: 'employee/profile_settings/code.html',
                settings: 'employee/settings/code.html',
                notifications: 'employee/notifications/code.html'
            }
        }
    };

    // ====================== STATE MANAGEMENT ======================
    const state = {
        currentRole: 'hr_admin',
        user: null,
        notifications: [],
        unreadCount: 0,
        theme: 'light',
        language: 'en'
    };

    // ====================== UTILITY FUNCTIONS ======================
    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function detectRole() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/management/')) return 'manager';
        if (path.includes('/employee/')) return 'employee';
        return 'hr_admin';
    }

    function getDepth() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s.length > 0);
        const roleIndex = segments.findIndex(s => ['admin_hr', 'management', 'employee'].includes(s));
        if (roleIndex !== -1) {
            return segments.length - roleIndex - 1;
        }
        return 2;
    }

    function buildPath(targetPath) {
        const depth = getDepth();
        return '../'.repeat(depth) + targetPath;
    }

    function storageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage not available:', e);
        }
    }

    // ====================== THEME MANAGEMENT ======================
    function initTheme() {
        const savedTheme = storageGet(CONFIG.storageKeys.theme, 'light');
        state.theme = savedTheme;
        applyTheme(savedTheme);
    }

    function applyTheme(theme) {
        const html = document.documentElement;
        const body = document.body;

        // Remove all theme classes
        html.classList.remove('light', 'dark');
        body.classList.remove('dark-mode', 'ems-dark');

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
                html.classList.add('dark');
                body.classList.add('ems-dark');
            } else {
                html.classList.add('light');
            }
        } else if (theme === 'dark') {
            html.classList.add('dark');
            body.classList.add('ems-dark');
        } else {
            html.classList.add('light');
        }

        // Update theme buttons if they exist
        $$('.theme-btn').forEach(btn => {
            btn.classList.remove('active', 'ring-2', 'ring-blue-500');
            const themeType = btn.id?.replace('theme', '').toLowerCase();
            if (themeType === state.theme) {
                btn.classList.add('active', 'ring-2', 'ring-blue-500');
            }
        });
    }

    function setTheme(theme) {
        state.theme = theme;
        storageSet(CONFIG.storageKeys.theme, theme);
        applyTheme(theme);
    }

    // ====================== LANGUAGE MANAGEMENT ======================
    function initLanguage() {
        const savedLang = storageGet(CONFIG.storageKeys.language, 'en');
        state.language = savedLang;
        applyLanguage(savedLang);
    }

    function applyLanguage(lang) {
        document.documentElement.lang = lang;

        // Update language selector if exists
        const langSelect = $('#languageSelect');
        if (langSelect) {
            langSelect.value = lang;
        }
    }

    function setLanguage(lang) {
        state.language = lang;
        storageSet(CONFIG.storageKeys.language, lang);
        applyLanguage(lang);
    }

    // ====================== USER MANAGEMENT ======================
    function initUser() {
        state.user = storageGet(CONFIG.storageKeys.user, sessionUser());
        state.currentRole = detectRole();
        updateUserUI();
    }

    function sessionUser() {
        const fullName = window.Auth?.fullName?.() || window.Auth?.email?.() || 'No data available';
        const role = window.Auth?.role?.() || 'No data available';
        const email = window.Auth?.email?.() || '';
        return {
            name: fullName,
            role,
            email,
            avatar: initials(fullName),
            department: '',
            employeeId: window.Auth?.employeeCode?.() || ''
        };
    }

    function initials(name) {
        return String(name || '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() || '')
            .join('') || 'NA';
    }

    function updateUserUI() {
        const user = state.user;

        // Update header elements
        const headerName = $('#header-name');
        const headerRole = $('#header-role');
        const headerAvatar = $('#header-avatar');
        const dropdownName = $('#dropdownName');
        const dropdownRole = $('#dropdownRole');
        const dropdownAvatar = $('#dropdownAvatar');

        if (headerName) headerName.textContent = user.name;
        if (headerRole) headerRole.textContent = user.role;
        if (headerAvatar) headerAvatar.textContent = user.avatar;
        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownRole) dropdownRole.textContent = user.role;
        if (dropdownAvatar) dropdownAvatar.textContent = user.avatar;
    }

    // ====================== NOTIFICATION MANAGEMENT ======================
    async function initNotifications() {
        // Set flag to prevent utils.js from initializing duplicate notification system
        window.EMS_HEADER_NOTIFICATIONS_INITIALIZED = true;

        try {
            // Try to load from backend API first
            await loadNotificationsFromBackend();
        } catch (error) { // If API fails, show no notifications
            console.warn('Notifications API unavailable:', error);
            state.notifications = [];
        }
        state.unreadCount = state.notifications.filter(n => !n.read).length;
        updateNotificationBadge();
        renderNotificationList();
        bindNotificationEvents();
    }

    async function loadNotificationsFromBackend() {
        const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
        const authHeaders = window.Auth?.headers ? window.Auth.headers() : { 'Content-Type': 'application/json' };
        
        // Try to get latest notifications
        const response = await fetch(`${baseUrl}/api/notifications/latest`, { headers: authHeaders });
        if (!response.ok) throw new Error('Failed to load notifications');
        
        let notifications = await response.json();
        if (!Array.isArray(notifications)) {
            notifications = notifications.items || notifications.content || [];
        }
        
        // Transform backend data to our format
        state.notifications = notifications.map(n => ({
            id: n.id,
            title: n.title || 'Notification',
            message: n.message || n.body,
            senderName: n.senderName || n.sender || 'System',
            category: n.category || n.type || 'General',
            createdAt: n.createdAt || 'just now',
            read: Boolean(n.read) || n.status === 'READ',
            route: n.route || n.targetPage
        }));
        
        // Also try to get unread count
        try {
            const unreadResponse = await fetch(`${baseUrl}/api/notifications/unread`, { headers: authHeaders });
            if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                state.unreadCount = Number(unreadData.count) || state.notifications.filter(n => !n.read).length;
            }
        } catch (e) {
            // Ignore unread count error if it fails
        }
    }

    function updateNotificationBadge() {
        const badge = $('#notificationBadge');
        if (badge) {
            if (state.unreadCount > 0) {
                badge.textContent = state.unreadCount > 9 ? '9+' : state.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        // Update sidebar badge if exists
        window.EMS_refreshSidebarBadges?.(state.unreadCount);
    }

    function renderNotificationList() {
        const list = $('#notificationList');
        if (!list) return;

        if (state.notifications.length === 0) {
            list.innerHTML = `
                <div class="text-center py-10 text-slate-500">
                    <span class="material-symbols-outlined text-5xl mb-3 block">notifications_none</span>
                    <p>No messages</p>
                </div>
            `;
            return;
        }

        list.innerHTML = state.notifications.map(notif => {
            const isRead = notif.read;
            return `
                <div class="px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${!isRead ? 'bg-blue-50/50' : ''}" data-notif-id="${notif.id}">
                    <div class="flex justify-between items-start gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="font-bold text-slate-800 text-sm truncate">${escapeHtml(notif.title)}</p>
                                <span class="text-[10px] text-slate-500">${escapeHtml(notif.category)}</span>
                            </div>
                            <p class="text-sm text-slate-600 mt-1">${escapeHtml(notif.message)}</p>
                            <p class="text-xs text-slate-400 mt-1">${escapeHtml(notif.createdAt)}</p>
                        </div>
                        <button type="button" 
                            class="text-xs font-semibold ${isRead ? 'text-slate-500' : 'text-primary'}" 
                            onclick="event.stopPropagation(); window.EMS_toggleNotificationRead('${notif.id}', ${!isRead})">
                            ${isRead ? 'Mark unread' : 'Mark read'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for notification items
        list.querySelectorAll('[data-notif-id]').forEach(el => {
            el.addEventListener('click', () => {
                window.EMS_navigateToNotification(el.getAttribute('data-notif-id'));
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function closeAllDropdowns() {
        // Close notification dropdown
        const notificationDropdown = $('#notificationDropdown');
        if (notificationDropdown) notificationDropdown.classList.remove('show'); // Close notification dropdown
        
        // Close profile dropdown
        const profileDropdown = $('#profileDropdown');
        if (profileDropdown) profileDropdown.classList.remove('show');
        
        // Close settings dropdown
        const settingsDropdown = $('#settingsDropdown');
        if (settingsDropdown) settingsDropdown.classList.remove('show'); // Close settings dropdown
        
        // Reset aria-expanded attributes
        const notificationBtn = $('#notificationBtn');
        if (notificationBtn) notificationBtn.setAttribute('aria-expanded', 'false');
        
        const profileBtn = $('#profileBtn');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
        const settingsBtn = $('#emsSettingsBtn');
        if (settingsBtn) settingsBtn.setAttribute('aria-expanded', 'false');
    }

    function bindNotificationEvents() {
        const notificationBtn = $('#notificationBtn');
        const notificationDropdown = $('#notificationDropdown');
        if (!notificationBtn || !notificationDropdown) return;
        
        if (notificationBtn.dataset.bound) return;
        notificationBtn.dataset.bound = "true";

        notificationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const wasOpen = notificationDropdown.classList.contains('show'); // Check state before closing others
            closeAllDropdowns(); // Close all other dropdowns
            
            if (!wasOpen) { // If it was not open, open it
                notificationDropdown.classList.add('show');
                notificationBtn.setAttribute('aria-expanded', 'true');
                // Re-render notifications when opening to ensure fresh data
                renderNotificationList();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (notificationDropdown.classList.contains('show') &&
                !notificationDropdown.contains(e.target) &&
                !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('show');
                notificationBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Mark all as read button
        const markAllReadBtn = $('#markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async () => {
                try {
                    const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
                    const authHeaders = window.Auth?.headers ? window.Auth.headers() : { 'Content-Type': 'application/json' };
                    await fetch(`${baseUrl}/api/notifications/read-all`, {
                        method: 'PUT',
                        headers: authHeaders
                    });
                } catch (e) {
                    // Ignore error
                }

                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
                updateNotificationBadge();
                renderNotificationList();
            });
        }
    }

    window.EMS_toggleNotificationRead = async function(id, read) {
        const notif = state.notifications.find(n => n.id === id);
        if (notif) {
            try {
                const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
                const authHeaders = window.Auth?.headers ? window.Auth.headers() : { 'Content-Type': 'application/json' };
                await fetch(`${baseUrl}/api/notifications/${encodeURIComponent(id)}/read`, {
                    method: read ? 'PUT' : 'DELETE',
                    headers: authHeaders
                });
            } catch (e) {
                // Ignore error
            }
            
            notif.read = read;
            state.unreadCount = state.notifications.filter(n => !n.read).length;
            updateNotificationBadge();
            renderNotificationList();
        }
    };

    window.EMS_navigateToNotification = async function(id) {
        const notif = state.notifications.find(n => n.id === id);
        if (notif) {
            try {
                const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
                const authHeaders = window.Auth?.headers ? window.Auth.headers() : { 'Content-Type': 'application/json' };
                await fetch(`${baseUrl}/api/notifications/${encodeURIComponent(id)}/read`, {
                    method: 'PUT',
                    headers: authHeaders
                });
            } catch (e) {
                // Ignore error
            }
            
            notif.read = true;
            state.unreadCount = state.notifications.filter(n => !n.read).length;
            updateNotificationBadge();
            renderNotificationList();
            
            if (notif.route) {
                navigateTo(notif.route);
            }
            
            const notificationDropdown = $('#notificationDropdown');
            if (notificationDropdown) { // Close notification dropdown
                notificationDropdown.classList.remove('show');
            }
        }
    };

    // ====================== PROFILE DROPDOWN ======================
    function initProfileDropdown() {
        const profileBtn = $('#profileBtn');
        const profileDropdown = $('#profileDropdown');
        if (!profileBtn || !profileDropdown) return;

        if (profileBtn.dataset.bound) return;
        profileBtn.dataset.bound = "true";

        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const wasOpen = profileDropdown.classList.contains('show'); // Check state before closing others
            closeAllDropdowns(); // Close other dropdowns
            if (!wasOpen) { // If it was not open, open it
                profileDropdown.classList.add('show');
                profileBtn.setAttribute('aria-expanded', 'true');
            } else {
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (profileDropdown.classList.contains('show') &&
                !profileDropdown.contains(e.target) &&
                !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Bind menu links
        $$('.profile-menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const nav = link.getAttribute('data-nav');
                if (nav) {
                    navigateTo(nav);
                }
            });
        });

        // Logout
        const logoutBtn = $('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    window.location.href = buildPath('authentication/unified_login_portal/code.html');
                }
            });
        }
    }

    // ====================== SETTINGS DROPDOWN ======================
    function initSettingsDropdown() {
        const settingsBtn = $('#emsSettingsBtn');
        const settingsDropdown = $('#settingsDropdown');
        if (!settingsBtn || !settingsDropdown) return;

        if (settingsBtn.dataset.bound) return;
        settingsBtn.dataset.bound = "true";

        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const wasOpen = settingsDropdown.classList.contains('show'); // Check state before closing others
            closeAllDropdowns(); // Close other dropdowns
            if (!wasOpen) { // If it was not open, open it
                settingsDropdown.classList.add('show');
                settingsBtn.setAttribute('aria-expanded', 'true');
            } else {
                settingsBtn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('click', (e) => {
            if (settingsDropdown.classList.contains('show') &&
                !settingsDropdown.contains(e.target) &&
                !settingsBtn.contains(e.target)) {
                settingsDropdown.classList.remove('show');
                settingsBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ====================== NOTIFICATION PREFERENCES ======================
    function initNotificationPreferences() {
        const prefs = storageGet(CONFIG.storageKeys.notifications, {
            email_attendance: true,
            email_leave: true,
            email_payroll: true,
            email_recruitment: true,
            email_performance: true,
            email_training: true
        });

        // Apply preferences to checkboxes
        Object.entries(prefs).forEach(([key, value]) => {
            const checkbox = $(`#prefs-${key.replace(/_/g, '-')}`);
            if (checkbox) {
                checkbox.checked = value;
                checkbox.addEventListener('change', () => {
                    prefs[key] = checkbox.checked;
                    storageSet(CONFIG.storageKeys.notifications, prefs);
                    showSaveSuccess();
                });
            }
        });
    }

    function showSaveSuccess() {
        const existing = $('.toast-success');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-success fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50';
        toast.innerHTML = `
            <span class="material-symbols-outlined">check_circle</span>
            <span>Settings saved successfully!</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ====================== THEME BUTTONS ======================
    function initThemeButtons() {
        const themeButtons = $$('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.id.replace('theme', '').toLowerCase();
                if (['light', 'dark', 'system'].includes(theme)) {
                    setTheme(theme);
                }
            });
        });
    }

    // ====================== LANGUAGE SELECTOR ======================
    function initLanguageSelector() {
        const langSelect = $('#languageSelect');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                setLanguage(e.target.value);
                showSaveSuccess();
            });
        }
    }

    // ====================== SIDEBAR TOGGLE (handled by layout-controller.js) ======================

    // ====================== NAVIGATION ======================
    function navigateTo(key) {
        const role = state.currentRole;
        let targetPath = CONFIG.navRoutes[role][key] || key;
        if (!targetPath.includes('/')) {
            // If it's just a key, look it up in utils nav routes if available
            if (typeof navTo === 'function') {
                navTo(key);
                return;
            }
        }
        window.location.href = buildPath(targetPath);
    }

    window.EMS_navigateTo = navigateTo;

    // ====================== INITIALIZATION ======================
    async function init() {
        initTheme();
        initLanguage();
        initUser();
        await initNotifications();
        initProfileDropdown();
        initSettingsDropdown();
        initNotificationPreferences();
        initThemeButtons();
        initLanguageSelector();
        // initSidebarToggle(); // Handled by layout-controller.js

        // Set page title from document title
        const titleEl = $('#page-header-title');
        if (titleEl && document.title) {
            const raw = document.title.split('|')[0].split('-')[0].trim();
            if (raw) titleEl.textContent = raw;
        }
    }

    window.EMS_initHeader = init;

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (state.theme === 'system') {
            applyTheme('system');
        }
    });

})();
