(function () {
    function apiBase() {
        return window.EMS_API?.LOGIN || window.location.origin;
    }

    function headers() {
        return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
    }

    async function request(path, options = {}) {
        const response = await fetch(apiBase() + path, {
            ...options,
            headers: {
                ...headers(),
                ...(options.headers || {})
            }
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(text || `${response.status} ${path}`);
        }
        if (response.status === 204) return null;
        return response.json();
    }

    function el(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDateTime(value) {
        if (!value) return "Just now";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
              });
    }

    function initials(fullName, fallback) {
        const source = String(fullName || fallback || "EMS").trim();
        const parts = source.split(/\s+/).filter(Boolean);
        if (!parts.length) return "EM";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    function setStatus(node, message, kind = "info") {
        if (!node) return;
        const colors = {
            info: "text-slate-500",
            success: "text-emerald-600",
            error: "text-red-600"
        };
        node.textContent = message;
        node.className = `text-sm font-semibold ${colors[kind] || colors.info}`;
    }

    function formValues(form) {
        return Object.fromEntries(new FormData(form).entries());
    }

    function populateForm(form, data) {
        if (!form || !data) return;
        Array.from(form.elements).forEach((field) => {
            if (!field.name) return;
            if (field.type === "checkbox") {
                field.checked = Boolean(data[field.name]);
                return;
            }
            if (data[field.name] != null) {
                field.value = data[field.name];
            }
        });
    }

    function renderStatList(node, items) {
        if (!node) return;
        node.innerHTML = items.map((item) => `
            <div class="portal-stat">
                <p class="text-xs font-bold uppercase tracking-[0.2em] portal-muted">${escapeHtml(item.label)}</p>
                <p class="mt-2 text-3xl font-black text-slate-900">${escapeHtml(item.value)}</p>
                ${item.hint ? `<p class="mt-2 text-sm portal-muted">${escapeHtml(item.hint)}</p>` : ""}
            </div>
        `).join("");
    }

    function renderCardList(node, items, emptyMessage, renderer) {
        if (!node) return;
        if (!items || !items.length) {
            node.innerHTML = `<div class="portal-empty">${escapeHtml(emptyMessage)}</div>`;
            return;
        }
        node.innerHTML = items.map(renderer).join("");
    }

    function feedBadge(kind) {
        switch (String(kind || "").toUpperCase()) {
            case "EVENT":
                return "Event";
            case "FEEDBACK":
                return "Feedback";
            case "ACTIVITY":
                return "Activity";
            case "ANNOUNCEMENT":
                return "Announcement";
            default:
                return "Update";
        }
    }

    function messageClass(direction) {
        return direction === "SENT" ? "sent" : "received";
    }

    function statusPill(status) {
        const normalized = String(status || "UNREAD").toUpperCase();
        if (normalized === "READ") return '<span class="portal-pill green">Read</span>';
        if (normalized === "ARCHIVED") return '<span class="portal-pill blue">Archived</span>';
        return '<span class="portal-pill amber">Unread</span>';
    }

    function notificationMatches(item, query, statusFilter) {
        const haystack = [
            item.title,
            item.subject,
            item.message,
            item.source,
            item.audience,
            item.priority,
            item.category,
            item.status,
            item.channel
        ].join(" ").toLowerCase();
        if (query && !haystack.includes(query)) return false;
        if (!statusFilter || statusFilter === "all") return true;
        return String(item.status || "").toLowerCase() === statusFilter;
    }

    function actionButtons(item, allowActions) {
        if (!allowActions || !item?.id || item.direction === "SENT") return "";
        const id = escapeHtml(item.id);
        const kind = escapeHtml(item.kind || "DIRECT");
        const isRead = Boolean(item.read) || String(item.status || "").toUpperCase() === "READ";
        return `
            <div class="mt-4 flex flex-wrap gap-2">
                ${isRead
                    ? `<button type="button" class="portal-pill blue" data-notif-action="unread" data-notif-id="${kind}:${id}">Mark unread</button>`
                    : `<button type="button" class="portal-pill blue" data-notif-action="read" data-notif-id="${kind}:${id}">Mark read</button>`}
                <button type="button" class="portal-pill amber" data-notif-action="archive" data-notif-id="${kind}:${id}">Archive</button>
                <button type="button" class="portal-pill" style="background:#fee2e2;color:#b91c1c" data-notif-action="delete" data-notif-id="${kind}:${id}">Delete</button>
            </div>`;
    }

    async function loadProfile(employeeCode) {
        return request(`/api/portal/profile/${encodeURIComponent(employeeCode)}`);
    }

    async function saveProfile(employeeCode, payload) {
        return request(`/api/portal/profile/${encodeURIComponent(employeeCode)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    }

    async function loadNotifications(employeeCode) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}`);
    }

    async function sendMessage(employeeCode, payload) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}/messages`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }

    async function markRead(employeeCode, messageId) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}/messages/${messageId}/read`, {
            method: "PUT"
        });
    }

    async function markUnread(employeeCode, messageId) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}/messages/${messageId}/unread`, {
            method: "PUT"
        });
    }

    async function archiveMessage(employeeCode, messageId) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}/messages/${messageId}/archive`, {
            method: "PUT"
        });
    }

    async function deleteMessage(employeeCode, messageId) {
        return request(`/api/portal/notifications/${encodeURIComponent(employeeCode)}/messages/${messageId}/delete`, {
            method: "PUT"
        });
    }

    function renderProfilePage(config = {}) {
        const code = (window.Auth?.employeeCode?.()) || 'EMP-IT-001';

        const pageTitle = el("profile-page-title");
        const pageSubtitle = el("profile-page-subtitle");
        const heroName = el("profile-hero-name");
        const heroRole = el("profile-hero-role");
        const heroDept = el("profile-hero-dept");
        const heroEmail = el("profile-hero-email");
        const avatar = el("profile-avatar");
        const statsNode = el("profile-stats");
        const feedNode = el("profile-feed");
        const form = el("profile-form");
        const status = el("profile-status");
        const saveBtn = el("profile-save-btn");

        if (pageTitle) pageTitle.textContent = config.title || "Profile Settings";
        if (pageSubtitle) pageSubtitle.textContent = config.subtitle || "Update your role-specific details, notification preferences, and contact information.";

        const refresh = async () => {
            try {
                const data = await loadProfile(code);
                const profile = data || {};
                if (heroName) heroName.textContent = profile.fullName || window.Auth?.fullName?.() || "Team Member";
                if (heroRole) heroRole.textContent = `${config.label || "Profile"} • ${profile.role || window.Auth?.role?.() || "TEAM"}`;
                if (heroDept) heroDept.textContent = profile.department || config.departmentLabel || "Corporate";
                if (heroEmail) heroEmail.textContent = profile.email || window.Auth?.email?.() || "";
                if (avatar) {
                    const photo = profile.photoUrl || profile.photo_url;
                    if (photo) {
                        avatar.innerHTML = `<img src="${escapeHtml(photo)}" alt="Profile photo" class="h-full w-full object-cover">`;
                    } else {
                        avatar.textContent = initials(profile.fullName, profile.email);
                    }
                }
                renderStatList(statsNode, [
                    { label: "Unread", value: profile.unreadCount ?? 0, hint: "Open items waiting for you" },
                    { label: "Sent", value: profile.sentCount ?? 0, hint: "Direct messages sent" },
                    { label: "Received", value: profile.receivedCount ?? 0, hint: "Direct messages received" }
                ]);
                if (feedNode) {
                    const highlights = [
                        profile.summary,
                        profile.workLocation ? `Work location: ${profile.workLocation}` : null,
                        profile.reportingManagerCode ? `Reports to: ${profile.reportingManagerCode}` : null
                    ].filter(Boolean);
                    feedNode.innerHTML = highlights.length
                        ? highlights.map((line) => `<div class="portal-feed-item announcement"><p class="font-semibold text-slate-900">${escapeHtml(line)}</p></div>`).join("")
                        : `<div class="portal-empty">No profile highlights yet.</div>`;
                }
                populateForm(form, profile);
                if (status) setStatus(status, "Profile loaded", "success");
            } catch (error) {
                if (status) setStatus(status, error.message || "Could not load profile", "error");
            }
        };

        if (form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                const payload = formValues(form);
                try {
                    if (saveBtn) saveBtn.disabled = true;
                    await saveProfile(code, {
                        ...payload,
                        emailAlerts: form.querySelector('[name="emailAlerts"]')?.checked,
                        pushAlerts: form.querySelector('[name="pushAlerts"]')?.checked,
                        payrollAlerts: form.querySelector('[name="payrollAlerts"]')?.checked
                    });
                    await refresh();
                    if (status) setStatus(status, "Profile updated successfully", "success");
                } catch (error) {
                    if (status) setStatus(status, error.message || "Could not save profile", "error");
                } finally {
                    if (saveBtn) saveBtn.disabled = false;
                }
            });
        }

        refresh();
    }

    function renderNotificationPage(config = {}) {
        const code = (window.Auth?.employeeCode?.()) || 'EMP-IT-001';

        const pageTitle = el("notification-page-title");
        const pageSubtitle = el("notification-page-subtitle");
        const inboxNode = el("notification-inbox");
        const sentNode = el("notification-sent");
        const feedNode = el("notification-feed");
        const statsNode = el("notification-stats");
        const form = el("notification-form");
        const status = el("notification-status");
        const recipientLabel = el("notification-recipient-label");
        const searchInput = el("notification-search");
        const filterSelect = el("notification-filter");
        const refreshBtn = el("notification-refresh");
        const unreadBadge = el("notification-count");
        const sidebarBadge = el("sidebar-unread-count");
        const allowCompose = config.allowCompose !== false;
        const allowActions = config.allowActions !== false;
        const autoRefreshMs = Number(config.autoRefreshMs || 30000);

        if (pageTitle) pageTitle.textContent = config.title || "Notifications";
        if (pageSubtitle) pageSubtitle.textContent = config.subtitle || "Send direct messages, review received alerts, and track the latest feed items.";
        if (recipientLabel) recipientLabel.textContent = config.recipientLabel || "Recipient group";

        if (form && allowCompose) {
            const recipientRoleInput = form.querySelector('[name="recipientRole"]');
            const recipientTypeInput = form.querySelector('[name="recipientType"]');
            const recipientCodeInput = form.querySelector('[name="recipientCode"]');
            if (recipientRoleInput && config.defaultRecipientRole) recipientRoleInput.value = config.defaultRecipientRole;
            if (recipientTypeInput && config.defaultRecipientType) recipientTypeInput.value = config.defaultRecipientType;
            if (recipientCodeInput && config.defaultRecipientCode) recipientCodeInput.value = config.defaultRecipientCode;
        }

        let currentData = { inbox: [], sent: [], feed: [], stats: {} };
        if (window.__emsNotificationTimer) {
            clearInterval(window.__emsNotificationTimer);
            window.__emsNotificationTimer = null;
        }

        const updateBadges = (count) => {
            const value = Number(count || 0);
            if (unreadBadge) unreadBadge.textContent = String(value);
            const panelBadge = el("notification-count-panel");
            if (panelBadge) panelBadge.textContent = String(value);
            if (sidebarBadge) sidebarBadge.textContent = String(value);
            if (window.EMS_refreshSidebarBadges) window.EMS_refreshSidebarBadges(value);
            if (window.EMS_setUnreadCount) window.EMS_setUnreadCount(value);
            document.dispatchEvent(new CustomEvent("ems-unread-updated", { detail: { count: value } }));
        };

        const render = (data) => {
            currentData = data || currentData;
            const received = currentData.inbox || [];
            const sent = currentData.sent || [];
            const feed = currentData.feed || [];
            const profile = currentData.profile || {};
            const stats = currentData.stats || {};
            const query = String(searchInput?.value || "").trim().toLowerCase();
            const filter = String(filterSelect?.value || "all").trim().toLowerCase();

            renderStatList(statsNode, [
                { label: "Unread", value: stats.unread ?? profile.unreadCount ?? 0, hint: "Items that still need attention" },
                { label: "Sent", value: stats.sent ?? sent.length, hint: "Messages you have dispatched" },
                { label: "Feed", value: stats.feed ?? feed.length, hint: "Announcements and company activity" }
            ]);
            updateBadges(stats.unread ?? profile.unreadCount ?? 0);

            const filteredInbox = received.filter(item => notificationMatches(item, query, filter));
            const filteredSent = sent.filter(item => notificationMatches(item, query, filter));
            const filteredFeed = feed.filter(item => notificationMatches(item, query, filter));

            renderCardList(inboxNode, filteredInbox, "No inbox messages yet.", (item) => `
                <article class="portal-message ${messageClass(item.direction)}">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <p class="text-sm font-black text-slate-900">${escapeHtml(item.title)}</p>
                                <span class="portal-pill blue">${escapeHtml(item.priority || "MEDIUM")}</span>
                                <span class="portal-pill">${escapeHtml(item.category || "General")}</span>
                            </div>
                            ${item.subject ? `<p class="mt-1 text-xs font-bold uppercase tracking-[0.18em] portal-muted">${escapeHtml(item.subject)}</p>` : ""}
                            <p class="mt-2 text-sm portal-muted break-words">${escapeHtml(item.message)}</p>
                        </div>
                        <div class="text-right text-xs portal-muted shrink-0">
                            <p>${escapeHtml(formatDateTime(item.createdAt))}</p>
                            <p>${escapeHtml(item.source || item.senderCode || "System")}</p>
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap items-center gap-2">
                        <span class="portal-pill blue">${escapeHtml(item.channel || item.kind || "IN_APP")}</span>
                        ${statusPill(item.status || (item.read ? "READ" : "UNREAD"))}
                        ${item.sendDate ? `<span class="portal-pill">Send ${escapeHtml(item.sendDate)}</span>` : ""}
                        ${item.expiryDate ? `<span class="portal-pill">Expiry ${escapeHtml(item.expiryDate)}</span>` : ""}
                    </div>
                    ${actionButtons(item, allowActions)}
                </article>
            `);

            renderCardList(sentNode, filteredSent, "No sent messages yet.", (item) => `
                <article class="portal-message sent">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <p class="text-sm font-black text-slate-900">${escapeHtml(item.title)}</p>
                                <span class="portal-pill blue">${escapeHtml(item.priority || "MEDIUM")}</span>
                                <span class="portal-pill">${escapeHtml(item.category || "General")}</span>
                            </div>
                            ${item.subject ? `<p class="mt-1 text-xs font-bold uppercase tracking-[0.18em] portal-muted">${escapeHtml(item.subject)}</p>` : ""}
                            <p class="mt-2 text-sm portal-muted break-words">${escapeHtml(item.message)}</p>
                        </div>
                        <div class="text-right text-xs portal-muted shrink-0">
                            <p>${escapeHtml(formatDateTime(item.createdAt))}</p>
                            <p>To ${escapeHtml(item.recipientCode || item.audience || "team")}</p>
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap items-center gap-2">
                        <span class="portal-pill blue">${escapeHtml(item.channel || item.kind || "IN_APP")}</span>
                        ${statusPill(item.status || (item.read ? "READ" : "UNREAD"))}
                    </div>
                </article>
            `);

            renderCardList(feedNode, filteredFeed, "No feed items available.", (item) => `
                <article class="portal-feed-item ${String(item.kind || "").toLowerCase()}">
                    <div class="flex items-center justify-between gap-4">
                        <span class="portal-pill blue">${escapeHtml(feedBadge(item.kind))}</span>
                        <span class="text-xs portal-muted">${escapeHtml(formatDateTime(item.createdAt))}</span>
                    </div>
                    <h4 class="mt-3 text-lg font-black text-slate-900">${escapeHtml(item.title)}</h4>
                    <p class="mt-2 text-sm portal-muted">${escapeHtml(item.message)}</p>
                    <p class="mt-3 text-xs portal-muted">${escapeHtml(item.source || "System")} • ${escapeHtml(item.audience || "ALL")}</p>
                </article>
            `);

            if (status) setStatus(status, "Notification center loaded", "success");
        };

        const refresh = async (silent = false) => {
            try {
                const data = await loadNotifications(code);
                render(data);
            } catch (error) {
                if (!silent && status) setStatus(status, error.message || "Could not load notifications", "error");
            }
        };

        if (allowCompose && form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                const payload = formValues(form);
                try {
                    const sendBtn = form.querySelector("button[type='submit']");
                    if (sendBtn) sendBtn.disabled = true;
                    await sendMessage(code, payload);
                    form.reset();
                    await refresh();
                    if (status) setStatus(status, "Message sent successfully", "success");
                } catch (error) {
                    if (status) setStatus(status, error.message || "Could not send message", "error");
                } finally {
                    const sendBtn = form.querySelector("button[type='submit']");
                    if (sendBtn) sendBtn.disabled = false;
                }
            });
        }

        const onDocumentClick = async (event) => {
            const target = event.target.closest("[data-notif-action]");
            if (!target) return;
            const action = target.getAttribute("data-notif-action");
            const messageId = target.getAttribute("data-notif-id");
            if (!messageId) return;
            try {
                if (action === "read") {
                    await markRead(code, messageId);
                } else if (action === "unread") {
                    await markUnread(code, messageId);
                } else if (action === "archive") {
                    await archiveMessage(code, messageId);
                } else if (action === "delete") {
                    if (!window.confirm("Delete this notification?")) return;
                    await deleteMessage(code, messageId);
                }
                await refresh();
            } catch (error) {
                if (status) setStatus(status, error.message || "Could not update message", "error");
            }
        };
        document.addEventListener("click", onDocumentClick);

        [searchInput, filterSelect].forEach(node => {
            if (!node || node.dataset.portalBound) return;
            node.dataset.portalBound = "1";
            node.addEventListener("input", () => render());
            node.addEventListener("change", () => render());
        });

        if (refreshBtn && !refreshBtn.dataset.portalBound) {
            refreshBtn.dataset.portalBound = "1";
            refreshBtn.addEventListener("click", () => refresh());
        }

        if (autoRefreshMs > 0) {
            window.__emsNotificationTimer = setInterval(() => refresh(true), autoRefreshMs);
            document.addEventListener("visibilitychange", () => {
                if (!document.hidden) refresh(true);
            });
        }

        refresh();
    }

    window.EMS_Portal = {
        initProfilePage: renderProfilePage,
        initNotificationsPage: renderNotificationPage
    };
})();
