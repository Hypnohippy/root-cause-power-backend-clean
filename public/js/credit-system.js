/**
 * Front-end Credit System (Founder VIP mode)
 *
 * This ONLY controls what the browser sees (UI + local checks).
 * The real source of truth can be Supabase on the backend.
 *
 * For now:
 * - You (founder) have infinite credits on this browser.
 * - We don't use localStorage "8 credits" anymore.
 * - All checks like `canAfford` and `useDailyCredit` always allow.
 */

(function () {
  console.log("💰 credit-system.js (Founder VIP) loaded");

  class CreditSystem {
    constructor() {
      // Founder mode: always VIP on this browser
      this.isVip = true;

      // These are only for display; backend can ignore them
      this.dailyCredits = {
        count: Number.POSITIVE_INFINITY,
        maxDaily: Number.POSITIVE_INFINITY,
        lastReset: new Date().toDateString(),
      };
      this.voiceCredits = Number.POSITIVE_INFINITY;

      this.updateCreditDisplays();
      this.startDailyReset();
    }

    // ---- UI updates ----
    updateCreditDisplays() {
      // Daily credits counter
      const dailyCounter = document.getElementById("daily-credit-count");
      if (dailyCounter) {
        dailyCounter.textContent = "∞";
      }

      const dailyContainer = document.getElementById("daily-credit-counter");
      if (dailyContainer) {
        dailyContainer.classList.remove("credit-low");
      }

      // Voice credits counter
      const voiceCounter = document.getElementById("voice-credit-count");
      if (voiceCounter) {
        voiceCounter.textContent = "∞";
      }

      // Voice session credits display
      const sessionCredits = document.getElementById("voice-session-credits");
      if (sessionCredits) {
        sessionCredits.textContent = "∞ minutes";
      }

      // Current balance in modal
      const currentBalance = document.getElementById("current-voice-balance");
      if (currentBalance) {
        currentBalance.textContent = "∞";
      }

      console.log("👑 Founder VIP front-end display set to ∞ credits");
    }

    // ---- Using credits (no-ops in VIP mode) ----
    useDailyCredit(purpose = "AI interaction") {
      console.log(
        `👑 VIP (front-end): daily credit request for ${purpose} – allowed, no deduction`
      );
      return true;
    }

    useVoiceCredits(minutes, purpose = "Voice AI session") {
      console.log(
        `👑 VIP (front-end): voice credit request for ${minutes} minutes (${purpose}) – allowed, no deduction`
      );
      return true;
    }

    addVoiceCredits(minutes) {
      console.log(
        `👑 VIP (front-end): addVoiceCredits(${minutes}) called – already infinite`
      );
      this.showCreditSuccess("voice", minutes);
    }

    // ---- Info / checks ----
    canAfford(type, amount = 1) {
      // In VIP mode, always true
      return true;
    }

    getCreditStatus() {
      return {
        daily: {
          available: Infinity,
          max: Infinity,
          resetsAt: this.getNextResetTime(),
        },
        voice: {
          available: Infinity,
          unit: "minutes",
        },
      };
    }

    getNextResetTime() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.toISOString();
    }

    getTimeUntilReset() {
      return "∞";
    }

    // ---- Toasters / modals (kept so nothing breaks) ----
    showCreditWarning(type) {
      console.log(
        `👑 VIP (front-end): showCreditWarning(${type}) called – but VIP mode ignores warnings`
      );
    }

    showCreditSuccess(type, amount) {
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300";

      toast.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-check-circle text-xl mr-3"></i>
          <div>
            <div class="font-semibold">Credits Updated</div>
            <div class="text-sm">You're in VIP mode – credits are effectively unlimited.</div>
          </div>
        </div>
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove("translate-x-full");
      }, 100);

      setTimeout(() => {
        toast.classList.add("translate-x-full");
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, 4000);
    }

    closeModal(element) {
      const modal = element.closest(".fixed");
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }

    closeAllModals() {
      const modals = document.querySelectorAll(
        "#voice-credit-modal, #payment-loading"
      );
      modals.forEach((modal) => {
        modal.classList.add("hidden");
      });
    }

    startDailyReset() {
      // In VIP mode, we don't actually change anything, but we keep the interval
      // in case other parts of the app expect it.
      setInterval(() => {
        console.log("⏰ VIP daily reset tick (no changes)");
      }, 60 * 60 * 1000);
    }
  }

  // Make it global so the rest of the app can use it
  window.creditSystem = new CreditSystem();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CreditSystem;
  }

  console.log("💰 Credit System initialized in Founder VIP front-end mode.");
})();
