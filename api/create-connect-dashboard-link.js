// API Route: /api/create-connect-dashboard-link
// Creates login link to Stripe Connect Express Dashboard (for introducers to manage payouts, view history, etc.)

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ error: 'Missing referral code' });
    }

    // Get Connect account ID from database
    // In production: const introducer = await db.introducers.findOne({ referralCode });
    // const connectAccountId = introducer?.stripeConnectId;

    // Mock for now
    const connectAccountId = null;

    if (!connectAccountId) {
      return res.status(404).json({ 
        error: 'No Connect account found',
        message: 'Please complete payout setup first'
      });
    }

    // Create login link to Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(connectAccountId);

    return res.status(200).json({
      success: true,
      dashboardUrl: loginLink.url,
      message: 'Redirect user to Stripe Express Dashboard'
    });

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    return res.status(500).json({ 
      error: 'Failed to create dashboard link',
      details: error.message 
    });
  }
}
