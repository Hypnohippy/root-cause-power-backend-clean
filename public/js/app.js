// public/js/app.js — RCP Guaranteed Working Assessment + Safe AI + Click/Readability Hotfix
// v2.0
(function () {
  console.log('🚀 RCP app.js v2 loaded');

  // 1) Super Hotfix CSS: make assessment readable & clickable; hide overlays that might block clicks
  try {
    const style = document.createElement('style');
    style.id = 'rcp-super-hotfix';
    style.textContent = `
      #assessment-questions, #assessment-content {
        position: relative !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
        color: #111827 !important; /* readable dark text */
        background: #ffffff !important; /* readable background */
      }
      #assessment-questions button, #assessment-content button { pointer-events: auto !important; }
      /* common overlay suspects */
      #mobile-menu, #nav-overlay, .mobile-menu-panel, .fixed.inset-0, .overlay, .backdrop, .drawer, .modal {
        display: none !important;
        pointer-events: none !important;
      }
      /* Follow-up bubble readable even if Tailwind not present */
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

  // 2) Safe AI helpers — always return something gentle
  window.app = window.app || {};

  app.aiFollowUp = async function (currentQuestion, userResponse) {
    try {
      const r = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion,
          userResponse: String(userResponse ?? '')
        })
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

  // 3) Minimal fallback assessment — renders Step 1 into #assessment-questions or #assessment-content
  document.addEventListener('DOMContentLoaded', function () {
    const container =
      document.getElementById('assessment-questions') ||
      document.getElementById('assessment-content');

    if (!container) {
      console.warn('RCP: No assessment container found (#assessment-questions or #assessment-content).');
      return;
    }
    if (container.dataset.rcpFallbackLoaded) return;
    container.dataset.rcpFallbackLoaded = '1';

    renderStep1(container);
  });

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

    const scaleBtns = container.querySelectorAll('.rcp-scale-btn');
    const followupDiv = container.querySelector('#rcp-followup');
    const nextBtn = container.querySelector('#rcp-next');

    let selected = null;

    scaleBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        // Unblock clicks just in case
        try {
          ['mobile-menu', 'nav-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display='none'; el.style.pointerEvents='none'; }
          });
        } catch {}

        // highlight selection
        scaleBtns.forEach(b => b.classList.remove('selected'));
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
    });

    nextBtn.addEventListener('click', async () => {
      renderPrescriptionLoading(container);
      try {
        const context = `ASSESSMENT RESULTS:\nSleep Quality:<span class="cursor">█</span>
