// public/js/coach-access-gate.js
// Wraps Coach David start to go through /api/coach-access (Supabase)

(function () {
  console.log("🔐 Coach access gate script loaded");

  function wrapBookVoiceCoach() {
    if (!window.bookVoiceCoachSession) {
      console.log("⏳ Waiting for bookVoiceCoachSession to exist...");
      return false;
    }

    if (window._bookVoiceCoachSessionWrapped) {
      return true;
    }

    console.log("✅ Wrapping bookVoiceCoachSession with Supabase gate");

    window._bookVoiceCoachSessionWrapped = true;
    window._originalBookVoiceCoachSession = window.bookVoiceCoachSession;

    window.bookVoiceCoachSession = async function (...args) {
      try {
        console.log("💵 Checking Coach David access via /api/coach-access...");

        // If you later set window.currentUserEmail from Supabase Auth,
        // it will use that. For now, backend will default to your founder email.
        const email = window.currentUserEmail || null;

        const res = await fetch("/api/coach-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log("📊 Supabase coach access result:", data);

        if (!res.ok || !data.allow) {
          // Handle "no credits" cleanly
          if (data.mode === "no_credits") {
            alert(
              "You’re out of voice credits for Coach David. Please top up in the pricing section."
            );
            return;
          }

          // Generic block
          alert(
            "Sorry, you can’t start a voice session right now (no credits / no access)."
          );
          return;
        }

        // Nice UX message for free trial
        if (data.mode === "free_trial") {
          alert(
            "🎁 Enjoy your free Coach David session – this one is on us. Future sessions will use your voice credits."
          );
        }

        // If we want, update the on-screen credit display
        if (window.creditSystem && typeof window.creditSystem.updateCreditDisplays === "function") {
          if (typeof data.voice_credits_remaining === "number") {
            window.creditSystem.voiceCredits = data.voice_credits_remaining;
          }
          window.creditSystem.updateCreditDisplays();
        }

        // All good → call the original function
        return window._originalBookVoiceCoachSession.apply(this, args);
      } catch (err) {
        console.error("❌ Coach access gate failed, falling back:", err);
        // Fail-open: if the gate breaks, we don't brick the app
        return window._originalBookVoiceCoachSession.apply(this, args);
      }
    };

    return true;
  }

  // Run after DOM ready & retry a few times until the function exists
  document.addEventListener("DOMContentLoaded", () => {
    let attempts = 0;
    const maxAttempts = 20;

    const timer = setInterval(() => {
      attempts += 1;
      const ok = wrapBookVoiceCoach();
      if (ok || attempts >= maxAttempts) {
        clearInterval(timer);
        if (!ok) {
          console.warn(
            "⚠️ Coach access gate could not wrap bookVoiceCoachSession (function never appeared)."
          );
        }
      }
    }, 500);
  });
})();
