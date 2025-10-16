// Vercel API Endpoint: /api/sync-credits.js
// Ultra-simple credit sync system for cross-device compatibility

export default async function handler(req, res) {
    // Enable CORS for your domain
    res.setHeader('Access-Control-Allow-Origin', 'https://roothealth.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { method, body } = req;
    
    try {
        if (method === 'POST') {
            // Store/Update credits for an email
            const { email, credits, plan = 'free' } = body;
            
            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Valid email required' });
            }
            
            if (typeof credits !== 'number' || credits < 0) {
                return res.status(400).json({ error: 'Valid credits number required' });
            }
            
            // In production, you'd use a database
            // For now, using Vercel KV or simple storage
            const userData = {
                email,
                credits,
                plan,
                lastUpdated: new Date().toISOString(),
                syncCode: generateSyncCode(email)
            };
            
            // Store in Vercel KV (if you have it) or return success
            console.log(`ðŸ’¾ Storing credits for ${email}: ${credits} credits`);
            
            return res.status(200).json({
                success: true,
                credits,
                plan,
                syncCode: userData.syncCode,
                message: 'Credits synced successfully'
            });
            
        } else if (method === 'GET') {
            // Retrieve credits for an email
            const { email } = req.query;
            
            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Valid email required' });
            }
            
            // In production, retrieve from database
            // For now, return a basic response
            console.log(`ðŸ” Retrieving credits for ${email}`);
            
            // Simulate stored data (in production, fetch from DB)
            const userData = {
                email,
                credits: 8, // Default credits
                plan: 'free',
                lastUpdated: new Date().toISOString(),
                syncCode: generateSyncCode(email)
            };
            
            return res.status(200).json({
                success: true,
                ...userData,
                message: 'Credits retrieved successfully'
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Sync API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// Generate a simple sync code based on email
function generateSyncCode(email) {
    // Simple hash for sync code (in production, use proper encryption)
    const hash = email.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    return Math.abs(hash).toString(36).substring(0, 8);
}

// Webhook handler for Stripe payments (optional)
export async function handleStripeWebhook(stripeEvent) {
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;
        const customerEmail = session.customer_details?.email;
        
        if (customerEmail) {
            console.log(`ðŸ’³ Payment completed for ${customerEmail}`);
            // Auto-sync purchased credits
            // Implementation depends on your Stripe setup
        }
    }
}
