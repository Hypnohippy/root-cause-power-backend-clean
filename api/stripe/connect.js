// ============================================
// API ENDPOINT: /api/stripe/connect.js
// ============================================
// Handles Stripe Connect onboarding for introducers
// POST - Create Connect account and onboarding link
// GET - Check Connect account status
// ============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ============================================
        // POST: Create Stripe Connect Account Link
        // ============================================
        if (req.method === 'POST') {
            const { referralCode, email, firstName, lastName } = req.body;

            if (!referralCode || !email) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    message: 'referralCode and email are required'
                });
            }

            // Find introducer in database
            const introducerQuery = await pool.query(
                'SELECT * FROM introducers WHERE referral_code = $1',
                [referralCode]
            );

            if (introducerQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Introducer not found' });
            }

            const introducer = introducerQuery.rows[0];
            let accountId = introducer.stripe_account_id;

            if (!accountId) {
                // Create new Stripe Connect Express account
                const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'GB',
                    email: email,
                    business_type: 'individual',
                    individual: {
                        first_name: firstName || introducer.first_name,
                        last_name: lastName || introducer.last_name,
                        email: email
                    },
                    capabilities: {
                        transfers: { requested: true }
                    },
                    metadata: {
                        introducer_code: referralCode,
                        introducer_id: introducer.id.toString()
                    }
                });

                accountId = account.id;

                // Save to database
                await pool.query(
                    'UPDATE introducers SET stripe_account_id = $1 WHERE id = $2',
                    [accountId, introducer.id]
                );

                console.log('✅ Stripe Connect account created:', accountId);
            }

            // Create account link for onboarding
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `https://roothealth.app/introducers?refresh=true`,
                return_url: `https://roothealth.app/introducers?connected=true`,
                type: 'account_onboarding'
            });

            console.log('✅ Onboarding link created for:', referralCode);

            res.status(200).json({
                success: true,
                url: accountLink.url,
                accountId: accountId
            });
        }

        // ============================================
        // GET: Check Stripe Connect Status
        // ============================================
        else if (req.method === 'GET') {
            const { referralCode } = req.query;

            if (!referralCode) {
                return res.status(400).json({ error: 'Missing referral code' });
            }

            // Find introducer
            const introducerQuery = await pool.query(
                'SELECT * FROM introducers WHERE referral_code = $1',
                [referralCode]
            );

            if (introducerQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Introducer not found' });
            }

            const introducer = introducerQuery.rows[0];

            if (!introducer.stripe_account_id) {
                return res.status(200).json({
                    connected: false,
                    onboardingComplete: false
                });
            }

            // Fetch Stripe account details
            const account = await stripe.accounts.retrieve(introducer.stripe_account_id);
            const isComplete = account.details_submitted && account.charges_enabled;

            // Update database if onboarding is complete
            if (isComplete && !introducer.stripe_onboarding_complete) {
                await pool.query(
                    'UPDATE introducers SET stripe_onboarding_complete = true WHERE id = $1',
                    [introducer.id]
                );
            }

            res.status(200).json({
                connected: true,
                onboardingComplete: isComplete,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                accountId: account.id
            });
        }

        else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Stripe Connect error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
