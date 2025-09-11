// public/api/prescription.js (Vercel Node Serverless, CommonJS + safe JSON body parsing)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // Robust JSON body parsing (works even when req.body is undefined)
  let body = {};
  try {
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    body = {};
  }

  const { assessmentContext } = body;
  const fallback = `Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  // No key? Always return a helpful prescription so the UI never breaks.
  if (!apiKey) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ prescription: fallback }));
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 300,
        messages: [
          { role: 'system', content: 'You are a gentle, trauma-informed coach named Sarah. Create a concise, actionable recovery prescription in 4–6 short bullet lines. Avoid medical advice and diagnosis.' },
          { role: 'user', content: `Use this assessment context to produce the prescription:\n${assessmentContext}\nReturn only the prescription, no extra commentary.` }
        ]
      })
    });

    const data = await r.json().catch(() => ({}));
    const text =
      (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? String(data.choices[0].message.content).trim()
        : '') || fallback;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ prescription: text }));
  } catch (err) {
    console.error('Prescription handler error', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ prescription: fallback }));
  }
};
