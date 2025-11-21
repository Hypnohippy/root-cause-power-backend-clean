// js/vip-override.js
(function () {
  console.log("🛠 VIP override script loaded");

  function applyVipOverride() {
    try {
      if (!window.creditSystem) {
        console.warn("creditSystem not ready yet, retrying…");
        return false;
      }

      // Force VIP mode and huge balances
      window.creditSystem.isVip = true;

      if (!window.creditSystem.dailyCredits) {
        window.creditSystem.dailyCredits = {};
      }

      window.creditSystem.dailyCredits.count = 999999;
      window.creditSystem.dailyCredits.maxDaily = 999999;
      window.creditSystem.dailyCredits.lastReset = new Date().toDateString();

      window.creditSystem.voiceCredits = 999999;

      // Save + update UI
      if (typeof window.creditSystem.saveDailyCredits === "function") {
        window.creditSystem.saveDailyCredits(window.creditSystem.dailyCredits);
      }
      if (typeof window.creditSystem.saveVoiceCredits === "function") {
        window.creditSystem.saveVoiceCredits(window.creditSystem.voiceCredits);
      }
      if (typeof window.creditSystem.updateCreditDisplays === "function") {
        window.creditSystem.updateCreditDisplays();
      }

      console.log("👑 VIP override applied – credits set to ∞");
      return true;
    } catch (e) {
      console.error("VIP override failed:", e);
      return false;
    }
  }

  // Try a few times while scripts load
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (applyVipOverride() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 300);

  // One more try on full window load
  window.addEventListener("load", () => {
    applyVipOverride();
  });
})();
