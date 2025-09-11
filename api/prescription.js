// /api/prescription.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assessmentContext } = req.body || {};
    const fallback =
`Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;

    // Use whichever key you have set in Vercel
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    // No key? Always return a helpful prescription so UI never breaks.
    if (!apiKey) {
      return res.status(200).json({ prescription: fallback });
    }

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content:
              'You are a gentle, trauma-informed coach named Sarah. Create a concise, actionable recovery prescription in 4–6 short bullet lines. Avoid medical advice and diagnosis.'
          },
          {
            role: 'user',
            content:
              `Use this assessment context to produce the prescription:\n${assessmentContext}\nReturn only the prescription, no extra commentary.`
          }
        ]
      })
    });

    const data = await r.json().catch(() => ({}));

    // If API errors, still return a helpful prescription
    if (!r.ok) {
      console.error('Groq error', r.status, data);
      return res.status(200).json({ prescription: fallback });
    }

    const text = (data?.choices?.[0]?.message?.content || '').trim() || fallback;
    return res.status(200).json({ prescription: text });
  } catch (err) {
    console.error('Prescription handler error', err);
    return res.status(200).json({ prescription: fallback });
  }
}
