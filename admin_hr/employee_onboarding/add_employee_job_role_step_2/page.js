/* ── ONBOARDING STEP 2 — Job & Role ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Next Step") || t.includes("Next")) {
      btn.addEventListener("click", () => {
        const required = document.querySelectorAll("input[required], select[required]");
        let valid = true;
        required.forEach(f => {
          if (!f.value.trim()) { f.classList.add("border-red-400"); valid = false; }
          else f.classList.remove("border-red-400");
        });
        if (!valid) { EMS_Toast.warning("Please fill all required fields"); return; }
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          window.location.href = "../add_employee_payroll_benefits/code.html";
        }, 600);
      });
    }

    if (t.includes("Save Draft")) {
      btn.addEventListener("click", () => EMS_Toast.success("Draft saved"));
    }

    if (t.includes("Back") || t.includes("arrow_back")) {
      btn.addEventListener("click", () => history.back());
    }
  });
});
