// API Route: /api/connect-account-status
// Checks if introducer's Stripe Connect account is fully onboarded and ready for payouts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referralCode } = req.query;

    if (!referralCode) {
      return res.status(400).json({ error: 'Missing referral code' });
    }

    // Get Connect account ID from database
    // In production: const introducer = await db.introducers.findOne({ referralCode });
    // const connectAccountId = introducer?.stripeConnectId;

    // Mock for now - replace with database lookup
    const connectAccountId = null;

    if (!connectAccountId) {
      return res.status(200).json({
        connected: false,
        status: 'not_started',
        message: 'No Connect account found. Please set up payouts.',
        actionRequired: 'setup'
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(connectAccountId);

    // Check if account is fully onboarded
    const isComplete = account.details_submitted;
    const canReceivePayouts = account.capabilities?.transfers === 'active';

    let status = 'incomplete';
    let actionRequired = null;

    if (isComplete && canReceivePayouts) {
      status = 'active';
    } else if (account.requirements?.currently_due?.length > 0) {
      status = 'requires_information';
      actionRequired = 'complete_onboarding';
    } else {
      status = 'pending_verification';
    }

    return res.status(200).json({
      connected: true,
      status: status,
      canReceivePayouts: canReceivePayouts,
      accountId: account.id,
      email: account.email,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || []
      },
      actionRequired: actionRequired,
      message: getStatusMessage(status, canReceivePayouts)
    });

  } catch (error) {
    console.error('Error checking Connect status:', error);
    return res.status(500).json({ 
      error: 'Failed to check Connect status',
      details: error.message 
    });
  }
}

function getStatusMessage(status, canReceivePayouts) {
  if (status === 'active' && canReceivePayouts) {
    return '✅ Your payout account is active and ready to receive commissions!';
  } else if (status === 'requires_information') {
    return '⚠️ Additional information required to complete setup. Click "Complete Setup" to continue.';
  } else if (status === 'pending_verification') {
    return '⏳ Your account is being verified by Stripe. This usually takes 1-2 business days.';
  } else {
    return '❌ Setup incomplete. Please complete the onboarding process.';
  }
}
