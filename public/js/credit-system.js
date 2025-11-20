/**
 * Credit System for Root Cause Power Platform
 * Handles daily credits, voice credits, and Stripe payments
 *
 * IMPORTANT FOR NOW:
 * - Founder (you) runs in "VIP mode" with effectively unlimited credits
 * - This version does NOT depend on Supabase, so it won't break magic link login
 * - Later we can wire proper per-user credits with Supabase on top of this
 */

class CreditSystem {
  constructor() {
    // 🔑 TEMP: Founder VIP toggle – gives you unlimited credits on this browser
    // When we go live for other users, we can turn this into a proper plan system.
    this.isVip = true;

    // Local credit state
    this.dailyCredits = this.loadDailyCredits();
    this.voiceCredits = this.loadVoiceCredits();

    this.stripe = null;

    // If VIP, force huge balances and persist them so refreshes don’t knock you back to 8
    if (this.isVip) {
      this.dailyCredits.count = 999999;
      this.dailyCredits.maxDaily = 999999;
      this.dailyCredits.lastReset = new Date().toDateString();
      this.voiceCredits = 999999;

      this.saveDailyCredits(this.dailyCredits);
      this.saveVoiceCredits(this.voiceCredits);

      console.log("👑 Founder VIP mode active – unlimited credits set.");
    }

    this.initStripe();
    this.updateCreditDisplays();
    this.startDailyReset();
  }

  // -----------------------------
  // Stripe initialisation
  // -----------------------------
  async initStripe() {
    try {
      const response = await fetch("/api/stripe-config");
      const config = await response.json();

      if (config.publishableKey && typeof Stripe !== "undefined") {
        this.stripe = Stripe(config.publishableKey);
        console.log("✅ Stripe initialized successfully");
      } else {
        console.warn("⚠️ Stripe not configured or Stripe.js not loaded");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Stripe:", error);
    }
  }

  // -----------------------------
  // Load / save credits (localStorage)
  // -----------------------------
  loadDailyCredits() {
    try {
      const stored = localStorage.getItem("dailyCredits");
      if (!stored) {
        return {
          count: 8, // original free trial amount
          maxDaily: 8,
          lastReset: new Date().toDateString(),
        };
      }

      const credits = JSON.parse(stored);

      // Normal non-VIP behaviour: reset when date changes
      const today = new Date().toDateString();
      if (!this.isVip && credits.lastReset !== today) {
        credits.count = credits.maxDaily;
        credits.lastReset = today;
        this.saveDailyCredits(credits);
      }

      return credits;
    } catch (e) {
      console.warn("⚠️ Failed to load dailyCredits, resetting", e);
      return {
        count: 8,
        maxDaily: 8,
        lastReset: new Date().toDateString(),
      };
    }
  }

  saveDailyCredits(credits) {
    try {
      localStorage.setItem("dailyCredits", JSON.stringify(credits));
      this.dailyCredits = credits;
      this.updateCreditDisplays();
    } catch (e) {
      console.warn("⚠️ Failed to save dailyCredits", e);
    }
  }

  loadVoiceCredits() {
    try {
      const stored = localStorage.getItem("voiceCredits");
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      console.warn("⚠️ Failed to load voiceCredits", e);
      return 0;
    }
  }

  saveVoiceCredits(credits) {
    try {
      localStorage.setItem("voiceCredits", credits.toString());
      this.voiceCredits = credits;
      this.updateCreditDisplays();
    } catch (e) {
      console.warn("⚠️ Failed to save voiceCredits", e);
    }
  }

  // -----------------------------
  // UI updates
  // -----------------------------
  updateCreditDisplays() {
    // Daily credits counter
    const dailyCounter = document.getElementById("daily-credit-count");
    if (dailyCounter) {
      const displayText = this.isVip
        ? "∞"
        : `${this.dailyCredits.count}/${this.dailyCredits.maxDaily}`;
      dailyCounter.textContent = displayText;

      const dailyContainer = document.getElementById("daily-credit-counter");
      if (dailyContainer) {
        if (!this.isVip && this.dailyCredits.count <= 1) {
          dailyContainer.classList.add("credit-low");
        } else {
          dailyContainer.classList.remove("credit-low");
        }
      }
    }

    // Voice credits counter
    const voiceCounter = document.getElementById("voice-credit-count");
    if (voiceCounter) {
      voiceCounter.textContent = this.isVip ? "∞" : this.voiceCredits;
    }

    // Voice session credits display
    const sessionCredits = document.getElementById("voice-session-credits");
    if (sessionCredits) {
      sessionCredits.textContent = this.isVip
        ? "∞ minutes"
        : `${this.voiceCredits} minutes`;
    }

    // Current balance in modal
    const currentBalance = document.getElementById("current-voice-balance");
    if (currentBalance) {
      currentBalance.textContent = this.isVip ? "∞" : this.voiceCredits;
    }
  }

  // -----------------------------
  // Using credits
  // -----------------------------
  useDailyCredit(purpose = "AI interaction") {
    // VIP: never deduct, always allow
    if (this.isVip) {
      console.log(
        `👑 VIP: daily credit request for ${purpose} – no deduction applied`
      );
      return true;
    }

    if (this.dailyCredits.count <= 0) {
      this.showCreditWarning("daily");
      return false;
    }

    this.dailyCredits.count--;
    this.saveDailyCredits(this.dailyCredits);

    console.log(
      `💰 Daily credit used for: ${purpose}. Remaining: ${this.dailyCredits.count}`
    );
    return true;
  }

  useVoiceCredits(minutes, purpose = "Voice AI session") {
    // VIP: never deduct
    if (this.isVip) {
      console.log(
        `👑 VIP: voice credit request for ${minutes} minutes (${purpose}) – no deduction applied`
      );
      return true;
    }

    if (this.voiceCredits < minutes) {
      this.showCreditWarning("voice");
      return false;
    }

    this.voiceCredits -= minutes;
    this.saveVoiceCredits(this.voiceCredits);

    console.log(
      `🎤 Voice credits used: ${minutes} minutes for ${purpose}. Remaining: ${this.voiceCredits}`
    );
    return true;
  }

  addVoiceCredits(minutes) {
    this.voiceCredits += minutes;
    this.saveVoiceCredits(this.voiceCredits);
    this.showCreditSuccess("voice", minutes);
    console.log(
      `✅ Added ${minutes} voice minutes. Total: ${this.voiceCredits}`
    );
  }

  // -----------------------------
  // Modals and toasts
  // -----------------------------
  showCreditWarning(type) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

    const content =
      type === "daily"
        ? {
            icon: "fas fa-coins",
            title: "Daily Credits Used Up",
            message: "You've used all your daily AI interaction credits.",
            action: "Get More Credits",
            actionFn: () => window.app && window.app.showSection
              ? window.app.showSection("pricing")
              : null,
          }
        : {
            icon: "fas fa-microphone",
            title: "Voice Credits Needed",
            message: "You need voice credits to use the AI voice coach.",
            action: "Buy Voice Credits",
            actionFn: () =>
              window.app && window.app.showVoiceCreditStore
                ? window.app.showVoiceCreditStore()
                : null,
          };

    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="${content.icon} text-orange-500 text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${content.title}</h3>
          <p class="text-gray-600">${content.message}</p>
        </div>
        
        <div class="space-y-4">
          <button class="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold">
            ${content.action}
          </button>
          <button class="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Maybe Later
          </button>
        </div>
        
        <div class="mt-4 text-xs text-gray-500 text-center">
          ${
            type === "daily"
              ? "Daily credits reset every 24 hours"
              : "Voice credits never expire"
          }
        </div>
      </div>
    `;

    const [primaryBtn, secondaryBtn] = modal.querySelectorAll("button");

    primaryBtn.addEventListener("click", () => {
      this.closeModal(primaryBtn);
      if (content.actionFn) content.actionFn();
    });

    secondaryBtn.addEventListener("click", () => {
      this.closeModal(secondaryBtn);
    });

    document.body.appendChild(modal);
  }

  showCreditSuccess(type, amount) {
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300";

    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle text-xl mr-3"></i>
        <div>
          <div class="font-semibold">Credits Added!</div>
          <div class="text-sm">${amount} ${
      type === "voice" ? "voice minutes" : "daily credits"
    } added to your account</div>
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

  // -----------------------------
  // Stripe purchase flow (kept as-is)
  // -----------------------------
  async purchaseVoiceCredits(packageType, amount, minutes) {
    if (!this.stripe) {
      alert("Payment system not available. Please try again later.");
      return;
    }

    try {
      console.log(
        `💳 Initiating purchase: ${packageType} - £${amount} for ${minutes} minutes`
      );

      this.showPaymentLoading();

      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType,
          amount: amount * 100,
          minutes,
          productName: `Voice Credits - ${
            packageType.charAt(0).toUpperCase() + packageType.slice(1)
          }`,
          description: `${minutes} minutes of AI voice coaching`,
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      const { error } = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("❌ Payment failed:", error);
      this.hidePaymentLoading();
      alert(`Payment failed: ${error.message || "Unknown error occurred"}`);
    }
  }

  showPaymentLoading() {
    const overlay = document.createElement("div");
    overlay.id = "payment-loading";
    overlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Processing Payment</h3>
        <p class="text-gray-600">Redirecting to secure payment...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  hidePaymentLoading() {
    const overlay = document.getElementById("payment-loading");
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  handlePaymentSuccess(sessionData) {
    if (sessionData.minutes) {
      this.addVoiceCredits(sessionData.minutes);
    }
    this.closeAllModals();
    this.showCreditSuccess("voice", sessionData.minutes);
  }

  // -----------------------------
  // Daily reset (kept mainly for non-VIP future users)
  // -----------------------------
  startDailyReset() {
    setInterval(() => {
      if (this.isVip) {
        // In VIP mode we don’t care about resets, but we keep the hook in case we later downgrade this browser.
        return;
      }

      const today = new Date().toDateString();
      if (this.dailyCredits.lastReset !== today) {
        this.dailyCredits.count = this.dailyCredits.maxDaily;
        this.dailyCredits.lastReset = today;
        this.saveDailyCredits(this.dailyCredits);

        console.log("🔄 Daily credits reset!");

        if (document.visibilityState === "visible") {
          this.showCreditSuccess("daily", this.dailyCredits.maxDaily);
        }
      }
    }, 60 * 60 * 1000); // every hour
  }

  // Utility helpers
  getCreditStatus() {
    return {
      daily: {
        available: this.isVip ? Infinity : this.dailyCredits.count,
        max: this.isVip ? Infinity : this.dailyCredits.maxDaily,
        resetsAt: this.getNextResetTime(),
      },
      voice: {
        available: this.isVip ? Infinity : this.voiceCredits,
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

  canAfford(type, amount = 1) {
    if (this.isVip) return true;
    if (type === "daily") return this.dailyCredits.count >= amount;
    if (type === "voice") return this.voiceCredits >= amount;
    return false;
  }

  getTimeUntilReset() {
    const nextReset = this.getNextResetTime();
    const timeUntil = new Date(nextReset) - new Date();
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeUntil % (1000 * 60 * 60)) / (1000 * 60)
    );
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

// Initialise
window.creditSystem = new CreditSystem();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CreditSystem;
}

console.log("💰 Credit System initialized successfully (VIP mode).");
