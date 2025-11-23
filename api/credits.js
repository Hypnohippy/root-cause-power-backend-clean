// api/credits.js
import { supabaseServer } from "./supabaseClient.js";

/**
 * Ensure a user_credits row exists for this user.
 * - Default plan: "free"
 * - Default daily credits: 8
 * - Voice credits default: 0
 */
async function ensureUserCredits(userId) {
  const { data, error } = await supabaseServer
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // PGRST116 = no rows found in maybeSingle
  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) return data;

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

/**
 * Helper: get Supabase user from an email.
 */
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

/**
 * API handler:
 *
 * GET /api/credits?email=...
 *   → returns current credits + plan
 *
 * POST /api/credits
 *   body: { email, type: "daily" | "voice", cost: number }
 *   → decrements credits (unless plan === "vip")
 */
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
        user_id: user.id,
        email,
        plan: creditsRow.plan,
        credits_remaining: creditsRow.credits_remaining,
        voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
        last_reset_at: creditsRow.last_reset_at,
      });
    }

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

      // VIP users: no decrement, always allowed
      if (creditsRow.plan === "vip") {
        return res.status(200).json({
          ok: true,
          plan: creditsRow.plan,
          credits_remaining: creditsRow.credits_remaining,
          voice_credits_remaining: creditsRow.voice_credits_remaining ?? 0,
          skipped_decrement: true,
        });
      }

      let updated = { ...creditsRow };

      if (type === "daily") {
        if (creditsRow.credits_remaining < cost) {
          return res.status(402).json({
            error: "Not enough daily credits",
            credits_remaining: creditsRow.credits_remaining,
          });
        }
        updated.credits_remaining = creditsRow.credits_remaining - cost;
      } else if (type === "voice") {
        const currentVoice = creditsRow.voice_credits_remaining ?? 0;
        if (currentVoice < cost) {
          return res.status(402).json({
            error: "Not enough voice credits",
            voice_credits_remaining: currentVoice,
          });
        }
        updated.voice_credits_remaining = currentVoice - cost;
      } else {
        return res.status(400).json({ error: "Unknown credit type" });
      }

      const { data: saved, error: updateError } = await supabaseServer
        .from("user_credits")
        .update({
          credits_remaining: updated.credits_remaining,
          voice_credits_remaining: updated.voice_credits_remaining,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        ok: true,
        plan: saved.plan,
        credits_remaining: saved.credits_remaining,
        voice_credits_remaining: saved.voice_credits_remaining ?? 0,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Credits handler error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error" });
  }
}
