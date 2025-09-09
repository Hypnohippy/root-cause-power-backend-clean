const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Security headers for PWA
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