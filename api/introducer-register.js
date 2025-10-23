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
    const { 
      firstName, 
      lastName, 
      email, 
      communityName, 
      platform, 
      communitySize, 
      motivation 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !communityName || !platform || !communitySize || !motivation) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    // Check if email already exists
    const existingCheck = await pool.query(
      'SELECT introducer_code FROM introducers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'This email is already registered. Please use a different email or contact support.',
        existingCode: existingCheck.rows[0].introducer_code
      });
    }

    // Generate unique referral code: INTRO_[FIRSTNAME][4RANDOM]
    const generateReferralCode = (firstName) => {
      const firstNameUpper = firstName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 6);
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      return `INTRO_${firstNameUpper}${randomDigits}`;
    };

    let referralCode = generateReferralCode(firstName);
    
    // Ensure uniqueness
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const checkCode = await pool.query(
        'SELECT introducer_code FROM introducers WHERE introducer_code = $1',
        [referralCode]
      );
      if (checkCode.rows.length === 0) {
        codeExists = false;
      } else {
        referralCode = generateReferralCode(firstName);
        attempts++;
      }
    }

    if (codeExists) {
      return res.status(500).json({ 
        success: false, 
        error: 'Unable to generate unique referral code. Please try again.' 
      });
    }

    // Insert new introducer into database
    await pool.query(
      `INSERT INTO introducers (
        introducer_code, 
        first_name, 
        last_name, 
        email, 
        community_name, 
        platform, 
        community_size, 
        motivation, 
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        referralCode,
        firstName,
        lastName,
        email.toLowerCase(),
        communityName,
        platform,
        communitySize,
        motivation,
        'active' // Auto-approve for now; can add approval workflow later
      ]
    );

    // Generate Stripe Connect onboarding URL
    const stripeConnectUrl = `/api/stripe-connect?code=${referralCode}`;

    // Return success with referral code and Stripe Connect URL
    return res.status(200).json({
      success: true,
      referralCode: referralCode,
      stripeConnectUrl: stripeConnectUrl,
      message: 'Registration successful! Please complete Stripe Connect setup to receive payments.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An error occurred during registration. Please try again.' 
    });
  }
}
