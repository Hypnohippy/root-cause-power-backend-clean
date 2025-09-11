// Speech-to-Speech AI Therapy Session Integration
export default async function handler(req, res) {
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
        const { 
            userMessage, 
            emotionalContext, 
            sessionHistory, 
            userProfile,
            therapyMode = 'supportive' 
        } = req.body;
        
        const groqApiKey = process.env.GROQ_API_KEY;
        const humeApiKey = process.env.HUME_API_KEY;
        
        if (!groqApiKey) {
            // Demo mode when no API key is configured
            return res.status(200).json({
                success: true,
                response: generateDemoTherapeuticResponse(userMessage, therapyMode),
                voiceResponse: null,
                sessionUpdate: {
                    timestamp: new Date().toISOString(),
                    emotionalState: emotionalContext || { stressLevel: 0.3 },
                    therapyProgress: { improvementTrend: 'stable', sessionCount: 1 }
                },
                demo: true,
                message: 'Demo mode - add GROQ_API_KEY to Vercel for live AI therapy'
            });
        }
        
        // Generate therapeutic response using Groq
        const therapeuticResponse = await generateTherapeuticResponse(
            userMessage, 
            emotionalContext, 
            sessionHistory, 
            userProfile, 
            therapyMode,
            groqApiKey
        );
        
        // If Hume is available, generate emotional voice response
        let voiceResponse = null;
        if (humeApiKey) {
            voiceResponse = await generateEmotionalVoiceResponse(
                therapeuticResponse.text,
                emotionalContext,
                humeApiKey
            );
        }
        
        return res.status(200).json({
            success: true,
            response: therapeuticResponse,
            voiceResponse,
            sessionUpdate: {
                timestamp: new Date().toISOString(),
                emotionalState: emotionalContext,
                therapyProgress: calculateTherapyProgress(sessionHistory, emotionalContext)
            }
        });
        
    } catch (error) {
        console.error('Speech Therapy API Error:', error);
        return res.status(500).json({
            error: 'Speech therapy session failed',
            fallback: generateFallbackTherapyResponse()
        });
    }
}

function generateDemoTherapeuticResponse(userMessage, therapyMode) {
    const responses = {
        supportive: {
            text: "I hear you, and I want you to acknowledge the courage it takes to share your feelings. What you're experiencing is valid, and you're taking important steps in your healing journey.",
            techniques: ['deep breathing', 'grounding', 'self-compassion'],
            emotionalTone: 'warm_supportive',
            followUpQuestions: [
                "How are you feeling in your body right now?",
                "What would feel most helpful for you in this moment?"
            ],
            crisisLevel: 'normal'
        },
        cognitive: {
            text: "Let's explore the thoughts that might be contributing to these feelings. Sometimes our minds can create patterns that don't serve us well. What thoughts have been most prominent for you lately?",
            techniques: ['thought challenging', 'cognitive restructuring', 'mindfulness'],
            emotionalTone: 'analytical_caring',
            followUpQuestions: [
                "Can you identify any patterns in these thoughts?",
                "What evidence supports or challenges these thoughts?"
            ],
            crisisLevel: 'normal'
        },
        emdr: {
            text: "I'd like to guide you through some bilateral stimulation techniques that can help process difficult emotions. Let's start with some gentle breathing and safe place visualization.",
            techniques: ['bilateral stimulation', 'safe place visualization', 'resource installation'],
            emotionalTone: 'calm_therapeutic',
            followUpQuestions: [
                "Can you visualize a place where you feel completely safe?",
                "What do you notice in your body as we do this exercise?"
            ],
            crisisLevel: 'normal'
        },
        crisis: {
            text: "I'm here with you right now, and your safety is the most important thing. You're not alone, and these intense feelings will pass. Let's focus on getting you through this moment.",
            techniques: ['grounding', 'crisis management', 'safety planning'],
            emotionalTone: 'urgent_supportive',
            followUpQuestions: [
                "Are you in a safe place right now?",
                "Can you name three things you can see around you?"
            ],
            crisisLevel: 'elevated'
        }
    };
    
    return responses[therapyMode] || responses.supportive;
}

async function generateTherapeuticResponse(userMessage, emotionalContext, sessionHistory, userProfile, therapyMode, apiKey) {
    const systemPrompt = createTherapeuticSystemPrompt(therapyMode, userProfile, emotionalContext);
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...formatSessionHistory(sessionHistory),
        { role: "user", content: userMessage }
    ];
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages,
                max_tokens: 800,
                temperature: 0.7,
                top_p: 0.9
            })
        });
        
        const data = await response.json();
        const therapeuticText = data.choices?.[0]?.message?.content || generateFallbackText();
        
        return {
            text: therapeuticText,
            techniques: extractRecommendedTechniques(therapeuticText),
            emotionalTone: determineEmotionalTone(emotionalContext),
            followUpQuestions: generateFollowUpQuestions(userMessage, emotionalContext),
            crisisLevel: assessCrisisLevel(userMessage, emotionalContext)
        };
        
    } catch (error) {
        console.error('Groq API Error:', error);
        return generateDemoTherapeuticResponse(userMessage, therapyMode);
    }
}

function createTherapeuticSystemPrompt(therapyMode, userProfile, emotionalContext) {
    const basePrompt = `You are an AI therapy assistant specializing in PTSD support and trauma-informed care. You provide empathetic, evidence-based therapeutic responses.`;
    
    const modePrompts = {
        supportive: `Focus on validation, emotional support, and gentle coping techniques. Use a warm, understanding tone.`,
        cognitive: `Utilize CBT techniques to help identify and reframe negative thought patterns. Guide the user through cognitive restructuring.`,
        emdr: `Incorporate EMDR principles with bilateral stimulation guidance and safe place visualization techniques.`,
        crisis: `Provide immediate crisis support with grounding techniques, safety planning, and emergency resource information.`,
        somatic: `Focus on body awareness, breathing techniques, and somatic experiencing approaches to trauma recovery.`
    };
    
    const emotionalGuidance = emotionalContext?.stressLevel > 0.7 
        ? `The user is experiencing high stress levels. Prioritize immediate calming and grounding techniques.`
        : `The user appears relatively stable. Focus on skill-building and processing techniques.`;
    
    return `${basePrompt}
    
    Current Therapy Mode: ${modePrompts[therapyMode] || modePrompts.supportive}
    
    User Context: ${userProfile?.traumaHistory ? 'User has disclosed trauma history' : 'New user or no trauma history disclosed'}
    
    Emotional State: ${emotionalGuidance}
    
    Guidelines:
    - Always validate the user's experience
    - Provide concrete, actionable techniques
    - Monitor for crisis indicators
    - Maintain therapeutic boundaries
    - Use trauma-informed language
    - Offer hope and encouragement
    - Never diagnose or provide medical advice
    
    Respond with empathy, practical support, and evidence-based techniques appropriate for the current emotional state.`;
}

function formatSessionHistory(sessionHistory) {
    if (!sessionHistory || sessionHistory.length === 0) return [];
    
    return sessionHistory.slice(-6).map(session => ({
        role: session.role || (session.isUser ? 'user' : 'assistant'),
        content: session.message || session.content || ''
    }));
}

function extractRecommendedTechniques(text) {
    const techniques = [];
    const techniquePhrases = [
        'breathing exercise', 'grounding technique', 'progressive muscle relaxation',
        'mindfulness', 'visualization', 'bilateral stimulation', 'safe place',
        'thought challenging', 'cognitive restructuring', 'body scan'
    ];
    
    techniquePhrases.forEach(phrase => {
        if (text.toLowerCase().includes(phrase)) {
            techniques.push(phrase);
        }
    });
    
    return techniques;
}

function determineEmotionalTone(emotionalContext) {
    if (!emotionalContext) return 'neutral';
    
    const { stressLevel, dominantEmotions = [] } = emotionalContext;
    
    if (stressLevel > 0.8) return 'crisis-support';
    if (stressLevel > 0.6) return 'calming';
    if (dominantEmotions.some(e => e.name === 'Sadness')) return 'compassionate';
    if (dominantEmotions.some(e => e.name === 'Anxiety')) return 'reassuring';
    
    return 'supportive';
}

function generateFollowUpQuestions(userMessage, emotionalContext) {
    const questions = [
        "How are you feeling in your body right now?",
        "What would feel most helpful for you in this moment?",
        "Is there a safe place you can visualize or go to?",
        "What coping strategies have worked for you before?"
    ];
    
    if (emotionalContext?.stressLevel > 0.7) {
        return [
            "Can you take three deep breaths with me?",
            "What five things can you see around you right now?",
            "Are you in a safe place physically?"
        ];
    }
    
    return questions.slice(0, 2);
}

function assessCrisisLevel(userMessage, emotionalContext) {
    const crisisKeywords = ['hurt myself', 'end it all', 'can\'t go on', 'suicide', 'kill myself'];
    const hasCrisisKeywords = crisisKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
    );
    
    const highStress = emotionalContext?.stressLevel > 0.8;
    
    if (hasCrisisKeywords) return 'immediate';
    if (highStress) return 'elevated';
    return 'normal';
}

async function generateEmotionalVoiceResponse(text, emotionalContext, humeApiKey) {
    // This would integrate with Hume's voice synthesis with emotional modulation
    // For now, return configuration for voice synthesis
    return {
        text: text,
        emotionalTone: determineEmotionalTone(emotionalContext),
        voiceConfig: {
            speed: emotionalContext?.stressLevel > 0.7 ? 0.8 : 1.0,
            pitch: 'warm',
            style: 'therapeutic'
        }
    };
}

function calculateTherapyProgress(sessionHistory, currentEmotional) {
    if (!sessionHistory || sessionHistory.length < 2) return null;
    
    const recentSessions = sessionHistory.slice(-5);
    const avgStress = recentSessions.reduce((sum, session) => 
        sum + (session.emotionalState?.stressLevel || 0), 0) / recentSessions.length;
    
    return {
        averageStressLevel: avgStress,
        sessionCount: sessionHistory.length,
        improvementTrend: avgStress < 0.5 ? 'improving' : 'needs-focus',
        recommendedFocus: avgStress > 0.7 ? 'crisis-management' : 'skill-building'
    };
}

function generateFallbackTherapyResponse() {
    return {
        text: "I'm experiencing some technical difficulties, but I want you to know that I'm here for you. Your feelings are valid, and you deserve support. Let's focus on some grounding techniques together.",
        techniques: ['deep breathing', 'grounding'],
        followUpQuestions: [
            "Can you tell me three things you can see right now?",
            "How are you feeling in this moment?"
        ],
        crisisLevel: 'normal'
    };
}

function generateFallbackText() {
    return "I hear you, and I want you to know that your experience matters. While I'm having some technical difficulties, let's focus on what's most important right now - your wellbeing. Take a deep breath with me, and remember that you're not alone in this journey.";
}
