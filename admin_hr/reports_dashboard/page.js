/* ── REPORTS DASHBOARD ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("Download PDF")) {
      btn.addEventListener("click", () => {
        EMS_Form.setLoading(btn, true);
        setTimeout(() => {
          EMS_Form.setLoading(btn, false);
          EMS_Toast.success("PDF report downloaded");
        }, 1200);
      });
    }
    if (t.includes("Export")) {
      btn.addEventListener("click", () => EMS_Toast.success("Report exported"));
    }
    if (t.includes("Print")) {
      btn.addEventListener("click", () => window.print());
    }
  });

  // Report cards clickable
  document.querySelectorAll(".card").forEach(card => {
    card.style.cursor = "pointer";
    card.classList.add("hover:shadow-lg", "transition-shadow");
    card.addEventListener("click", () => EMS_Toast.info("Opening detailed report…"));
  });

  // Select / date filters
  document.querySelectorAll("select").forEach(sel => {
    sel.addEventListener("change", () => EMS_Toast.info("Report filter applied"));
  });
});
