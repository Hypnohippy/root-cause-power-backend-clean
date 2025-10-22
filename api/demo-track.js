// ============================================
// API ENDPOINT: /api/demo/track.js
// ============================================
// Tracks demo page views for analytics
// ============================================

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            introducerCode,
            duration,
            converted,
            referrerUrl 
        } = req.body;

        if (!introducerCode) {
            return res.status(400).json({ error: 'Missing introducer code' });
        }

        const visitorIp = hashIp(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        const visitorUserAgent = req.headers['user-agent'];

        await pool.query(`
            INSERT INTO demo_views (
                introducer_code, visitor_ip, visitor_user_agent,
                referrer_url, duration_seconds, converted_to_signup
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            introducerCode, visitorIp, visitorUserAgent,
            referrerUrl || null, duration || 0, converted || false
        ]);

        console.log('✅ Demo view tracked:', introducerCode);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ Error tracking demo view:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

function hashIp(ip) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}
