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
        const HUME_API_KEY = process.env.HUME_API_KEY || 'hvOX7RFpPCJWXef9Vs3eH4xA6QsK1mGnY3zH8kT2vR9wN5cJ7B';
        const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY || 'LdQe8f4K1mGnY3zH8kT2vR9wN5cJ7BvOX7RFpPCJWXef9Vs3eH4xA6Qs';

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
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
