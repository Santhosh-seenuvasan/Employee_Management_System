/* ── ONBOARDING STEP 4 — Review & Confirm ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("edit") || t.toLowerCase().includes("edit")) {
      const section = btn.closest("section, div.card, div[class*='rounded']");
      const stepMap = {
        "personal": "../add_employee_personal_details_step_1/code.html",
        "job":      "../add_employee_job_role_step_2/code.html",
        "payroll":  "../add_employee_payroll_benefits/code.html"
      };
      const text = section?.textContent.toLowerCase() || "";
      const href = text.includes("personal") ? stepMap.personal
                 : text.includes("job") || text.includes("role") ? stepMap.job
                 : stepMap.payroll;
      btn.addEventListener("click", () => { window.location.href = href; });
    }

    if (t.includes("Confirm") || t.includes("Submit") || t.includes("Complete")) {
      btn.addEventListener("click", () => {
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          EMS_Toast.success("Employee onboarded successfully!");
          setTimeout(() => {
            window.location.href = "../../../admin_hr/employee_directory/code.html";
          }, 1500);
        }, 1800);
      });
    }

    if (t.includes("Back") || t.includes("arrow_back")) {
      btn.addEventListener("click", () => history.back());
    }
  });
});
