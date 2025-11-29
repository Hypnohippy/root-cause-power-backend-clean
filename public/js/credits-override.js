// public/js/credits-override.js
// Hard override of any stale "8 credits" demo logic.
// Trusts Supabase via /api/credits and fixes the UI on each page load.

window.addEventListener("load", async () => {
  try {
    console.log("🔄 [credits-override] Running credits override…");

    // Try to get an email we can sync against.
    // We saw in your code you use "syncEmail" for cross-device sync.
    const email =
      localStorage.getItem("syncEmail") ||
      localStorage.getItem("userEmail") ||
      localStorage.getItem("user_email");

    if (!email) {
      console.log(
        "🔄 [credits-override] No sync email found in localStorage, skipping override."
      );
      return;
    }

    // Call your existing backend: /api/credits?email=...
    const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      console.warn(
        "⚠️ [credits-override] /api/credits GET failed with status",
        res.status
      );
      return;
    }

    const data = await res.json();
    const credits =
      data.credits_remaining != null
        ? data.credits_remaining
        : data.credits != null
        ? data.credits
        : null;

    if (credits == null) {
      console.warn(
        "⚠️ [credits-override] No credits value in response:",
        data
      );
      return;
    }

    const plan = data.plan || "free";

    console.log(
      `✅ [credits-override] Supabase says plan=${plan}, credits=${credits}`
    );

    // Update localStorage so any old code that reads userPlan sees the real value
    const userPlan = { credits, plan };
    try {
      localStorage.setItem("userPlan", JSON.stringify(userPlan));
    } catch (err) {
      console.warn("[credits-override] Unable to write userPlan:", err);
    }

    // Update all visible credit badges
    const creditEls = document.querySelectorAll(
      "#desktop-credits-remaining, #mobile-credits-remaining, #credits-remaining"
    );

    creditEls.forEach((el) => {
      if (!el) return;

      if (plan === "vip") {
        el.textContent = "∞";
        el.style.color = "#a855f7";
        el.title = "VIP - Unlimited credits";
        return;
      }

      el.textContent = credits;

      // Simple colour-coding
      if (credits < 10) {
        el.style.color = "#ef4444"; // red
      } else if (credits < 25) {
        el.style.color = "#f59e0b"; // amber
      } else {
        el.style.color = "#10b981"; // green
      }

      el.title = `${credits} credits remaining`;
    });
  } catch (e) {
    console.error("[credits-override] Unexpected error:", e);
  }
});
