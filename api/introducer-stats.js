// ============================================
// API ENDPOINT: /api/introducer-stats.js
// ============================================
// ES Module version for Vercel
// FIXED: Updated to use introducer_code column
// ============================================

import pg from 'pg';
const { Pool } = pg;

// Create database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ 
                error: 'Missing introducer code',
                message: 'Please provide ?code=INTRO_XXXXX'
            });
        }

        // Get introducer info - FIXED: using introducer_code
        const introducerQuery = await pool.query(
            'SELECT * FROM introducers WHERE introducer_code = $1',
            [code]
        );

        if (introducerQuery.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Introducer not found',
                message: 'No introducer found with this code'
            });
        }

        const introducer = introducerQuery.rows[0];

        // Get active referrals
        const activeReferralsQuery = await pool.query(`
            SELECT 
                COUNT(*) AS active_count,
                COALESCE(SUM(commission_amount), 0) AS monthly_income,
                COALESCE(SUM(monthly_value), 0) AS customer_value
            FROM referrals 
            WHERE introducer_id = $1 
            AND status = 'active'
        `, [introducer.id]);

        const activeStats = activeReferralsQuery.rows[0];

        // Get total earnings
        const earningsQuery = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_paid,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) AS payment_count
            FROM commissions 
            WHERE introducer_id = $1
        `, [introducer.id]);

        const earnings = earningsQuery.rows[0];

        // Get recruiter bonus stats - FIXED: using introducer_code
        const recruiterBonusQuery = await pool.query(`
            SELECT 
                COUNT(DISTINCT recruited.id) AS recruited_introducers,
                COUNT(r.id) AS indirect_referrals,
                COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0) AS recruiter_earnings
            FROM introducers recruiter
            LEFT JOIN introducers recruited ON recruited.recruiter_code = recruiter.introducer_code
            LEFT JOIN referrals r ON r.introducer_id = recruited.id AND r.status = 'active'
            LEFT JOIN commissions c ON c.introducer_id = recruiter.id AND c.commission_type = 'recruiter_bonus'
            WHERE recruiter.id = $1
        `, [introducer.id]);

        const recruiterStats = recruiterBonusQuery.rows[0];

        // Get demo page stats
        const demoStatsQuery = await pool.query(`
            SELECT 
                COUNT(*) AS total_views,
                COUNT(CASE WHEN converted_to_signup = true THEN 1 END) AS conversions,
                COALESCE(AVG(duration_seconds), 0) AS avg_duration
            FROM demo_views 
            WHERE introducer_code = $1
        `, [code]);

        const demoStats = demoStatsQuery.rows[0];

        // Calculate projections
        const activeReferrals = parseInt(activeStats.active_count) || 0;
        const monthlyIncome = parseFloat(activeStats.monthly_income) || 0.00;
        const tenYearProjection = monthlyIncome * 120;

        // Get recent referrals
        const recentReferralsQuery = await pool.query(`
            SELECT 
                customer_email,
                plan_type,
                commission_amount,
                status,
                converted_at,
                referral_source
            FROM referrals 
            WHERE introducer_id = $1 
            ORDER BY converted_at DESC 
            LIMIT 5
        `, [introducer.id]);

        // Get pending payout
        const nextPayoutQuery = await pool.query(`
            SELECT 
                COALESCE(SUM(amount), 0) AS next_payout_amount,
                COUNT(*) AS pending_commissions
            FROM commissions 
            WHERE introducer_id = $1 
            AND status = 'pending'
        `, [introducer.id]);

        const nextPayout = nextPayoutQuery.rows[0];

        // Return response - FIXED: using introducer_code in response
        res.status(200).json({
            success: true,
            introducer: {
                id: introducer.id,
                email: introducer.email,
                referralCode: introducer.introducer_code,
                firstName: introducer.first_name,
                lastName: introducer.last_name,
                status: introducer.status,
                stripeConnected: introducer.stripe_onboarding_complete,
                memberSince: introducer.created_at,
                isRecruiter: parseInt(recruiterStats.recruited_introducers) > 0
            },
            
            stats: {
                activeReferrals: activeReferrals,
                monthlyIncome: parseFloat(monthlyIncome).toFixed(2),
                totalEarned: parseFloat(earnings.total_paid || 0).toFixed(2),
                pendingEarnings: parseFloat(earnings.pending || 0).toFixed(2),
                projection10Years: parseFloat(tenYearProjection).toFixed(2),
                totalPayments: parseInt(earnings.payment_count) || 0
            },

            recruiter: {
                recruitedIntroducers: parseInt(recruiterStats.recruited_introducers) || 0,
                indirectReferrals: parseInt(recruiterStats.indirect_referrals) || 0,
                recruiterEarnings: parseFloat(recruiterStats.recruiter_earnings || 0).toFixed(2),
                hasRecruitCode: !!introducer.recruiter_code,
                recruitedBy: introducer.recruiter_code || null
            },

            demo: {
                totalViews: parseInt(demoStats.total_views) || 0,
                conversions: parseInt(demoStats.conversions) || 0,
                conversionRate: demoStats.total_views > 0 
                    ? ((demoStats.conversions / demoStats.total_views) * 100).toFixed(1) + '%'
                    : '0%',
                avgDuration: Math.round(parseFloat(demoStats.avg_duration) || 0) + 's'
            },

            nextPayout: {
                amount: parseFloat(nextPayout.next_payout_amount || 0).toFixed(2),
                commissionCount: parseInt(nextPayout.pending_commissions) || 0,
                estimatedDate: getNextPayoutDate()
            },

            recentReferrals: recentReferralsQuery.rows.map(ref => ({
                email: maskEmail(ref.customer_email),
                plan: ref.plan_type,
                commission: parseFloat(ref.commission_amount || 0).toFixed(2),
                status: ref.status,
                date: ref.converted_at,
                source: ref.referral_source
            })),

            links: {
                referralLink: `https://roothealth.app/?ref=${code}`,
                demoLink: `https://roothealth.app/demo.html?ref=${code}`,
                recruiterLink: `https://roothealth.app/introducer-landing.html?recruiter=${code}`
            }
        });

    } catch (error) {
        console.error('❌ Error fetching introducer stats:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Helper functions
function getNextPayoutDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    
    if (now.getDate() >= 5) {
        return nextMonth.toISOString().split('T')[0];
    } else {
        return new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0];
    }
}

function maskEmail(email) {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const username = parts[0];
    const domain = parts[1];
    
    if (username.length <= 2) return email;
    
    return username.substring(0, 2) + '***@' + domain;
}
