/* ── RECRUITMENT MANAGEMENT ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Post Job") || t.includes("New Job")) {
      btn.addEventListener("click", () => EMS_Toast.info("Job posting form coming soon"));
    }
    if (t.includes("Schedule Interview")) {
      btn.addEventListener("click", () => EMS_Toast.success("Interview scheduled"));
    }
    if (t.includes("Shortlist") || t.includes("shortlist")) {
      btn.addEventListener("click", () => EMS_Toast.success("Candidate shortlisted"));
    }
    if (t.includes("Reject")) {
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const badge = row?.querySelector("span[class*='bg-']");
        if (badge) EMS_setStatus(badge, "rejected");
        EMS_Toast.error("Candidate rejected");
      });
    }
    if (t.includes("Hire") || t.includes("Onboard")) {
      btn.addEventListener("click", () => {
        window.location.href = "../../admin_hr/employee_onboarding/add_employee_personal_details_step_1/code.html";
      });
    }
  });

  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", () => EMS_Toast.info("Opening candidate profile…"));
  });
});
