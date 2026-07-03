/**
 * Corporate EMS - Unified UI JavaScript
 * Handles all interactive components across all modules
 * (HR Admin, Management, Employee)
 */

(function() {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================
    const CONFIG = {
        sidebarWidth: 280,
        breakpoints: {
            mobile: 768,
            tablet: 1024
        },
        notifications: {
            maxVisible: 5
        }
    };

    // =====================================================
    // STATE MANAGEMENT
    // =====================================================
    const state = {
        sidebarOpen: false,
        notifications: [],
        messages: [],
        currentUser: null,
        theme: 'light'
    };

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    }

    function addClass(element, className) {
        if (element) element.classList.add(className);
    }

    function removeClass(element, className) {
        if (element) element.classList.remove(className);
    }

    function hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    // =====================================================
    // DEPRECATED: Sidebar control logic is now handled by layout-controller.js
    // const SidebarController = {
    //     init() {
    //         this.sidebar = $('.corporate-sidebar');
    //         this.overlay = $('.sidebar-overlay');
    //         this.toggleBtn = $('#sidebarToggle');
    //         this.navItems = $$('.sidebar-nav-item');

    //         if (this.toggleBtn) {
    //             this.toggleBtn.addEventListener('click', () => this.toggle());
    //         }

    //         if (this.overlay) {
    //             this.overlay.addEventListener('click', () => this.close());
    //         }

    //         // Close on escape
    //         document.addEventListener('keydown', (e) => {
    //             if (e.key === 'Escape' && state.sidebarOpen) {
    //                 this.close();
    //             }
    //         });

    //         // Set active nav item based on current page
    //         this.setActiveNavItem();

    //         // Handle window resize
    //         window.addEventListener('resize', () => this.handleResize());
    //     },

    //     toggle() {
    //         state.sidebarOpen = !state.sidebarOpen;
    //         if (state.sidebarOpen) {
    //             this.open();
    //         } else {
    //             this.close();
    //         }
    //     },

    //     open() {
    //         state.sidebarOpen = true;
    //         addClass(this.sidebar, 'open');
    //         addClass(this.overlay, 'show');
    //         document.body.style.overflow = 'hidden';
    //     },

    //     close() {
    //         state.sidebarOpen = false;
    //         removeClass(this.sidebar, 'open');
    //         removeClass(this.overlay, 'show');
    //         document.body.style.overflow = '';
    //     },

    //     setActiveNavItem() {
    //         const currentPath = window.location.pathname;
    //         this.navItems.forEach(item => {
    //             const link = item.querySelector('a');
    //             if (link && currentPath.includes(link.getAttribute('href'))) {
    //                 addClass(item, 'active');
    //             }
    //         });
    //     },

    //     handleResize() {
    //         if (window.innerWidth > CONFIG.breakpoints.mobile) {
    //             this.close();
    //         }
    //     }
    // };

    // =====================================================
    // HEADER CONTROLLER
    // =====================================================
    const HeaderController = {
        init() {
            this.notificationBtn = $('#notificationBtn');
            this.notificationDropdown = $('#notificationDropdown');
            this.profileBtn = $('#profileBtn');
            this.profileDropdown = $('#profileDropdown');
            this.settingsBtn = $('#emsSettingsBtn');
            this.logoutBtn = $('#logoutBtn');

            this.bindEvents();
            this.loadNotifications();
        },

        bindEvents() {
            // Notification dropdown
            if (this.notificationBtn) {
                this.notificationBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(this.notificationDropdown);
                    removeClass(this.profileDropdown, 'show');
                });
            }

            // Profile dropdown
            if (this.profileBtn) {
                this.profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(this.profileDropdown);
                    removeClass(this.notificationDropdown, 'show');
                });
            }

            // Close dropdowns when clicking outside
            document.addEventListener('click', () => {
                removeClass(this.notificationDropdown, 'show');
                removeClass(this.profileDropdown, 'show');
            });

            // Settings button
            if (this.settingsBtn) {
                this.settingsBtn.addEventListener('click', () => {
                    this.navigateTo('../settings/code.html');
                });
            }

            // Logout button
            if (this.logoutBtn) {
                this.logoutBtn.addEventListener('click', () => {
                    this.handleLogout();
                });
            }

            // Mark all notifications as read
            const markAllReadBtn = $('#markAllReadBtn');
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => {
                    this.markAllNotificationsRead();
                });
            }
        },

        toggleDropdown(dropdown) {
            if (dropdown) {
                const isOpen = hasClass(dropdown, 'show');
                removeClass(this.notificationDropdown, 'show');
                removeClass(this.profileDropdown, 'show');
                if (!isOpen) {
                    addClass(dropdown, 'show');
                }
            }
        },

        async loadNotifications() {
            try {
                const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
                const response = await fetch(`${baseUrl}/api/notifications/latest`, {
                    headers: window.Auth?.headers ? Auth.headers() : {}
                });
                if (!response.ok) throw new Error('Unable to load notifications');
                const data = await response.json();
                const notifications = Array.isArray(data) ? data : (data.items || data.content || []);
                state.notifications = notifications.map(n => ({
                    id: n.id,
                    type: (n.priority || n.type || 'info').toLowerCase(),
                    title: n.title || n.subject || 'Notification',
                    message: n.message || '',
                    time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '',
                    unread: n.read === false || n.status === 'UNREAD'
                }));
            } catch (_) {
                state.notifications = [];
            }
            this.renderNotifications();
            this.updateNotificationBadge();
        },

        renderNotifications() {
            const list = $('#notificationList');
            if (!list) return;

            const notifications = state.notifications.slice(0, CONFIG.notifications.maxVisible);
            if (!notifications.length) {
                list.innerHTML = '<div class="notification-empty">No data available</div>';
                return;
            }
            list.innerHTML = notifications.map(n => `
                <div class="notification-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notification-item-icon ${n.type}">
                        <span class="material-symbols-outlined">${this.getNotificationIcon(n.type)}</span>
                    </div>
                    <div class="notification-item-content">
                        <div class="notification-item-title">${n.title}</div>
                        <div class="notification-item-message">${n.message}</div>
                        <div class="notification-item-time">${n.time}</div>
                    </div>
                </div>
            `).join('');

            // Bind click events
            list.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    this.markAsRead(id);
                });
            });
        },

        getNotificationIcon(type) {
            const icons = {
                success: 'check_circle',
                warning: 'warning',
                danger: 'error',
                info: 'info'
            };
            return icons[type] || 'notifications';
        },

        updateNotificationBadge() {
            const badge = $('#notificationBadge');
            if (!badge) return;

            const unreadCount = state.notifications.filter(n => n.unread).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        },

        async markAsRead(id) {
            const notification = state.notifications.find(n => n.id === id);
            if (notification) {
                const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
                await fetch(`${baseUrl}/api/notifications/${encodeURIComponent(id)}/read`, {
                    method: 'PUT',
                    headers: window.Auth?.headers ? Auth.headers() : {}
                });
                await this.loadNotifications();
            }
        },

        async markAllNotificationsRead() {
            const baseUrl = window.EMS_API?.LOGIN || window.location.origin;
            await fetch(`${baseUrl}/api/notifications/read-all`, {
                method: 'PUT',
                headers: window.Auth?.headers ? Auth.headers() : {}
            });
            await this.loadNotifications();
        },

        handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('ems_user');
                window.location.href = '../../authentication/unified_login_portal/code.html';
            }
        },

        navigateTo(url) {
            window.location.href = url;
        }
    };

    // =====================================================
    // MODAL CONTROLLER
    // =====================================================
    const ModalController = {
        init() {
            this.bindEvents();
        },

        bindEvents() {
            // Close modal on overlay click
            $$('.modal-overlay').forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.close(overlay);
                    }
                });
            });

            // Close modal on close button click
            $$('.modal-close-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal-overlay');
                    if (modal) this.close(modal);
                });
            });

            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const openModal = $('.modal-overlay.show');
                    if (openModal) this.close(openModal);
                }
            });
        },

        open(modalId) {
            const modal = $(`#${modalId}`);
            if (modal) {
                addClass(modal, 'show');
                document.body.style.overflow = 'hidden';
            }
        },

        close(modal) {
            if (typeof modal === 'string') {
                modal = $(`#${modal}`);
            }
            if (modal) {
                removeClass(modal, 'show');
                document.body.style.overflow = '';
            }
        }
    };

    // =====================================================
    // FORM CONTROLLER
    // =====================================================
    const FormController = {
        init() {
            this.bindValidation();
        },

        bindValidation() {
            $$('form').forEach(form => {
                form.addEventListener('submit', (e) => {
                    if (!this.validate(form)) {
                        e.preventDefault();
                    }
                });

                // Real-time validation
                form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => {
                        if (hasClass(input, 'is-invalid')) {
                            this.validateField(input);
                        }
                    });
                });
            });
        },

        validate(form) {
            let isValid = true;
            form.querySelectorAll('.form-input[required], .form-select[required], .form-textarea[required]').forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });
            return isValid;
        },

        validateField(input) {
            const value = input.value.trim();
            const isValid = value !== '' || !input.hasAttribute('required');

            if (isValid) {
                removeClass(input, 'is-invalid');
                addClass(input, 'is-valid');
            } else {
                removeClass(input, 'is-valid');
                addClass(input, 'is-invalid');
            }

            return isValid;
        }
    };

    // =====================================================
    // THEME CONTROLLER
    // =====================================================
    const ThemeController = {
        init() {
            this.loadTheme();
            this.bindEvents();
        },

        loadTheme() {
            const savedTheme = localStorage.getItem('ems_theme');
            if (savedTheme) {
                state.theme = savedTheme;
                this.applyTheme(savedTheme);
            }
        },

        bindEvents() {
            // Theme toggle button (if exists)
            const themeToggle = $('#themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const newTheme = state.theme === 'light' ? 'dark' : 'light';
                    this.setTheme(newTheme);
                });
            }
        },

        setTheme(theme) {
            state.theme = theme;
            localStorage.setItem('ems_theme', theme);
            this.applyTheme(theme);
        },

        applyTheme(theme) {
            const html = document.documentElement;
            removeClass(html, 'light', 'dark');
            addClass(html, theme);

            if (theme === 'dark') {
                addClass(document.body, 'ems-dark');
            } else {
                removeClass(document.body, 'ems-dark');
            }
        }
    };

    // =====================================================
    // TABLE CONTROLLER
    // =====================================================
    const TableController = {
        init() {
            this.initSortableTables();
        },

        initSortableTables() {
            $$('.sortable-table th[data-sort]').forEach(th => {
                th.addEventListener('click', () => {
                    const table = th.closest('table');
                    const column = th.dataset.sort;
                    this.sortTable(table, column);
                });
            });
        },

        sortTable(table, column) {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const th = table.querySelector(`th[data-sort="${column}"]`);
            const isAsc = hasClass(th, 'asc');

            // Remove sort classes from all headers
            table.querySelectorAll('th').forEach(header => {
                removeClass(header, 'asc', 'desc');
            });

            // Sort rows
            rows.sort((a, b) => {
                const aValue = a.querySelector(`td[data-column="${column}"]`)?.textContent.trim() || '';
                const bValue = b.querySelector(`td[data-column="${column}"]`)?.textContent.trim() || '';
                return isAsc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
            });

            // Update header class
            addClass(th, isAsc ? 'desc' : 'asc');

            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        }
    };

    // =====================================================
    // TOAST NOTIFICATIONS
    // =====================================================
    const ToastController = {
        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <span class="material-symbols-outlined">${this.getIcon(type)}</span>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        getIcon(type) {
            const icons = {
                success: 'check_circle',
                error: 'error',
                warning: 'warning',
                info: 'info'
            };
            return icons[type] || 'info';
        }
    };

    // =====================================================
    // BREADCRUMB CONTROLLER
    // =====================================================
    const BreadcrumbController = {
        init() {
            const container = $('#breadcrumb');
            if (container) {
                const crumbs = this.generateCrumbs();
                container.innerHTML = crumbs;
            }
        },

        generateCrumbs() {
            const path = window.location.pathname;
            const segments = path.split('/').filter(s => s && s !== 'code.html');
            
            let crumbs = '<nav aria-label="Breadcrumb"><ol class="breadcrumb">';
            crumbs += `<li class="breadcrumb-item"><a href="#" class="breadcrumb-link">Dashboard</a></li>`;
            
            segments.forEach((segment, index) => {
                const isLast = index === segments.length - 1;
                const label = this.formatSegment(segment);
                
                if (!isLast) {
                    crumbs += `<li class="breadcrumb-item">
                        <span class="breadcrumb-separator">›</span>
                        <a href="#" class="breadcrumb-link">${label}</a>
                    </li>`;
                } else {
                    crumbs += `<li class="breadcrumb-item">
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-current">${label}</span>
                    </li>`;
                }
            });
            
            crumbs += '</ol></nav>';
            return crumbs;
        },

        formatSegment(segment) {
            return segment
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    };

    // =====================================================
    // INITIALIZATION
    // =====================================================
    async function init() {
        // SidebarController.init(); // Disabled: Logic moved to layout-controller.js
        // HeaderController.init(); // Disabled: Handled by header.js
        ModalController.init();
        FormController.init();
        ThemeController.init();
        TableController.init();
        BreadcrumbController.init();

        // Expose ToastController globally
        window.EMSToast = ToastController;

        // Expose ModalController globally
        window.EMSModal = ModalController;

        console.log('Corporate EMS UI initialized');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
