// ============================================
// API ENDPOINT: /api/process-payouts.js
// ============================================
// Monthly automated payout processor
// Run via cron job on 5th of each month
// Processes all pending commissions and sends payouts via Stripe Connect
// ============================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Security: Require API key for cron job
const CRON_SECRET = process.env.CRON_SECRET_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron secret
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (providedSecret !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🚀 Starting monthly payout process...');

    try {
        // ============================================
        // STEP 1: Create payout batch record
        // ============================================
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

        const batchResult = await pool.query(`
            INSERT INTO payout_batches (
                batch_date, period_start, period_end, status
            ) VALUES ($1, $2, $3, 'processing')
            RETURNING id
        `, [now, periodStart, periodEnd]);

        const batchId = batchResult.rows[0].id;
        console.log(`✅ Payout batch created: ${batchId}`);

        // ============================================
        // STEP 2: Get all pending commissions
        // ============================================
        const commissionsQuery = await pool.query(`
            SELECT 
                c.*,
                i.stripe_account_id,
                i.referral_code,
                i.email,
                i.stripe_onboarding_complete
            FROM commissions c
            JOIN introducers i ON c.introducer_id = i.id
            WHERE c.status = 'pending'
            AND c.period_start >= $1
            AND c.period_end <= $2
            AND i.stripe_onboarding_complete = true
            ORDER BY c.introducer_id, c.commission_type
        `, [periodStart, periodEnd]);

        const commissions = commissionsQuery.rows;
        console.log(`📊 Found ${commissions.length} pending commissions`);

        if (commissions.length === 0) {
            await pool.query(
                'UPDATE payout_batches SET status = \'completed\', completed_at = CURRENT_TIMESTAMP WHERE id = $1',
                [batchId]
            );
            return res.status(200).json({
                success: true,
                message: 'No pending commissions to process',
                batchId: batchId
            });
        }

        // ============================================
        // STEP 3: Group commissions by introducer
        // ============================================
        const introducerPayouts = {};

        commissions.forEach(commission => {
            const introducerId = commission.introducer_id;
            
            if (!introducerPayouts[introducerId]) {
                introducerPayouts[introducerId] = {
                    introducer_id: introducerId,
                    stripe_account_id: commission.stripe_account_id,
                    referral_code: commission.referral_code,
                    email: commission.email,
                    total_amount: 0,
                    commission_ids: [],
                    direct_amount: 0,
                    recruiter_bonus_amount: 0,
                    commission_count: 0
                };
            }

            introducerPayouts[introducerId].total_amount += parseFloat(commission.amount);
            introducerPayouts[introducerId].commission_ids.push(commission.id);
            introducerPayouts[introducerId].commission_count++;

            if (commission.commission_type === 'direct') {
                introducerPayouts[introducerId].direct_amount += parseFloat(commission.amount);
            } else if (commission.commission_type === 'recruiter_bonus') {
                introducerPayouts[introducerId].recruiter_bonus_amount += parseFloat(commission.amount);
            }
        });

        console.log(`👥 Processing payouts for ${Object.keys(introducerPayouts).length} introducers`);

        // ============================================
        // STEP 4: Process payouts via Stripe Connect
        // ============================================
        let successCount = 0;
        let failureCount = 0;
        let totalPaidAmount = 0;

        for (const [introducerId, payout] of Object.entries(introducerPayouts)) {
            try {
                // Minimum payout threshold: £10
                if (payout.total_amount < 10.00) {
                    console.log(`⏭️ Skipping ${payout.referral_code}: Below minimum (£${payout.total_amount})`);
                    continue;
                }

                // Create Stripe transfer
                const transfer = await stripe.transfers.create({
                    amount: Math.round(payout.total_amount * 100), // Convert to pence
                    currency: 'gbp',
                    destination: payout.stripe_account_id,
                    description: `Root Cause Power - Commission for ${periodStart.toISOString().split('T')[0]}`,
                    metadata: {
                        introducer_code: payout.referral_code,
                        introducer_id: introducerId.toString(),
                        batch_id: batchId.toString(),
                        period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
                        direct_amount: payout.direct_amount.toFixed(2),
                        recruiter_bonus: payout.recruiter_bonus_amount.toFixed(2)
                    }
                });

                console.log(`✅ Transfer created: ${transfer.id} → ${payout.referral_code} (£${payout.total_amount})`);

                // Update commission records to 'paid'
                await pool.query(`
                    UPDATE commissions 
                    SET status = 'paid', stripe_transfer_id = $1, paid_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($2)
                `, [transfer.id, payout.commission_ids]);

                // Update introducer last_payout_at
                await pool.query(
                    'UPDATE introducers SET last_payout_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [introducerId]
                );

                successCount++;
                totalPaidAmount += payout.total_amount;

            } catch (error) {
                console.error(`❌ Payout failed for ${payout.referral_code}:`, error.message);
                
                // Mark commissions as failed
                await pool.query(`
                    UPDATE commissions SET status = 'failed' WHERE id = ANY($1)
                `, [payout.commission_ids]);

                failureCount++;
            }
        }

        // ============================================
        // STEP 5: Update payout batch summary
        // ============================================
        await pool.query(`
            UPDATE payout_batches 
            SET 
                total_introducers = $1,
                total_amount = $2,
                total_commissions = $3,
                status = 'completed',
                completed_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [successCount, totalPaidAmount, commissions.length, batchId]);

        console.log('🎉 Payout process completed!');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log(`   💰 Total Paid: £${totalPaidAmount.toFixed(2)}`);

        res.status(200).json({
            success: true,
            batchId: batchId,
            summary: {
                total_introducers_paid: successCount,
                total_introducers_failed: failureCount,
                total_amount_paid: totalPaidAmount.toFixed(2),
                period: {
                    start: periodStart.toISOString().split('T')[0],
                    end: periodEnd.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        console.error('❌ Payout process failed:', error);
        res.status(500).json({ 
            error: 'Payout process failed',
            message: error.message
        });
    }
}
