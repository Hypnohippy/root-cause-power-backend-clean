// ============================================
// API ENDPOINT: /api/stripe-connect.js
// ============================================
// Handles Stripe Connect onboarding for introducers
// POST - Create Connect account and onboarding link
// GET - Check Connect account status
// ============================================

import Stripe from 'stripe';
import pkg from 'pg';
const { Pool } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

            // Find introducer in database (FIXED: using introducer_code)
            const introducerQuery = await pool.query(
                'SELECT * FROM introducers WHERE introducer_code = $1',
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
                refresh_url: `https://roothealth.app/introducers.html?refresh=true`,
                return_url: `https://roothealth.app/introducers.html?connected=true`,
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
            const { code, referralCode } = req.query;
            const introducerCode = code || referralCode;

            if (!introducerCode) {
                return res.status(400).json({ error: 'Missing introducer code' });
            }

            // Find introducer (FIXED: using introducer_code)
            const introducerQuery = await pool.query(
                'SELECT * FROM introducers WHERE introducer_code = $1',
                [introducerCode]
            );

            if (introducerQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Introducer not found' });
            }

            const introducer = introducerQuery.rows[0];

            if (!introducer.stripe_account_id) {
                // If no Stripe account yet, create one and redirect
                const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'GB',
                    email: introducer.email,
                    business_type: 'individual',
                    individual: {
                        first_name: introducer.first_name,
                        last_name: introducer.last_name,
                        email: introducer.email
                    },
                    capabilities: {
                        transfers: { requested: true }
                    },
                    metadata: {
                        introducer_code: introducerCode,
                        introducer_id: introducer.id.toString()
                    }
                });

                // Save to database
                await pool.query(
                    'UPDATE introducers SET stripe_account_id = $1 WHERE id = $2',
                    [account.id, introducer.id]
                );

                // Create account link for onboarding
                const accountLink = await stripe.accountLinks.create({
                    account: account.id,
                    refresh_url: `https://roothealth.app/api/stripe-connect?code=${introducerCode}`,
                    return_url: `https://roothealth.app/introducers.html?code=${introducerCode}&setup=complete`,
                    type: 'account_onboarding'
                });

                // Redirect to Stripe onboarding
                return res.redirect(302, accountLink.url);
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

            // If GET request with code param, redirect to onboarding
            if (code && !isComplete) {
                const accountLink = await stripe.accountLinks.create({
                    account: introducer.stripe_account_id,
                    refresh_url: `https://roothealth.app/api/stripe-connect?code=${introducerCode}`,
                    return_url: `https://roothealth.app/introducers.html?code=${introducerCode}&setup=complete`,
                    type: 'account_onboarding'
                });
                return res.redirect(302, accountLink.url);
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

