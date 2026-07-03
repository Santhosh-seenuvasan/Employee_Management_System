/* ── ONBOARDING STEP 3 — Payroll & Benefits ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Next") || t.includes("Review")) {
      btn.addEventListener("click", () => {
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          window.location.href = "../add_employee_review_confirm_step_4/code.html";
        }, 600);
      });
    }

    if (t.includes("Back") || t.includes("arrow_back")) {
      btn.addEventListener("click", () => history.back());
    }

    if (t.includes("Save Draft")) {
      btn.addEventListener("click", () => EMS_Toast.success("Payroll details saved as draft"));
    }
  });

  // Currency formatter
  document.querySelectorAll('input[type="number"], input[placeholder*="salary"], input[placeholder*="Salary"]').forEach(inp => {
    inp.addEventListener("input", () => {
      if (inp.value < 0) inp.value = 0;
    });
  });
});
