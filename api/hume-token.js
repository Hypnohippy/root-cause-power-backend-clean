// api/hume-token.js
// Vercel Serverless Function for Hume API Token
// Now with Supabase voice-credit enforcement

import { supabaseServer } from "./supabaseClient.js";

const VOICE_COST_PER_SESSION = 5; // cost in voice credits per Hume session

async function getUserByEmail(email) {
  const {
    data: { users },
    error,
  } = await supabaseServer.auth.admin.listUsers({
    email,
    perPage: 1,
  });

  if (error) throw error;
  if (!users || users.length === 0) return null;
  return users[0];
}

async function ensureUserCredits(userId) {
  const { data, error } = await supabaseServer
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // PGRST116 = no rows found
  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) return data;

  // If no row yet, create a default "free" one
  const { data: inserted, error: insertError } = await supabaseServer
    .from("user_credits")
    .insert({
      user_id: userId,
      plan: "free",
      credits_remaining: 8,
      voice_credits_remaining: 0,
      last_reset_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function chargeVoiceCreditsForUser(user, cost) {
  let creditsRow = await ensureUserCredits(user.id);

  // VIP plan: skip decrement entirely
  if (creditsRow.plan === "vip") {
    return {
      plan: creditsRow.plan,
      credits_remaining: creditsRow.credits_remaining,
      voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
      skipped_decrement: true,
    };
  }

  const currentVoice = creditsRow.voice_credits_remaining ?? 0;
  if (currentVoice < cost) {
    return {
      error: "Not enough voice credits",
      voice_credits_remaining: currentVoice,
      plan: creditsRow.plan,
    };
  }

  const newVoice = currentVoice - cost;

  const { data: saved, error: updateError } = await supabaseServer
    .from("user_credits")
    .update({
      voice_credits_remaining: newVoice,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    plan: saved.plan,
    credits_remaining: saved.credits_remaining,
    voice_credits_remaining: saved.voice_credits_remaining ?? newVoice,
    skipped_decrement: false,
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ---- 1) Read email from body (required) ----
    const body = req.body || {};
    const email = body.email;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Missing email in request body for credit tracking" });
    }

    // ---- 2) Supabase: find user by email ----
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found in Supabase" });
    }

    // ---- 3) Supabase: charge voice credits (or skip if VIP) ----
    const creditResult = await chargeVoiceCreditsForUser(
      user,
      VOICE_COST_PER_SESSION
    );

    if (creditResult.error) {
      // Not enough credits
      return res.status(402).json({
        error: creditResult.error,
        plan: creditResult.plan,
        voice_credits_remaining: creditResult.voice_credits_remaining,
      });
    }

    // ---- 4) Hume credentials from env ----
    const HUME_API_KEY = process.env.HUME_API_KEY;
    const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY;

    if (!HUME_API_KEY || !HUME_SECRET_KEY) {
      console.error("❌ Hume API credentials not configured in Vercel");
      console.error("Missing:", {
        hasApiKey: !!HUME_API_KEY,
        hasSecretKey: !!HUME_SECRET_KEY,
      });
      return res.status(500).json({
        error: "Hume API credentials not configured",
        details:
          "Please check Vercel environment variables: HUME_API_KEY, HUME_SECRET_KEY",
      });
    }

    console.log("✅ Hume credentials found, requesting token...");
    console.log("   API Key length:", HUME_API_KEY.length);
    console.log("   Secret Key length:", HUME_SECRET_KEY.length);

    // ---- 5) Request token from Hume ----
    const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: HUME_API_KEY,
        client_secret: HUME_SECRET_KEY,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Hume API error:", response.status, data);
      return res.status(response.status).json({
        error: "Hume API authentication failed",
        details: data,
        hint: "Check that Vercel environment variables HUME_API_KEY and HUME_SECRET_KEY are correct",
      });
    }

    console.log("✅ Hume token obtained successfully");

    // ---- 6) Return token + credit info back to frontend ----
    return res.status(200).json({
      ...data, // Hume token fields
      credits: {
        plan: creditResult.plan,
        voice_credits_remaining: creditResult.voice_credits_remaining,
        skipped_decrement: creditResult.skipped_decrement,
      },
    });
  } catch (error) {
    console.error("❌ Hume token endpoint error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
