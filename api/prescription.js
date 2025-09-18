// /api/prescription.js - AI-Generated Health Recommendations

export default async function handler(req, res) {
  // Enable CORS
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
    const { 
      assessmentData, 
      symptoms = [], 
      goals = [],
      riskFactors = [],
      currentConditions = []
    } = req.body;

    if (!assessmentData) {
      return res.status(400).json({ error: 'Assessment data is required' });
    }

    // Use Groq to generate personalized health recommendations
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API service not configured' });
    }

    // Build context for AI prescription generation
    const contextPrompt = `
Generate a comprehensive, personalized health and wellness prescription based on:

Assessment Scores:
${Object.entries(assessmentData.responses || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}

Risk Factors: ${riskFactors.join(', ') || 'None identified'}
Current Symptoms: ${symptoms.join(', ') || 'None reported'}
Health Goals: ${goals.join(', ') || 'General wellness'}
Existing Conditions: ${currentConditions.join(', ') || 'None reported'}

Create a structured prescription with:
1. Immediate priorities (top 3)
2. Lifestyle modifications 
3. Nutrition recommendations
4. Mental health support
5. Physical wellness plan
6. Follow-up timeline

Be specific, actionable, and trauma-informed. Include crisis resources if mental health risks are detected.
`;

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
            content: 'You are a compassionate AI health advisor creating personalized wellness prescriptions. Be specific, actionable, and always emphasize professional medical consultation for serious concerns.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9
      })
    });

    if (!groqResponse.ok) {
      throw new Error('Failed to generate prescription');
    }

    const groqData = await groqResponse.json();
    const aiPrescription = groqData.choices[0].message.content;

    // Structure the response
    const prescription = {
      id: `prescription_${Date.now()}`,
      patientSummary: {
        riskLevel: calculateRiskLevel(assessmentData),
        primaryConcerns: identifyPrimaryConcerns(assessmentData, symptoms),
        strengths: identifyStrengths(assessmentData)
      },
      aiRecommendations: aiPrescription,
      structuredPlan: {
        immediate: generateImmediateActions(assessmentData),
        weekly: generateWeeklyPlan(assessmentData),
        monthly: generateMonthlyGoals(assessmentData)
      },
      resources: {
        crisis: [
          { name: 'UK Samaritans', contact: '116 123', available: '24/7' },
          { name: 'US Crisis Lifeline', contact: '988', available: '24/7' },
          { name: 'Emergency Services', contact: '999/911', available: '24/7' }
        ],
        support: [
          { name: 'Mind UK', url: 'https://www.mind.org.uk', type: 'Mental Health' },
          { name: 'NHS 111', contact: '111', type: 'Health Advice' },
          { name: 'PTSD UK', url: 'https://www.ptsduk.org', type: 'Trauma Support' }
        ]
      },
      followUp: {
        checkIn: '1 week',
        reassessment: '4 weeks',
        professionalReferral: shouldRecommendProfessional(assessmentData)
      },
      timestamp: new Date().toISOString(),
      disclaimer: 'This AI-generated prescription is for educational purposes only and does not replace professional medical advice. Please consult with healthcare providers for personalized treatment.'
    };

    res.status(200).json({
      success: true,
      prescription: prescription
    });

  } catch (error) {
    console.error('Prescription API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Prescription generation failed'
    });
  }
}

// Helper functions
function calculateRiskLevel(assessmentData) {
  const responses = assessmentData.responses || {};
  let riskScore = 0;

  // Higher risk indicators
  if (responses.mental_health <= 1) riskScore += 3;
  if (responses.ptsd_trauma >= 3) riskScore += 3;
  if (responses.anxiety_stress >= 4) riskScore += 2;
  if (responses.sleep <= 2) riskScore += 1;
  if (responses.social_support <= 2) riskScore += 1;

  if (riskScore >= 6) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

function identifyPrimaryConcerns(assessmentData, symptoms) {
  const concerns = [];
  const responses = assessmentData.responses || {};

  if (responses.mental_health <= 1) concerns.push('Mental health crisis risk');
  if (responses.ptsd_trauma >= 3) concerns.push('Trauma/PTSD symptoms');
  if (responses.anxiety_stress >= 4) concerns.push('High anxiety/stress levels');
  if (responses.sleep <= 2) concerns.push('Sleep disturbances');

  return concerns.slice(0, 3); // Top 3 concerns
}

function identifyStrengths(assessmentData) {
  const strengths = [];
  const responses = assessmentData.responses || {};

  if (responses.coping_resilience >= 4) strengths.push('Strong coping skills');
  if (responses.social_support >= 4) strengths.push('Good social support');
  if (responses.physical_health >= 4) strengths.push('Good physical health');
  if (responses.life_satisfaction >= 4) strengths.push('High life satisfaction');

  return strengths;
}

function generateImmediateActions(assessmentData) {
  const actions = [];
  const responses = assessmentData.responses || {};

  if (responses.mental_health <= 1) {
    actions.push('Contact mental health crisis support immediately');
  }
  if (responses.sleep <= 2) {
    actions.push('Establish consistent sleep routine tonight');
  }
  if (responses.anxiety_stress >= 4) {
    actions.push('Practice grounding technique (5-4-3-2-1 method)');
  }

  return actions;
}

function generateWeeklyPlan(assessmentData) {
  return [
    'Complete daily mood tracking',
    'Practice 10 minutes of mindfulness/meditation',
    'Engage in 30 minutes of physical activity 3x per week',
    'Connect with support person at least twice',
    'Maintain consistent sleep schedule'
  ];
}

function generateMonthlyGoals(assessmentData) {
  return [
    'Complete comprehensive health check-up',
    'Establish regular therapy/counseling if recommended',
    'Build sustainable wellness routine',
    'Reassess and adjust health goals'
  ];
}

function shouldRecommendProfessional(assessmentData) {
  const responses = assessmentData.responses || {};

  return responses.mental_health <= 1 || 
         responses.ptsd_trauma >= 3 || 
         responses.chronic_illness >= 3;
}
