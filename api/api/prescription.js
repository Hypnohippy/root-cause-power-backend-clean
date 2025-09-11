'use strict';

export default async function handler(req, res) {
  // Basic CORS (safe for same-site too)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { assessmentContext } = req.body || {};
    if (!assessmentContext) {
      return res.status(400).json({ error: 'assessmentContext is required' });
    }

    const systemPrompt = `You are Coach Sarah, a compassionate trauma-informed wellness coach specializing in PTSD recovery and lifestyle medicine.
Generate a personalized recovery prescription based on the user's assessment.
Be warm, hopeful, and specific. Include:
1) Personal acknowledgment
2) 3–4 key focus areas based on responses
3) Specific, actionable steps for the next 2 weeks
4) Crisis support if needed
5) Encouragement
Keep it under 500 words. Use "you" language.`;

    const userPrompt = `Create a personalized recovery prescription from this data:\n\n${assessmentContext}\n\nFocus on strengths and clear next steps.`;

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.8
      })
    });

    if (!r.ok) {
      const details = await r.text();
      return res.status(r.status).json({ error: 'Groq error', details });
    }

    const data = await r.json();
    const prescription = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ prescription });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}
