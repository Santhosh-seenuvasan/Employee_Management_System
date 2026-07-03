/* ── LEAVE MANAGEMENT ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  // Approve / Reject (full row handling)
  document.querySelectorAll("tbody").forEach(tbody => {
    tbody.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const row   = btn.closest("tr");
      const badge = row?.querySelector("[class*='bg-amber'], [class*='bg-yellow'], .status-badge, span[class*='bg-']");
      const name  = row?.cells[0]?.textContent.trim() || "Request";

      if (btn.textContent.trim().toLowerCase() === "approve") {
        if (badge) EMS_setStatus(badge, "approved");
        btn.closest("td").innerHTML = `<span class="text-xs text-emerald-600 font-semibold">Approved</span>`;
        EMS_Toast.success(`${name}'s leave approved`);
      }
      if (["reject","decline","cancel"].includes(btn.textContent.trim().toLowerCase())) {
        if (badge) EMS_setStatus(badge, "rejected");
        btn.closest("td").innerHTML = `<span class="text-xs text-red-500 font-semibold">Rejected</span>`;
        EMS_Toast.error(`${name}'s leave rejected`);
      }
      if (btn.textContent.trim() === "View History") {
        EMS_Toast.info(`Viewing ${name}'s leave history`);
      }
    });
  });

  // "check_circle" and "cancel" icon buttons
  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (!icon) return;
    const ic = icon.textContent.trim();
    if (ic === "check_circle") {
      btn.addEventListener("click", e => {
        const row = btn.closest("tr");
        const badge = row?.querySelector("span[class*='bg-']");
        if (badge) EMS_setStatus(badge, "approved");
        EMS_Toast.success("Leave approved");
      });
    }
    if (ic === "cancel") {
      btn.addEventListener("click", e => {
        const row = btn.closest("tr");
        const badge = row?.querySelector("span[class*='bg-']");
        if (badge) EMS_setStatus(badge, "rejected");
        EMS_Toast.error("Leave rejected");
      });
    }
  });
});
