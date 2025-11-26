// public/js/credit-system.js
// Simple persistent credits using localStorage on the client.

document.addEventListener("DOMContentLoaded", () => {
  const CREDITS_KEY = "roothealth_credits";
  const INITIAL_CREDITS = 8;

  // Try to find the element that shows credits:
  // - either something like <span data-credits>
  // - or <span id="credits-count">
  const creditsEl =
    document.querySelector("[data-credits]") ||
    document.getElementById("credits-count");

  if (!creditsEl) {
    console.warn(
      "[RootHealth] credit-system.js: No credits element found (data-credits or #credits-count)."
    );
    return;
  }

  function loadCredits() {
    const stored = window.localStorage.getItem(CREDITS_KEY);
    const num = parseInt(stored, 10);
    if (Number.isNaN(num)) {
      return INITIAL_CREDITS;
    }
    return num;
  }

  let credits = loadCredits();

  function saveCredits() {
    window.localStorage.setItem(CREDITS_KEY, String(credits));
  }

  function renderCredits() {
    creditsEl.textContent = String(credits);
  }

  function setCredits(value) {
    credits = Math.max(0, Number(value) || 0);
    saveCredits();
    renderCredits();
  }

  function spendCredits(amount = 1) {
    amount = Number(amount) || 1;
    if (credits < amount) {
      return false; // not enough
    }
    credits -= amount;
    saveCredits();
    renderCredits();
    return true;
  }

  function resetCredits() {
    credits = INITIAL_CREDITS;
    saveCredits();
    renderCredits();
  }

  // Expose a global helper so other scripts can hook into this
  window.RootHealthCredits = {
    get: () => credits,
    set: setCredits,
    spend: spendCredits,
    reset: resetCredits
  };

  // Initial render
  renderCredits();
});
