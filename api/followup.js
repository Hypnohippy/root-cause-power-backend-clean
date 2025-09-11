// /api/followup.js (Vercel Node Serverless, CommonJS + safe JSON body parsing)
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

  const { currentQuestion, userResponse } = body;
  const fallback =
    'Thanks for sharing. What tends to make your sleep better or worse lately?';

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  // No key? Always return a helpful follow-up so the UI never breaks.
  if (!apiKey) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ followUp: fallback }));
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content:
              'You are a gentle, trauma-informed coach named Sarah. Ask ONE concise, compassionate follow-up question based on the user’s response. Avoid medical advice.'
          },
          {
            role: 'user',
            content: `Question: ${currentQuestion}\nUser response: ${userResponse}\nAsk ONE short, compassionate follow-up question.`
          }
        ]
      })
    });

    const data = await r.json().catch(() => ({}));

    const followUp =
      (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? String(data.choices[0].message.content).trim()
        : '') || fallback;

    // Always return 200 with a usable follow-up (graceful)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ followUp }));
  } catch (err) {
    console.error('Followup handler error', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        followUp:
          'Thank you. Could you share a bit more about what affects your sleep lately?'
      })
    );
  }
};
