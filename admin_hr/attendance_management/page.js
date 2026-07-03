/* ── ATTENDANCE MANAGEMENT ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 10 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t.includes("Export") || t.includes("Download")) {
      btn.addEventListener("click", () => EMS_Toast.success("Attendance report exported"));
    }
    if (t.includes("Mark Attendance")) {
      btn.addEventListener("click", () => EMS_Toast.success("Attendance marked successfully"));
    }
    if (t.includes("Filter") || btn.querySelector(".material-symbols-outlined")?.textContent.trim() === "filter_list") {
      btn.addEventListener("click", () => EMS_Toast.info("Filter options coming soon"));
    }
  });

  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", () => EMS_Toast.info("Opening attendance details…"));
  });

  // Date picker
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    inp.addEventListener("change", () => EMS_Toast.info("Filtering by selected date…"));
  });
});
