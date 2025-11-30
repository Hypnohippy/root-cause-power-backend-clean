// api/credits.js
// Central credit system for Root Health
// - Uses Supabase service role
// - 30 text credits by default
// - Daily credits ("daily") and voice credits ("voice")

import { createClient } from "@supabase/supabase-js";

// 🔐 Supabase admin client (server-side only)
const SUPABASE_URL = "https://bechmxbywqhsauhctewo.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("[credits] Missing SUPABASE_SERVICE_ROLE_KEY in environment");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Default starting credits
const DEFAULT_DAILY_CREDITS = 30;
const DEFAULT_VOICE_CREDITS = 0;

// Helper: find auth user by email
async function getUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    email,
    perPage: 1,
  });

  if (error) {
    console.error("[credits] listUsers error:", error);
    throw error;
  }

  if (!data || !data.users || data.users.length === 0) {
    return null;
  }

  return data.users[0];
}

// Helper: ensure a user_credits row exists for this user_id
async function ensureUserCredits(userId) {
  // Try to fetch existing row
  const { data, error } = await supabaseAdmin
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // PGRST116 = no rows found
  if (error && error.code !== "PGRST116") {
    console.error("[credits] select user_credits error:", error);
    throw error;
  }

  if (data) return data;

  // No row yet → create one
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("user_credits")
    .insert({
      user_id: userId,
      plan: "free",
      credits_remaining: DEFAULT_DAILY_CREDITS,
      voice_credits_remaining: DEFAULT_VOICE_CREDITS,
      last_reset_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("[credits] insert user_credits error:", insertError);
    throw insertError;
  }

  return inserted;
}

export default async function handler(req, res) {
  try {
    // Basic CORS
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(200).end();
    }

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!SERVICE_ROLE_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing service role key" });
    }

    // ---------- GET = check credits ----------
    if (req.method === "GET") {
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const creditsRow = await ensureUserCredits(user.id);

      return res.status(200).json({
        ok: true,
        user_id: user.id,
        email,
        plan: creditsRow.plan,
        credits_remaining: creditsRow.credits_remaining,
        voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
        last_reset_at: creditsRow.last_reset_at,
      });
    }

    // ---------- POST = consume credits ----------
    if (req.method === "POST") {
      const { email, type, cost } = req.body || {};

      if (!email || !type || typeof cost !== "number") {
        return res
          .status(400)
          .json({ error: "Missing email, type or cost in body" });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let creditsRow = await ensureUserCredits(user.id);

      // VIP users never decremented
      if (creditsRow.plan === "vip") {
        return res.status(200).json({
          ok: true,
          plan: creditsRow.plan,
          credits_remaining: creditsRow.credits_remaining,
          voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
          skipped_decrement: true,
        });
      }

      let nextDaily = creditsRow.credits_remaining ?? DEFAULT_DAILY_CREDITS;
      let nextVoice = creditsRow.voice_credits_remaining ?? DEFAULT_VOICE_CREDITS;

      if (type === "daily") {
        if (nextDaily < cost) {
          return res.status(402).json({
            error: "Not enough daily credits",
            credits_remaining: nextDaily,
          });
        }
        nextDaily -= cost;
      } else if (type === "voice") {
        if (nextVoice < cost) {
          return res.status(402).json({
            error: "Not enough voice credits",
            voice_credits_remaining: nextVoice,
          });
        }
        nextVoice -= cost;
      } else {
        return res.status(400).json({ error: "Unknown credit type" });
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("user_credits")
        .update({
          credits_remaining: nextDaily,
          voice_credits_remaining: nextVoice,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("[credits] update user_credits error:", updateError);
        throw updateError;
      }

      return res.status(200).json({
        ok: true,
        plan: updated.plan,
        credits_remaining: updated.credits_remaining,
        voice_credits_remaining: updated.voice_credits_remaining ?? 0,
      });
    }

    // Any other method
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[credits] Handler error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Unexpected server error" });
  }
}
