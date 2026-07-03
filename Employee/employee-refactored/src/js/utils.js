// /* =============================================================
//    utils.js – EMS Shared Utilities
//    Handles auth token storage, role checks, and API base URL.
//    ============================================================= */

// ── Config ───────────────────────────────────────────────────────────
function resolveGatewayOrigin() {
    if (window.location.port === '8080') {
        return window.location.origin;
    }
    // VS Code Live Server (5500), Python dev server (8765), file:// — all go to gateway.
    // Use the same hostname the browser used (127.0.0.1 or localhost) so that
    // CORS pre-flight and cookies stay on the same origin.
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8080`;
}

// Expose for debug
window.EMS_GATEWAY = resolveGatewayOrigin();

const GATEWAY = resolveGatewayOrigin();
const EMPLOYEE_API = 'http://localhost:8085';

const EMS_API = {
    LOGIN:   EMPLOYEE_API,   // employee backend on :8085
    HR:      GATEWAY,        // unified backend on :8080 (/api/attendance/**, /api/leave/**)
    MGMT:    GATEWAY,        // unified backend on :8080 (/api/projects/**, /api/meetings/**)
};

// Expose API config for React components
window.EMS_API = EMS_API;

const EMS_STORAGE = {
    get(key) {
        try {
            if (window.localStorage) return localStorage.getItem(key);
        } catch (_) {}

        try {
            const params = new URLSearchParams(window.location.search);
            if (params.has(key)) return params.get(key);
        } catch (_) {}

        const name = encodeURIComponent(key) + '=';
        return document.cookie
            .split(';')
            .map(part => part.trim())
            .filter(part => part.startsWith(name))
            .map(part => decodeURIComponent(part.slice(name.length)))[0] || null;
    },

    set(key, value) {
        try {
            if (window.localStorage) {
                localStorage.setItem(key, value);
                return;
            }
        } catch (_) {}

        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
    },

    remove(key) {
        try {
            if (window.localStorage) localStorage.removeItem(key);
        } catch (_) {}

        document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
    }
};

// ── Token helpers ────────────────────────────────────────────────────
const Auth = {
    /** Store login session */
    save(response) {
        EMS_STORAGE.set('ems_token',        response.token);
        EMS_STORAGE.set('ems_role',         response.role);
        EMS_STORAGE.set('ems_employeeCode', response.employeeCode);
        EMS_STORAGE.set('ems_email',        response.email);
        if (response.fullName) EMS_STORAGE.set('ems_fullName', response.fullName);
    },

    /** Clear session (logout) */
    clear() {
        ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'].forEach(k => EMS_STORAGE.remove(k));
    },

    token()        { return EMS_STORAGE.get('ems_token'); },
    role()         { return EMS_STORAGE.get('ems_role'); },
    employeeCode() { return EMS_STORAGE.get('ems_employeeCode'); },
    email()        { return EMS_STORAGE.get('ems_email'); },
    fullName()     { return EMS_STORAGE.get('ems_fullName'); },

    isLoggedIn()   { return !!this.token(); },

    /** Build Authorization header object */
    headers() {
        return {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${this.token()}`
        };
    }
};

// Expose auth helpers for React components
window.Auth = Auth;
// ── Direct-load / dev fallback ────────────────────────────────────────
// When no login session exists (no token in localStorage), seed Auth with
// a default employee code so all API calls work without going through login.
// Change DEV_EMPLOYEE_CODE to any employee_code in your ems_db.employees table.
// In production, remove this block (or keep it — it only fires when NOT logged in).
(function seedDevAuth() {
    if (Auth.isLoggedIn()) return;                 // real session → do nothing
    const DEV_EMPLOYEE_CODE = 'EMP-IT-001';        // ← change to your employee_code
    EMS_STORAGE.set('ems_employeeCode', DEV_EMPLOYEE_CODE);
    EMS_STORAGE.set('ems_role',         'EMPLOYEE');
    EMS_STORAGE.set('ems_fullName',     'Santhosh Kumar');
    EMS_STORAGE.set('ems_email',        'santhosh@company.com');
    // No token needed — SecurityConfig permits all /api/** without auth
    console.info('[EMS] Dev fallback active → employee code:', DEV_EMPLOYEE_CODE);
})();


// // â”€â”€ Token helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// const Auth = {
//     /** Store login session */
//     save(response) {
//         EMS_STORAGE.set('ems_token',        response.token);
//         EMS_STORAGE.set('ems_role',         response.role);
//         EMS_STORAGE.set('ems_employeeCode', response.employeeCode);
//         EMS_STORAGE.set('ems_email',        response.email);
//         if (response.fullName) EMS_STORAGE.set('ems_fullName', response.fullName);
//     },

//     /** Clear session (logout) */
//     clear() {
//         ['ems_token', 'ems_role', 'ems_employeeCode', 'ems_email', 'ems_fullName'].forEach(k => EMS_STORAGE.remove(k));
//     },

//     token()        { return EMS_STORAGE.get('ems_token'); },
//     role()         { return EMS_STORAGE.get('ems_role'); },
//     employeeCode() { return EMS_STORAGE.get('ems_employeeCode'); },
//     email()        { return EMS_STORAGE.get('ems_email'); },
//     fullName()     { return EMS_STORAGE.get('ems_fullName'); },

//     isLoggedIn()   { return !!this.token(); },

//     /** Build Authorization header object */
//     headers() {
//         return {
//             'Content-Type':  'application/json',
//             'Authorization': `Bearer ${this.token()}`
//         };
//     }
// };

// // â”€â”€ Role-based redirect map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// const ROLE_DASHBOARDS = {
//     ADMIN:      'admin_hr/admin_hr_dashboard/code.html',
//     HR:         'admin_hr/admin_hr_dashboard/code.html',
//     MANAGER:    'management/management_dashboard/code.html',
//     MANAGEMENT: 'management/management_dashboard/code.html',
//     EMPLOYEE:   'employee/employee_dashboard/code.html',
// };

// /** Return the EMS root (parent of /authentication, /employee, etc.) */
// function emsRoot() {
//     const parts = window.location.pathname.split('/');
//     // Find the EMS root by going up until we reach the folder that contains
//     // authentication/, employee/, management/, admin_hr/
//     const knownDirs = ['authentication','employee','management','admin_hr','shared'];
//     for (let i = parts.length - 1; i >= 0; i--) {
//         if (knownDirs.includes(parts[i])) {
//             return parts.slice(0, i).join('/') || '/';
//         }
//     }
//     return '';
// }

// function emsPath(path) {
//     const root = emsRoot();
//     const cleanRoot = root === '/' ? '' : root.replace(/\/+$/, '');
//     const cleanPath = String(path || '').replace(/^\/+/, '');
//     return cleanRoot + '/' + cleanPath;
// }

// /** Redirect to the dashboard for the current user's role */
// function redirectToDashboard(role) {
//     const path = ROLE_DASHBOARDS[(role || '').toUpperCase()] || ROLE_DASHBOARDS.EMPLOYEE;
//     window.location.href = emsPath(path);
// }

// // â”€â”€ Route guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /**
//  * Call at the top of every protected page.
//  * Optionally pass allowed roles: guardPage(['ADMIN','HR'])
//  */
// function guardPage(allowedRoles) {
//     if (!Auth.isLoggedIn()) {
//         window.location.href = emsPath('authentication/unified_login_portal/code.html');
//         return false;
//     }
//     if (allowedRoles && allowedRoles.length > 0) {
//         const role = (Auth.role() || '').toUpperCase();
//         const allowed = allowedRoles.map(r => r.toUpperCase());
//         if (!allowed.includes(role)) {
//             if (role === "MANAGER" && allowed.includes("MANAGEMENT")) return true;
//             // Redirect to own dashboard
//             redirectToDashboard(Auth.role());
//             return false;
//         }
//     }
//     return true;
// }

// // â”€â”€ Logout helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// async function logout() {
//     try {
//         await fetch(`${EMS_API.LOGIN}/api/auth/logout`, {
//             method: 'POST',
//             headers: Auth.headers()
//         });
//     } catch (_) { /* ignore network errors on logout */ }
//     Auth.clear();
//     window.location.href = emsPath('authentication/unified_login_portal/code.html');
// }

// // â”€â”€ Expose globals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// window.Auth            = Auth;
// window.EMS_API         = EMS_API;
// window.ROLE_DASHBOARDS = ROLE_DASHBOARDS;
// window.guardPage       = guardPage;
// window.redirectToDashboard = redirectToDashboard;
// window.emsPath         = emsPath;
// window.logout          = logout;
// window.fetchJson       = fetchJson;
// window.fetchEmployees  = fetchEmployees;

// window.filterListItems = function filterListItems(query) {
//     const needle = String(query || '').trim().toLowerCase();
//     document.querySelectorAll('[data-list-item], tbody tr, .list-item').forEach(item => {
//         const text = item.textContent.toLowerCase();
//         item.style.display = !needle || text.includes(needle) ? '' : 'none';
//     });
// };

// (function initEMSSharedUi() {
//     const routeMap = {
//         employees: "admin_hr/employee_directory/code.html",
//         "mgmt-employees": "management/employees/code.html",
//         attendance: "admin_hr/attendance_management/code.html",
//         "mgmt-attendance": "management/attendance/code.html",
//         leave: "admin_hr/leave_management/code.html",
//         "mgmt-leave": "management/leave_requests/code.html",
//         payroll: "admin_hr/payroll_page/code.html",
//         recruitment: "admin_hr/recruitment_management/code.html",
//         reports: "admin_hr/reports_dashboard/code.html",
//         "mgmt-reports": "management/reports/code.html",
//         onboarding: "admin_hr/onboarding_tracking/code.html",
//         approvals: "management/approvals/code.html",
//         projects: "management/projects/code.html",
//         performance: "employee/performance/code.html",
//         "mgmt-performance": "management/performance_reviews/code.html",
//         "hr-performance": "admin_hr/performance/code.html",
//         "hr-training": "admin_hr/training/code.html",
//         meetings: "management/meetings/code.html",
//         "dept-reports": "management/department_reports/code.html",
//         analytics: "management/team_analytics/code.html",
//         "hr-profile": "admin_hr/profile_settings/code.html",
//         "hr-notifications": "admin_hr/notifications/code.html",
//         "mgmt-profile": "management/profile_settings/code.html",
//         "mgmt-notifications": "management/notifications/code.html",
//         "employee-profile": "employee/profile_settings/code.html",
//         "employee-notifications": "employee/notifications/code.html",
//         "apply-leave": "employee/apply_leave/code.html",
//         salary: "employee/salary_slips/code.html",
//         "employee-attendance": "employee/attendance_view/code.html",
//         "employee-training": "employee/training/code.html",
//         "employee-documents": "employee/documents/code.html",
//         "employee-settings": "employee/settings/code.html",
//         "hr-settings": "admin_hr/settings/code.html",
//         "mgmt-settings": "management/settings/code.html"
//     };

//     function roleAwareRoute(key) {
//         const current = window.location.pathname.toLowerCase();
//         const role = Auth.role() ? String(Auth.role()).toUpperCase() : "";

//         if (key === "profile") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-profile"];
//             }
//             if (current.includes("/admin_hr/") || role === "ADMIN" || role === "HR") {
//                 return routeMap["hr-profile"];
//             }
//             return routeMap["employee-profile"];
//         }

//         if (key === "notifications") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-notifications"];
//             }
//             if (current.includes("/admin_hr/") || role === "ADMIN" || role === "HR") {
//                 return routeMap["hr-notifications"];
//             }
//             return routeMap["employee-notifications"];
//         }

//         if (key === "employees") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-employees"];
//             }
//             return routeMap.employees;
//         }

//         if (key === "attendance") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-attendance"];
//             }
//             if (current.includes("/employee/") || role === "EMPLOYEE") {
//                 return routeMap["employee-attendance"];
//             }
//             return routeMap.attendance;
//         }

//         if (key === "leave") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-leave"];
//             }
//             if (current.includes("/employee/") || role === "EMPLOYEE") {
//                 return routeMap["apply-leave"];
//             }
//             return routeMap.leave;
//         }

//         if (key === "reports") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-reports"];
//             }
//             return routeMap.reports;
//         }

//         if (key === "performance") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-performance"];
//             }
//             if (current.includes("/admin_hr/") || role === "ADMIN" || role === "HR") {
//                 return routeMap["hr-performance"];
//             }
//             return routeMap.performance;
//         }

//         if (key === "settings") {
//             if (current.includes("/management/") || role === "MANAGER" || role === "MANAGEMENT") {
//                 return routeMap["mgmt-settings"];
//             }
//             if (current.includes("/admin_hr/") || role === "ADMIN" || role === "HR") {
//                 return routeMap["hr-settings"];
//             }
//             return routeMap["employee-settings"];
//         }

//         if (key === "training") {
//             if (current.includes("/employee/") || role === "EMPLOYEE") return routeMap["employee-training"];
//             return routeMap["hr-training"];
//         }

//         if (key === "documents") {
//             return routeMap["employee-documents"];
//         }

//         return routeMap[key] || key;
//     }

//     function ensureToastHost() {
//         let host = document.getElementById("ems-toast-host");
//         if (host) return host;
//         host = document.createElement("div");
//         host.id = "ems-toast-host";
//         host.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99999;display:grid;gap:10px;max-width:min(360px,calc(100vw - 32px));";
//         document.body.appendChild(host);
//         return host;
//     }

//     function showToast(message, type) {
//         const colors = {
//             success: ["#ecfdf5", "#047857", "#a7f3d0"],
//             error: ["#fef2f2", "#b91c1c", "#fecaca"],
//             warning: ["#fffbeb", "#b45309", "#fde68a"],
//             info: ["#eff6ff", "#1d4ed8", "#bfdbfe"]
//         };
//         const [bg, fg, border] = colors[type] || colors.info;
//         const toast = document.createElement("div");
//         toast.textContent = message;
//         toast.setAttribute("role", "status");
//         toast.style.cssText = `background:${bg};color:${fg};border:1px solid ${border};box-shadow:0 16px 36px rgba(15,23,42,.14);border-radius:14px;padding:12px 14px;font:600 14px Inter,system-ui,sans-serif;`;
//         ensureToastHost().appendChild(toast);
//         setTimeout(() => {
//             toast.style.opacity = "0";
//             toast.style.transform = "translateY(6px)";
//             toast.style.transition = "all .2s ease";
//             setTimeout(() => toast.remove(), 220);
//         }, 2600);
//     }

//     window.EMS_Toast = {
//         success: (msg) => showToast(msg, "success"),
//         error: (msg) => showToast(msg, "error"),
//         warning: (msg) => showToast(msg, "warning"),
//         info: (msg) => showToast(msg, "info")
//     };

//     function pageRoot() {
//         const root = emsRoot();
//         if (root === "/") return "/";
//         return root.endsWith("/") ? root : root + "/";
//     }

//     function navTo(key) {
//         const current = window.location.pathname.toLowerCase();
//         let target = roleAwareRoute(key);
//         if (key === "performance" && current.includes("/management/")) target = routeMap["mgmt-performance"];
//         if (key === "attendance" && current.includes("/employee/")) target = routeMap["employee-attendance"];
//         window.location.href = pageRoot() + target;
//     }

//     function initTable(selector, options) {
//         const table = document.querySelector(selector);
//         if (!table) return;
//         const rows = Array.from(table.querySelectorAll("tbody tr"));
//         const search = options && options.searchId ? document.getElementById(options.searchId) : document.querySelector("#list-search-input, input[type='search']");
//         const pageSize = Number(options && options.pageSize) || rows.length || 10;
//         let page = 1;

//         function filteredRows() {
//             const q = (search && search.value || "").trim().toLowerCase();
//             return rows.filter(row => !q || row.textContent.toLowerCase().includes(q));
//         }

//         function render() {
//             const visible = filteredRows();
//             const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
//             page = Math.min(page, totalPages);
//             rows.forEach(row => row.style.display = "none");
//             visible.slice((page - 1) * pageSize, page * pageSize).forEach(row => row.style.display = "");
//         }

//         if (search) search.addEventListener("input", () => { page = 1; render(); });
//         render();
//     }

//     function downloadText(filename, body, type) {
//         const blob = new Blob([body], { type: type || "text/plain;charset=utf-8" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         URL.revokeObjectURL(url);
//     }

//     function tableToCsv() {
//         const rows = Array.from(document.querySelectorAll("table tr"));
//         return rows.map(row => Array.from(row.children).map(cell => {
//             const text = cell.textContent.replace(/\s+/g, " ").trim().replace(/"/g, '""');
//             return `"${text}"`;
//         }).join(",")).join("\n");
//     }

//     function exportCurrentPage(kind) {
//         const title = (document.title || "ems-report").split("|")[0].trim().replace(/[^\w-]+/g, "-").toLowerCase();
//         if (kind === "csv" || document.querySelector("table")) {
//             downloadText(`${title || "ems"}-${Date.now()}.csv`, tableToCsv() || document.body.innerText, "text/csv;charset=utf-8");
//         } else {
//             downloadText(`${title || "ems"}-${Date.now()}.txt`, document.body.innerText);
//         }
//         showToast("Export downloaded", "success");
//     }

//     function openQuickCreate(title, fields, onSave) {
//         const old = document.getElementById("ems-action-modal");
//         if (old) old.remove();
//         const modal = document.createElement("div");
//         modal.id = "ems-action-modal";
//         modal.style.cssText = "position:fixed;inset:0;z-index:99998;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px;";
//         modal.innerHTML = `
//             <div style="width:min(520px,100%);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.25);padding:22px;">
//                 <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
//                     <h2 style="font:800 20px Inter,system-ui,sans-serif;color:#0f172a;margin:0;">${title}</h2>
//                     <button type="button" data-close style="border:0;background:#f1f5f9;border-radius:10px;width:36px;height:36px;cursor:pointer;">x</button>
//                 </div>
//                 <form id="ems-action-form" style="display:grid;gap:12px;">
//                     ${fields.map(field => `
//                         <label style="display:grid;gap:6px;font:600 13px Inter,system-ui,sans-serif;color:#475569;">
//                             ${field.label}
//                             <input name="${field.name}" type="${field.type || "text"}" value="${field.value || ""}" required
//                                 style="border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;font:500 14px Inter,system-ui,sans-serif;">
//                         </label>`).join("")}
//                     <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
//                         <button type="button" data-close style="border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer;">Cancel</button>
//                         <button type="submit" style="border:0;background:#2563eb;color:#fff;border-radius:12px;padding:11px 16px;font-weight:800;cursor:pointer;">Save</button>
//                     </div>
//                 </form>
//             </div>`;
//         document.body.appendChild(modal);
//         modal.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => modal.remove()));
//         modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
//         modal.querySelector("form").addEventListener("submit", e => {
//             e.preventDefault();
//             const data = Object.fromEntries(new FormData(e.currentTarget).entries());
//             if (onSave) onSave(data);
//             modal.remove();
//             showToast(`${title} saved`, "success");
//         });
//         modal.querySelector("input")?.focus();
//     }

//     function applyFilters() {
//         const search = document.querySelector("#list-search-input, #searchInput, input[type='search']");
//         if (search) {
//             search.focus();
//             search.dispatchEvent(new Event("input", { bubbles: true }));
//         }
//         showToast("Filters applied", "info");
//     }

//     function initGenericButtons() {
//         document.querySelectorAll("button").forEach(btn => {
//             if (btn.dataset.emsGenericReady) return;
//             btn.dataset.emsGenericReady = "1";
//             const text = btn.textContent.replace(/\s+/g, " ").trim().toLowerCase();
//             const icon = btn.querySelector(".material-symbols-outlined")?.textContent.trim().toLowerCase();
//             if (icon === "settings") btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); const p=document.getElementById("emsSettingsPanel"); if(p) p.classList.toggle("open"); });
//             if (icon === "help") btn.addEventListener("click", () => showToast("EMS support: contact your administrator.", "info"));
//             if (text.includes("export csv")) btn.addEventListener("click", () => exportCurrentPage("csv"));
//             else if (text.includes("download") || text.includes("export report") || text.includes("download pdf")) btn.addEventListener("click", () => exportCurrentPage("csv"));
//             if (text.includes("filter")) btn.addEventListener("click", applyFilters);
//             if (text === "cancel") btn.addEventListener("click", () => history.length > 1 ? history.back() : showToast("No previous page in this tab", "info"));
//         });
//     }

//     function initProfileSettings() {
//         const panels = Array.from(document.querySelectorAll("main .bg-white.rounded-3xl, main .bg-white.rounded-2xl"));
//         const tabButtons = Array.from(document.querySelectorAll("button")).filter(btn => /personal info|security|documents|notifications/i.test(btn.textContent));
//         tabButtons.forEach((btn, index) => {
//             btn.addEventListener("click", () => {
//                 tabButtons.forEach(b => b.classList.remove("bg-blue-50", "text-primary"));
//                 btn.classList.add("bg-blue-50", "text-primary");
//                 panels.forEach((panel, panelIndex) => {
//                     if (panels.length > 1) panel.style.display = panelIndex === Math.min(index, panels.length - 1) ? "" : "none";
//                 });
//                 showToast(`${btn.textContent.trim()} selected`, "info");
//             });
//         });

//         document.querySelectorAll("button").forEach(btn => {
//             const text = btn.textContent.toLowerCase();
//             if (text.includes("change photo") || text.includes("upload photo")) {
//                 btn.addEventListener("click", () => {
//                     let input = document.getElementById("ems-photo-input");
//                     if (!input) {
//                         input = document.createElement("input");
//                         input.id = "ems-photo-input";
//                         input.type = "file";
//                         input.accept = "image/*";
//                         input.hidden = true;
//                         document.body.appendChild(input);
//                     }
//                     input.onchange = () => showToast("Photo selected", "success");
//                     input.click();
//                 });
//             }
//             if (text.includes("save changes") || text.includes("save preferences")) {
//                 btn.addEventListener("click", () => {
//                     const values = Array.from(document.querySelectorAll("input, textarea, select")).map(el => [el.name || el.type || "field", el.value]);
//                     EMS_STORAGE.set("ems_profile_draft", JSON.stringify(values));
//                     showToast("Changes saved", "success");
//                 });
//             }
//         });
//     }

//     function titleCase(value) {
//         return String(value || "")
//             .toLowerCase()
//             .split(/[_\s-]+/)
//             .filter(Boolean)
//             .map(part => part.charAt(0).toUpperCase() + part.slice(1))
//             .join(" ");
//     }

//     function initials(name, email) {
//         const source = String(name || email || "EMS User").trim();
//         const parts = source.includes("@")
//             ? source.split("@")[0].split(/[._-]+/)
//             : source.split(/\s+/);
//         return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("") || "EU";
//     }

//     function getField(obj, names, fallback) {
//         if (!obj) return fallback;
//         for (const name of names) {
//             if (obj[name] !== undefined && obj[name] !== null && obj[name] !== "") return obj[name];
//         }
//         return fallback;
//     }

//     async function fetchJson(url) {
//         const response = await fetch(url, { headers: Auth.headers() });
//         if (!response.ok) throw new Error(`${response.status} ${url}`);
//         return response.json();
//     }

//     async function fetchEmployees() {
//         const urls = [
//             `${EMS_API.LOGIN}/api/employees`,
//             `${EMS_API.LOGIN}/api/employees/`
//         ];
//         for (const url of urls) {
//             try {
//                 return await fetchJson(url);
//             } catch (_) {}
//         }
//         return [];
//     }

//     async function currentEmployeeProfile() {
//         const cached = window.EMS_CURRENT_PROFILE;
//         if (cached) return cached;

//         const code = Auth.employeeCode();
//         if (!code) return null;

//         try {
//             const profile = await fetchJson(`${EMS_API.LOGIN}/api/portal/profile/${encodeURIComponent(code)}`);
//             if (profile && Object.keys(profile).length) {
//                 window.EMS_CURRENT_PROFILE = profile;
//                 return window.EMS_CURRENT_PROFILE;
//             }
//         } catch (_) {
//             // Fall through to the older endpoints below.
//         }

//         try {
//             const profile = await fetchJson(`${EMS_API.LOGIN}/api/employee-profiles/${encodeURIComponent(code)}`);
//             if (profile && Object.keys(profile).length) {
//                 window.EMS_CURRENT_PROFILE = profile;
//                 return window.EMS_CURRENT_PROFILE;
//             }
//         } catch (_) {
//             // Fall through to dashboard/profile fallbacks.
//         }

//         try {
//             const data = await fetchJson(`${EMS_API.LOGIN}/api/employees/${encodeURIComponent(code)}/dashboard`);
//             window.EMS_CURRENT_PROFILE = data.profile || {};
//             return window.EMS_CURRENT_PROFILE;
//         } catch (err) {
//             try {
//                 const employees = await fetchEmployees();
//                 const match = employees.find(emp => [emp.id, emp.employeeCode, emp.employee_code].includes(code));
//                 window.EMS_CURRENT_PROFILE = match || {};
//                 return window.EMS_CURRENT_PROFILE;
//             } catch (_) {}
//             return {
//                 employeeCode: code,
//                 fullName: Auth.fullName() || Auth.email(),
//                 email: Auth.email(),
//                 role: Auth.role()
//             };
//         }
//     }

//     function profileView(profile) {
//         const role = (Auth.role() || profile?.role || "").toUpperCase();
//         const designation = getField(profile, ["designation", "jobTitle", "position"], titleCase(role));
//         const department = getField(profile, ["department"], (role === "MANAGEMENT" || role === "MANAGER") ? "Management" : role === "EMPLOYEE" ? "Employee" : "HR Administration");
//         const fullName = getField(profile, ["fullName", "full_name", "name"], Auth.fullName() || Auth.email());
//         const employeeCode = getField(profile, ["employeeCode", "employee_code"], Auth.employeeCode());
//         const email = getField(profile, ["email", "username"], Auth.email());
//         return { role, designation, department, fullName, employeeCode, email };
//     }
//     function updateUserHeader(profile) {
//         const view = profileView(profile);
//         const header = document.querySelector("header.fixed, header");
//         if (!header) return;

//         let nameLine = header.querySelector("#header-name");
//         let roleLine = header.querySelector("#header-role");
//         let avatar = header.querySelector("#header-avatar");

//         const userBlocks = Array.from(header.querySelectorAll(".hidden.sm\\:block.text-right, .text-right"))
//             .filter(el => el.querySelector("p"));
//         if (!nameLine && userBlocks.length) {
//             const ps = userBlocks[0].querySelectorAll("p");
//             if (ps[0]) { nameLine = ps[0]; if (!nameLine.id) nameLine.id = "header-name"; }
//             if (ps[1]) { roleLine = ps[1]; if (!roleLine.id) roleLine.id = "header-role"; }
//         }
//         if (!nameLine) {
//             nameLine = Array.from(header.querySelectorAll("p.font-bold, p.text-sm.font-bold"))
//                 .find(p => p.closest(".header-profile, .profile-dropdown, header"));
//             if (nameLine && !nameLine.id) nameLine.id = "header-name";
//         }
//         if (!roleLine) {
//             roleLine = header.querySelector("#header-role")
//                 || Array.from(header.querySelectorAll("p.text-\\[11px\\], p.text-xs")).find(p => p !== nameLine);
//             if (roleLine && !roleLine.id) roleLine.id = "header-role";
//         }
//         if (!avatar) {
//             avatar = Array.from(header.querySelectorAll("div, img"))
//                 .find(el => el.className && el.className.includes("rounded-full") && (el.tagName === "IMG" || /^[A-Z]{1,3}â‚¹/i.test((el.textContent || "").trim())));
//             if (avatar && !avatar.id) avatar.id = "header-avatar";
//         }

//         if (nameLine) {
//             nameLine.textContent = view.fullName;
//             nameLine.setAttribute("data-ems-user", "name");
//         }
//         if (roleLine) {
//             roleLine.textContent = view.designation || titleCase(view.role);
//             roleLine.setAttribute("data-ems-user", "role");
//         }
//         if (avatar) {
//             if (avatar.tagName === "IMG") {
//                 const photo = profile?.photo_url || profile?.photoUrl;
//                 if (photo) {
//                     const origin = EMS_API.LOGIN || window.location.origin;
//                     avatar.src = String(photo).startsWith("http") ? photo : origin + photo;
//                 }
//             } else {
//                 avatar.textContent = initials(view.fullName, view.email);
//             }
//         }

//         EMS_STORAGE.set("ems_fullName", view.fullName);
//         initEmsHeaderSettings(header);
//     }

//     function applyEmsTheme(mode) {
//         const dark = mode === "dark";
//         document.documentElement.classList.toggle("dark", dark);
//         document.body.classList.toggle("ems-dark", dark);
//         document.body.classList.toggle("dark-mode", dark);
//         EMS_STORAGE.set("theme", dark ? "dark" : "light");
//         EMS_STORAGE.set("ems-theme", dark ? "dark" : "light");
//     }

//     function getSavedTheme() {
//         return EMS_STORAGE.get("theme") ||
//             EMS_STORAGE.get("ems-theme") ||
//             localStorage.getItem("theme") ||
//             localStorage.getItem("ems-theme");
//     }

//     function initSavedTheme() {
//         const saved = getSavedTheme();
//         if (saved === "dark") applyEmsTheme("dark");
//         if (saved === "light") applyEmsTheme("light");
//     }

//     function initEmsHeaderSettings(header) {
//         if (!header || header.dataset.emsHeaderReady) return;
//         header.dataset.emsHeaderReady = "1";

//         // Initialize theme from saved preference
//         const saved = getSavedTheme();
//         if (saved === "dark") applyEmsTheme("dark");
//         if (saved === "light") applyEmsTheme("light");

//         // Setup dark mode toggle in profile dropdown
//         const darkModeToggle = document.getElementById("darkModeToggle");
//         if (darkModeToggle) {
//             darkModeToggle.checked = document.body.classList.contains("ems-dark");
//             darkModeToggle.addEventListener("change", () => {
//                 const next = darkModeToggle.checked ? "dark" : "light";
//                 applyEmsTheme(next);
//                 EMS_Toast?.info(next === "dark" ? "Dark theme on" : "Light theme on");
//             });
//         }

//         // Setup language selector in profile dropdown
//         const langSelect = document.getElementById("languageSelect");
//         if (langSelect) {
//             const savedLang = EMS_STORAGE.get("ems-language") || "en";
//             langSelect.value = savedLang;
//             langSelect.addEventListener("change", () => {
//                 EMS_STORAGE.set("ems-language", langSelect.value);
//                 showToast("Language updated", "success");
//             });
//         }
//     }

//     function upgradeHeader(header) {
//         if (!header) return;

//         // Add notification dropdown
//         let notificationBtn = header.querySelector('#notificationBtn');
//         let notificationBadge = header.querySelector('#notificationBadge');
//         let notificationDropdown = header.querySelector('#notificationDropdown');
        
//         if (!notificationBtn) {
//             const notificationIconBtn = Array.from(header.querySelectorAll('button')).find(
//                 b => b.querySelector('.material-symbols-outlined')?.textContent.trim() === 'notifications'
//             );
//             if (notificationIconBtn) {
//                 notificationIconBtn.id = 'notificationBtn';
//                 notificationIconBtn.style.position = 'relative';
                
//                 // Create badge
//                 notificationBadge = document.createElement('span');
//                 notificationBadge.id = 'notificationBadge';
//                 notificationBadge.className = 'ems-notification-badge';
//                 notificationBadge.textContent = '3';
//                 notificationIconBtn.appendChild(notificationBadge);
                
//                 // Create wrapper
//                 const dropdownWrap = document.createElement('div');
//                 dropdownWrap.className = 'ems-notification-wrap';
//                 notificationIconBtn.parentNode.insertBefore(dropdownWrap, notificationIconBtn);
//                 dropdownWrap.appendChild(notificationIconBtn);
                
//                 // Create dropdown panel
//                 notificationDropdown = document.createElement('div');
//                 notificationDropdown.id = 'notificationDropdown';
//                 notificationDropdown.className = 'ems-notification-panel';
//                 notificationDropdown.innerHTML = `
//                     <div class="ems-notif-header">
//                         <p class="ems-notif-title">Notifications</p>
//                         <button class="ems-notif-mark-read" id="markAllReadBtn">Mark all read</button>
//                     </div>
//                     <div class="ems-notif-list" id="notificationList"></div>
//                     <div class="ems-notif-footer">
//                         <a href="#" class="ems-notif-view-all" id="viewAllNotifsBtn">View all notifications</a>
//                     </div>
//                 `;
//                 dropdownWrap.appendChild(notificationDropdown);
//             }
//         }

//         // Initialize settings panel
//         initEmsHeaderSettings(header);

//         // Initialize notification dropdown
//         initNotificationDropdown();
//     }

// function initNotificationDropdown() {
//     // Skip if header.js has already initialized its notification system
//     // to prevent duplicate notification panels
//     if (window.EMS_HEADER_NOTIFICATIONS_INITIALIZED) return;
    
//     // Notification logic has been moved to src/js/header.js
//     // This placeholder remains to prevent errors in upgradeHeader() while
//     // ensuring src/js/header.js takes full responsibility for event binding.
//     console.log("Notification initialization handled by header.js");
// }

// function initProfileDropdown() {
//     // Profile dropdown logic has been moved to src/js/header.js
//     // This placeholder remains to prevent errors in upgradeHeader() while
//     // ensuring src/js/header.js takes full responsibility for event binding.
//     console.log("Profile dropdown initialization handled by header.js");
// }

// window.EMS_refreshHeader = async function EMS_refreshHeader() {
//     // Header refresh logic has been moved to src/js/header.js
//     console.log("Header refresh handled by header.js");
// };

// document.addEventListener("DOMContentLoaded", () => {
//     // The header initialization is now handled by src/js/header.js
//     // This ensures a single source of truth for header functionality.
//     // The upgradeHeader function and related init functions are no longer needed here.
//     console.log("Header initialization delegated to header.js");
// });

// function setMetricValue(labelText, value, subtext) {
//     const cards = Array.from(document.querySelectorAll(".card, section .bg-white, .rounded-3xl"));
//     const card = cards.find(el => (el.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
//     if (!card) return;
//     const valueEl = card.querySelector("h2, h3, h1, p.text-5xl, p.text-4xl, p.text-3xl");
//     if (valueEl && value !== undefined && value !== null) valueEl.textContent = String(value);
//     if (subtext) {
//         const note = Array.from(card.querySelectorAll("p")).find(p => !(p.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
//         if (note) note.textContent = subtext;
//     }
// }

// function statusBadgeClass(status) {
//     const normalized = String(status || "").toLowerCase();
//     if (normalized.includes("approved") || normalized.includes("active") || normalized.includes("complete")) return "bg-emerald-100 text-emerald-700";
//     if (normalized.includes("reject") || normalized.includes("blocked") || normalized.includes("absent")) return "bg-rose-100 text-rose-700";
//     if (normalized.includes("pending") || normalized.includes("late")) return "bg-amber-100 text-amber-700";
//     return "bg-blue-100 text-blue-700";
// }

// function renderBars(container, items, options) {
//     if (!container || !items.length) return;
//     const max = Math.max(...items.map(item => Number(item.value) || 0), 1);
//     container.innerHTML = items.map((item, index) => {
//         const height = Math.max(8, Math.round(((Number(item.value) || 0) / max) * 92));
//         const colors = options?.colors || ["bg-blue-500", "bg-blue-400", "bg-blue-300", "bg-indigo-400", "bg-emerald-400"];
//         return `
//             <div class="flex-1 text-center flex flex-col justify-end min-w-0">
//                 <div class="${colors[index % colors.length]} rounded-t-2xl mx-auto w-12 transition-all" style="height:${height}%"></div>
//                 <p class="mt-3 text-sm font-medium truncate" title="${item.label}">${item.label}</p>
//                 <p class="text-xl font-bold">${item.value}</p>
//             </div>`;
//     }).join("");
// }

// function attendanceRate(summary, report) {
//     const total = Number(summary?.totalEmployees || 0);
//     const present = Number(summary?.presentToday || 0);
//     if (total > 0) return Math.round((present / total) * 100);

//     const latest = Array.isArray(report) && report.length ? report[report.length - 1] : null;
//     if (!latest) return 0;

//     const attended = Number(latest.present || 0) + Number(latest.late || 0) + Number(latest.halfDay || 0);
//     const counted = attended + Number(latest.absent || 0);
//     return counted ? Math.round((attended / counted) * 100) : 0;
// }

// async function hydrateAdminDashboard() {
//     if (!location.pathname.includes("/admin_hr/admin_hr_dashboard/")) return;

//     const [summary, employees, attendanceReport, leaveReport] = await Promise.all([
//         fetchJson(`${EMS_API.HR}/api/dashboard/summary`).catch(() => null),
//         fetchEmployees(),
//         fetchJson(`${EMS_API.HR}/api/reports/attendance`).catch(() => []),
//         fetchJson(`${EMS_API.HR}/api/reports/leave`).catch(() => null)
//     ]);

//     if (summary) {
//         const total = Number(summary.totalEmployees || 0);
//         const present = Number(summary.presentToday || 0);
//         const attendanceRate = total ? `${Math.round((present / total) * 100)}%` : "0%";
//         setMetricValue("Total Employees", total);
//         setMetricValue("Attendance Rate", attendanceRate);
//         setMetricValue("Pending Leaves", leaveReport?.pending ?? 0);
//         setMetricValue("Payroll Status", "Ready", "Current batch ready");
//     }

//     const byDept = {};
//     employees.forEach(emp => {
//         const dept = emp.department || "Unassigned";
//         byDept[dept] = (byDept[dept] || 0) + 1;
//     });
//     const deptItems = Object.entries(byDept).map(([label, value]) => ({ label, value }));
//     const deptChart = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Department Distribution"))
//         ?.closest(".card")
//         ?.querySelector(".h-64");
//     renderBars(deptChart, deptItems);

//     const hireRows = Array.from(employees)
//         .sort((a, b) => String(b.dateOfJoining || b.joinDate || "").localeCompare(String(a.dateOfJoining || a.joinDate || "")))
//         .slice(0, 4);
//     const tbody = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Recent Hires"))
//         ?.closest("section")
//         ?.querySelector("tbody");
//     if (tbody && hireRows.length) {
//         tbody.innerHTML = hireRows.map(emp => `
//             <tr class="hover:bg-slate-50 transition">
//                 <td class="px-6 py-4 font-semibold">${emp.name || emp.fullName || emp.full_name || emp.id}</td>
//                 <td class="px-6 py-4 text-slate-500">${emp.department || "Unassigned"}</td>
//                 <td class="px-6 py-4 text-slate-500">${emp.dateOfJoining || emp.joinDate || "-"}</td>
//                 <td class="px-6 py-4 text-right"><button class="text-blue-600 font-semibold">View</button></td>
//             </tr>`).join("");
//     }

//     if (attendanceReport.length) {
//         const activity = Array.from(document.querySelectorAll("h3"))
//             .find(h => h.textContent.includes("Recent Activity"))
//             ?.closest(".stat-card")
//             ?.querySelector(".space-y-6");
//         if (activity) {
//             const latest = attendanceReport[attendanceReport.length - 1];
//             activity.innerHTML = `
//                 <div class="flex gap-4">
//                     <span class="material-symbols-outlined text-2xl text-primary">fact_check</span>
//                     <div><p><strong>${latest.present}</strong> present on ${latest.date}</p><p class="text-slate-500">${latest.late} late, ${latest.absent} absent</p></div>
//                 </div>
//                 <div class="flex gap-4">
//                     <span class="material-symbols-outlined text-2xl text-amber-600">event_busy</span>
//                     <div><p><strong>${leaveReport?.pending || 0} leave requests</strong> pending</p><p class="text-slate-500">${leaveReport?.approved || 0} approved this cycle</p></div>
//                 </div>`;
//         }
//     }
// }

// async function hydrateManagementDashboard(profile) {
//     if (!location.pathname.includes("/management/management_dashboard/")) return;
//     const view = profileView(profile);
//     const [summary, employees, projects, approvals, reviews, attendanceReport] = await Promise.all([
//         fetchJson(`${EMS_API.HR}/api/dashboard/summary`).catch(() => null),
//         fetchEmployees(),
//         fetchJson(`${EMS_API.MGMT}/api/projects`).catch(() => []),
//         fetchJson(`${EMS_API.MGMT}/api/approvals`).catch(() => []),
//         fetchJson(`${EMS_API.MGMT}/api/performance-reviews`).catch(() => []),
//         fetchJson(`${EMS_API.HR}/api/reports/attendance`).catch(() => [])
//     ]);

//     const welcome = document.querySelector(".p-8 h1.text-4xl, main h1.text-4xl");
//     if (welcome) welcome.textContent = "Management Dashboard";
//     const subtitle = welcome?.parentElement?.querySelector("p");
//     if (subtitle) subtitle.textContent = `Welcome back, ${view.fullName}. Here is the current overview for ${view.department}.`;

//     const rate = attendanceRate(summary, attendanceReport);
//     setMetricValue("Total Employees", Number(summary?.totalEmployees || employees.length));
//     setMetricValue("Attendance Rate", `${rate}%`, `${Number(summary?.presentToday || 0)} present today`);
//     setMetricValue("Open Projects", projects.filter(p => !String(p.status || "").toLowerCase().includes("complete")).length);
//     setMetricValue("Pending Approvals", approvals.filter(a => String(a.status || "").toLowerCase() === "pending").length);

//     const chart = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Team Productivity"))
//         ?.closest(".bg-white")
//         ?.querySelector(".h-72");
//     const reviewItems = reviews.slice(0, 5).map(review => ({
//         label: (review.employeeName || review.employeeId || "Employee").split(" ")[0],
//         value: Number(review.performanceRating || 0) * 20
//     }));
//     const attendanceItems = attendanceReport.slice(-5).map(row => {
//         const attended = Number(row.present || 0) + Number(row.late || 0) + Number(row.halfDay || 0);
//         const counted = attended + Number(row.absent || 0);
//         return {
//             label: String(row.date || "").slice(5) || "Day",
//             value: counted ? Math.round((attended / counted) * 100) : 0
//         };
//     });
//     renderBars(chart, attendanceItems.length ? attendanceItems : reviewItems.length ? reviewItems : [{ label: "No data", value: 0 }], { colors: ["bg-blue-500", "bg-indigo-500", "bg-emerald-500"] });

//     const projectCards = document.getElementById('projectCardsContainer');
//     if (projectCards && projects.length) {
//         projectCards.innerHTML = projects.slice(0, 3).map(project => {
//             const progress = Number(project.progress || 0);
//             const color = progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-600" : "bg-amber-500";
//             return `
//                 <div class="bg-white rounded-3xl border border-slate-200 p-6">
//                     <div class="flex justify-between mb-4"><h4 class="font-bold">${project.name}</h4><span class="text-primary font-bold">${progress}%</span></div>
//                     <div class="h-3 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${color}" style="width:${progress}%"></div></div>
//                     <p class="mt-4 text-sm text-slate-500">${project.status || "Active"} â€¢ ${project.priority || "Normal"} priority</p>
//                 </div>`;
//         }).join("");
//     }

//     const tbody = document.getElementById('teamOverviewTableBody');
//     if (tbody && employees.length) {
//         tbody.innerHTML = employees.slice(0, 5).map(emp => {
//             const name = emp.name || emp.fullName || emp.full_name || emp.id;
//             const perf = reviews.find(r => r.employeeId === emp.id || r.employeeId === emp.employeeCode);
//             const percent = Math.max(20, Number(perf?.performanceRating || 3) * 20);
//             const status = emp.status || "Active";
//             return `
//                 <tr class="border-t hover:bg-slate-50">
//                     <td class="px-6 py-5"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">${initials(name, emp.email)}</div><div><h4 class="font-semibold">${name}</h4><p class="text-sm text-slate-500">${emp.email || ""}</p></div></div></td>
//                     <td class="px-6 py-5">${emp.designation || emp.position || emp.department || "-"}</td>
//                     <td class="px-6 py-5"><span class="px-3 py-1 rounded-full ${statusBadgeClass(status)} text-xs font-semibold">${status}</span></td>
//                     <td class="px-6 py-5"><div class="w-40 h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-primary" style="width:${percent}%"></div></div></td>
//                     <td class="px-6 py-5 text-right"><button><span class="material-symbols-outlined">more_vert</span></button></td>
//                 </tr>`;
//         }).join("");
//     }
// }

// async function hydrateEmployeeDashboard(profile) {
//     if (!location.pathname.includes("/employee/employee_dashboard/")) return;
//     const code = Auth.employeeCode();
//     if (!code) return;
//     const data = await fetchJson(`${EMS_API.LOGIN}/api/employees/${encodeURIComponent(code)}/dashboard`).catch(() => null);

//     const view = profileView((data && data.profile) || profile);

//     // â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//     const heroNameSpan = document.getElementById("emp-welcome-name");
//     if (heroNameSpan) heroNameSpan.textContent = view.fullName;
//     else {
//         const heroH1 = document.querySelector(".p-8 h1.text-4xl, #emp-hero-name");
//         if (heroH1) heroH1.textContent = `Welcome back, ${view.fullName}`;
//     }
//     const subtitle = document.getElementById("emp-hero-subtitle");
//     if (subtitle) subtitle.textContent = `${view.designation} â€¢ ${view.department}`;

//     // Employee ID card
//     const idCard = document.getElementById("emp-id-card");
//     if (idCard) idCard.textContent = view.employeeCode;

//     // Join date
//     const joinEl = document.getElementById("emp-join-date");
//     if (joinEl) {
//         const joined = getField(data && data.profile, ["dateOfJoining", "joinDate", "date_of_joining"], null);
//         if (joined) joinEl.textContent = new Date(joined).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
//     }

//     // â”€â”€ Profile card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//     const profName = document.getElementById("emp-profile-name");
//     if (profName) profName.textContent = view.fullName;
//     const profDesig = document.getElementById("emp-profile-designation");
//     if (profDesig) profDesig.textContent = view.designation;
//     const profDept = document.getElementById("emp-profile-dept");
//     if (profDept) profDept.textContent = view.department;
//     const profAvatar = document.getElementById("emp-profile-avatar");
//     if (profAvatar) {
//         const photoUrl = data && data.profile && (data.profile.photo_url || data.profile.photoUrl);
//         if (photoUrl) {
//             const img = document.createElement("img");
//             img.src = String(photoUrl).startsWith("http") ? photoUrl : (EMS_API.LOGIN + photoUrl);
//             img.className = "w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg";
//             profAvatar.replaceWith(img);
//         } else {
//             profAvatar.textContent = initials(view.fullName, view.email);
//         }
//     }

//     if (!data) return;

//     // â”€â”€ Leave balance cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//     const balance = data.leaveBalance || {};
//     const leaveMap = [
//         ["annual", Number(balance.annual_leave || 0), Number(balance.used_annual || 0)],
//         ["sick",   Number(balance.sick_leave   || 0), Number(balance.used_sick    || 0)],
//         ["casual", Number(balance.casual_leave  || 0), Number(balance.used_casual  || 0)]
//     ];
//     leaveMap.forEach(([key, total, used]) => {
//         const remaining = Math.max(0, total - used);
//         const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
//         const countEl = document.getElementById(`leave-${key}-count`);
//         const subEl   = document.getElementById(`leave-${key}-sub`);
//         const barEl   = document.getElementById(`leave-${key}-bar`);
//         if (countEl) countEl.textContent = remaining;
//         if (subEl)   subEl.textContent   = `${used} used of ${total}`;
//         if (barEl)   barEl.style.width   = `${pct}%`;
//         // Fallback: text-content matcher
//         if (!countEl) {
//             const label = key === "annual" ? "Annual Leave" : key === "sick" ? "Sick Leave" : "Casual Leave";
//             const card = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes(label))?.closest(".bg-white");
//             if (!card) return;
//             const h2 = card.querySelector("h2");
//             if (h2) h2.textContent = String(remaining);
//             const p = card.querySelector("p.text-slate-500");
//             if (p) p.textContent = `${used} used of ${total}`;
//             const fill = card.querySelector(".progress-fill");
//             if (fill) fill.style.width = `${pct}%`;
//         }
//     });

//     const tasksBox = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Priority Tasks"))?.closest(".bg-white")?.querySelector(".divide-y");
//     if (tasksBox && data.tasks?.length) {
//         tasksBox.innerHTML = data.tasks.map(task => {
//             const progress = Number(task.progress_percent || task.progress || 0);
//             return `
//                 <div class="p-8 flex flex-col lg:flex-row justify-between gap-6">
//                     <div class="flex gap-5"><div class="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">task</span></div><div><h4 class="font-bold text-lg">${task.title || task.task_name || "Task"}</h4><p class="text-slate-500 mt-1">${task.due_date || "No due date"} â€¢ ${task.status || "Open"}</p></div></div>
//                     <div class="w-full lg:w-72"><div class="flex justify-between text-sm mb-2 font-semibold"><span>Progress</span><span>${progress}%</span></div><div class="progress-bar"><div class="progress-fill bg-primary" style="width:${progress}%"></div></div></div>
//                 </div>`;
//         }).join("");
//     }

//     const feedbackBox = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Manager Feedback"))?.closest(".bg-white")?.querySelector(".p-8.space-y-8");
//     if (feedbackBox && data.feedback?.length) {
//         feedbackBox.innerHTML = data.feedback.map(item => `
//             <div class="relative pl-8 border-l-2 border-blue-200">
//                 <div class="absolute -left-[10px] top-0 w-5 h-5 rounded-full bg-primary border-4 border-white"></div>
//                 <div class="flex items-center justify-between mb-2"><span class="text-xs uppercase tracking-widest font-bold text-primary">${item.review_period || "Feedback"}</span><span class="text-xs text-slate-400">${item.review_date || ""}</span></div>
//                 <h4 class="font-bold">${item.manager_name || item.reviewer_name || "Manager"}</h4>
//                 <p class="text-sm text-slate-500 mb-3">Rating ${item.rating_score || item.rating || "-"}</p>
//                 <p class="italic text-slate-600 leading-relaxed">"${item.feedback || item.overall_comments || item.comments || "No comment"}"</p>
//             </div>`).join("");
//     }
// }

// async function hydrateReportsDashboard() {
//     if (!location.pathname.includes("/admin_hr/reports_dashboard/")) return;

//     const [employees, attendanceReport, leaveReport] = await Promise.all([
//         fetchEmployees(),
//         fetchJson(`${EMS_API.HR}/api/reports/attendance`).catch(() => []),
//         fetchJson(`${EMS_API.HR}/api/reports/leave`).catch(() => null)
//     ]);

//     setMetricValue("Turnover Rate", "0%", "Based on active employee records");
//     setMetricValue("Training Completion", `${Math.max(0, 100 - Number(leaveReport?.pending || 0))}%`);
//     setMetricValue("Diversity Index", new Set(employees.map(emp => emp.department).filter(Boolean)).size || 0, "departments represented");

//     const headcountBox = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Headcount Trend"))
//         ?.parentElement
//         ?.querySelector(".h-80");
//     const byMonth = {};
//     employees.forEach(emp => {
//         const month = String(emp.dateOfJoining || emp.joinDate || "").slice(0, 7) || "Unknown";
//         byMonth[month] = (byMonth[month] || 0) + 1;
//     });
//     renderBars(headcountBox, Object.entries(byMonth).slice(-12).map(([label, value]) => ({ label, value })));

//     const performanceBox = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Department Performance"))
//         ?.parentElement
//         ?.querySelector(".h-80");
//     const latest = attendanceReport.length ? attendanceReport[attendanceReport.length - 1] : null;
//     const present = Number(latest?.present || 0) + Number(latest?.late || 0) + Number(latest?.halfDay || 0);
//     const deptCounts = {};
//     employees.forEach(emp => {
//         const dept = emp.department || "Unassigned";
//         deptCounts[dept] = (deptCounts[dept] || 0) + 1;
//     });
//     const deptItems = Object.entries(deptCounts).map(([label, count]) => ({
//         label,
//         value: employees.length ? Math.round((present / employees.length) * 100) : count
//     }));
//     renderBars(performanceBox, deptItems.length ? deptItems : [{ label: "No data", value: 0 }], { colors: ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-amber-400"] });
// }

// async function hydrateTeamAnalytics() {
//     if (!location.pathname.includes("/management/team_analytics/")) return;

//     const [projects, reviews] = await Promise.all([
//         fetchJson(`${EMS_API.MGMT}/api/projects`).catch(() => []),
//         fetchJson(`${EMS_API.MGMT}/api/performance-reviews`).catch(() => [])
//     ]);

//     const trendBox = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Performance Trend"))
//         ?.parentElement
//         ?.querySelector(".h-80");
//     const trendItems = reviews.slice(-6).map(review => ({
//         label: String(review.reviewDate || review.reviewPeriod || review.employeeName || "Review").slice(0, 10),
//         value: Math.round(Number(review.performanceRating || 0) * 20)
//     }));
//     renderBars(trendBox, trendItems.length ? trendItems : [{ label: "No reviews", value: 0 }], { colors: ["bg-blue-500", "bg-indigo-500", "bg-emerald-500"] });

//     const workloadBox = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Workload Distribution"))
//         ?.parentElement
//         ?.querySelector(".h-80");
//     const workloadItems = projects.slice(0, 6).map(project => ({
//         label: project.name || project.projectName || "Project",
//         value: Array.isArray(project.teamMembers) ? project.teamMembers.length : Number(project.teamSize || 1)
//     }));
//     renderBars(workloadBox, workloadItems.length ? workloadItems : [{ label: "No projects", value: 0 }], { colors: ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-amber-400"] });

//     const performers = Array.from(document.querySelectorAll("h3"))
//         .find(h => h.textContent.includes("Top Performers"))
//         ?.parentElement
//         ?.querySelector(".grid");
//     if (performers && reviews.length) {
//         performers.innerHTML = reviews
//             .slice()
//             .sort((a, b) => Number(b.performanceRating || 0) - Number(a.performanceRating || 0))
//             .slice(0, 3)
//             .map(review => `
//                 <div class="border border-slate-200 rounded-3xl p-6 text-center">
//                     <p class="font-medium">${review.employeeName || review.employeeId || "Employee"}</p>
//                     <p class="text-emerald-600 text-3xl font-bold mt-2">${review.performanceRating || "-"}</p>
//                     <p class="text-xs text-slate-500">${review.reviewPeriod || "Latest review"}</p>
//                 </div>`)
//             .join("");
//     }
// }

// async function hydratePageData() {
//     if (!Auth.isLoggedIn()) return;
//     const profile = await currentEmployeeProfile();
//     // updateUserHeader(profile); // Handled by header.js
//     await Promise.allSettled([
//         hydrateAdminDashboard(),
//         hydrateManagementDashboard(profile),
//         hydrateEmployeeDashboard(profile),
//         hydrateEmployeeDashboardPay(),
//         hydrateReportsDashboard(),
//         hydrateTeamAnalytics(),
//         hydratePayrollPage(),
//         hydrateSalarySlipsPage(),
//         hydrateApprovalsPage()
//     ]);
// }

// window.EMS_Toast = {
//     success: msg => showToast(msg, "success"),
//     error: msg => showToast(msg, "error"),
//     warning: msg => showToast(msg, "warning"),
//     info: msg => showToast(msg, "info")
// };
// window.EMS_Table = { init: initTable };
// window.EMS_Form = {
//     setLoading(button, loading) {
//         if (!button) return;
//         if (loading) {
//             button.dataset.originalHtml = button.dataset.originalHtml || button.innerHTML;
//             button.disabled = true;
//             button.innerHTML = "Working...";
//         } else {
//             button.disabled = false;
//             if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
//         }
//     }
// };
// window.EMS_setStatus = (badge, status) => {
//     if (!badge) return;
//     const label = String(status || "").replace(/-/g, " ");
//     badge.textContent = label.charAt(0).toUpperCase() + label.slice(1);
//     badge.className = badge.className
//         .replace(/bg-\S+/g, "")
//         .replace(/text-\S+/g, "")
//         .trim();
//     const styles = {
//         approved: "bg-emerald-100 text-emerald-700",
//         rejected: "bg-rose-100 text-rose-700",
//         pending: "bg-amber-100 text-amber-700",
//         completed: "bg-emerald-100 text-emerald-700"
//     };
//     badge.className = `${badge.className} ${styles[status] || "bg-blue-100 text-blue-700"}`.trim();
// };
// window.EMS_navTo = navTo;
// window.EMS_ConfirmDelete = (message, onConfirm) => {
//     if (window.confirm(message || "Are you sure?") && onConfirm) onConfirm();
// };
// window.EMS_openQuickCreate = openQuickCreate;
// window.EMS_exportCurrentPage = exportCurrentPage;
// window.EMS_applyFilters = applyFilters;

// function formatINR(amount) {
//     const n = Number(amount);
//     if (!Number.isFinite(n)) return "â‚¹0";
//     return new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//         maximumFractionDigits: 0
//     }).format(n);
// }

// async function hydratePayrollPage() {
//     if (!location.pathname.includes("/admin_hr/payroll_page/")) return;
//     const month = new Date().toISOString().slice(0, 7);
//     const [payslips, summary] = await Promise.all([
//         fetchJson(`${EMS_API.HR}/api/payroll?month=${month}`).catch(() => []),
//         fetchJson(`${EMS_API.HR}/api/payroll/summary?month=${month}`).catch(() => null)
//     ]);
//     if (summary) {
//         setMetricValue("Total Payroll", formatINR(summary.total_gross || summary.totalGross));
//         setMetricValue("Total Deductions", formatINR(summary.total_deductions || summary.totalDeductions));
//         setMetricValue("Net Disbursement", formatINR(summary.total_net || summary.totalNet));
//     }
//     const tbody = document.querySelector("table tbody");
//     if (tbody && Array.isArray(payslips) && payslips.length) {
//         tbody.innerHTML = payslips.map(ps => {
//             const gross = Number(ps.basicSalary || 0) + Number(ps.hra || 0) + Number(ps.allowances || 0);
//             const ded = Number(ps.deductions || 0);
//             const net = Number(ps.netSalary || 0);
//             return `<tr class="hover:bg-slate-50 transition cursor-pointer">
//                 <td class="px-6 py-4 font-semibold">${ps.employeeName || ps.employeeId}</td>
//                 <td class="px-6 py-4 text-slate-500">${ps.department || "-"}</td>
//                 <td class="px-6 py-4 text-slate-600 font-medium">${formatINR(gross)}</td>
//                 <td class="px-6 py-4 text-error font-medium">-${formatINR(ded).replace("â‚¹", "â‚¹")}</td>
//                 <td class="px-6 py-4 text-right font-bold text-slate-900">${formatINR(net)}</td>
//                 <td class="px-6 py-4 text-right"><span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Paid</span></td>
//             </tr>`;
//         }).join("");
//     }
// }

// async function hydrateSalarySlipsPage() {
//     if (!location.pathname.includes("/employee/salary_slips/")) return;
//     const code = Auth.employeeCode();
//     if (!code) return;
//     const month = new Date().toISOString().slice(0, 7);
//     const slips = await fetchJson(`${EMS_API.HR}/api/payroll/${encodeURIComponent(code)}?month=${month}`).catch(() => null);
//     const list = await fetchJson(`${EMS_API.HR}/api/payroll?month=${month}`).catch(() => []);
//     const mine = slips || (Array.isArray(list) ? list.find(p => p.employeeId === code) : null);
//     if (!mine) return;
//     const gross = Number(mine.basicSalary || 0) + Number(mine.hra || 0) + Number(mine.allowances || 0);
//     const ded = Number(mine.deductions || 0);
//     const net = Number(mine.netSalary || 0);
//     setMetricValue("Gross Salary", formatINR(gross));
//     setMetricValue("Total Deductions", formatINR(ded));
//     setMetricValue("Net Pay", formatINR(net));
//     const hero = document.querySelector('[data-ems-pay="net"], h1.text-5xl.font-black');
//     if (hero) hero.textContent = formatINR(net);
// }

// async function hydrateEmployeeDashboardPay() {
//     if (!location.pathname.includes("/employee/employee_dashboard/")) return;
//     const code = Auth.employeeCode();
//     if (!code) return;
//     const month = new Date().toISOString().slice(0, 7);
//     const slip = await fetchJson(`${EMS_API.HR}/api/payroll/${encodeURIComponent(code)}?month=${month}`).catch(() => null);
//     if (!slip) return;
//     const net = Number(slip.netSalary || slip.net_salary || 0);
//     // Try ID first, then fallback
//     const netEl = document.getElementById("emp-net-salary") || document.querySelector("[data-ems-pay='net']");
//     if (netEl) netEl.textContent = formatINR(net);
//     const dateEl = document.getElementById("emp-pay-date");
//     if (dateEl) {
//         const paidOn = slip.paymentDate || slip.payment_date || slip.payPeriod || month;
//         dateEl.textContent = `Paid on ${new Date(paidOn).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;
//     }
// }

// async function hydrateApprovalsPage() {
//     if (!location.pathname.includes("/management/approvals/")) return;
//     const approvals = await fetchJson(`${EMS_API.MGMT}/api/approvals`).catch(() => []);
//     const tbody = document.querySelector("table tbody");
//     if (!tbody || !approvals.length) return;
//     tbody.innerHTML = approvals.slice(0, 10).map(a => `
//         <tr class="hover:bg-slate-50">
//             <td class="px-8 py-6 font-semibold">${a.requestId || a.request_id || "-"}</td>
//             <td class="px-8 py-6">${a.requestType || a.request_type || "-"}</td>
//             <td class="px-8 py-6 text-slate-600">${Number(a.amount) ? formatINR(a.amount) : "-"} - ${a.description || ""}</td>
//             <td class="px-8 py-6"><span class="px-3 py-1 rounded-full ${statusBadgeClass(a.status)} text-xs font-semibold">${a.status || "Pending"}</span></td>
//         </tr>`).join("");
// }

// window.formatINR = formatINR;

// document.addEventListener("DOMContentLoaded", () => {
//     initGenericButtons();
//     initProfileSettings();
//     // Header initialization is now handled by src/js/header.js
//     hydratePageData();
// });
// })();