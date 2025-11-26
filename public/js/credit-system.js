// credit-system.js
// Persists whatever your existing credits display shows,
// without changing your current AI / booking logic.

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "roothealth_credits";

  // Helper: find elements that contain the "Credits:" text
  function findCreditNodes() {
    const all = Array.from(document.querySelectorAll("body *"));
    const candidates = all.filter((el) => {
      // Only elements with a single text node child
      if (el.childNodes.length !== 1) return false;
      const node = el.childNodes[0];
      if (node.nodeType !== Node.TEXT_NODE) return false;
      const text = node.textContent.trim();
      return text.startsWith("Credits:");
    });
    return candidates;
  }

  const creditNodes = findCreditNodes();

  if (!creditNodes.length) {
    console.warn("[RootHealth] credit-system.js: No 'Credits:' text nodes found.");
    return;
  }

  let currentCredits = null;

  function parseCreditsFromText(text) {
    // Try to match "Credits: 8", "Credits: 12", etc.
    const match = text.match(/Credits:\s*(\d+)/);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    if (Number.isNaN(num)) return null;
    return num;
  }

  function renderCreditsToNodes(value) {
    const text = `Credits: ${value}`;
    creditNodes.forEach((el) => {
      el.textContent = text;
    });
  }

  function saveCredits(value) {
    currentCredits = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch (err) {
      console.warn("[RootHealth] Unable to save credits to localStorage:", err);
    }
  }

  function loadStoredCredits() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored == null) return null;
      const num = parseInt(stored, 10);
      if (Number.isNaN(num)) return null;
      return num;
    } catch (err) {
      console.warn("[RootHealth] Unable to read credits from localStorage:", err);
      return null;
    }
  }

  // 1) On load, try to apply stored credits (if any)
  const stored = loadStoredCredits();
  if (stored != null) {
    currentCredits = stored;
    renderCreditsToNodes(stored);
  } else {
    // If nothing stored yet, try to read the initial number (if your existing JS has set it),
    // otherwise we just leave it alone until your own logic updates it.
    const firstText = creditNodes[0].textContent;
    const parsed = parseCreditsFromText(firstText);
    if (parsed != null) {
      currentCredits = parsed;
      saveCredits(parsed);
    }
  }

  // 2) Watch for changes to the credits nodes and update storage
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target =
        mutation.target.nodeType === Node.TEXT_NODE
          ? mutation.target.parentNode
          : mutation.target;

      if (!target) continue;
      if (!creditNodes.includes(target)) continue;

      const text = target.textContent;
      const parsed = parseCreditsFromText(text);
      if (parsed != null && parsed !== currentCredits) {
        saveCredits(parsed);
      }
    }
  });

  creditNodes.forEach((node) => {
    observer.observe(node, {
      characterData: true,
      childList: true,
      subtree: true
    });
  });

  // 3) Optional global helper if you ever want to tweak credits from elsewhere
  window.RootHealthCredits = {
    get() {
      return currentCredits;
    },
    set(value) {
      const num = parseInt(value, 10);
      if (Number.isNaN(num)) return;
      saveCredits(num);
      renderCreditsToNodes(num);
    },
    reset(initial = 8) {
      this.set(initial);
    }
  };
});
