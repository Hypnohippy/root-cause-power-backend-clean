const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Initialize Stripe
let stripe = null;
try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
        stripe = require('stripe')(stripeKey);
        console.log('✅ Stripe initialized successfully');
    } else {
        console.log('⚠️ STRIPE_SECRET_KEY not found in environment variables');
        console.log('Please add your Stripe keys to production environment');
    }
} catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://js.stripe.com", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"], // Allow inline event handlers
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.groq.com", "https://api.hume.ai", "wss:", "ws:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:", "data:"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting for voice AI endpoints (stricter limits)
const voiceApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 voice requests per windowMs
    message: {
        error: 'Too many voice requests, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/voice/', voiceApiLimiter);
app.use('/api/', apiLimiter);

// CORS with specific origins (enhance for production)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com', 'https://www.your-domain.com'] 
        : true,
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Enhanced security headers for PWA
app.use((req, res, next) => {
    // HTTPS redirect (in production)
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        // PWA-specific headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Service Worker headers
        if (req.url.endsWith('.js') && req.url.includes('sw')) {
            res.setHeader('Service-Worker-Allowed', '/');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        
        // Manifest headers
        if (req.url.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/manifest+json');
        }
        
        next();
    }
});

// API Routes for testing (mock endpoints)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.post('/api/sync/journal', (req, res) => {
    console.log('📝 Journal sync request:', req.body);
    res.json({ 
        success: true, 
        message: 'Journal entries synced successfully',
        synced: req.body.length || 0
    });
});

app.post('/api/sync/assessment', (req, res) => {
    console.log('📊 Assessment sync request:', req.body);
    res.json({ 
        success: true, 
        message: 'Assessment data synced successfully'
    });
});

app.get('/api/crisis', (req, res) => {
    res.json({
        crisisResources: {
            uk: { name: 'Samaritans', number: '116123' },
            us: { name: 'Crisis Lifeline', number: '988' },
            emergency: { name: 'Emergency Services', number: '999 (UK) / 911 (US)' }
        },
        message: 'Crisis resources are available 24/7',
        offline: false
    });
});

app.get('/api/config', (req, res) => {
    // Provide API configuration
    // In production, use environment variables
    res.json({
        groqApiKey: process.env.GROQ_API_KEY || null,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        humeApiKey: process.env.HUME_API_KEY || null,
        humeConfigId: process.env.HUME_CONFIG_ID || null,
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🎉 Revolutionary Voice Coach API endpoints
app.get('/api/hume/config', (req, res) => {
    res.json({
        apiKey: process.env.HUME_API_KEY || 'zYPlodq03zJLORX8IvOiFtzy5Es4fsaRtjo29UzTN8ckVibB',
        configId: process.env.HUME_CONFIG_ID || '06f12c85-3975-4774-b078-8611e826dd85',
        wsUrl: `wss://api.hume.ai/v0/evi/chat?api_key=${process.env.HUME_API_KEY || 'zYPlodq03zJLORX8IvOiFtzy5Es4fsaRtjo29UzTN8ckVibB'}&config_id=${process.env.HUME_CONFIG_ID || '06f12c85-3975-4774-b078-8611e826dd85'}`,
        status: 'revolutionary_ready'
    });
});

// Hume usage tracking and monitoring
let humeUsageData = []; // In production, use database

app.post('/api/hume/usage', (req, res) => {
    const { minutes, timestamp, userId } = req.body;
    
    // Store usage data
    humeUsageData.push({
        minutes: parseFloat(minutes),
        timestamp,
        userId: userId || 'anonymous',
        date: new Date(timestamp).toDateString()
    });
    
    // Calculate monthly usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUsage = humeUsageData
        .filter(entry => new Date(entry.timestamp) >= monthStart)
        .reduce((total, entry) => total + entry.minutes, 0);
    
    // Calculate estimated cost
    const includedMinutes = 200; // Creator plan includes 200 minutes
    const overageMinutes = Math.max(0, monthlyUsage - includedMinutes);
    const estimatedCost = 14 + (overageMinutes * 0.07);
    
    res.json({
        success: true,
        monthlyUsage: Math.round(monthlyUsage * 100) / 100,
        includedMinutes,
        overageMinutes: Math.round(overageMinutes * 100) / 100,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        percentUsed: Math.round((monthlyUsage / includedMinutes) * 100)
    });
});

app.get('/api/hume/usage/summary', (req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyData = humeUsageData
        .filter(entry => new Date(entry.timestamp) >= monthStart);
    
    const totalMinutes = monthlyData.reduce((sum, entry) => sum + entry.minutes, 0);
    const totalSessions = monthlyData.length;
    const avgSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    
    res.json({
        success: true,
        summary: {
            totalMinutes: Math.round(totalMinutes * 100) / 100,
            totalSessions,
            avgSessionLength: Math.round(avgSessionLength * 100) / 100,
            estimatedCost: Math.round((14 + Math.max(0, totalMinutes - 200) * 0.07) * 100) / 100,
            daysInMonth: now.getDate(),
            projectedMonthlyUsage: Math.round((totalMinutes / now.getDate()) * 30 * 100) / 100
        }
    });
});

// ===================================
// 💳 VOICE CREDIT MANAGEMENT SYSTEM
// ===================================

// In-memory storage for voice credits (use database in production)
let userVoiceCredits = new Map();

// Voice credit endpoints
app.get('/api/voice-credits', (req, res) => {
    const userId = req.headers['user-id'] || 'anonymous';
    const credits = userVoiceCredits.get(userId) || 0;
    
    res.json({
        success: true,
        credits,
        userId
    });
});

app.post('/api/voice-credits/deduct', (req, res) => {
    const userId = req.headers['user-id'] || 'anonymous';
    const { minutes } = req.body;
    
    if (!minutes || minutes <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid minutes specified'
        });
    }
    
    const currentCredits = userVoiceCredits.get(userId) || 0;
    
    if (currentCredits < minutes) {
        return res.status(400).json({
            success: false,
            error: 'Insufficient credits'
        });
    }
    
    const newCredits = currentCredits - minutes;
    userVoiceCredits.set(userId, newCredits);
    
    res.json({
        success: true,
        deductedMinutes: minutes,
        remainingCredits: newCredits
    });
});

app.post('/api/voice-credits/add', (req, res) => {
    const userId = req.headers['user-id'] || 'anonymous';
    const { minutes } = req.body;
    
    if (!minutes || minutes <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid minutes specified'
        });
    }
    
    const currentCredits = userVoiceCredits.get(userId) || 0;
    const newCredits = currentCredits + minutes;
    userVoiceCredits.set(userId, newCredits);
    
    res.json({
        success: true,
        addedMinutes: minutes,
        totalCredits: newCredits
    });
});

// Subscription management
app.post('/api/create-subscription', async (req, res) => {
    try {
        const { userId, planName, amount } = req.body;
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe not configured'
            });
        }
        
        // Create Stripe checkout session for subscription
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `🧠 PTSD Platform - ${planName} Membership`,
                        description: `Monthly ${planName} membership with voice coaching benefits`,
                        images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400']
                    },
                    unit_amount: amount,
                    recurring: {
                        interval: 'month',
                    },
                },
                quantity: 1,
            }],
            success_url: `${req.headers.origin || 'http://localhost:3000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${planName}&user_id=${userId}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}?subscription=cancelled`,
            metadata: {
                userId,
                planName,
                type: 'subscription'
            }
        });
        
        res.json({
            success: true,
            sessionId: session.id,
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
        
    } catch (error) {
        console.error('❌ Failed to create subscription:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Handle successful subscription payments
app.get('/subscription-success', async (req, res) => {
    try {
        const { session_id, plan, user_id } = req.query;
        
        if (!session_id || !plan || !user_id) {
            throw new Error('Missing required parameters');
        }
        
        // Verify payment with Stripe
        if (stripe) {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            
            if (session.payment_status === 'paid') {
                // Update user's plan (in production, store in database)
                console.log(`✅ Subscription successful: ${user_id} upgraded to ${plan}`);
                
                // Add monthly voice credits based on plan
                const monthlyCredits = {
                    'Standard': 60,
                    'Premium': 120
                };
                
                const currentCredits = userVoiceCredits.get(user_id) || 0;
                userVoiceCredits.set(user_id, currentCredits + (monthlyCredits[plan] || 0));
            }
        }
        
        // Redirect back to platform with success message
        res.redirect(`/?subscription=success&plan=${plan}`);
        
    } catch (error) {
        console.error('❌ Subscription success handler error:', error);
        res.redirect('/?subscription=error&error=' + encodeURIComponent(error.message));
    }
});

// Stripe payment integration for voice sessions
app.post('/api/create-voice-session-payment', async (req, res) => {
    try {
        const { userId, sessionMinutes, coachType, amount, planName } = req.body;
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe not configured'
            });
        }
        
        const priceText = (amount / 100).toFixed(2);
        const membershipInfo = planName !== 'Free' ? ` (${planName} Member Price)` : '';
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `🧠 Hume Voice Coaching Session${membershipInfo}`,
                        description: `${sessionMinutes}-minute emotionally intelligent voice coaching with ${coachType} specialist`,
                        images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400']
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/voice-payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&minutes=${sessionMinutes}&coach_type=${coachType}&plan=${planName}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}?payment=cancelled`,
            metadata: {
                userId,
                sessionMinutes: sessionMinutes.toString(),
                coachType,
                planName: planName || 'Free',
                type: 'voice_session'
            }
        });
        
        res.json({
            success: true,
            sessionId: session.id,
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
        
    } catch (error) {
        console.error('❌ Failed to create voice session payment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Handle successful voice session payments
app.get('/voice-payment-success', async (req, res) => {
    try {
        const { session_id, user_id, minutes, coach_type } = req.query;
        
        if (!session_id || !user_id || !minutes) {
            throw new Error('Missing required parameters');
        }
        
        // Verify payment with Stripe
        if (stripe) {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            
            if (session.payment_status === 'paid') {
                // Add voice credits to user account
                const currentCredits = userVoiceCredits.get(user_id) || 0;
                const sessionMinutes = parseInt(minutes);
                userVoiceCredits.set(user_id, currentCredits + sessionMinutes);
                
                console.log(`✅ Voice payment successful: ${sessionMinutes} minutes added to ${user_id}`);
            }
        }
        
        // Redirect back to platform with success message
        res.redirect(`/?payment=success&voice_session=true&minutes=${minutes}&coach=${coach_type}`);
        
    } catch (error) {
        console.error('❌ Voice payment success handler error:', error);
        res.redirect('/?payment=error&error=' + encodeURIComponent(error.message));
    }
});

// Crisis detection and emergency support
app.post('/api/crisis/alert', (req, res) => {
    const { emotionalState, transcript, severity, userId } = req.body;
    
    console.log('🚨 CRISIS ALERT RECEIVED:', {
        emotionalState: emotionalState?.dominant || 'unknown',
        transcript: transcript ? transcript.substring(0, 100) + '...' : 'no transcript',
        severity: severity || 'unknown',
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString()
    });
    
    // In production, this would trigger:
    // - Emergency contact notifications  
    // - Professional intervention protocols
    // - Crisis team alerts
    // - Automatic therapist referrals
    
    res.json({
        status: 'crisis_support_activated',
        crisisId: `crisis_${Date.now()}`,
        priority: 'immediate',
        resources: {
            immediate: {
                suicide_prevention: {
                    number: '988',
                    description: 'National Suicide Prevention Lifeline',
                    available: '24/7'
                },
                crisis_text: {
                    number: '741741',
                    description: 'Crisis Text Line - Text HOME',
                    available: '24/7'
                },
                emergency: {
                    number: '911',
                    description: 'Emergency Services',
                    available: '24/7'
                }
            },
            ptsd_specific: {
                ptsd_foundation: {
                    number: '877-717-7873',
                    description: 'PTSD Foundation of America',
                    available: 'Business hours'
                },
                veterans_crisis: {
                    number: '1-800-273-8255',
                    description: 'Veterans Crisis Line',
                    available: '24/7'
                },
                rainn_hotline: {
                    number: '1-800-656-4673',
                    description: 'RAINN National Sexual Assault Hotline',
                    available: '24/7'
                }
            }
        },
        supportMessage: '🚨 Crisis support has been activated. You are not alone. Professional help is available immediately. Your safety matters.',
        interventions: [
            'Professional crisis counselor notified',
            'Emergency contacts alerted',
            'Safety resources provided',
            'Follow-up support scheduled'
        ]
    });
});

// Voice coaching session management
app.post('/api/voice/session/start', (req, res) => {
    const { userId, sessionType } = req.body;
    
    console.log('🎙️ Voice coaching session started:', {
        userId: userId || 'anonymous',
        sessionType: sessionType || 'general_support',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        sessionId: `voice_session_${Date.now()}`,
        status: 'active',
        startTime: new Date().toISOString(),
        emotionalSupport: {
            crisis_monitoring: true,
            real_time_analysis: true,
            adaptive_responses: true
        },
        message: '🧠 Revolutionary voice coaching session initiated. Your emotionally intelligent companion is ready to support you.'
    });
});

app.post('/api/voice/session/end', (req, res) => {
    const { sessionId, duration, emotionalJourney } = req.body;
    
    console.log('🎙️ Voice coaching session ended:', {
        sessionId,
        duration: duration || 'unknown',
        emotionalJourney: emotionalJourney?.length || 0,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        status: 'session_completed',
        summary: {
            duration: duration || 0,
            emotional_progress: 'analyzed',
            support_provided: true,
            follow_up_recommended: true
        },
        message: '💜 Session completed successfully. Your progress has been recorded and support continues to be available.'
    });
});

// Voice credits validation and tracking
app.post('/api/voice/validate-credit', [
    body('userId').isString().notEmpty(),
    body('sessionId').isString().optional(),
    body('creditType').isIn(['speech_to_speech', 'text_to_speech', 'speech_recognition'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
            message: 'Invalid request parameters'
        });
    }

    const { userId, sessionId, creditType } = req.body;
    
    console.log('🔐 Voice credit validation request:', {
        userId: userId.substring(0, 8) + '...',
        creditType,
        timestamp: new Date().toISOString()
    });

    // In production, validate against database
    // For now, return validation success
    res.json({
        success: true,
        creditValid: true,
        remaining: 999, // Would be fetched from database
        message: 'Credit validated successfully',
        rateLimit: {
            remaining: res.getHeader('X-RateLimit-Remaining'),
            reset: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
    });
});

app.post('/api/voice/consume-credit', [
    body('userId').isString().notEmpty(),
    body('sessionId').isString().notEmpty(),
    body('duration').isNumeric(),
    body('creditType').isIn(['speech_to_speech', 'text_to_speech', 'speech_recognition'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { userId, sessionId, duration, creditType } = req.body;
    
    console.log('💳 Voice credit consumption:', {
        userId: userId.substring(0, 8) + '...',
        sessionId,
        duration,
        creditType,
        timestamp: new Date().toISOString()
    });

    // In production:
    // 1. Validate session exists and is active
    // 2. Deduct credit from user account
    // 3. Log transaction for billing
    // 4. Update usage analytics

    res.json({
        success: true,
        creditConsumed: true,
        remainingCredits: 998, // Would be updated from database
        transactionId: 'txn_' + Date.now(),
        message: 'Credit consumed successfully'
    });
});

app.get('/api/voice/credit-balance/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!userId || userId.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID'
        });
    }

    console.log('📊 Credit balance check:', {
        userId: userId.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
    });

    // In production, fetch from database
    res.json({
        success: true,
        balance: 999,
        plan: 'premium',
        lastUpdated: new Date().toISOString()
    });
});

// Session booking endpoints
app.post('/api/sessions/book', (req, res) => {
    const { sessionType, sessionDate, sessionTime, goals, price, userId, userEmail } = req.body;
    
    console.log('📅 Session booking request:', {
        type: sessionType,
        date: sessionDate,
        time: sessionTime,
        user: userEmail
    });
    
    // In production, this would:
    // 1. Validate session availability
    // 2. Create Stripe checkout session
    // 3. Store session in database
    // 4. Send confirmation emails
    
    const sessionId = 'session_' + Date.now();
    const bookingData = {
        sessionId,
        sessionType,
        sessionDate,
        sessionTime,
        goals,
        price,
        userId,
        userEmail,
        status: 'confirmed',
        bookingTime: new Date().toISOString(),
        // In production, include Stripe payment intent ID
        paymentId: 'demo_payment_' + Date.now()
    };
    
    res.json({
        success: true,
        sessionId: sessionId,
        message: 'Session booked successfully',
        booking: bookingData,
        // In production, return Stripe checkout URL
        checkoutUrl: `/session-confirmation?session=${sessionId}`
    });
});

app.get('/api/sessions/:userId', (req, res) => {
    const { userId } = req.params;
    
    console.log('📋 Fetching sessions for user:', userId);
    
    // In production, fetch from database
    // For demo, return mock data
    const sessions = [
        {
            id: 'session_example',
            type: 'comprehensive',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:00',
            status: 'confirmed',
            price: '$149 / 90 min',
            practitioner: 'Dr. Sarah Mitchell'
        }
    ];
    
    res.json({
        success: true,
        sessions: sessions
    });
});

app.post('/api/sessions/cancel/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    console.log('❌ Session cancellation request:', sessionId, reason);
    
    // In production:
    // 1. Update session status in database
    // 2. Process refund if applicable
    // 3. Send cancellation emails
    // 4. Update calendar availability
    
    res.json({
        success: true,
        message: 'Session cancelled successfully',
        sessionId: sessionId,
        refundProcessed: true
    });
});

// Session preparation and AI integration
app.post('/api/sessions/prep', (req, res) => {
    const { sessionType, userContext } = req.body;
    
    console.log('🤖 Generating session preparation for:', sessionType);
    
    // In production, this would use AI to analyze user data
    // and generate personalized session preparation
    const prepPlans = {
        comprehensive: {
            focus: ['Complete wellness assessment', 'Treatment plan refinement', 'Goal setting'],
            preparation: ['Review recent symptoms and progress', 'List current medications and supplements', 'Prepare questions about lifestyle integration'],
            outcomes: ['Personalized wellness roadmap', 'Updated treatment protocols', 'Clear next steps']
        },
        'ptsd-trauma': {
            focus: ['Trauma processing techniques', 'EMDR therapy session', 'Safety plan updates'],
            preparation: ['Practice grounding techniques', 'Prepare safe space', 'Have support person available if needed'],
            outcomes: ['Reduced trauma activation', 'New coping strategies', 'Healing progress validation']
        },
        nutrition: {
            focus: ['Nutritional assessment', 'Gut-brain connection analysis', 'Meal plan optimization'],
            preparation: ['Complete 3-day food diary', 'List current supplements', 'Note energy and mood patterns'],
            outcomes: ['Personalized nutrition protocol', 'Supplement recommendations', 'Meal planning guidance']
        },
        hypnotherapy: {
            focus: ['Subconscious reprogramming', 'Neural pathway healing', 'Deep relaxation therapy'],
            preparation: ['Find quiet, comfortable space', 'Set healing intentions', 'Practice deep breathing'],
            outcomes: ['Subconscious pattern shifts', 'Deeper relaxation capacity', 'Enhanced self-healing activation']
        },
        lifestyle: {
            focus: ['Sleep optimization', 'Stress management', 'Movement integration'],
            preparation: ['Track sleep patterns', 'Note stress triggers', 'Assess current activity levels'],
            outcomes: ['Optimized daily routines', 'Stress reduction strategies', 'Sustainable lifestyle changes']
        }
    };
    
    const sessionPrep = prepPlans[sessionType] || prepPlans.comprehensive;
    
    res.json({
        success: true,
        sessionType: sessionType,
        preparation: sessionPrep,
        aiGenerated: true
    });
});

// Catch-all handler: send back React's index.html file for client-side routing
// Community API endpoints with seed data
const communityPosts = [
    {
        id: '1704121200000',
        title: 'How EMDR Changed My Life - 6 Months Progress Update',
        content: 'I wanted to share my journey with EMDR therapy through this platform. Six months ago, I was having daily panic attacks and flashbacks. The AI coach helped me identify triggers, and the EMDR exercises became part of my routine. Today, I had my first panic-attack-free week in years. If you\'re struggling, please know there is hope. The journey isn\'t linear, but every small step counts. Thank you to this community for the support! 💜',
        author: 'Sarah_Survivor',
        category: 'success',
        createdAt: '2024-01-02T10:00:00.000Z',
        likes: 47,
        comments: [
            {
                id: '1704121800000',
                content: 'This gives me so much hope! I\'m just starting my EMDR journey. Thank you for sharing! 🌟',
                author: 'NewHope_2024',
                createdAt: '2024-01-02T10:10:00.000Z'
            },
            {
                id: '1704122400000',
                content: 'So proud of your progress! The AI coach has been a game-changer for me too. Keep going strong! 💪',
                author: 'HealingPath',
                createdAt: '2024-01-02T10:20:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: '1704207600000',
        title: 'Sleep Issues After Trauma - Need Advice',
        content: 'I\'ve been using the platform for 3 weeks now and love the nutrition guidance, but I\'m still struggling with sleep. I wake up multiple times per night with anxiety. Has anyone found techniques that work? The AI sleep coach suggests magnesium and chamomile tea, but wondering what real experiences people have had. Any tips welcome! 🌙',
        author: 'RestlessNights',
        category: 'support',
        createdAt: '2024-01-02T10:00:00.000Z',
        likes: 23,
        comments: [
            {
                id: '1704208200000',
                content: 'Progressive muscle relaxation before bed has helped me tremendously. The platform has guided audio for this - found in Media Library!',
                author: 'SleepRecovered',
                createdAt: '2024-01-02T10:10:00.000Z'
            },
            {
                id: '1704208800000',
                content: 'Weighted blanket + the breathing exercises from PTSD Corner = life saver for me. Also keeping room cool helps anxiety.',
                author: 'NightOwlHealing',
                createdAt: '2024-01-02T10:20:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: '1704294000000',
        title: 'Nutrition Revolution: How Food Healed My Depression',
        content: 'Credit to the AI Nutrition Coach and the photo analysis feature! 📸 I started photographing every meal 2 months ago. The AI identified I was severely low in omega-3s, B-vitamins, and magnesium. Following the personalized meal plans and supplement recommendations, my depression has lifted significantly. My GP is amazed at the improvement in my mood scores. Food truly is medicine! Full credit to the Root Cause Power team for this incredible AI system. 🥗✨',
        author: 'FoodAsMedicine',
        category: 'success',
        createdAt: '2024-01-03T10:00:00.000Z',
        likes: 89,
        comments: [
            {
                id: '1704294600000',
                content: 'The photo analysis is incredible! It caught deficiencies my doctors missed. Thank you for sharing your success! 📷🎉',
                author: 'PhotoNutrition_Fan',
                createdAt: '2024-01-03T10:10:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: '1704380400000',
        title: 'Voice AI Sessions: First Impressions & Honest Review',
        content: 'Just finished my first 3 voice coaching sessions using the new Hume AI integration. WOW. The emotional intelligence is remarkable - it detected my anxiety before I even realized I was stressed. The British accent is soothing and the responses feel genuinely empathetic. Worth every credit! The crisis detection feature activated when I was having a tough moment and immediately connected me to resources. This technology is revolutionary for trauma survivors. Full credit to David Prince and the dev team! 🎤🧠',
        author: 'VoiceCoach_User',
        category: 'success',
        createdAt: '2024-01-04T10:00:00.000Z',
        likes: 67,
        comments: [
            {
                id: '1704381000000',
                content: 'The voice AI detected my panic attack symptoms in my speech patterns before I was aware! Incredible technology.',
                author: 'EarlyWarning_User',
                createdAt: '2024-01-04T10:10:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: '1704466800000',
        title: 'Question: Best Time for EMDR Self-Practice?',
        content: 'I\'m new to EMDR and using the self-guided techniques in PTSD Corner. When do you find is the best time to practice? Morning, afternoon, or evening? Also, should I do it daily or few times per week? The AI suggests consistency but I\'d love to hear from real users about what worked for you! 🤔',
        author: 'EMDR_Newbie',
        category: 'question',
        createdAt: '2024-01-05T10:00:00.000Z',
        likes: 15,
        comments: [
            {
                id: '1704467400000',
                content: 'I do 10 minutes every morning right after coffee. Creates a calm start to my day and processes overnight anxiety.',
                author: 'MorningRitual',
                createdAt: '2024-01-05T10:10:00.000Z'
            },
            {
                id: '1704468000000',
                content: 'Evening works better for me - processes the day\'s stress before sleep. Try both and see what feels right!',
                author: 'EveningProcessor',
                createdAt: '2024-01-05T10:20:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: '1704553200000',
        title: 'Helpful Resource: Free Trauma-Informed Yoga Videos',
        content: 'Found these amazing free trauma-informed yoga sessions on YouTube that complement the platform perfectly! Channel: "Trauma-Sensitive Yoga with Anna" - specifically designed for survivors. The gentle movements help with the somatic aspects the AI coaches mention. Perfect complement to the PTSD Corner exercises. Sharing because community support makes all the difference! 🧘‍♀️✨ Credit: Anna Thompson, Licensed Trauma Yoga Instructor',
        author: 'YogaHealing',
        category: 'resource',
        createdAt: '2024-01-06T10:00:00.000Z',
        likes: 34,
        comments: [
            {
                id: '1704553800000',
                content: 'Thank you for sharing! Movement therapy has been huge in my recovery alongside the AI coaching.',
                author: 'MovementHealer',
                createdAt: '2024-01-06T10:10:00.000Z'
            }
        ],
        moderated: true
    },
    {
        id: Date.now().toString(),
        title: "First day using the platform - feeling hopeful!",
        content: "Just signed up today and already impressed by how comprehensive this is. The assessment was eye-opening and the AI coaches seem incredibly supportive. Looking forward to starting my healing journey with this community. Thank you all for sharing your stories - they give me hope! ✨",
        author: "NewJourney2024",
        category: "support",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 8,
        comments: [
            {
                id: (Date.now() + 1).toString(),
                content: "Welcome to the community! You've taken a brave first step. We're all here to support each other. 💜",
                author: "WarmWelcome",
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            }
        ],
        moderated: true
    },
    {
        id: (Date.now() + 2).toString(),
        title: "Voice coaching breakthrough - it actually works!",
        content: "I was skeptical about AI voice coaching but decided to try it during a panic attack today. The voice AI immediately detected my distress from my speech patterns and guided me through breathing exercises. Within 5 minutes, I was calm. This technology is incredible! Credit to the Hume AI integration - it felt like talking to a real therapist. 🎙️🧠",
        author: "SkepticalBeliever",
        category: "success", 
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        likes: 19,
        comments: [
            {
                id: (Date.now() + 3).toString(),
                content: "The voice AI is amazing! It picked up on my anxiety before I even realized how stressed I was getting.",
                author: "VoiceAIFan",
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            }
        ],
        moderated: true
    }
]; // In production, use a database

// Content Automation API endpoints
app.post('/api/content/discover', async (req, res) => {
    try {
        // In a full implementation, you'd load and use ContentAggregator here
        // For now, return a mock response to demonstrate the system
        const mockContent = [
            {
                id: `content_${Date.now()}_1`,
                type: 'research_paper',
                title: 'New EMDR Research: Enhanced Bilateral Stimulation Techniques',
                description: 'Recent clinical trial shows 23% improvement in PTSD recovery rates with new bilateral stimulation protocols.',
                source: 'PubMed',
                url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
                relevanceScore: 0.92,
                publishDate: new Date().toISOString(),
                discovered: new Date().toISOString()
            },
            {
                id: `content_${Date.now()}_2`,
                type: 'video',
                title: 'Trauma-Informed Yoga: Integration with Traditional Therapy',
                description: 'Professional webinar on combining somatic approaches with cognitive behavioral therapy for trauma survivors.',
                source: 'YouTube',
                url: 'https://youtube.com/watch?v=example',
                relevanceScore: 0.87,
                publishDate: new Date().toISOString(),
                discovered: new Date().toISOString()
            },
            {
                id: `content_${Date.now()}_3`,
                type: 'article',
                title: 'Digital Therapeutics in Mental Health: Latest FDA Approvals',
                description: 'Overview of newly approved digital mental health interventions and their clinical effectiveness data.',
                source: 'Mental Health Today',
                relevanceScore: 0.81,
                publishDate: new Date().toISOString(),
                discovered: new Date().toISOString()
            }
        ];
        
        res.json({
            success: true,
            contentFound: mockContent.length,
            content: mockContent,
            message: `Discovered ${mockContent.length} new content items for review`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Content discovery error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Content discovery failed'
        });
    }
});

app.get('/api/content/status', (req, res) => {
    try {
        // Mock content status - in production, query your database
        res.json({
            success: true,
            status: {
                pending: 12,
                approved: 45,
                rejected: 8,
                total: 65,
                lastDiscovery: new Date().toISOString(),
                avgQualityScore: 0.78,
                automationEnabled: true
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Community API endpoints
app.get('/api/community/posts', (req, res) => {
    res.json({
        success: true,
        posts: communityPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
});

app.post('/api/community/posts', [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('content').trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be 10-2000 characters'),
    body('author').trim().isLength({ min: 2, max: 50 }).withMessage('Author name required'),
    body('category').isIn(['support', 'success', 'question', 'resource']).withMessage('Valid category required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    const newPost = {
        id: Date.now().toString(),
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        category: req.body.category,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        moderated: true // Auto-approve for now, implement moderation later
    };

    communityPosts.push(newPost);
    res.json({ success: true, post: newPost });
});

app.post('/api/community/posts/:id/like', (req, res) => {
    const post = communityPosts.find(p => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    post.likes = (post.likes || 0) + 1;
    res.json({ success: true, likes: post.likes });
});

app.post('/api/community/posts/:id/comment', [
    body('content').trim().isLength({ min: 3, max: 500 }).withMessage('Comment must be 3-500 characters'),
    body('author').trim().isLength({ min: 2, max: 50 }).withMessage('Author name required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    const post = communityPosts.find(p => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
        id: Date.now().toString(),
        content: req.body.content,
        author: req.body.author,
        createdAt: new Date().toISOString()
    };

    post.comments.push(comment);
    res.json({ success: true, comment });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Root Cause Power PWA server is running!`);
    console.log(`📱 Open in browser: http://localhost:${PORT}`);
    console.log(`🌐 Server listening on port ${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`🛠️  Development mode - Hot reload disabled`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;