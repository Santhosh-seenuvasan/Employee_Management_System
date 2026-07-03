/* ── MEETINGS ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t === "Join") {
      btn.addEventListener("click", () => {
        EMS_Toast.success("Joining meeting… Opening video call");
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">videocam</span> Joining…`;
        btn.disabled = true;
      });
    }
    if (t === "View Details") {
      btn.addEventListener("click", () => EMS_Toast.info("Opening meeting details…"));
    }
    if (t.includes("Schedule") || t.includes("New Meeting")) {
      btn.addEventListener("click", () => EMS_Toast.info("Meeting scheduler coming soon"));
    }
    if (t.includes("Export") || t.includes("Download")) {
      btn.addEventListener("click", () => EMS_Toast.success("Meeting agenda downloaded"));
    }
  });

  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", e => {
      if (!e.target.closest("button")) EMS_Toast.info("Opening meeting details…");
    });
  });
});
