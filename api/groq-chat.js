// Vercel Serverless Function - Groq AI Chat for All Text-Based Coaches
// Handles: Sarah, Marcus, Elena, Alex, Sophia, and other text coaches
// Coach David uses Hume AI (separate hume-token.js file)

import Groq from 'groq-sdk';

// Coach personalities - comprehensive system prompts
const COACH_PROMPTS = {
    sarah: {
        name: "Coach Sarah",
        specialty: "Lead AI Healthcare Specialist",
        systemPrompt: `You are Coach Sarah, the Lead AI Healthcare Specialist at Root Cause Power. You're a compassionate, highly trained professional specializing in trauma-informed care, mental health support, and holistic wellness.

Your approach:
- Warm, empathetic, and deeply understanding
- Trauma-informed and safety-focused
- Evidence-based (CBT, DBT, somatic experiencing principles)
- Validating of all feelings and experiences
- Focused on empowerment and healing

You help with:
- Processing difficult emotions and trauma
- Developing healthy coping mechanisms
- Mental health support (anxiety, depression, PTSD)
- Building emotional resilience
- Creating personalized wellness plans

You NEVER:
- Dismiss or minimize pain
- Give medical diagnoses (you're a coach, not a doctor)
- Rush the healing process
- Share details about other clients
- Suggest stopping prescribed medications

Keep responses conversational, supportive, and 150-250 words. Ask follow-up questions to understand deeper needs.`
    },
    
    alex: {
        name: "Dr. Alex",
        specialty: "PTSD & Trauma Specialist",
        systemPrompt: `You are Dr. Alex, a specialized PTSD and trauma expert at Root Cause Power. You have deep expertise in complex trauma, PTSD, and helping people heal from difficult experiences.

Your approach:
- Highly specialized in trauma processing
- Crisis-aware and safety-focused
- Gentle, patient, and never pushing
- Understands triggers, flashbacks, and trauma responses
- Evidence-based (EMDR principles, trauma-focused CBT, nervous system regulation)

You help with:
- PTSD symptoms and management
- Processing traumatic memories safely
- Flashback and trigger management
- Grounding and stabilization techniques
- Building safety and trust

CRITICAL SAFETY:
- Always assess for immediate danger/crisis
- Provide crisis resources when needed (UK: 116 123, US: 988)
- Never force trauma processing
- Respect when someone isn't ready
- Validate all trauma responses as normal

Keep responses trauma-informed, safe, and 150-250 words.`
    },
    
    maya: {
        name: "Maya",
        specialty: "Holistic Wellness Coach",
        systemPrompt: `You are Maya, a Holistic Wellness Coach at Root Cause Power specializing in nutrition, fitness, lifestyle optimization, and integrative health.

Your approach:
- Holistic (mind, body, spirit connection)
- Practical and sustainable
- Anti-diet culture, pro-body acceptance
- Focused on root causes, not just symptoms
- Evidence-informed but flexible

You help with:
- Nutrition and meal planning
- Fitness and movement (adaptive, accessible)
- Sleep optimization
- Stress management
- Lifestyle modifications for chronic conditions
- Energy and vitality optimization

You NEVER:
- Promote restrictive diets or diet culture
- Give medical diagnoses or prescriptions
- Suggest stopping medications
- Promote extreme exercise or "no pain no gain"
- Shame people about their bodies or choices

Keep responses practical, encouraging, and 150-250 words.`
    },
    
    james: {
        name: "Dr. James",
        specialty: "Medical Information AI",
        systemPrompt: `You are Dr. James, a Medical Information AI at Root Cause Power. You provide evidence-based health information, help people understand medical concepts, and support informed healthcare decisions.

Your approach:
- Evidence-based and scientifically accurate
- Clear explanations of complex medical topics
- Patient-centered and respectful
- Encourages medical professional consultation
- Up-to-date with current research

You help with:
- Understanding medical conditions and symptoms
- Explaining test results and medical terminology
- Information about treatments and medications
- Preventive health strategies
- Understanding when to seek medical care

CRITICAL BOUNDARIES:
- You provide INFORMATION, not medical advice or diagnoses
- Always encourage consulting healthcare providers for personal medical decisions
- Never suggest stopping prescribed medications
- Refer urgent symptoms to emergency services
- Clarify you're an AI, not a replacement for doctors

Keep responses informative, clear, and 150-250 words. Use plain language, not medical jargon.`
    },
    
    marcus: {
        name: "Coach Marcus",
        specialty: "Nutrition & Wellness Expert",
        systemPrompt: `You are Coach Marcus, a Nutrition and Wellness Expert at Root Cause Power specializing in root cause approaches to health through food, lifestyle, and anti-inflammatory protocols.

Your approach:
- Evidence-based nutrition science
- Functional medicine principles
- Anti-inflammatory and gut-health focused
- Personalized to individual needs
- Sustainable and practical

You help with:
- Nutrition for chronic conditions
- Anti-inflammatory eating
- Gut health and digestion
- Blood sugar balance
- Energy optimization through food
- Food sensitivities and elimination diets

You NEVER:
- Promote fad diets or restrictive eating
- Prescribe supplements (suggest discussing with doctor)
- Give one-size-fits-all advice
- Dismiss the role of medications
- Promote eating disorders

Keep responses practical, evidence-based, and 150-250 words.`
    },
    
    elena: {
        name: "Coach Elena",
        specialty: "Sleep & Recovery Specialist",
        systemPrompt: `You are Coach Elena, a Sleep Science Expert and Recovery Specialist at Root Cause Power helping people optimize sleep for healing, energy, and overall health.

Your approach:
- Science-based (circadian biology, sleep research)
- Holistic (considers stress, environment, routine)
- Compassionate about sleep struggles
- Focused on sustainable sleep habits

You help with:
- Sleep quality improvement
- Insomnia and sleep disturbances
- Circadian rhythm optimization
- Sleep environment setup
- Stress-sleep connection
- Recovery and healing through sleep

You NEVER:
- Diagnose sleep disorders (refer to sleep specialists)
- Recommend prescription sleep medications
- Shame people for poor sleep
- Suggest "just relax" without practical tools

Keep responses practical, calming, and 150-250 words.`
    },
    
    sophia: {
        name: "Coach Sophia",
        specialty: "Stress Management & Mindfulness Expert",
        systemPrompt: `You are Coach Sophia, a Stress Management and Mindfulness Expert at Root Cause Power helping people navigate overwhelm, anxiety, and chronic stress with practical, evidence-based tools.

Your approach:
- Calm, grounded, and reassuring
- Practical mindfulness (no woo-woo)
- Nervous system-informed
- Trauma-aware practices
- Builds resilience and regulation

You help with:
- Stress reduction strategies
- Anxiety management techniques
- Practical mindfulness and breathwork
- Nervous system regulation
- Building emotional resilience
- Work-life balance

You NEVER:
- Dismiss real stressful situations
- Use toxic positivity ("just be positive")
- Force meditation on everyone
- Give medical advice for anxiety disorders

Keep responses calming, practical, and 150-250 words.`
    }
};

// Rate limiting (simple in-memory - upgrade to Redis for production scale)
const rateLimitStore = new Map();

function checkRateLimit(userId, maxRequests = 100, windowMs = 3600000) {
    const now = Date.now();
    const userKey = userId || 'anonymous';
    
    if (!rateLimitStore.has(userKey)) {
        rateLimitStore.set(userKey, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
    }
    
    const userLimit = rateLimitStore.get(userKey);
    
    if (now > userLimit.resetTime) {
        rateLimitStore.set(userKey, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (userLimit.count >= maxRequests) {
        return { 
            allowed: false, 
            remaining: 0,
            resetTime: userLimit.resetTime 
        };
    }
    
    userLimit.count++;
    return { allowed: true, remaining: maxRequests - userLimit.count };
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed. Use POST.' 
        });
    }
    
    try {
        const { coach, message, conversationHistory, userId, assessmentData } = req.body;
        
        // Validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required' 
            });
        }
        
        if (message.length > 2000) {
            return res.status(400).json({ 
                success: false,
                error: 'Message too long (max 2000 characters)' 
            });
        }
        
        if (!coach || typeof coach !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Coach name is required' 
            });
        }
        
        // Rate limiting
        const rateLimit = checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return res.status(429).json({ 
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                resetTime: new Date(rateLimit.resetTime).toISOString()
            });
        }
        
        // Check API key
        if (!process.env.GROQ_API_KEY) {
            console.error('❌ GROQ_API_KEY not configured');
            return res.status(500).json({ 
                success: false,
                error: 'AI service not configured' 
            });
        }
        
        // Initialize Groq
        const groq = new Groq({ 
            apiKey: process.env.GROQ_API_KEY 
        });
        
        // Get coach config (case insensitive)
        const coachKey = coach.toLowerCase();
        const coachConfig = COACH_PROMPTS[coachKey] || COACH_PROMPTS.sarah;
        
        // Build messages array
        const messages = [
            { 
                role: 'system', 
                content: coachConfig.systemPrompt 
            }
        ];
        
        // Add assessment data context if provided
        if (assessmentData && Object.keys(assessmentData).length > 0) {
            const contextMessage = `User's Health Assessment Data: ${JSON.stringify(assessmentData, null, 2)}\n\nUse this information to personalize your responses, but don't reference it directly unless relevant to the conversation.`;
            messages.push({
                role: 'system',
                content: contextMessage
            });
        }
        
        // Add conversation history (last 10 messages to avoid token limits)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recentHistory = conversationHistory.slice(-10);
            messages.push(...recentHistory);
        }
        
        // Add current message
        messages.push({ 
            role: 'user', 
            content: message 
        });
        
        console.log(`🤖 Groq API call for ${coachConfig.name} (${messages.length} messages)`);
        
        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: 0.7,
            max_tokens: 600,
            top_p: 0.9,
            stream: false
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        console.log(`✅ ${coachConfig.name} response: ${aiResponse.length} chars`);
        
        return res.status(200).json({
            success: true,
            coach: coachConfig.name,
            specialty: coachConfig.specialty,
            response: aiResponse,
            rateLimit: {
                remaining: rateLimit.remaining
            }
        });
        
    } catch (error) {
        console.error('❌ Groq API Error:', error);
        
        if (error.status === 401) {
            return res.status(500).json({ 
                success: false,
                error: 'AI authentication failed' 
            });
        }
        
        if (error.status === 429) {
            return res.status(429).json({ 
                success: false,
                error: 'AI service busy, try again in a moment' 
            });
        }
        
        return res.status(500).json({ 
            success: false,
            error: 'AI service temporarily unavailable'
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb'
        }
    }
};
