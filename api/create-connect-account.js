// API Route: /api/create-connect-account
// Creates Stripe Connect account for introducer and returns onboarding link

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
    const { email, referralCode, country = 'GB' } = req.body;

    if (!email || !referralCode) {
      return res.status(400).json({ error: 'Missing required fields: email and referralCode' });
    }

    // Check if introducer already has Connect account
    // In production: const existingAccount = await db.introducers.findOne({ referralCode });
    // if (existingAccount?.stripeConnectId) { ... }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express', // Express account = simplest onboarding
      country: country,
      email: email,
      capabilities: {
        transfers: { requested: true } // Required for receiving payouts
      },
      business_type: 'individual', // Most introducers are individuals
      metadata: {
        referral_code: referralCode,
        source: 'root_cause_power_introducer'
      }
    });

    console.log('Stripe Connect account created:', account.id);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.BASE_URL}/introducers?setup=refresh`,
      return_url: `${process.env.BASE_URL}/introducers?setup=complete`,
      type: 'account_onboarding',
    });

    // Store Connect account ID in database
    // In production:
    // await db.introducers.update(
    //   { referralCode },
    //   { stripeConnectId: account.id, connectStatus: 'onboarding' }
    // );

    return res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      message: 'Connect account created. Redirect user to onboardingUrl.'
    });

  } catch (error) {
    console.error('Error creating Connect account:', error);
    return res.status(500).json({ 
      error: 'Failed to create Connect account',
      details: error.message 
    });
  }
}
