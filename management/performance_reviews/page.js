/* ── PERFORMANCE REVIEWS ── */
document.addEventListener("DOMContentLoaded", () => {

  EMS_Table.init("table", { searchId: "list-search-input", pageSize: 8 });

  document.querySelectorAll("button").forEach(btn => {
    const t = btn.textContent.trim();

    if (t === "View Review") {
      btn.addEventListener("click", () => EMS_Toast.info("Opening performance review…"));
    }
    if (t === "Start Review") {
      btn.addEventListener("click", () => {
        btn.innerHTML = `<span class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>Starting…`;
        btn.disabled = true;
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = "In Progress";
          EMS_Toast.success("Review started");
        }, 1200);
      });
    }
    if (t.includes("Export") || t.includes("Download")) {
      btn.addEventListener("click", () => EMS_Toast.success("Performance report downloaded"));
    }
  });

  document.querySelectorAll("tbody tr").forEach(row => {
    row.style.cursor = "pointer";
    row.classList.add("hover:bg-blue-50", "transition");
    row.addEventListener("click", e => {
      if (!e.target.closest("button")) EMS_Toast.info("Opening performance details…");
    });
  });
});
