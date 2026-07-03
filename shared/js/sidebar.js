// ====================== EMS SIDEBAR NAVIGATION ======================

const roleMenus = {
    hr_admin: [
        { icon: "dashboard",  text: "Dashboard",   folder: "admin_hr_dashboard" },
        { icon: "group",      text: "Directory",   folder: "employee_directory" },
        { icon: "how_to_reg", text: "Attendance",  folder: "attendance_management" },
        { icon: "event_busy", text: "Leave",       folder: "leave_management" },
        { icon: "payments",   text: "Payroll",     folder: "payroll_page" },
        { icon: "work",       text: "Recruitment", folder: "recruitment_management" },
        { icon: "bar_chart",  text: "Reports",     folder: "reports_dashboard" },
        { icon: "person_add", text: "Onboarding",  folder: "employee_onboarding/add_employee_personal_details_step_1", matchKey: "employee_onboarding" }
    ],
    manager: [
        { icon: "dashboard",      text: "Overview",       folder: "management_dashboard" },
        { icon: "task_alt",       text: "Approvals",      folder: "approvals" },
        { icon: "folder_special", text: "Projects",       folder: "projects" },
        { icon: "query_stats",    text: "Performance",    folder: "performance_reviews" },
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
        { icon: "notifications", text: "Notifications", folder: "notifications" }
    ]
};

const roleRootFolder = {
    hr_admin: "admin_hr",
    manager:  "management",
    employee: "employee"
};

function detectRole(path) {
    const p = path.toLowerCase();
    if (p.includes("/management/")) return "manager";
    if (p.includes("/employee/"))   return "employee";
    return "hr_admin";
}

/**
 * Count how many directory levels the current page is below the EMS root.
 * Works for any root folder name (ems_final, ems_updated, etc.)
 * and also works when opened directly from a server path.
 */
function getDepthToRoot(path) {
    const lPath = path.toLowerCase();

    // Try known root folder markers
    const rootMarkers = ["ems_final", "ems_updated", "ems_project", "ems"];
    for (const marker of rootMarkers) {
        const idx = lPath.indexOf("/" + marker + "/");
        if (idx !== -1) {
            const afterRoot = path.substring(idx + marker.length + 2);
            const segs = afterRoot.split("/").filter(s => s.length > 0);
            // segs includes code.html as last segment, so depth = segs.length - 1
            return Math.max(1, segs.length - 1);
        }
    }

    // Fallback: find the role folder and count segments from there
    const roleMarkers = ["/admin_hr/", "/management/", "/employee/", "/authentication/"];
    for (const rm of roleMarkers) {
        const idx = lPath.indexOf(rm);
        if (idx !== -1) {
            const afterRole = path.substring(idx + 1);
            const segs = afterRole.split("/").filter(s => s.length > 0);
            // segs: [admin_hr, page_folder, code.html] → depth = segs.length - 1
            return Math.max(1, segs.length - 1);
        }
    }

    return 2; // safe default
}

function buildLink(depth, roleFolder, itemFolder) {
    return "../".repeat(depth) + `${roleFolder}/${itemFolder}/code.html`;
}

function getCurrentPageKey(path) {
    const segs = path.split("/").filter(s => s.length > 0);
    return segs.length >= 2 ? segs[segs.length - 2].toLowerCase() : "";
}

function createMenuItem(item, currentPath, link) {
    const currentKey = getCurrentPageKey(currentPath);
    const itemKey = (item.matchKey || item.folder.split("/").slice(-1)[0]).toLowerCase();
    const isActive = currentKey === itemKey ||
                     currentPath.toLowerCase().includes(itemKey) ||
                     (item.matchKey && currentPath.toLowerCase().includes(item.matchKey));

    return `
        <li class="nav-item ${isActive ? "active" : ""}">
            <a href="${link}">
                <span class="material-symbols-outlined">${item.icon}</span>
                <span class="nav-text">${item.text}</span>
            </a>
        </li>`;
}

function loadSidebar() {
    const path = window.location.pathname;
    const role = detectRole(path);
    const container = document.getElementById("sidebar-menu");
    if (!container) return;

    const depth = getDepthToRoot(path);
    const roleFolder = roleRootFolder[role];
    const ups = "../".repeat(depth);

    const menuHTML = roleMenus[role].map(item =>
        createMenuItem(item, path, buildLink(depth, roleFolder, item.folder))
    ).join("");

    const logoutLink = `${ups}authentication/unified_login_portal/code.html`;

    container.innerHTML = `
        ${menuHTML}
        <div class="sidebar-footer" style="margin-top:auto;padding-top:16px;border-top:1px solid #e2e8f0;">
            <li class="nav-item">
                <a href="${logoutLink}" class="logout-btn">
                    <span class="material-symbols-outlined">logout</span>
                    <span class="nav-text">Logout</span>
                </a>
            </li>
        </div>`;
}

document.addEventListener("DOMContentLoaded", loadSidebar);

// ====================== SIDEBAR TOGGLE ======================

document.addEventListener("DOMContentLoaded", function () {
    const sidebar   = document.getElementById("sidebar");
    const overlay   = document.getElementById("sidebarOverlay");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (!sidebar || !toggleBtn) return;

    let open = false;

    function openSidebar() {
        sidebar.classList.remove("-translate-x-full");
        if (overlay) overlay.classList.remove("hidden");
        open = true;
    }

    function closeSidebar() {
        sidebar.classList.add("-translate-x-full");
        if (overlay) overlay.classList.add("hidden");
        open = false;
    }

    toggleBtn.addEventListener("click", function () {
        open ? closeSidebar() : openSidebar();
    });

    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    // Set topbar title from <title>
    const titleEl = document.getElementById("page-header-title");
    if (titleEl) {
        const raw = document.title.split("|")[0].split("-")[0].trim();
        titleEl.textContent = raw || "Dashboard";
    }
});
