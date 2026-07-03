/* ── EMPLOYEE DIRECTORY ── */
document.addEventListener("DOMContentLoaded", () => {

  // Table with search + sort + pagination
  EMS_Table.init("table, #employee-table", {
    searchId: "list-search-input",
    pageSize: 10
  });

  // "Add New Employee" button
  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("Add New Employee")) {
      btn.addEventListener("click", () => {
        window.location.href = "../../admin_hr/employee_onboarding/add_employee_personal_details_step_1/code.html";
      });
    }
  });

  // Department filter buttons
  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (["All Members","Engineering","Marketing","Sales","HR","Finance"].includes(t)) {
      btn.addEventListener("click", () => {
        document.querySelectorAll("button").forEach(b => {
          if (["All Members","Engineering","Marketing","Sales","HR","Finance"].includes(b.textContent.trim())) {
            b.classList.remove("bg-primary","text-white");
            b.classList.add("bg-white","text-slate-600");
          }
        });
        btn.classList.add("bg-primary","text-white");
        btn.classList.remove("bg-white","text-slate-600");

        const filter = t === "All Members" ? "" : t.toLowerCase();
        document.querySelectorAll("tbody tr").forEach(row => {
          row.style.display = !filter || row.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
      });
    }
  });

  // Row click → view employee
  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", () => EMS_Toast.info("Employee details view coming soon"));
  });

  // View buttons
  document.querySelectorAll("tbody button").forEach(btn => {
    if (btn.textContent.trim() === "View") {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        EMS_Toast.info("Opening employee profile…");
      });
    }
    if (btn.textContent.trim() === "Edit") {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        window.location.href = "../../admin_hr/employee_onboarding/add_employee_personal_details_step_1/code.html";
      });
    }
    if (btn.textContent.trim() === "Delete") {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const row = btn.closest("tr");
        const name = row?.cells[0]?.textContent.trim() || "this employee";
        EMS_ConfirmDelete(`Delete ${name}? This cannot be undone.`, () => {
          row.remove();
          EMS_Toast.success(`${name} removed`);
        });
      });
    }
  });
});
