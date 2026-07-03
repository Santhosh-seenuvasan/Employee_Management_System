/* ================================================================
   EMS UTILS.JS  — Shared across ALL pages
   Covers: Toast · Modal · Profile Dropdown · Help · Notifications
           Form Validation · Table (sort/search/filter/paginate)
           Approve/Reject · Delete Confirm · Download · Print
           Card Clicks · KPI Navigation · Topbar wiring
   ================================================================ */

// ── 1. TOAST ────────────────────────────────────────────────────
const EMS_Toast = (() => {
  let container;

  function _ensure() {
    if (container) return;
    container = document.createElement("div");
    container.id = "ems-toast-container";
    container.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(container);
  }

  const icons = { success: "check_circle", error: "cancel",
                  warning: "warning", info: "info" };
  const colors = {
    success: "bg-emerald-600", error: "bg-red-600",
    warning: "bg-amber-500",  info:  "bg-blue-600"
  };

  function show(message, type = "success", duration = 3000) {
    _ensure();
    const toast = document.createElement("div");
    toast.className =
      `${colors[type]} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3
       text-sm font-medium max-w-xs opacity-0 translate-x-4 transition-all duration-300`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-base">${icons[type]}</span>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-auto opacity-70 hover:opacity-100">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove("opacity-0", "translate-x-4");
      });
    });
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-x-4");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return { show,
    success: (m, d) => show(m, "success", d),
    error:   (m, d) => show(m, "error",   d),
    warning: (m, d) => show(m, "warning", d),
    info:    (m, d) => show(m, "info",    d)
  };
})();

window.EMS_Toast = EMS_Toast;


// ── 2. MODAL ────────────────────────────────────────────────────
const EMS_Modal = (() => {
  let activeModal = null;

  function _trapFocus(el) {
    const focusable = el.querySelectorAll(
      'a,button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    el._trapHandler = e => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    };
    el.addEventListener("keydown", el._trapHandler);
    first.focus();
  }

  function open(modalId) {
    const modal = typeof modalId === "string"
      ? document.getElementById(modalId) : modalId;
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    activeModal = modal;
    _trapFocus(modal);
  }

  function close(modalId) {
    const modal = typeof modalId === "string"
      ? document.getElementById(modalId) : (modalId || activeModal);
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    if (modal._trapHandler) modal.removeEventListener("keydown", modal._trapHandler);
    activeModal = null;
  }

  // ESC closes active modal
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && activeModal) close(activeModal);
  });

  // Backdrop click closes
  document.addEventListener("click", e => {
    if (activeModal && e.target === activeModal) close(activeModal);
  });

  return { open, close };
})();

window.EMS_Modal = EMS_Modal;


// ── 3. CONFIRM DELETE MODAL ──────────────────────────────────────
function EMS_ConfirmDelete(message, onConfirm) {
  let overlay = document.getElementById("ems-confirm-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "ems-confirm-overlay";
    overlay.className =
      "fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden";
    overlay.innerHTML = `
      <div id="ems-confirm-box"
           class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-red-600 text-3xl">delete</span>
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">Confirm Delete</h3>
        <p id="ems-confirm-msg" class="text-slate-500 text-sm mb-6"></p>
        <div class="flex gap-3">
          <button id="ems-confirm-cancel"
            class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700
                   font-medium hover:bg-slate-50 transition">Cancel</button>
          <button id="ems-confirm-ok"
            class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium
                   hover:bg-red-700 transition">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById("ems-confirm-cancel").onclick = () => {
      overlay.classList.add("hidden");
    };
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  }

  document.getElementById("ems-confirm-msg").textContent =
    message || "Are you sure you want to delete this? This action cannot be undone.";

  overlay.classList.remove("hidden");

  const okBtn = document.getElementById("ems-confirm-ok");
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.onclick = () => {
    overlay.classList.add("hidden");
    if (typeof onConfirm === "function") onConfirm();
  };
}

window.EMS_ConfirmDelete = EMS_ConfirmDelete;


// ── 4. HELP MODAL ───────────────────────────────────────────────
function EMS_initHelp() {
  let helpModal = document.getElementById("ems-help-modal");
  if (!helpModal) {
    helpModal = document.createElement("div");
    helpModal.id = "ems-help-modal";
    helpModal.className =
      "fixed inset-0 z-[9997] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden";
    helpModal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-600">help</span>
            Help & Support
          </h3>
          <button id="ems-help-close"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
            <span class="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>
        <div class="space-y-4 text-sm">
          <a href="#" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
            <span class="material-symbols-outlined text-blue-500 group-hover:scale-110 transition">menu_book</span>
            <div><p class="font-semibold text-slate-800">Documentation</p>
              <p class="text-slate-500">Browse full EMS user guide</p></div>
          </a>
          <a href="#" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
            <span class="material-symbols-outlined text-emerald-500 group-hover:scale-110 transition">support_agent</span>
            <div><p class="font-semibold text-slate-800">Contact Support</p>
              <p class="text-slate-500">Reach our HR support team</p></div>
          </a>
          <a href="#" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition group">
            <span class="material-symbols-outlined text-amber-500 group-hover:scale-110 transition">live_help</span>
            <div><p class="font-semibold text-slate-800">FAQs</p>
              <p class="text-slate-500">Frequently asked questions</p></div>
          </a>
        </div>
        <p class="mt-6 text-xs text-slate-400 text-center">EMS v2.0 · support@hrpulse.io</p>
      </div>`;
    document.body.appendChild(helpModal);
    document.getElementById("ems-help-close").onclick = () =>
      helpModal.classList.add("hidden");
    helpModal.addEventListener("click", e => {
      if (e.target === helpModal) helpModal.classList.add("hidden");
    });
  }

  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "help") {
      btn.addEventListener("click", () => helpModal.classList.remove("hidden"));
    }
  });
}


// ── 5. NOTIFICATIONS PANEL ──────────────────────────────────────
function EMS_initNotifications() {
  let panel = document.getElementById("ems-notif-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "ems-notif-panel";
    panel.className =
      "fixed top-16 right-4 z-[9996] w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 hidden";
    panel.innerHTML = `
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h4 class="font-bold text-slate-900">Notifications</h4>
        <button id="ems-notif-close" class="text-xs text-blue-600 font-semibold hover:underline">
          Mark all read</button>
      </div>
      <div class="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        <div class="p-4 flex gap-3 hover:bg-slate-50 transition cursor-pointer">
          <span class="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
          <div class="text-sm"><p class="font-medium text-slate-800">Leave request approved</p>
            <p class="text-slate-500 text-xs mt-0.5">Your annual leave for Jun 20 was approved.</p></div>
        </div>
        <div class="p-4 flex gap-3 hover:bg-slate-50 transition cursor-pointer">
          <span class="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
          <div class="text-sm"><p class="font-medium text-slate-800">Payroll processing</p>
            <p class="text-slate-500 text-xs mt-0.5">June payroll disbursement in 3 days.</p></div>
        </div>
        <div class="p-4 flex gap-3 hover:bg-slate-50 transition cursor-pointer">
          <span class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
          <div class="text-sm"><p class="font-medium text-slate-800">New employee onboarded</p>
            <p class="text-slate-500 text-xs mt-0.5">Marcus Wright joined Engineering.</p></div>
        </div>
      </div>
      <div class="p-3 border-t border-slate-100 text-center">
        <a class="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
           onclick="EMS_navTo('notifications')">View all notifications</a>
      </div>`;
    document.body.appendChild(panel);

    document.getElementById("ems-notif-close").onclick = () => {
      panel.querySelectorAll(".w-2.h-2.rounded-full:not(.bg-slate-300)").forEach(dot => {
        dot.classList.remove("bg-blue-500", "bg-amber-500");
        dot.classList.add("bg-slate-300");
      });
      EMS_Toast.info("All notifications marked as read");
    };

    document.addEventListener("click", e => {
      if (!panel.contains(e.target) && !e.target.closest("[data-notif-btn]"))
        panel.classList.add("hidden");
    });
  }

  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "notifications") {
      btn.setAttribute("data-notif-btn", "1");
      btn.addEventListener("click", e => {
        e.stopPropagation();
        panel.classList.toggle("hidden");
      });
    }
  });
}


// ── 6. PROFILE DROPDOWN ─────────────────────────────────────────
function EMS_initProfileDropdown() {
  const profileWrap = document.querySelector(".w-10.h-10.rounded-full.bg-blue-100");
  if (!profileWrap) return;

  const wrapper = profileWrap.closest(".flex.items-center.gap-3") ||
                  profileWrap.parentElement;
  if (!wrapper) return;

  wrapper.style.position = "relative";
  wrapper.style.cursor   = "pointer";

  let dropdown = document.getElementById("ems-profile-drop");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "ems-profile-drop";
    dropdown.className =
      "absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 hidden z-[9995]";

    const path   = window.location.pathname.toLowerCase();
    const isEmp  = path.includes("/employee/");
    const isMgr  = path.includes("/management/");
    const prefix = isEmp ? "../../employee/" : isMgr ? "../../management/" : "../../admin_hr/";
    const profileHref  = prefix + "profile_settings/code.html";
    const notifHref    = isEmp ? "../../employee/notifications/code.html" : "#";

    dropdown.innerHTML = `
      <div class="p-4 border-b border-slate-100">
        <p class="font-bold text-slate-900 text-sm">Alex Rivera</p>
        <p class="text-xs text-slate-500">HR Manager</p>
      </div>
      <div class="p-2">
        <a href="${profileHref}"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700">
          <span class="material-symbols-outlined text-base text-slate-500">person</span>My Profile</a>
        <a href="${profileHref}"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700">
          <span class="material-symbols-outlined text-base text-slate-500">settings</span>Settings</a>
        <a href="${notifHref}"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700">
          <span class="material-symbols-outlined text-base text-slate-500">notifications</span>Notifications</a>
      </div>
      <div class="p-2 border-t border-slate-100">
        <a href="../../authentication/unified_login_portal/code.html"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition text-sm font-medium text-red-600">
          <span class="material-symbols-outlined text-base">logout</span>Logout</a>
      </div>`;
    wrapper.appendChild(dropdown);

    wrapper.addEventListener("click", e => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", () => dropdown.classList.add("hidden"));
  }
}


// ── 7. SETTINGS BUTTON → profile page ───────────────────────────
function EMS_initSettings() {
  const path  = window.location.pathname.toLowerCase();
  const isEmp = path.includes("/employee/");
  const isMgr = path.includes("/management/");
  const href  = isEmp ? "../../employee/profile_settings/code.html"
              : isMgr ? "../../admin_hr/profile_settings/code.html"
              :         "../../admin_hr/profile_settings/code.html";

  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "settings") {
      btn.addEventListener("click", () => { window.location.href = href; });
    }
  });
}


// ── 8. FORM VALIDATION ──────────────────────────────────────────
const EMS_Form = {
  validate(formEl) {
    let valid = true;
    formEl.querySelectorAll("[required]").forEach(field => {
      const err = document.getElementById(field.id + "-err") ||
                  field.parentElement.querySelector(".field-error");
      const val = field.value.trim();
      if (!val) {
        field.classList.add("border-red-400", "focus:ring-red-400");
        if (err) err.classList.remove("hidden");
        valid = false;
      } else {
        field.classList.remove("border-red-400", "focus:ring-red-400");
        if (err) err.classList.add("hidden");
      }
    });
    // email fields
    formEl.querySelectorAll('input[type="email"]').forEach(field => {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (field.value && !emailRx.test(field.value)) {
        field.classList.add("border-red-400");
        valid = false;
      }
    });
    return valid;
  },

  setLoading(btn, loading) {
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.disabled  = true;
      btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-white
        border-t-transparent rounded-full animate-spin mr-2"></span>Saving…`;
    } else {
      btn.disabled  = false;
      btn.innerHTML = btn._origText || btn.innerHTML;
    }
  }
};

window.EMS_Form = EMS_Form;


// ── 9. TABLE UTILITIES ──────────────────────────────────────────
const EMS_Table = {
  PAGE_SIZE: 10,

  init(tableId, options = {}) {
    const table = document.getElementById(tableId) ||
                  document.querySelector(tableId);
    if (!table) return;

    const pageSize = options.pageSize || this.PAGE_SIZE;
    const tbody    = table.querySelector("tbody");
    const ths      = table.querySelectorAll("thead th");
    if (!tbody) return;

    // State
    let allRows   = Array.from(tbody.querySelectorAll("tr"));
    let filtered  = [...allRows];
    let sortCol   = -1;
    let sortAsc   = true;
    let page      = 1;

    // Sort on header click
    ths.forEach((th, i) => {
      th.style.cursor = "pointer";
      th.setAttribute("aria-sort", "none");
      th.addEventListener("click", () => {
        if (sortCol === i) sortAsc = !sortAsc;
        else { sortCol = i; sortAsc = true; }
        ths.forEach(t => t.setAttribute("aria-sort", "none"));
        th.setAttribute("aria-sort", sortAsc ? "ascending" : "descending");
        filtered.sort((a, b) => {
          const av = a.cells[i]?.textContent.trim().toLowerCase() || "";
          const bv = b.cells[i]?.textContent.trim().toLowerCase() || "";
          return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        page = 1;
        render();
      });
    });

    // Filter / Search
    const search = options.searchId
      ? document.getElementById(options.searchId)
      : document.querySelector('[id*="search"]');

    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.toLowerCase().trim();
        filtered = allRows.filter(r => r.textContent.toLowerCase().includes(q));
        page = 1;
        render();
      });
    }

    // Pagination container
    let paginationEl = options.paginationId
      ? document.getElementById(options.paginationId)
      : null;

    if (!paginationEl) {
      paginationEl = document.createElement("div");
      paginationEl.className =
        "flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm";
      table.closest("section, div, .card")?.appendChild(paginationEl);
    }

    function render() {
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      page = Math.min(page, pages);

      // Show / hide rows
      allRows.forEach(r => (r.style.display = "none"));
      const start = (page - 1) * pageSize;
      filtered.slice(start, start + pageSize).forEach(r => (r.style.display = ""));

      // Empty state
      let emptyRow = tbody.querySelector(".ems-empty-row");
      if (filtered.length === 0) {
        if (!emptyRow) {
          emptyRow = document.createElement("tr");
          emptyRow.className = "ems-empty-row";
          emptyRow.innerHTML = `
            <td colspan="${ths.length}" class="py-12 text-center text-slate-400">
              <span class="material-symbols-outlined text-4xl block mb-2">inbox</span>
              No records found
            </td>`;
          tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = "";
      } else if (emptyRow) {
        emptyRow.style.display = "none";
      }

      // Pagination UI
      const info = `Showing ${total ? start + 1 : 0}–${Math.min(start + pageSize, total)} of ${total}`;
      const btns = [];
      for (let i = 1; i <= pages; i++) {
        btns.push(`<button data-page="${i}"
          class="w-8 h-8 rounded-lg text-xs font-semibold transition
          ${i === page
            ? "bg-primary text-white"
            : "text-slate-600 hover:bg-slate-100"}">${i}</button>`);
      }
      paginationEl.innerHTML = `
        <span class="text-slate-500">${info}</span>
        <div class="flex gap-1">
          <button data-page="${page - 1}" ${page === 1 ? "disabled" : ""}
            class="w-8 h-8 rounded-lg hover:bg-slate-100 transition disabled:opacity-30">
            <span class="material-symbols-outlined text-sm">chevron_left</span></button>
          ${btns.join("")}
          <button data-page="${page + 1}" ${page === pages ? "disabled" : ""}
            class="w-8 h-8 rounded-lg hover:bg-slate-100 transition disabled:opacity-30">
            <span class="material-symbols-outlined text-sm">chevron_right</span></button>
        </div>`;

      paginationEl.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
          const p = parseInt(btn.dataset.page);
          if (p >= 1 && p <= pages) { page = p; render(); }
        });
      });
    }

    // Refresh when rows change
    this._refresh = () => {
      allRows  = Array.from(tbody.querySelectorAll("tr:not(.ems-empty-row)"));
      filtered = [...allRows];
      page     = 1;
      render();
    };

    render();
    return this;
  }
};

window.EMS_Table = EMS_Table;


// ── 10. STATUS BADGE HELPER ─────────────────────────────────────
function EMS_setStatus(badge, status) {
  const map = {
    approved: "bg-emerald-100 text-emerald-700",
    active:   "bg-emerald-100 text-emerald-700",
    pending:  "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    inactive: "bg-slate-100 text-slate-600"
  };
  badge.className = badge.className
    .replace(/bg-\w+-\d+\s*/g, "")
    .replace(/text-\w+-\d+\s*/g, "")
    .trim();
  const cls = map[status.toLowerCase()] || map.pending;
  cls.split(" ").forEach(c => badge.classList.add(c));
  badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

window.EMS_setStatus = EMS_setStatus;


// ── 11. APPROVE / REJECT WIRING (global delegation) ─────────────
function EMS_initApproveReject() {
  document.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const text = btn.textContent.trim().toLowerCase();

    if (text === "approve") {
      const row = btn.closest("tr, .card, li");
      const badge = row?.querySelector("[class*='badge'], [class*='status'], .status-badge, span[class*='bg-']");
      if (badge) EMS_setStatus(badge, "approved");
      btn.closest(".flex.gap")?.querySelectorAll("button").forEach(b => b.remove());
      EMS_Toast.success("Request approved successfully");
    }

    if (text === "decline" || text === "reject") {
      const row = btn.closest("tr, .card, li");
      const badge = row?.querySelector("[class*='badge'], [class*='status'], .status-badge, span[class*='bg-']");
      if (badge) EMS_setStatus(badge, "rejected");
      btn.closest(".flex.gap")?.querySelectorAll("button").forEach(b => b.remove());
      EMS_Toast.error("Request declined");
    }
  });
}


// ── 12. DOWNLOAD / PRINT WIRING ──────────────────────────────────
function EMS_initDownloadPrint() {
  document.addEventListener("click", e => {
    const btn = e.target.closest("button, a");
    if (!btn) return;
    const text = btn.textContent.trim().toLowerCase();

    if (text.includes("print")) {
      window.print();
      return;
    }

    const isDownload =
      text.includes("download") || text.includes("export") ||
      text.includes("export csv") || text.includes("export pdf") ||
      btn.querySelector?.(".material-symbols-outlined")?.textContent.trim() === "download";

    if (isDownload && !btn.href) {
      EMS_Toast.success("Download started");
    }
  });
}


// ── 13. NAV HELPER ──────────────────────────────────────────────
function EMS_navTo(page) {
  const path  = window.location.pathname.toLowerCase();
  const isEmp = path.includes("/employee/");
  const isMgr = path.includes("/management/");
  const base  = isEmp ? "../../employee/"
              : isMgr ? "../../management/"
              :          "../../admin_hr/";

  const routes = {
    // admin
    dashboard:   "../../admin_hr/admin_hr_dashboard/code.html",
    employees:   "../../admin_hr/employee_directory/code.html",
    leave:       "../../admin_hr/leave_management/code.html",
    payroll:     "../../admin_hr/payroll_page/code.html",
    attendance:  isEmp ? "../../employee/attendance_view/code.html"
                       : "../../admin_hr/attendance_management/code.html",
    reports:     "../../admin_hr/reports_dashboard/code.html",
    recruitment: "../../admin_hr/recruitment_management/code.html",
    onboarding:  "../../admin_hr/employee_onboarding/add_employee_personal_details_step_1/code.html",
    // employee
    "my-dashboard": "../../employee/employee_dashboard/code.html",
    profile:        base + "profile_settings/code.html",
    salary:         "../../employee/salary_slips/code.html",
    notifications:  "../../employee/notifications/code.html",
    "apply-leave":  "../../employee/apply_leave/code.html",
    performance:    "../../employee/performance/code.html",
    // management
    approvals:      "../../management/approvals/code.html",
    meetings:       "../../management/meetings/code.html",
    projects:       "../../management/projects/code.html",
    analytics:      "../../management/team_analytics/code.html"
  };

  const href = routes[page] || "#";
  if (href !== "#") window.location.href = href;
}

window.EMS_navTo = EMS_navTo;


// ── 14. CARD CLICK NAVIGATION ────────────────────────────────────
function EMS_initCardClicks() {
  document.querySelectorAll("[data-nav]").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => EMS_navTo(card.dataset.nav));
  });
}


// ── 15. TOPBAR TITLE AUTO-UPDATE ────────────────────────────────
function EMS_initTopbarTitle() {
  const el = document.getElementById("page-header-title");
  if (el) {
    const raw = document.title.split("|")[0].split("-")[0].trim();
    if (raw) el.textContent = raw;
  }
}


// ── INIT ALL ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  EMS_initHelp();
  EMS_initNotifications();
  EMS_initProfileDropdown();
  EMS_initSettings();
  EMS_initApproveReject();
  EMS_initDownloadPrint();
  EMS_initCardClicks();
  EMS_initTopbarTitle();
});
