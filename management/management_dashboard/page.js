/* ── MANAGEMENT DASHBOARD ── */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Export")) {
      btn.addEventListener("click", () => EMS_Toast.success("Report exported"));
    }
    if (t.includes("New Task")) {
      btn.addEventListener("click", () => {
        EMS_Toast.info("Task creation coming soon");
      });
    }
    if (t.includes("View All")) {
      btn.addEventListener("click", () => EMS_navTo("approvals"));
    }
  });

  // KPI cards navigation
  const kpiMap = [
    { keyword: "Pending Approvals", nav: "approvals" },
    { keyword: "Team Performance",  nav: "analytics" },
    { keyword: "Open Projects",     nav: "projects" },
    { keyword: "Meetings",          nav: "meetings" }
  ];
  document.querySelectorAll(".card").forEach(card => {
    const label = card.querySelector("p")?.textContent || "";
    const match = kpiMap.find(k => label.includes(k.keyword));
    if (match) {
      card.style.cursor = "pointer";
      card.classList.add("hover:shadow-lg", "transition-shadow");
      card.addEventListener("click", () => EMS_navTo(match.nav));
    }
  });

  // Three-dot menus
  document.querySelectorAll("button").forEach(btn => {
    if (btn.querySelector(".material-symbols-outlined")?.textContent.trim() === "more_vert") {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        EMS_Toast.info("More options coming soon");
      });
    }
  });
});
