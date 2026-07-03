/* ── PROJECTS ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();
    if (t.includes("New Project") || t.includes("Add Project")) {
      btn.addEventListener("click", () => EMS_Toast.info("New project form coming soon"));
    }
    if (t.includes("View") || t === "Open") {
      btn.addEventListener("click", () => EMS_Toast.info("Opening project details…"));
    }
    if (t.includes("Archive") || t.includes("Delete")) {
      btn.addEventListener("click", () => {
        EMS_ConfirmDelete("Archive this project?", () => {
          btn.closest("tr, .card")?.remove();
          EMS_Toast.success("Project archived");
        });
      });
    }
  });

  // Project cards
  document.querySelectorAll(".card").forEach(card => {
    card.style.cursor = "pointer";
    card.classList.add("hover:shadow-lg", "transition-shadow");
    card.addEventListener("click", e => {
      if (!e.target.closest("button")) EMS_Toast.info("Opening project…");
    });
  });

  // Progress bar hover
  document.querySelectorAll("[class*='bg-blue'], [class*='rounded-full']").forEach(bar => {
    if (bar.style.width || bar.className.includes("h-2")) {
      bar.title = `Progress: ${bar.style.width || "0%"}`;
    }
  });
});
