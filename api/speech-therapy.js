// /api/speech-therapy.js - Advanced Speech Processing and Therapeutic Guidance

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
    const { audioData, analysisType = 'general', sessionId } = req.body;

    // Speech analysis patterns (mock implementation for now)
    const speechAnalysis = {
      clarity: Math.random() * 0.4 + 0.6, // 0.6-1.0
      pace: Math.random() * 0.5 + 0.5, // 0.5-1.0  
      volume: Math.random() * 0.3 + 0.7, // 0.7-1.0
      fluency: Math.random() * 0.4 + 0.6, // 0.6-1.0
      confidence: Math.random() * 0.5 + 0.5 // 0.5-1.0
    };

    // Generate therapy recommendations based on analysis
    const recommendations = [];

    if (speechAnalysis.clarity < 0.7) {
      recommendations.push({
        type: 'clarity',
        suggestion: 'Practice articulation exercises focusing on consonant sounds',
        exercise: 'Repeat "Red leather, yellow leather" slowly 5 times'
      });
    }

    if (speechAnalysis.pace < 0.6) {
      recommendations.push({
        type: 'pace',
        suggestion: 'Work on speaking rhythm and pacing',
        exercise: 'Practice reading aloud with deliberate pauses between sentences'
      });
    }

    if (speechAnalysis.volume < 0.8) {
      recommendations.push({
        type: 'volume',
        suggestion: 'Focus on breath support and projection',
        exercise: 'Diaphragmatic breathing: Inhale for 4, hold for 4, exhale for 6'
      });
    }

    // Therapeutic response based on analysis type
    let therapeuticGuidance = '';

    switch (analysisType) {
      case 'ptsd':
        therapeuticGuidance = 'Your speech patterns show signs of processing. This is normal and part of healing. Focus on grounding techniques between speech exercises.';
        break;
      case 'anxiety':
        therapeuticGuidance = 'Detected some tension in speech patterns. Try the 4-7-8 breathing technique before speaking exercises to reduce anxiety.';
        break;
      case 'confidence':
        therapeuticGuidance = 'Building vocal confidence takes time. Your progress is valuable, and each practice session strengthens your voice.';
        break;
      default:
        therapeuticGuidance = 'Your speech analysis is complete. Regular practice with the suggested exercises will help improve your communication confidence.';
    }

    const response = {
      success: true,
      sessionId: sessionId || `session_${Date.now()}`,
      analysis: speechAnalysis,
      recommendations: recommendations,
      therapeuticGuidance: therapeuticGuidance,
      exercises: [
        {
          name: 'Vocal Warm-up',
          duration: '5 minutes',
          instruction: 'Hum gently, then say "Ma-May-My-Mo-Moo" with clear articulation'
        },
        {
          name: 'Breath Control',
          duration: '3 minutes', 
          instruction: 'Count from 1 to 10 on a single breath, focusing on steady airflow'
        },
        {
          name: 'Confidence Building',
          duration: '5 minutes',
          instruction: 'Read positive affirmations aloud with strong, clear voice projection'
        }
      ],
      nextSteps: [
        'Practice recommended exercises daily',
        'Record yourself to track progress',
        'Focus on one area at a time for improvement'
      ],
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Speech Therapy API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Speech analysis failed'
    });
  }
}
