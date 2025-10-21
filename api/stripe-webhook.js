// API endpoint: /api/stripe-webhook.js
// Purpose: Receive Stripe webhook events and process subscription changes for commission tracking

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_WEBHOOK_SECRET 
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription) {
  const referralCode = subscription.metadata?.referralCode;
  
  if (!referralCode) {
    console.log('No referral code found for subscription:', subscription.id);
    return;
  }

  console.log('New subscription with referral:', {
    subscriptionId: subscription.id,
    referralCode: referralCode,
    customerId: subscription.customer,
    amount: subscription.items.data[0].price.unit_amount / 100,
    status: subscription.status
  });

  // TODO: Store in database
  // - Link subscription to introducer
  // - Set status to 'active'
  // - Record start date
}

// Handle subscription updates (e.g., plan changes)
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });

  // TODO: Update database
  // - Update subscription status
  // - If cancelled, mark for commission stop after period ends
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription cancelled:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  // TODO: Update database
  // - Mark subscription as cancelled
  // - Stop commission accrual
  // - Keep historical records
}

// Handle successful payment (this is where we calculate commission)
async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    console.log('Invoice not related to subscription:', invoice.id);
    return;
  }

  const amountPaid = invoice.amount_paid / 100; // Convert from cents to pounds
  const commission = amountPaid * 0.20; // 20% commission

  console.log('Payment succeeded - Commission earned:', {
    invoiceId: invoice.id,
    subscriptionId: subscriptionId,
    amountPaid: `£${amountPaid}`,
    commission: `£${commission.toFixed(2)}`,
    billingReason: invoice.billing_reason
  });

  // TODO: Store in database
  // - Record commission earned
  // - Add to introducer's balance
  // - Track payment date
  // - Update total earnings
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    attemptCount: invoice.attempt_count
  });

  // TODO: Update database
  // - Flag subscription as payment issue
  // - Don't accrue commission until resolved
}

// Vercel needs this for raw body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};
