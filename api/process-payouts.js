// API endpoint: /api/process-payouts.js
// Purpose: Monthly CRON job to process introducer payouts via Stripe Connect
// Runs: 5th of each month at 2 AM UTC (configured in vercel.json)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Verify this is called from Vercel CRON (security check)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting monthly payout process...');
    
    // TODO: Query database for all introducers with pending balance >= £10
    // const introducersWithBalance = await database.query(`
    //   SELECT introducer_id, stripe_connect_account_id, pending_balance
    //   FROM introducers 
    //   WHERE pending_balance >= 10 
    //   AND stripe_connect_account_id IS NOT NULL
    //   AND payout_enabled = true
    // `);

    // Mock data structure for reference:
    const introducersWithBalance = [
      // { 
      //   introducerId: 'intro_123',
      //   stripeConnectAccountId: 'acct_xxx',
      //   pendingBalance: 45.50
      // }
    ];

    const results = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      errors: []
    };

    // Process each introducer's payout
    for (const introducer of introducersWithBalance) {
      try {
        const amountInPence = Math.round(introducer.pendingBalance * 100);
        
        // Create transfer to Connected Account
        const transfer = await stripe.transfers.create({
          amount: amountInPence,
          currency: 'gbp',
          destination: introducer.stripeConnectAccountId,
          description: `Referral commission payout - ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
          metadata: {
            introducerId: introducer.introducerId,
            payoutMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
          }
        });

        console.log(`Payout successful for ${introducer.introducerId}: £${introducer.pendingBalance}`);

        // TODO: Update database
        // await database.query(`
        //   INSERT INTO payout_history (introducer_id, amount, stripe_transfer_id, payout_date)
        //   VALUES (?, ?, ?, NOW())
        // `, [introducer.introducerId, introducer.pendingBalance, transfer.id]);
        
        // await database.query(`
        //   UPDATE introducers 
        //   SET pending_balance = 0, last_payout_date = NOW() 
        //   WHERE introducer_id = ?
        // `, [introducer.introducerId]);

        results.processed++;
        results.totalAmount += introducer.pendingBalance;

      } catch (error) {
        console.error(`Payout failed for ${introducer.introducerId}:`, error.message);
        results.failed++;
        results.errors.push({
          introducerId: introducer.introducerId,
          error: error.message
        });
      }
    }

    console.log('Payout process complete:', results);

    return res.status(200).json({
      success: true,
      message: 'Payout processing complete',
      summary: results
    });

  } catch (error) {
    console.error('Error in payout process:', error);
    return res.status(500).json({ 
      error: 'Payout processing failed',
      details: error.message 
    });
  }
}
