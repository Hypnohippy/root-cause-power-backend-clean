// public/js/founder-vip.js
// Force founder VIP mode in the browser: unlimited credits for now.

(function () {
  console.log("👑 founder-vip.js loaded – forcing unlimited credits for now");

  function applyVip() {
    try {
      const today = new Date().toDateString();

      // 1) Force huge credit values into localStorage
      const vipDaily = {
        count: 999999,
        maxDaily: 999999,
        lastReset: today,
      };
      localStorage.setItem("dailyCredits", JSON.stringify(vipDaily));
      localStorage.setItem("voiceCredits", "999999");

      // 2) Update the visible UI counters (if present)
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

      // 3) If a creditSystem object exists, patch it too
      if (window.creditSystem) {
        try {
          window.creditSystem.isVip = true;

          if (window.creditSystem.dailyCredits) {
            window.creditSystem.dailyCredits.count = 999999;
            window.creditSystem.dailyCredits.maxDaily = 999999;
            window.creditSystem.dailyCredits.lastReset = today;
          }

          window.creditSystem.voiceCredits = 999999;

          if (typeof window.creditSystem.saveDailyCredits === "function") {
            window.creditSystem.saveDailyCredits(window.creditSystem.dailyCredits);
          }
          if (typeof window.creditSystem.saveVoiceCredits === "function") {
            window.creditSystem.saveVoiceCredits(window.creditSystem.voiceCredits);
          }
          if (typeof window.creditSystem.updateCreditDisplays === "function") {
            window.creditSystem.updateCreditDisplays();
          }
        } catch (innerErr) {
          console.warn("VIP patch failed on window.creditSystem:", innerErr);
        }
      }
    } catch (e) {
      console.warn("VIP override failed:", e);
    }
  }

  // Run once immediately…
  applyVip();
  // …then again after other scripts have done their thing…
  setTimeout(applyVip, 500);
  setTimeout(applyVip, 1500);
  // …and keep enforcing every 5 seconds for safety.
  setInterval(applyVip, 5000);
})();
