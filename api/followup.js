'use strict';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { currentQuestion, userResponse } = req.body || {};
    if (!currentQuestion) return res.status(400).json({ error: 'currentQuestion is required' });

    const systemPrompt = 'You are a compassionate, trauma-informed coach conducting a sensitive PTSD assessment.';
    const userPrompt = `
Current Question: "${currentQuestion}"
User's Response: ${typeof userResponse === 'string' ? userResponse : JSON.stringify(userResponse || '')}
Generate ONE brief, caring follow-up question (max 20 words). Be gentle, non-judgmental, trauma-informed, focused on understanding—not diagnosing. Only return the question.`.trim();

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
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'Groq error', details: t });
    }

    const data = await r.json();
    const followUp = data?.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ followUp });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}
