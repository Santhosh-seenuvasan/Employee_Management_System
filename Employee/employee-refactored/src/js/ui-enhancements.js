const buttonSelector = [
  "button:not(:disabled)",
  "a.btn",
  ".btn",
  ".profile-dropdown-item",
  ".tab-btn",
  ".leave-type-btn",
  ".header-icon-btn",
  ".header-toggle-btn",
  ".header-profile-avatar",
  ".notification-dropdown-clear",
  ".doc-download",
  ".doc-delete",
  ".course-continue",
  ".portal-refresh"
].join(",");

const cardSelector = [
  ".content-card",
  ".info-card",
  ".stat-card",
  ".portal-card",
  ".doc-card",
  ".course-card",
  ".bg-white.rounded-3xl",
  ".rounded-3xl.border.border-slate-100"
].join(",");

function getEventTarget(event) {
  const target = event.target;
  return target instanceof Element ? target : null;
}

function getButtonTarget(event) {
  const target = getEventTarget(event);
  return target?.closest(buttonSelector);
}

function createRipple(event, target) {
  if (!(target instanceof HTMLElement)) return;

  const rect = target.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;
  const ripple = document.createElement("span");

  ripple.className = "ui-ripple";
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;

  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

function enhanceButtons() {
  document.addEventListener("click", (event) => {
    const target = getButtonTarget(event);
    if (!target || event.button !== 0) return;
    createRipple(event, target);
  });

  document.addEventListener("pointerdown", (event) => {
    const target = getButtonTarget(event);
    if (!target) return;
    target.classList.add("is-pressed");
  }, true);

  document.addEventListener("pointerup", (event) => {
    const target = getButtonTarget(event);
    if (!target) return;
    target.classList.remove("is-pressed");
  }, true);

  document.addEventListener("pointercancel", (event) => {
    const target = getButtonTarget(event);
    if (!target) return;
    target.classList.remove("is-pressed");
  }, true);
}

function enhanceCards() {
  document.querySelectorAll(cardSelector).forEach((card) => {
    if (card.dataset.uiCard === "true") return;
    card.classList.add("ui-card");
    card.dataset.uiCard = "true";
  });
}

function observeCards() {
  enhanceCards();

  if (!("MutationObserver" in window)) return;

  const observer = new MutationObserver(enhanceCards);
  observer.observe(document.body, { childList: true, subtree: true });
}

enhanceButtons();
observeCards();
