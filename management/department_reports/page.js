/* ── DEPARTMENT REPORTS ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("Download") || t.includes("Export")) {
      btn.addEventListener("click", () => EMS_Toast.success("Department report exported"));
    }
    if (t.includes("Print")) {
      btn.addEventListener("click", () => window.print());
    }
    if (t.includes("Filter")) {
      btn.addEventListener("click", () => EMS_Toast.info("Filters applied"));
    }
  });

  document.querySelectorAll("select").forEach(sel => {
    sel.addEventListener("change", () => EMS_Toast.info("Report updated for " + sel.value));
  });

  document.querySelectorAll(".card").forEach(card => {
    card.style.cursor = "pointer";
    card.classList.add("hover:shadow-lg", "transition-shadow");
    card.addEventListener("click", () => EMS_Toast.info("Opening detailed report…"));
  });
});
