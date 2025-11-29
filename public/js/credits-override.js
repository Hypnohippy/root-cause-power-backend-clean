// public/js/credits-override.js
// Hard override of any stale "8 credits" logic.
// Trusts Supabase via /api/credits and fixes the UI on each page load.

(function () {
  async function getSyncEmail() {
    // Try a few likely keys
    const keys = ["syncEmail", "userEmail", "user_email"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.includes("@")) return v;
    }
    return null;
  }

  function updateCreditsUI(plan, credits) {
    const els = document.querySelectorAll(
      "#desktop-credits-remaining, #mobile-credits-remaining, #credits-remaining"
    );

    els.forEach((el) => {
      if (!el) return;

      if (plan === "vip") {
        el.textContent = "∞";
        el.style.color = "#a855f7";
        el.title = "VIP - Unlimited credits";
        return;
      }

      el.textContent = credits;

      if (credits < 10) {
        el.style.color = "#ef4444"; // red
      } else if (credits < 25) {
        el.style.color = "#f59e0b"; // amber
      } else {
        el.style.color = "#10b981"; // green
      }

      el.title = `${credits} credits remaining`;
    });
  }

  async function fetchCreditsFromServer() {
    try {
      const email = await getSyncEmail();
      if (!email) {
        console.log("[credits-override] No email found for sync");
        return null;
      }

      const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        console.warn("[credits-override] /api/credits GET failed:", res.status);
        return null;
      }

      const data = await res.json();
      const credits =
        data.credits_remaining != null
          ? data.credits_remaining
          : data.credits != null
          ? data.credits
          : null;

      if (credits == null) {
        console.warn("[credits-override] No credits in response:", data);
        return null;
      }

      return {
        plan: data.plan || "free",
        credits,
        email,
      };
    } catch (err) {
      console.error("[credits-override] Error fetching credits:", err);
      return null;
    }
  }

  async function syncAndRenderCredits() {
    const info = await fetchCreditsFromServer();
    if (!info) return;

    const { plan, credits } = info;

    // Keep old code happy by updating userPlan
    try {
      localStorage.setItem("userPlan", JSON.stringify({ plan, credits }));
    } catch (err) {
      console.warn("[credits-override] Failed to write userPlan:", err);
    }

    updateCreditsUI(plan, credits);
  }

  // Override deductCredits globally so old code uses Supabase
  window.deductCredits = async function (amount, feature = "AI feature") {
    try {
      const email = await getSyncEmail();
      if (!email) {
        console.warn(
          "[credits-override] No email for deductCredits – blocking usage"
        );
        return false;
      }

      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "daily",
          cost: amount,
        }),
      });

      if (res.status === 402) {
        console.log("[credits-override] Not enough credits");
        if (typeof window.showInsufficientCreditsModal === "function") {
          window.showInsufficientCreditsModal(feature, amount);
        } else {
          alert("Not enough credits to use this feature.");
        }
        return false;
      }

      if (!res.ok) {
        console.warn(
          "[credits-override] /api/credits POST failed:",
          res.status
        );
        return false;
      }

      const data = await res.json();

      // VIP: Supabase doesn’t decrement
      const plan = data.plan || "free";
      const credits =
        data.credits_remaining != null
          ? data.credits_remaining
          : data.credits != null
          ? data.credits
          : plan === "vip"
          ? 999999
          : 0;

      try {
        localStorage.setItem("userPlan", JSON.stringify({ plan, credits }));
      } catch {}

      updateCreditsUI(plan, credits);

      console.log(
        `[credits-override] Deducted ${amount} for ${feature}. Plan=${plan}, credits=${credits}`
      );

      return credits;
    } catch (err) {
      console.error("[credits-override] deductCredits error:", err);
      return false;
    }
  };

  // Run AFTER everything else on each page load
  window.addEventListener("load", () => {
    syncAndRenderCredits();
    // and again a moment later in case old demo code runs late
    setTimeout(syncAndRenderCredits, 2000);
  });

  // Expose helper for manual checking in console
  window.RootHealthCredits = {
    refresh: syncAndRenderCredits,
  };
})();
