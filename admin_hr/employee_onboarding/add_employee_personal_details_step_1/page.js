/* ── ONBOARDING STEP 1 — Personal Details ── */
document.addEventListener("DOMContentLoaded", () => {

  // Stepper highlight
  const steps = document.querySelectorAll(".step, [class*='stepper'], [class*='step-']");

  // Photo upload preview
  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Upload Photo")) {
      const inp = document.createElement("input");
      inp.type   = "file";
      inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      btn.addEventListener("click", () => inp.click());
      inp.addEventListener("change", () => {
        const file = inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          const img = document.querySelector(".profile-photo, .w-24.h-24, .w-20.h-20, [class*='rounded-full']");
          if (img?.tagName === "IMG") img.src = e.target.result;
          EMS_Toast.success("Photo uploaded");
        };
        reader.readAsDataURL(file);
      });
    }

    if (t === "Cancel") {
      btn.addEventListener("click", () => {
        if (confirm("Cancel onboarding? All progress will be lost."))
          window.location.href = "../../../admin_hr/employee_directory/code.html";
      });
    }

    if (t.includes("Next") || t.includes("Next Step")) {
      btn.addEventListener("click", () => {
        const form = document.querySelector("form") || document.body;
        const required = form.querySelectorAll("input[required], select[required]");
        let valid = true;
        required.forEach(f => {
          if (!f.value.trim()) {
            f.classList.add("border-red-400");
            valid = false;
          } else f.classList.remove("border-red-400");
        });
        if (!valid) { EMS_Toast.warning("Please fill all required fields"); return; }
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          window.location.href = "../add_employee_job_role_step_2/code.html";
        }, 600);
      });
    }

    if (t === "Back" && !t.includes("arrow_back")) {
      btn.addEventListener("click", () => history.back());
    }
  });

  // Live validation on input blur
  document.querySelectorAll("input[required], select[required]").forEach(inp => {
    inp.addEventListener("blur", () => {
      if (!inp.value.trim()) inp.classList.add("border-red-400");
      else inp.classList.remove("border-red-400");
    });
  });
});
