import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { introducerCode } = req.body;

    // Validate introducer code
    if (!introducerCode || !introducerCode.startsWith('INTRO_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid introducer code' 
      });
    }

    // Check if introducer exists
    const introducerCheck = await pool.query(
      'SELECT introducer_code FROM introducers WHERE introducer_code = $1',
      [introducerCode]
    );

    if (introducerCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Introducer not found' 
      });
    }

    // Insert demo view record
    await pool.query(
      `INSERT INTO demo_views (introducer_code, viewed_at) 
       VALUES ($1, NOW())`,
      [introducerCode]
    );

    return res.status(200).json({
      success: true,
      message: 'Demo view tracked successfully'
    });

  } catch (error) {
    console.error('Demo tracking error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An error occurred while tracking demo view' 
    });
  }
}
