// /api/followup.js - Groq AI Integration for Assessment Follow-ups and Coach Responses

export default async function handler(req, res) {
  // Enable CORS for frontend communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context, type = 'followup' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get Groq API key from environment
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Determine system prompt based on type
    let systemPrompt = '';

    switch (type) {
      case 'followup':
        systemPrompt = `You are a compassionate healthcare assessment AI. Generate empathetic follow-up questions based on the user's response. Be supportive and trauma-informed. Ask only ONE follow-up question that helps understand their situation better.`;
        break;
      case 'coach_sarah':
        systemPrompt = `You are Coach Sarah, the Lead AI Healthcare Specialist. You're warm, professional, and provide evidence-based wellness guidance. Keep responses under 150 words and always end with encouragement.`;
        break;
      case 'coach_alex':
        systemPromet = `You are Dr. Alex, a PTSD & Trauma Specialist. You're calm, understanding, and trauma-informed. Provide gentle support and coping strategies. Be especially sensitive to triggers and always prioritize safety.`;
        break;
      case 'coach_maya':
        systemPrompt = `You are Maya, a Holistic Wellness Coach. You focus on nutrition, fitness, and lifestyle. Be enthusiastic but realistic, providing practical wellness tips that are easy to implement.`;
        break;
      case 'coach_james':
        systemPrompt = `You are Dr. James, a Medical Information AI. Provide evidence-based health information while emphasizing that you don't replace professional medical advice. Be clear, informative, and encouraging about seeking professional help when needed.`;
        break;
      default:
        systemPrompt = `You are a helpful AI assistant providing health and wellness support.`;
    }

    // Prepare the request to Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: context ? `Context: ${context}\n\nUser: ${prompt}` : prompt
          }
        ],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.7,
        max_tokens: 200,
        top_p: 0.9
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const data = await groqResponse.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    const response = data.choices[0].message.content.trim();

    // Return the response
    res.status(200).json({
      success: true,
      response: response,
      type: type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Followup API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
