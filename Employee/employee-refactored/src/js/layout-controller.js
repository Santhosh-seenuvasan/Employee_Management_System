// ====================== EMS LAYOUT CONTROLLER ======================
// Unified sidebar toggle and header dropdowns for all EMS pages
// =====================================================

(function() {
    'use strict';

    const CONFIG = {
        breakpoints: {
            desktop: 1024,
            tablet: 768
        }
    };

    const state = {
        sidebarOpen: true,
        isMobile: false,
        openDropdown: null
    };

    let elements = {
        sidebar: null,
        mainContent: null,
        toggleBtn: null,
        overlay: null,
        notificationBtn: null,
        notificationDropdown: null,
        profileBtn: null,
        profileDropdown: null
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function toggleDropdown(type) {
        if (state.openDropdown === type) {
            closeDropdown();
        } else {
            closeDropdown();
            openDropdown(type);
        }
    }

    function openDropdown(type) {
        state.openDropdown = type;
        if (type === 'notification') {
            if (elements.notificationBtn && elements.notificationDropdown) {
                elements.notificationBtn.setAttribute('aria-expanded', 'true');
                elements.notificationDropdown.classList.add('show');
            }
        } else if (type === 'profile') {
            if (elements.profileBtn && elements.profileDropdown) {
                elements.profileBtn.setAttribute('aria-expanded', 'true');
                elements.profileDropdown.classList.add('show');
            }
        }
    }

    function closeDropdown() {
        if (state.openDropdown === 'notification') {
            if (elements.notificationBtn && elements.notificationDropdown) {
                elements.notificationBtn.setAttribute('aria-expanded', 'false');
                elements.notificationDropdown.classList.remove('show');
            }
        } else if (state.openDropdown === 'profile') {
            if (elements.profileBtn && elements.profileDropdown) {
                elements.profileBtn.setAttribute('aria-expanded', 'false');
                elements.profileDropdown.classList.remove('show');
            }
        }
        state.openDropdown = null;
    }

    function initDropdowns() {
        elements.notificationBtn = $('#notificationBtn');
        elements.notificationDropdown = $('#notificationDropdown');
        elements.profileBtn = $('#profileBtn');
        elements.profileDropdown = $('#profileDropdown');
    }

    function toggleSidebar() {
        const sidebar = elements.sidebar;
        if (!sidebar) return;

        state.sidebarOpen = !state.sidebarOpen;

        if (state.sidebarOpen) {
            openSidebar();
        } else {
            closeSidebar();
        }

        window.dispatchEvent(new CustomEvent('ems:sidebar-toggle', {
            detail: { isOpen: state.sidebarOpen }
        }));
    }

    function openSidebar() {
        const sidebar = elements.sidebar;
        const mainContent = elements.mainContent;
        const overlay = elements.overlay;

        if (!sidebar) return;
        state.sidebarOpen = true;

        sidebar.classList.remove('sidebar-hidden');
        if (mainContent) {
            mainContent.classList.remove('main-expanded');
        }

        if (state.isMobile || window.innerWidth < CONFIG.breakpoints.desktop) {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
            document.body.classList.add('sidebar-open');
        }

        if (elements.toggleBtn) {
            elements.toggleBtn.setAttribute('aria-expanded', 'true');
        }

        saveSidebarState(true);
    }

    function closeSidebar() {
        const sidebar = elements.sidebar;
        const mainContent = elements.mainContent;
        const overlay = elements.overlay;

        if (!sidebar) return;
        state.sidebarOpen = false;

        sidebar.classList.add('sidebar-hidden');
        sidebar.classList.remove('open');
        if (mainContent) {
            mainContent.classList.add('main-expanded');
        }

        if (overlay) {
            overlay.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        }

        if (elements.toggleBtn) {
            elements.toggleBtn.setAttribute('aria-expanded', 'false');
        }

        document.body.classList.remove('sidebar-open');
        saveSidebarState(false);
    }

    function saveSidebarState(isOpen) {
        try {
            localStorage.setItem('ems_sidebar_open', isOpen.toString());
        } catch (e) {}
    }

    function loadSidebarState() {
        try {
            const saved = localStorage.getItem('ems_sidebar_open');
            if (saved !== null) {
                return saved === 'true';
            }
        } catch (e) {}
        return window.innerWidth >= CONFIG.breakpoints.desktop;
    }

    function handleResize() {
        const width = window.innerWidth;
        state.isMobile = width < CONFIG.breakpoints.desktop;

        const sidebar = elements.sidebar;
        const mainContent = elements.mainContent;
        const overlay = elements.overlay;
        if (!sidebar) return;

        if (width >= CONFIG.breakpoints.desktop) {
            document.body.classList.remove('sidebar-open');
            if (overlay) overlay.classList.add('hidden');

            if (state.sidebarOpen) {
                sidebar.classList.remove('sidebar-hidden', 'open');
                if (mainContent) {
                    mainContent.classList.remove('main-expanded');
                }
            } else {
                sidebar.classList.add('sidebar-hidden');
                if (mainContent) {
                    mainContent.classList.add('main-expanded');
                }
            }
        } else {
            if (state.sidebarOpen) {
                sidebar.classList.add('open');
                sidebar.classList.remove('sidebar-hidden');
                if (overlay) overlay.classList.remove('hidden');
            } else {
                sidebar.classList.remove('open');
                sidebar.classList.add('sidebar-hidden');
                if (overlay) overlay.classList.add('hidden');
            }
            if (mainContent) {
                mainContent.classList.add('main-expanded');
            }
        }
    }

    function initElements() {
        elements.sidebar = $('#sidebar') || $('.corporate-sidebar') || $('.sidebar');
        elements.mainContent = $('#main-content') || $('.corporate-main') || $('.main-content') || $('main');
        elements.toggleBtn = $('#sidebarToggle') || $('#menu-toggle') || $('.header-toggle-btn') || $('[data-toggle="sidebar"]');
        elements.overlay = $('#sidebarOverlay') || $('.sidebar-overlay');

        if (elements.sidebar) {
            state.sidebarOpen = loadSidebarState();

            if (state.sidebarOpen) {
                openSidebar();
            } else {
                closeSidebar();
            }
        }

        initDropdowns();
        handleResize();
    }

    let globalsInitialized = false;

    function initGlobals() {
        if (globalsInitialized) return;
        globalsInitialized = true;

        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('#sidebarToggle, #menu-toggle, [data-toggle="sidebar"]');
            if (toggle) {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
                return;
            }

            const overlay = e.target.closest('#sidebarOverlay, .sidebar-overlay');
            if (overlay && elements.overlay) {
                if (!state.isMobile || window.innerWidth < CONFIG.breakpoints.desktop) {
                    closeSidebar();
                }
            }
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (state.sidebarOpen) closeSidebar();
                if (state.openDropdown) closeDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (state.openDropdown) {
                const isClickInsideNotification = elements.notificationDropdown && elements.notificationDropdown.contains(e.target);
                const isClickInsideProfile = elements.profileDropdown && elements.profileDropdown.contains(e.target);
                if (!isClickInsideNotification && !isClickInsideProfile) {
                    closeDropdown();
                }
            }
        });
    }

    function init() {
        initGlobals();
        initElements();
    }

    window.EMS_Layout = {
        toggle: toggleSidebar,
        open: openSidebar,
        close: closeSidebar,
        isOpen: () => state.sidebarOpen,
        init: init,
        refresh: handleResize,
        toggleDropdown: toggleDropdown,
        openDropdown: openDropdown,
        closeDropdown: closeDropdown
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
