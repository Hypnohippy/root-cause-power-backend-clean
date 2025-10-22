// ============================================
// API ENDPOINT: /api/stripe-webhook.js
// ============================================
// Listens for Stripe events and automatically tracks:
// - New subscriptions (create referral record)
// - Subscription updates
// - Subscription cancellations
// - Monthly invoices (calculate commissions)
// - THREE-TIER COMMISSIONS (Direct + Recruiter Bonus)
// ============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Webhook signing secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
    api: {
        bodyParser: false, // Must disable for Stripe webhook signature verification
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    // Get raw body
    const rawBody = await getRawBody(req);

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log('✅ Stripe Event Received:', event.type);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionCancelled(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoiceFailed(event.data.object);
                break;

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        res.json({ received: true, event: event.type });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

// Get raw body for signature verification
async function getRawBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleCheckoutCompleted(session) {
    console.log('🎯 Checkout completed:', session.id);

    const referralCode = session.client_reference_id;
    if (!referralCode) {
        console.log('ℹ️ No referral code in checkout session');
        return;
    }

    const introducerQuery = await pool.query(
        'SELECT * FROM introducers WHERE referral_code = $1',
        [referralCode]
    );

    if (introducerQuery.rows.length === 0) {
        console.warn('⚠️ Referral code not found:', referralCode);
        return;
    }

    const introducer = introducerQuery.rows[0];

    await pool.query(`
        INSERT INTO referrals (
            introducer_id, introducer_code, customer_email,
            customer_stripe_id, subscription_id, status, referral_source
        ) VALUES ($1, $2, $3, $4, $5, 'pending', 'direct')
    `, [
        introducer.id, referralCode, session.customer_email,
        session.customer, session.subscription
    ]);

    console.log('✅ Referral created (pending):', referralCode);
}

async function handleSubscriptionCreated(subscription) {
    console.log('🎯 Subscription activated:', subscription.id);

    const planAmount = subscription.items.data[0].price.unit_amount / 100;
    const commissionAmount = planAmount * 0.20;

    const updateResult = await pool.query(`
        UPDATE referrals 
        SET status = 'active', monthly_value = $1,
            commission_amount = $2, converted_at = CURRENT_TIMESTAMP
        WHERE subscription_id = $3
        RETURNING *
    `, [planAmount, commissionAmount, subscription.id]);

    if (updateResult.rows.length === 0) {
        console.warn('⚠️ No referral found for subscription:', subscription.id);
        return;
    }

    const referral = updateResult.rows[0];
    console.log('✅ Referral activated:', referral.introducer_code);

    // Process recruiter bonus
    await processRecruiterBonus(referral.introducer_id, referral.id, subscription.id);
}

async function processRecruiterBonus(introducerId, referralId, subscriptionId) {
    const introducerQuery = await pool.query(
        'SELECT recruiter_code FROM introducers WHERE id = $1',
        [introducerId]
    );

    if (introducerQuery.rows.length === 0 || !introducerQuery.rows[0].recruiter_code) {
        return;
    }

    const recruiterCode = introducerQuery.rows[0].recruiter_code;
    const recruiterQuery = await pool.query(
        'SELECT id FROM introducers WHERE referral_code = $1',
        [recruiterCode]
    );

    if (recruiterQuery.rows.length === 0) {
        console.warn('⚠️ Recruiter not found:', recruiterCode);
        return;
    }

    const recruiterId = recruiterQuery.rows[0].id;
    const recruiterBonusAmount = 2.00;
    const currentMonth = new Date();
    const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const periodEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    await pool.query(`
        INSERT INTO commissions (
            introducer_id, commission_type, amount,
            period_start, period_end, referral_id,
            recruited_introducer_id, subscription_id, status
        ) VALUES ($1, 'recruiter_bonus', $2, $3, $4, $5, $6, $7, 'pending')
    `, [
        recruiterId, recruiterBonusAmount, periodStart, periodEnd,
        referralId, introducerId, subscriptionId
    ]);

    console.log('✅ Recruiter bonus created:', recruiterCode);
}

async function handleSubscriptionUpdated(subscription) {
    console.log('🎯 Subscription updated:', subscription.id);
    const planAmount = subscription.items.data[0].price.unit_amount / 100;

    await pool.query(`
        UPDATE referrals 
        SET monthly_value = $1, commission_amount = $2
        WHERE subscription_id = $3
    `, [planAmount, planAmount * 0.20, subscription.id]);
}

async function handleSubscriptionCancelled(subscription) {
    console.log('🎯 Subscription cancelled:', subscription.id);

    await pool.query(`
        UPDATE referrals 
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE subscription_id = $1
    `, [subscription.id]);
}

async function handleInvoicePaid(invoice) {
    console.log('🎯 Invoice paid:', invoice.id);

    if (!invoice.subscription) return;

    const referralQuery = await pool.query(
        'SELECT * FROM referrals WHERE subscription_id = $1 AND status = \'active\'',
        [invoice.subscription]
    );

    if (referralQuery.rows.length === 0) return;

    const referral = referralQuery.rows[0];
    const invoiceDate = new Date(invoice.created * 1000);
    const periodStart = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1);
    const periodEnd = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0);

    await pool.query(`
        INSERT INTO commissions (
            introducer_id, commission_type, amount,
            period_start, period_end, referral_id,
            subscription_id, status
        ) VALUES ($1, 'direct', $2, $3, $4, $5, $6, 'pending')
    `, [
        referral.introducer_id, referral.commission_amount,
        periodStart, periodEnd, referral.id, invoice.subscription
    ]);

    console.log('✅ Commission created:', referral.introducer_code);
    await processRecruiterBonus(referral.introducer_id, referral.id, invoice.subscription);
}

async function handleInvoiceFailed(invoice) {
    console.log('⚠️ Invoice payment failed:', invoice.id);
}
