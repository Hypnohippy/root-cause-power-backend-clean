// js/vip-override.js
(function () {
  console.log("🛠 VIP override script loaded");

  // Stub for the missing Stripe helper so it stops crashing
  if (typeof window !== "undefined" && typeof window.openEmbeddedStripeCheckout === "undefined") {
    window.openEmbeddedStripeCheckout = function () {
      console.log(
        "openEmbeddedStripeCheckout called (stub) – full Stripe embed not wired in this build."
      );
    };
  }

  function applyVipOverride() {
    try {
      const today = new Date().toDateString();

      // 1) Force huge credits into localStorage
      const daily = {
        count: 999999,
        maxDaily: 999999,
        lastReset: today,
      };
      localStorage.setItem("dailyCredits", JSON.stringify(daily));
      localStorage.setItem("voiceCredits", "999999");

      // 2) Update UI elements directly (ignore internal logic)
      const dailyCounter = document.getElementById("daily-credit-count");
      if (dailyCounter) {
        dailyCounter.textContent = "∞";
      }

      const dailyContainer = document.getElementById("daily-credit-counter");
      if (dailyContainer) {
        dailyContainer.classList.remove("credit-low");
      }

      const voiceCounter = document.getElementById("voice-credit-count");
      if (voiceCounter) {
        voiceCounter.textContent = "∞";
      }

      const sessionCredits = document.getElementById("voice-session-credits");
      if (sessionCredits) {
        sessionCredits.textContent = "∞ minutes";
      }

      const currentBalance = document.getElementById("current-voice-balance");
      if (currentBalance) {
        currentBalance.textContent = "∞";
      }

      console.log("👑 VIP override applied via localStorage + DOM");
      return true;
    } catch (e) {
      console.warn("VIP override failed:", e);
      return false;
    }
  }

  // Try repeatedly while the page and main scripts finish loading
  let attempts = 0;
  const maxAttempts = 30;
  const interval = setInterval(() => {
    attempts++;
    const ok = applyVipOverride();

    // Give it a few successful passes, then stop
    if ((ok && attempts > 5) || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 400);

  // One more pass after full load
  window.addEventListener("load", () => {
    setTimeout(applyVipOverride, 500);
  });
})();
