// ====================== EMS SIDEBAR NAVIGATION ======================

const roleMenus = {
    hr_admin: [
        { icon: "dashboard",  text: "Dashboard",   folder: "admin_hr_dashboard" },
        { icon: "group",      text: "Employees",   folder: "employee_directory" },
        { icon: "domain",     text: "Departments", folder: "departments" },
        { icon: "work",       text: "Recruitment", folder: "recruitment_management" },
        { icon: "person_add", text: "Onboarding",  folder: "employee_onboarding/add_employee_personal_details_step_1", matchKey: "employee_onboarding" },
        { icon: "how_to_reg", text: "Attendance",  folder: "attendance_management" },
        { icon: "event_busy", text: "Leave",       folder: "leave_management" },
        { icon: "payments",   text: "Payroll",     folder: "payroll_page" },
        { icon: "workspace_premium", text: "Performance", folder: "performance" },
        { icon: "school",     text: "Training",    folder: "training" },
        { icon: "inventory_2", text: "Assets",      folder: "asset_management" },
        { icon: "notifications", text: "Notifications", folder: "notifications" },
        { icon: "bar_chart",  text: "Reports",     folder: "reports_dashboard" },
        { icon: "settings",   text: "Settings",    folder: "settings" },
        { icon: "person",     text: "Profile",     folder: "profile_settings" },
        { icon: "track_changes", text: "OB Tracker", folder: "onboarding_tracking", matchKey: "onboarding_tracking" }
    ],
    manager: [
        { icon: "dashboard",      text: "Overview",       folder: "management_dashboard" },
        { icon: "groups",         text: "Employees",      folder: "employees" },
        { icon: "group_work",     text: "Teams",          folder: "teams" },
        { icon: "how_to_reg",     text: "Attendance",     folder: "attendance" },
        { icon: "event_busy",     text: "Leave Requests", folder: "leave_requests" },
        { icon: "query_stats",    text: "Performance",    folder: "performance_reviews" },
        { icon: "notifications",  text: "Notifications",  folder: "notifications" },
        { icon: "analytics",      text: "Reports",        folder: "reports" },
        { icon: "person",         text: "Profile",        folder: "profile_settings" },
        { icon: "settings",       text: "Settings",       folder: "settings" },
        { icon: "task_alt",       text: "Approvals",      folder: "approvals" },
        { icon: "folder_special", text: "Projects",       folder: "projects" },
        { icon: "groups",         text: "Meetings",       folder: "meetings" },
        { icon: "analytics",      text: "Dept. Reports",  folder: "department_reports" },
        { icon: "leaderboard",    text: "Team Analytics", folder: "team_analytics" }
    ],
    employee: [
        { icon: "dashboard",     text: "My Dashboard",  folder: "employee_dashboard" },
        { icon: "person",        text: "My Profile",    folder: "profile_settings" },
        { icon: "how_to_reg",    text: "Attendance",    folder: "attendance_view" },
        { icon: "event_busy",    text: "Apply Leave",   folder: "apply_leave" },
        { icon: "payments",      text: "Salary Slips",  folder: "salary_slips" },
        { icon: "trending_up",   text: "Performance",   folder: "performance" },
        { icon: "school",        text: "Training",      folder: "training" },
        { icon: "notifications", text: "Notifications", folder: "notifications" },
        { icon: "folder",        text: "Documents",     folder: "documents" },
        { icon: "settings",      text: "Settings",      folder: "settings" }
    ]
};

const roleRootFolder = {
    hr_admin: "admin_hr",
    manager:  "management",
    employee: "employee"
};

function detectRole(path) {
    const forcedRole = String(window.EMS_PORTAL_ROLE || "").toLowerCase();
    if (roleRootFolder[forcedRole]) return forcedRole;
    const p = path.toLowerCase();
    if (p.includes("/management/")) return "manager";
    if (p.includes("/employee/"))   return "employee";
    return "hr_admin";
}

function getDepthToRoot(path) {
    const lPath = path.toLowerCase();
    const rootMarkers = ["ems_final", "ems_updated", "ems_project", "ems"];
    for (const marker of rootMarkers) {
        const idx = lPath.indexOf("/" + marker + "/");
        if (idx !== -1) {
            const afterRoot = path.substring(idx + marker.length + 2);
            const segs = afterRoot.split("/").filter(s => s.length > 0);
            return Math.max(1, segs.length - 1);
        }
    }
    const roleMarkers = ["/admin_hr/", "/management/", "/employee/", "/authentication/"];
    for (const rm of roleMarkers) {
        const idx = lPath.indexOf(rm);
        if (idx !== -1) {
            const afterRole = path.substring(idx + 1);
            const segs = afterRole.split("/").filter(s => s.length > 0);
            return Math.max(1, segs.length - 1);
        }
    }
    return 2;
}

function buildLink(depth, roleFolder, itemFolder) {
    const target = `${roleFolder}/${itemFolder}/code.html`;
    if (typeof emsPath === "function") return emsPath(target);
    return "../".repeat(depth) + target;
}

function getCurrentPageKey(path) {
    const segs = path.split("/").filter(s => s.length > 0);
    return segs.length >= 2 ? segs[segs.length - 2].toLowerCase() : "";
}

function createMenuItem(item, currentPath, link) {
    const currentKey = getCurrentPageKey(currentPath);
    const itemKey = (item.matchKey || item.folder.split("/").slice(-1)[0]).toLowerCase();
    
    // CRITICAL FIX: Use exact route matching for active state
    let isActive = false;
    
    // Get the exact folder name from the current path
    const pathSegments = currentPath.split("/").filter(s => s.length > 0);
    const currentFolder = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2].toLowerCase() : "";
    
    // Exact match with the folder name
    if (currentFolder === itemKey) {
        isActive = true;
    } else if (item.matchKey) {
        // For items with matchKey, check if the path includes the matchKey
        isActive = currentPath.toLowerCase().includes("/" + item.matchKey.toLowerCase() + "/");
    }
    
    // Ensure only one item is active by using strict matching
    // Reset any other potential matches
    const unreadCount = Number(window.EMS_unreadCount || 0);
    const unreadBadge = item.text === "Notifications"
        ? `<span class="sidebar-nav-badge" data-unread-count-badge style="${unreadCount > 0 ? "" : "display:none;"}">${unreadCount > 0 ? unreadCount : ""}</span>`
        : "";

    return `
        <li class="sidebar-nav-item ${isActive ? "active" : ""}">
            <a href="${link}" ${isActive ? 'aria-current="page"' : ""}>
                <span class="material-symbols-outlined">${item.icon}</span>
                <span class="sidebar-nav-text">${item.text}</span>
                ${unreadBadge}
            </a>
        </li>`;
}

function loadSidebar() {
    const path = (window.location.pathname + " " + window.location.href);
    const role = detectRole(path);
    const containers = document.querySelectorAll("#sidebar-menu");
    if (!containers.length) return;
    const depth = getDepthToRoot(path);

    const roleFolder = roleRootFolder[role];

    const menuHTML = roleMenus[role].map(item =>
        createMenuItem(item, path, buildLink(depth, roleFolder, item.folder))
    ).join("");

    const logoutLink = typeof emsPath === "function"
        ? emsPath("authentication/unified_login_portal/code.html")
        : "../".repeat(depth) + "authentication/unified_login_portal/code.html";

    const sidebarHTML = `
        ${menuHTML}
        <li class="sidebar-nav-item" style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--ems-border);">
            <a href="${logoutLink}" class="logout-btn" style="display: flex; align-items: center; gap: var(--ems-space-md); height: 48px; padding: 0 var(--ems-space-lg); text-decoration: none; border-radius: 12px; transition: var(--ems-transition-fast); font-weight: 500; font-size: 14px;">
                <span class="material-symbols-outlined">logout</span>
                <span class="sidebar-nav-text">Logout</span>
            </a>
        </li>
    `;

    containers.forEach(container => container.innerHTML = sidebarHTML);

    // Set sidebar role label
    const roleLabel = document.getElementById("sidebar-role-label");
    if (roleLabel) {
        const roleLabels = {
            hr_admin: "HR Administration",
            manager: "Management",
            employee: "Employee Portal"
        };
        roleLabel.textContent = roleLabels[role] || "Corporate EMS";
    }
}

window.EMS_unreadCount = Number(window.EMS_unreadCount || 0);
window.EMS_refreshSidebarBadges = function (count) {
    const next = Number(count || 0);
    window.EMS_unreadCount = next;
    document.querySelectorAll("[data-unread-count-badge]").forEach(node => {
        node.textContent = next > 0 ? String(next) : "";
        node.style.display = next > 0 ? "inline-flex" : "none";
    });
};
window.EMS_setUnreadCount = window.EMS_refreshSidebarBadges;
window.EMS_loadSidebar = loadSidebar;

document.addEventListener("DOMContentLoaded", loadSidebar);
