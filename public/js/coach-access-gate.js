// public/js/coach-access-gate.js
// Wraps Coach David so voice credits are actually used
(function () {
  console.log("🔐 Coach access gate script loaded");

  // Smooth-scroll to the pricing section
  function scrollToPricing() {
    try {
      const el =
        document.getElementById("pricing") ||
        document.querySelector('[data-section="pricing"]');

      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Fallback: at least change the hash
        window.location.hash = "#pricing";
      }
    } catch (e) {
      console.warn("Could not scroll to pricing:", e);
    }
  }

  // Fix upgrade modal buttons: when user clicks "Get More Credits" etc,
  // make sure they actually go to pricing.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const txt = (btn.textContent || "").toLowerCase();

    if (
      txt.includes("get more credits") ||
      txt.includes("buy voice credits") ||
      txt.includes("upgrade")
    ) {
      // Let any existing logic run, then nudge user to pricing
      setTimeout(scrollToPricing, 50);
    }
  });

  // Wrap bookVoiceCoachSession so it uses voice credits
  function wrapCoachOnce() {
    if (!window.creditSystem) {
      console.log("⏳ Waiting for creditSystem to exist...");
      return false;
    }
    if (typeof window.bookVoiceCoachSession !== "function") {
      console.log("⏳ Waiting for bookVoiceCoachSession to exist...");
      return false;
    }

    const original = window.bookVoiceCoachSession;

    // Avoid double-wrapping
    if (original.__wrappedByCredits) {
      console.log("✅ Coach session already wrapped by gate; skipping");
      return true;
    }

    window.bookVoiceCoachSession = async function (...args) {
      try {
        const costMinutes = 5; // cost per Coach David session

        if (!window.creditSystem) {
          console.warn(
            "⚠️ No creditSystem present, falling back to original session"
          );
          return original.apply(this, args);
        }

        // If creditSystem has a canAfford helper, use it
        if (
          typeof window.creditSystem.canAfford === "function" &&
          !window.creditSystem.canAfford("voice", costMinutes)
        ) {
          console.log("🚫 Not enough voice credits for Coach David");
          if (
            typeof window.creditSystem.showCreditWarning === "function"
          ) {
            window.creditSystem.showCreditWarning("voice");
          } else {
            alert(
              "You need more credits to use Coach David. Scroll down to the pricing section to add more."
            );
          }
          scrollToPricing();
          return;
        }

        // Deduct credits before starting the session
        if (
          typeof window.creditSystem.useVoiceCredits === "function"
        ) {
          const ok = window.creditSystem.useVoiceCredits(
            costMinutes,
            "Coach David voice session"
          );
          if (!ok) {
            console.log("🚫 useVoiceCredits() blocked the session");
            scrollToPricing();
            return;
          }
        }

        console.log("✅ Credits ok, starting Coach David session");
        return original.apply(this, args);
      } catch (err) {
        console.error("❌ Error in Coach David gate wrapper:", err);
        // In case of any error, don't block therapy – let original run
        return original.apply(this, args);
      }
    };

    window.bookVoiceCoachSession.__wrappedByCredits = true;
    console.log("✅ Coach David session wrapped with credit gate");
    return true;
  }

  // Retry a few times until both creditSystem and bookVoiceCoachSession exist
  function tryWrapLoop() {
    if (wrapCoachOnce()) return;
    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      if (wrapCoachOnce() || attempts > 40) {
        clearInterval(id);
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryWrapLoop, {
      once: true,
    });
  } else {
    tryWrapLoop();
  }
})();
