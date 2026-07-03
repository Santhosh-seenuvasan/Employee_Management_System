/* ── APPROVALS ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  // Approve / Decline with badge update
  document.querySelectorAll("tbody, .approvals-list").forEach(container => {
    container.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const t   = btn.textContent.trim().toLowerCase();
      const row = btn.closest("tr, li, .approval-card");
      const badge = row?.querySelector("span[class*='bg-amber'], span[class*='bg-yellow'], .status-badge");
      const requester = row?.cells?.[0]?.textContent.trim() || "Request";

      if (t === "approve") {
        if (badge) EMS_setStatus(badge, "approved");
        btn.closest("td, div").innerHTML =
          `<span class="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">check_circle</span>Approved</span>`;
        EMS_Toast.success(`${requester} approved`);
      }
      if (t === "decline" || t === "reject") {
        if (badge) EMS_setStatus(badge, "rejected");
        btn.closest("td, div").innerHTML =
          `<span class="text-xs text-red-500 font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">cancel</span>Declined</span>`;
        EMS_Toast.error(`${requester} declined`);
      }
    });
  });

  // Row click for details
  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", e => {
      if (!e.target.closest("button")) EMS_Toast.info("Opening approval details…");
    });
  });

  // Filter tabs
  document.querySelectorAll("[data-filter], .filter-tab, button").forEach(btn => {
    const t = btn.textContent.trim();
    if (["All","Pending","Approved","Rejected"].includes(t)) {
      btn.addEventListener("click", () => {
        document.querySelectorAll("button").forEach(b => {
          if (["All","Pending","Approved","Rejected"].includes(b.textContent.trim())) {
            b.classList.remove("bg-primary","text-white");
            b.classList.add("text-slate-600");
          }
        });
        btn.classList.add("bg-primary","text-white");

        const f = t === "All" ? "" : t.toLowerCase();
        document.querySelectorAll("tbody tr").forEach(row => {
          const badge = row.querySelector("span[class*='bg-']");
          const status = badge?.textContent.trim().toLowerCase() || "";
          row.style.display = !f || status.includes(f) ? "" : "none";
        });
      });
    }
  });
});
