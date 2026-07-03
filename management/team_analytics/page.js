/* ── TEAM ANALYTICS ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("Export") || t.includes("Download")) {
      btn.addEventListener("click", () => EMS_Toast.success("Analytics report downloaded"));
    }
  });

  // Period selector
  document.querySelectorAll("select").forEach(sel => {
    sel.addEventListener("change", () => EMS_Toast.info("Analytics updated for " + sel.value));
  });

  // Chart bars interactive hover
  document.querySelectorAll("[class*='bg-blue-5'], [class*='rounded-t-']").forEach(bar => {
    bar.style.cursor = "pointer";
    bar.addEventListener("mouseenter", () => bar.style.filter = "brightness(1.1)");
    bar.addEventListener("mouseleave", () => bar.style.filter = "");
    bar.addEventListener("click", () => EMS_Toast.info("Department detail: " +
      (bar.closest(".flex-1")?.querySelector("p")?.textContent || "Department")));
  });
});
