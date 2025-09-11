const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  // No key yet? Still return a helpful follow-up so the UI works.
  return res.status(200).json({ followUp: fallback });
}

// Call Groq (OpenAI-compatible API)
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
        content: 'You are a gentle, trauma-informed coach named Sarah. Ask ONE concise, compassionate follow-up question based on the user’s response. Avoid medical advice.'
      },
      {
        role: 'user',
        content: `Question: ${currentQuestion}\nUser response: ${userResponse}\nAsk ONE short, compassionate follow-up question.`
      }
    ]
  })
});

const data = await r.json().catch(() => ({}));

if (!r.ok) {
  console.error('Groq error', r.status, data);
  return res.status(200).json({ followUp: fallback });
}

const followUp = (data?.choices?.[0]?.message?.content || '').trim() || fallback;
return res.status(200).json({ followUp });
