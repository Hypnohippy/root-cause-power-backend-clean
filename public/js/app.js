// public/js/app.js — RCP v4: init-now + unblock overlays + safe AI fallbacks
(function () {
  console.log('🚀 RCP app.js v4 loaded');

  // 1) Super Hotfix CSS: readable assessment and basic button styles
  try {
    const style = document.createElement('style');
    style.id = 'rcp-super-hotfix';
    style.textContent = `
      #assessment-questions, #assessment-content {
        position: relative !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        color: #111827 !important;      /* readable text */
        background: #ffffff !important;  /* readable backdrop for the panel */
      }
      #assessment-questions button, #assessment-content button { pointer-events: auto !important; }
      /* Readable follow-up bubble */
      #rcp-followup {
        background: #eff6ff !important;
        border-left: 4px solid #60a5fa !important;
        color: #1e40af !important;
        padding: 1rem !important;
        border-radius: 0.5rem !important;
        margin-top: 1rem !important;
      }
      .rcp-scale-btn { border: 2px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem; background: #ffffff; }
      .rcp-scale-btn .rcp-num { font-weight: 700; color: #7c3aed; font-size: 1.5rem; display:block; margin-bottom: 0.25rem; }
      .rcp-scale-btn .rcp-label { color:#4b5563; font-size: 0.75rem; display:block; }
      .rcp-scale-btn:hover { background:#f5f3ff; border-color:#a78bfa; cursor:pointer; }
      .rcp-scale-btn.selected { background:#ede9fe; border-color:#7c3aed; }
    `;
    document.head.appendChild(style);
  } catch (e) {
    console.warn('Hotfix style inject failed', e);
  }

  // 2) Safe AI helpers — always return something gentle so the UI never shows "unavailable"
  window.app = window.app || {};

  app.aiFollowUp = async function (currentQuestion, userResponse) {
    try {
      const r = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentQuestion, userResponse: String(userResponse ?? '') })
      });
      let data = {};
      try { data = await r.json(); } catch {}
      return data.followUp || 'Would you like to tell me a little more?';
    } catch {
      return 'Would you like to tell me a little more?';
    }
  };

  app.aiPrescription = async function (assessmentContext) {
    try {
      const r = await fetch('/api/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentContext })
      });
      let data = {};
      try { data = await r.json(); } catch {}
      return data.prescription || `Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;
    } catch {
      return `Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;
    }
  };

  // 3) Init-now pattern: render immediately, even if DOMContentLoaded already fired
  function startAssessment() {
    const container = document.getElementById('assessment-questions') ||
                      document.getElementById('assessment-content');

    if (!container) {
      console.warn('RCP: No assessment container found (#assessment-questions or #assessment-content).');
      return;
    }
    if (container.dataset.rcpRendered) return;
    container.dataset.rcpRendered = '1';

    // Uncover overlays above the assessment area (if any)
    try { uncoverOverlaysAbove(container); } catch (e) { console.warn('uncoverOverlaysAbove failed', e); }

    renderStep1(container);
  }

  // 4) Overlay killer: disable pointer-events for any blocker above the assessment
  function uncoverOverlaysAbove(container) {
    const rect = container.getBoundingClientRect();
    const pts = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + 10, rect.top + 10],
      [rect.right - 10, rect.top + 10],
      [rect.left + 10, rect.bottom - 10],
      [rect.right - 10, rect.bottom - 10]
    ];
    const changed = new Set();

    pts.forEach(([x, y]) => {
      const stack = document.elementsFromPoint(x, y);
      for (const el of stack) {
        if (!el || el === document.documentElement || el === document.body) continue;
        if (container.contains(el)) break; // we reached the container or inside it—stop
        if (!changed.has(el)) {
          changed.add(el);
          try {
            el.style.pointerEvents = 'none';
            if (isFullscreenOverlay(el)) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
          } catch {}
        }
      }
    });
  }

  function isFullscreenOverlay(el) {
    const st = getComputedStyle(el);
    const fixedOrAbs = st.position === 'fixed' || st.position === 'absolute';
    const widthCovers = st.width.endsWith('vw') || parseInt(st.width) >= (window.innerWidth - 2);
    const heightCovers = st.height.endsWith('vh') || parseInt(st.height) >= (window.innerHeight - 2);
    const coversScreen = parseInt(st.left) <= 0 && parseInt(st.top) <= 0 && widthCovers && heightCovers;
    const looksLikeOverlay =
      (el.id && /overlay|backdrop|modal|drawer|sheet|inset-0/i.test(el.id)) ||
      (el.className && /overlay|backdrop|modal|drawer|sheet|inset-0|fixed/i.test(String(el.className)));
    return fixedOrAbs && (coversScreen || looksLikeOverlay);
  }

  // 5) Render Step 1 (Sleep Quality)
  function renderStep1(container) {
    container.innerHTML = `
      <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div style="background:linear-gradient(90deg,#faf5ff,#eff6ff); padding:1rem; border-bottom:1px solid #e5e7eb;">
          <div style="display:flex; align-items:center;">
            <div style="width:48px; height:48px; background:linear-gradient(135deg,#7c3aed,#3b82f6); border-radius:9999px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:18px; margin-right:1rem;">1</div>
            <div>
              <h3 style="font-size:1.125rem; font-weight:600; color:#1f2937; margin:0;">Sleep Quality</h3>
              <p style="font-size:0.875rem; color:#4b5563; margin:0;">How well are you sleeping these days?</p>
            </div>
          </div>
        </div>
        <div style="padding:1rem;">
          <div id="rcp-scale" style="display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0.5rem; margin-bottom:0.5rem;">
            ${[1,2,3,4,5].map(i => `
              <button data-value="${i}" class="rcp-scale-btn">
                <span class="rcp-num">${i}</span>
                <span class="rcp-label">${['Terrible','Poor','Fair','Good','Excellent'][i-1]}</span>
              </button>
            `).join('')}
          </div>
          <p style="font-size:0.75rem; color:#6b7280; text-align:center; margin-bottom:1rem;">Click a number to rate your experience</p>

          <div id="rcp-followup" class="hidden" style="display:none;"></div>

          <div style="margin-top:1.25rem; display:flex; justify-content:space-between; align-items:center;">
            <button id="rcp-prev" style="padding:0.5rem 1rem; border:1px solid #d1d5db; border-radius:0.5rem; color:#374151; background:#fff;" disabled>← Previous</button>
            <button id="rcp-next" style="padding:0.5rem 1rem; border-radius:0.5rem; color:#fff; background:linear-gradient(90deg,#7c3aed,#3b82f6); opacity:0.6;" disabled>Continue →</button>
          </div>
        </div>
      </div>
    `;

    const scale = container.querySelector('#rcp-scale');
    const followupDiv = container.querySelector('#rcp-followup');
    const nextBtn = container.querySelector('#rcp-next');

    let selected = null;

    // Delegated clicks (more robust than per-button listeners)
    scale.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('.rcp-scale-btn');
      if (!btn) return;

      // If something still blocks, try to clear it again
      try { uncoverOverlaysAbove(container); } catch {}

      // highlight selection
      container.querySelectorAll('.rcp-scale-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selected = parseInt(btn.dataset.value, 10);
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';

      // Ask AI a follow-up
      try {
        followupDiv.style.display = 'block';
        followupDiv.textContent = 'Thinking...';
        const q = 'How well are you sleeping these days?';
        const f = await app.aiFollowUp(q, `${selected}/5`);
        followupDiv.innerHTML = `<strong>AI Coach Sarah asks:</strong> ${escapeHtml(f)}`;
      } catch (e) {
        followupDiv.style.display = 'block';
        followupDiv.textContent = 'Follow-up unavailable right now.';
        console.warn(e);
      }
    });

    nextBtn.addEventListener('click', async () => {
      renderPrescriptionLoading(container);
      try {
        const context = `ASSESSMENT RESULTS:\nSleep Quality: ${selected}/5 (${['Terrible','Poor','Fair','Good','Excellent'][selected-1]})\n`;
        const rx = await app.aiPrescription(context);
        renderPrescription(container, rx);
      } catch (e) {
        renderPrescription(container, 'Sorry—could not generate your prescription right now.');
        console.warn(e);
      }
    });
  }

  function renderPrescriptionLoading(container) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 0;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; background:linear-gradient(135deg,#7c3aed,#3b82f6); border-radius:9999px; margin-bottom:1.5rem; animation:pulse 1.2s ease-in-out infinite;"></div>
        <h3 style="font-size:1.5rem; font-weight:700; color:#1f2937; margin:0 0 0.5rem;">Creating your personalized prescription…</h3>
        <p style="color:#4b5563; margin:0;">This usually takes a few seconds.</p>
      </div>
    `;
  }

  function renderPrescription(container, text) {
    container.innerHTML = `
      <div style="text-align:center; margin-bottom:2rem;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; background:linear-gradient(135deg,#22c55e,#3b82f6); border-radius:9999px; margin-bottom:1rem;"></div>
        <h2 style="font-size:1.75rem; font-weight:800; color:#1f2937; margin:0 0 0.5rem;">Your Personal Recovery Prescription</h2>
        <p style="color:#4b5563; margin:0;">Created by AI Coach Sarah for you</p>
      </div>
      <div style="background:#fff; border:2px solid #bbf7d0; border-radius:0.75rem; padding:2rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05); text-align:left; white-space:pre-wrap; line-height:1.7; color:#111827;">
        ${escapeHtml(text || 'No content')}
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
    }[s]));
  }

  // 6) Start immediately (even if DOMContentLoaded already fired), and retry a few times
  function boot() {
    try { startAssessment(); } catch {}
    setTimeout(() => { try { startAssessment(); } catch {} }, 0);
    setTimeout(() => { try { startAssessment(); } catch {} }, 150);
    setTimeout(() => { try { startAssessment(); } catch {} }, 500);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { try { startAssessment(); } catch {} }, { once: true });
    } else {
      // in case we loaded after DOMContentLoaded, we already called startAssessment above
    }
    window.addEventListener('load', () => { try { startAssessment(); } catch {} }, { once: true });

    // On resize/orientation, try to uncover overlays again
    ['resize', 'orientationchange'].forEach(evt =>
      window.addEventListener(evt, () => { 
        const c = document.getElementById('assessment-questions') || document.getElementById('assessment-content');
        if (c) { try { uncoverOverlaysAbove(c); } catch {} }
      })
    );
  }

  boot();
})();
