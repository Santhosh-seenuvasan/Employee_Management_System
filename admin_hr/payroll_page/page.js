/* ── PAYROLL PAGE ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 10 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Process Monthly Payroll") || t.includes("account_balance_wallet")) {
      btn.addEventListener("click", () => {
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          EMS_Form.setLoading(btn, false);
          EMS_Toast.success("Payroll processing initiated for this month");
        }, 1800);
      });
    }

    if (t.includes("Export CSV")) {
      btn.addEventListener("click", () => EMS_Toast.success("CSV export started"));
    }

    if (t.includes("Bulk Pay")) {
      btn.addEventListener("click", () => {
        const checked = document.querySelectorAll("tbody input[type='checkbox']:checked");
        if (checked.length === 0) {
          EMS_Toast.warning("Please select employees first");
        } else {
          EMS_Toast.success(`Bulk payment initiated for ${checked.length} employee(s)`);
        }
      });
    }

    if (t === "Download" || btn.querySelector(".material-symbols-outlined")?.textContent.trim() === "download") {
      btn.addEventListener("click", () => EMS_Toast.success("Payslip download started"));
    }
  });

  // Row clicks
  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.addEventListener("click", () => EMS_Toast.info("Opening payroll details…"));
  });

  // Salary slip filter tabs
  document.querySelectorAll("[data-icon]").forEach(btn => {
    btn.addEventListener("click", () => EMS_Toast.info("Filter applied"));
  });
});
