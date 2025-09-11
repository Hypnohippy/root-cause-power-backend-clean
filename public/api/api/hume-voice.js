// Hume Voice AI Integration for Revolutionary PTSD Support Platform
export default async function handler(req, res) {
    // Set CORS headers for browser access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { audioData, sessionId, userId } = req.body;
        const humeApiKey = process.env.HUME_API_KEY;
        
        if (!humeApiKey) {
            // Demo mode when no API key is configured
            return res.status(200).json({
                success: true,
                emotionalAnalysis: generateDemoAnalysis(),
                therapeuticResponse: generateDemoTherapeuticResponse(),
                sessionId: sessionId || 'demo_session_' + Date.now(),
                timestamp: new Date().toISOString(),
                demo: true,
                message: 'Demo mode - add HUME_API_KEY to Vercel for live voice analysis'
            });
        }
        
        // Live Hume API integration
        const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
            method: 'POST',
            headers: {
                'X-Hume-Api-Key': humeApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                models: {
                    prosody: {}
                },
                transcription: {
                    language: "en"
                },
                files: [{
                    data: audioData,
                    filename: `voice_session_${sessionId}.wav`
                }]
            })
        });
        
        if (!humeResponse.ok) {
            throw new Error(`Hume API error: ${humeResponse.statusText}`);
        }
        
        const result = await humeResponse.json();
        
        // Extract emotional insights
        const emotionalAnalysis = processHumeResults(result);
        
        // Generate personalized therapeutic response
        const therapeuticResponse = await generateTherapeuticResponse(emotionalAnalysis, userId);
        
        return res.status(200).json({
            success: true,
            emotionalAnalysis,
            therapeuticResponse,
            sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Hume Voice API Error:', error);
        return res.status(500).json({ 
            error: 'Voice analysis failed',
            fallback: generateFallbackResponse()
        });
    }
}

function generateDemoAnalysis() {
    return {
        dominantEmotions: [
            { name: 'Calm', score: 0.7, timestamp: Date.now() },
            { name: 'Hope', score: 0.6, timestamp: Date.now() },
            { name: 'Determined', score: 0.5, timestamp: Date.now() }
        ],
        stressLevel: 0.3,
        anxietyMarkers: [],
        ptsdIndicators: [],
        voiceStability: 0.8,
        therapeuticNeeds: ['relaxation', 'positive_reinforcement']
    };
}

function generateDemoTherapeuticResponse() {
    return {
        supportMessage: "I can hear the strength in your voice today. You're taking such positive steps in your healing journey, and that takes real courage.",
        copingTechniques: [
            "Deep breathing exercises",
            "Progressive muscle relaxation", 
            "Mindful meditation"
        ],
        immediateActions: [
            "Take three deep, calming breaths",
            "Notice five things around you that bring you peace",
            "Remind yourself: 'I am safe, I am strong, I am healing'"
        ],
        progressNotes: "Voice analysis shows emotional stability and positive engagement. Continue current wellness practices."
    };
}

function processHumeResults(humeData) {
    // Process Hume's emotional analysis results
    const emotions = humeData.predictions?.[0]?.models?.prosody?.grouped_predictions?.[0]?.predictions || [];
    
    const emotionalProfile = {
        dominantEmotions: [],
        stressLevel: 0,
        anxietyMarkers: [],
        ptsdIndicators: [],
        voiceStability: 0,
        therapeuticNeeds: []
    };
    
    // Analyze emotions for PTSD-specific patterns
    emotions.forEach(prediction => {
        const emotions = prediction.emotions || [];
        
        emotions.forEach(emotion => {
            if (emotion.score > 0.6) {
                emotionalProfile.dominantEmotions.push({
                    name: emotion.name,
                    score: emotion.score,
                    timestamp: prediction.time
                });
                
                // PTSD-specific markers
                if (['Fear', 'Anxiety', 'Distress', 'Sadness'].includes(emotion.name)) {
                    emotionalProfile.ptsdIndicators.push({
                        type: emotion.name,
                        intensity: emotion.score
                    });
                }
                
                // Stress level calculation
                if (['Stress', 'Anxiety', 'Fear', 'Anger'].includes(emotion.name)) {
                    emotionalProfile.stressLevel += emotion.score;
                }
            }
        });
    });
    
    // Normalize stress level
    emotionalProfile.stressLevel = Math.min(emotionalProfile.stressLevel / 4, 1);
    
    return emotionalProfile;
}

async function generateTherapeuticResponse(emotionalAnalysis, userId) {
    // Create personalized therapeutic response based on voice analysis
    const { dominantEmotions, stressLevel, ptsdIndicators } = emotionalAnalysis;
    
    let response = {
        supportMessage: "",
        copingTechniques: [],
        immediateActions: [],
        progressNotes: ""
    };
    
    if (stressLevel > 0.7) {
        response.supportMessage = "I can hear the stress in your voice, and I want you to know that you're not alone in this moment. Your feelings are valid, and together we can work through this.";
        response.immediateActions = [
            "Take 3 deep breaths with me right now",
            "Ground yourself by naming 5 things you can see",
            "Remember: This feeling is temporary and will pass"
        ];
    } else if (stressLevel > 0.4) {
        response.supportMessage = "I notice some tension in your voice. Let's focus on bringing you back to a calmer state with some gentle techniques.";
        response.copingTechniques = [
            "Progressive muscle relaxation",
            "Guided breathing exercise",
            "Mindful observation technique"
        ];
    } else {
        response.supportMessage = "Your voice sounds relatively calm today. This is a good time to practice preventative techniques and build resilience.";
        response.copingTechniques = [
            "Gratitude reflection",
            "Strength identification exercise", 
            "Future planning visualization"
        ];
    }
    
    // PTSD-specific support
    if (ptsdIndicators.length > 0) {
        response.ptsdSupport = {
            detected: true,
            techniques: [
                "EMDR breathing pattern",
                "Safe place visualization",
                "Bilateral stimulation exercise"
            ]
        };
    }
    
    return response;
}

function generateFallbackResponse() {
    return {
        supportMessage: "I'm here to listen and support you, even when technology has hiccups. Your voice and feelings matter.",
        copingTechniques: [
            "Deep breathing (4-7-8 technique)",
            "Grounding through your senses",
            "Self-compassion reminder"
        ],
        immediateActions: [
            "Take a moment to pause",
            "Notice your surroundings", 
            "Remember you are safe right now"
        ]
    };
}
