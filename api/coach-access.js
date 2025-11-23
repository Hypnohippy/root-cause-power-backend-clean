// api/coach-access.js
// Central gatekeeper for Coach David access (VIP + free trial + paid credits)

import { supabaseServer } from "../utils/supabaseAdmin.js";

const VOICE_COST_PER_SESSION = 5; // how many voice credits one voice session costs

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

  // PGRST116 = "no rows" from PostgREST – that's okay, we'll insert
  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) return data;

  // No row yet → create a default free user
  const { data: inserted, error: insertError } = await supabaseServer
    .from("user_credits")
    .insert({
      user_id: userId,
      plan: "free",
      credits_remaining: 8,
      voice_credits_remaining: 0,
      free_trial_used: false,
      last_reset_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function decideCoachAccess(creditsRow) {
  // 1) VIP → always allowed, no credit changes
  if (creditsRow.plan === "vip") {
    return {
      allow: true,
      mode: "vip",
      plan: creditsRow.plan,
      credits_remaining: creditsRow.credits_remaining,
      voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
      free_trial_used: creditsRow.free_trial_used ?? true,
    };
  }

  // 2) FREE TRIAL → one-time flag in Supabase
  if (!creditsRow.free_trial_used) {
    const { data: updated, error: updateError } = await supabaseServer
      .from("user_credits")
      .update({ free_trial_used: true })
      .eq("user_id", creditsRow.user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      allow: true,
      mode: "free_trial",
      plan: updated.plan,
      credits_remaining: updated.credits_remaining,
      voice_credits_remaining: updated.voice_credits_remaining ?? 0,
      free_trial_used: updated.free_trial_used,
    };
  }

  // 3) PAID CREDITS → require enough voice_credits_remaining
  const currentVoice = creditsRow.voice_credits_remaining ?? 0;

  if (currentVoice < VOICE_COST_PER_SESSION) {
    // Not enough credits – block
    return {
      allow: false,
      mode: "no_credits",
      plan: creditsRow.plan,
      credits_remaining: creditsRow.credits_remaining,
      voice_credits_remaining: currentVoice,
      free_trial_used: creditsRow.free_trial_used ?? true,
    };
  }

  const newVoice = currentVoice - VOICE_COST_PER_SESSION;

  const { data: saved, error: voiceUpdateError } = await supabaseServer
    .from("user_credits")
    .update({
      voice_credits_remaining: newVoice,
    })
    .eq("user_id", creditsRow.user_id)
    .select()
    .single();

  if (voiceUpdateError) throw voiceUpdateError;

  return {
    allow: true,
    mode: "paid",
    plan: saved.plan,
    credits_remaining: saved.credits_remaining,
    voice_credits_remaining: saved.voice_credits_remaining ?? newVoice,
    free_trial_used: saved.free_trial_used ?? true,
  };
}

export default async function handler(req, res) {
  // Basic CORS
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
    // 1) Read email from body (for now we’ll default to your email if missing)
    let email = null;

    if (req.body && typeof req.body === "object") {
      email = req.body.email || null;
    }

    if (!email) {
      email = "david@fuelgeist.co.uk";
      console.log(
        "⚠️ /api/coach-access: No email supplied, using founder email:",
        email
      );
    }

    // 2) Look up user in Supabase
    const user = await getUserByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found in Supabase", email });
    }

    // 3) Ensure they have a  user_credits row
    const creditsRow = await ensureUserCredits(user.id);

    // 4) Decide access
    const result = await decideCoachAccess(creditsRow);

    if (!result.allow) {
      return res.status(402).json(result);
    }

    // 5) Success
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ /api/coach-access error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
