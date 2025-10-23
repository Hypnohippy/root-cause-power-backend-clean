// Vercel Serverless Function for Hume API Token
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get credentials from environment variables (NO FALLBACK)
        const HUME_API_KEY = process.env.HUME_API_KEY;
        const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY;

        // Check if credentials are configured
        if (!HUME_API_KEY || !HUME_SECRET_KEY) {
            console.error('❌ Hume API credentials not configured in Vercel');
            console.error('Missing:', {
                hasApiKey: !!HUME_API_KEY,
                hasSecretKey: !!HUME_SECRET_KEY
            });
            return res.status(500).json({ 
                error: 'Hume API credentials not configured',
                details: 'Please check Vercel environment variables: HUME_API_KEY, HUME_SECRET_KEY'
            });
        }

        console.log('✅ Hume credentials found, requesting token...');
        console.log('   API Key length:', HUME_API_KEY.length);
        console.log('   Secret Key length:', HUME_SECRET_KEY.length);

        const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: HUME_API_KEY,
                client_secret: HUME_SECRET_KEY
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Hume API error:', response.status, data);
            return res.status(response.status).json({
                error: 'Hume API authentication failed',
                details: data,
                hint: 'Check that Vercel environment variables HUME_API_KEY and HUME_SECRET_KEY are correct'
            });
        }

        console.log('✅ Hume token obtained successfully');
        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ Hume token endpoint error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
