/* ── ADMIN HR DASHBOARD ── */
document.addEventListener("DOMContentLoaded", () => {

  // KPI cards → navigate on click
  const kpiMap = [
    { keyword: "Total Employees", nav: "employees" },
    { keyword: "Attendance Rate",  nav: "attendance" },
    { keyword: "Pending Leaves",   nav: "leave" },
    { keyword: "Payroll Status",   nav: "payroll" }
  ];
  document.querySelectorAll(".card").forEach(card => {
    const label = card.querySelector("p")?.textContent || "";
    const match = kpiMap.find(k => label.includes(k.keyword));
    if (match) {
      card.style.cursor = "pointer";
      card.classList.add("hover:shadow-lg", "transition-shadow", "duration-200");
      card.addEventListener("click", () => EMS_navTo(match.nav));
    }
  });

  // "Add Employee" button
  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("Add Employee")) {
      btn.addEventListener("click", () => {
        window.location.href = "../../admin_hr/employee_onboarding/add_employee_personal_details_step_1/code.html";
      });
    }
    if (t.includes("Export Report")) {
      btn.addEventListener("click", () => EMS_Toast.success("Report exported successfully"));
    }
    if (t.includes("View All")) {
      btn.addEventListener("click", () => EMS_navTo("employees"));
    }
    if (t.includes("filter_list") || btn.querySelector(".material-symbols-outlined")?.textContent.trim() === "filter_list") {
      btn.addEventListener("click", () => EMS_Toast.info("Filter options coming soon"));
    }
  });

  // Recent Hires table — "View" buttons
  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.addEventListener("click", () => EMS_navTo("employees"));
    const viewBtn = row.querySelector("button");
    if (viewBtn && viewBtn.textContent.trim() === "View") {
      viewBtn.addEventListener("click", e => {
        e.stopPropagation();
        EMS_navTo("employees");
      });
    }
  });

  // "View All" on Recent Activity
  document.querySelectorAll("button").forEach(btn => {
    if (btn.textContent.trim() === "View All") {
      btn.addEventListener("click", () => EMS_navTo("employees"));
    }
  });
});
