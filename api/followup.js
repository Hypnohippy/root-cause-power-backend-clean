// /api/followup.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentQuestion, userResponse } = req.body || {};
    const fallback = 'Thanks for sharing. What tends to make your sleep better or worse lately?';

    // Use whichever key you have set in Vercel
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    // No key configured? Always return a useful follow-up so the UI never breaks.
    if (!apiKey) {
      return res.status(200).json({ followUp: fallback });
    }

    // Call Groq (OpenAI-compatible)
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
            content:
              `Question: ${currentQuestion}\nUser response: ${userResponse}\nAsk ONE short, compassionate follow-up question.`
          }
        ]
      })
    });

    const data = await r.json().catch(() => ({}));

    // If API errors, still return a helpful question
    if (!r.ok) {
      console.error('Groq error', r.status, data);
      return res.status(200).json({ followUp: fallback });
    }

    const followUp = (data?.choices?.[0]?.message?.content || '').trim() || fallback;
    return res.status(200).json({ followUp });
  } catch (err) {
    console.error('Followup handler error', err);
    return res.status(200).json({
      followUp: 'Thank you. Could you share a bit more about what affects your sleep lately?'
    });
  }
}
