import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bechmxbywqhsauhctewo.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user_id, email } = req.body || {};

    if (!user_id || !email) {
      return res.status(400).json({ error: "Missing user_id or email" });
    }

    // Check if a row already exists
    const { data, error } = await supabaseAdmin
      .from("user_credits")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // Decide default plan & credits
    let plan = "free";
    let credits = 30;

    // Special case: YOU are VIP with huge credits for demos
    const founderEmail = "david@fuelgeist.co.uk"; // change if needed
    if (email.toLowerCase() === founderEmail.toLowerCase()) {
      plan = "vip";
      credits = 999999;
    }

    if (!data) {
      // No record yet -> create one
      const { error: insertError } = await supabaseAdmin.from("user_credits").insert({
        user_id,
        plan,
        credits_remaining: credits,
      });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return res.status(500).json({ error: "Failed to create credits row" });
      }

      return res.status(200).json({
        ok: true,
        created: true,
        plan,
        credits_remaining: credits,
      });
    } else {
      // Already exists -> optionally upgrade you to VIP if needed
      let updatedPlan = data.plan;
      let updatedCredits = data.credits_remaining;

      if (
        email.toLowerCase() === founderEmail.toLowerCase() &&
        data.plan !== "vip"
      ) {
        updatedPlan = "vip";
        updatedCredits = 999999;

        const { error: updateError } = await supabaseAdmin
          .from("user_credits")
          .update({
            plan: updatedPlan,
            credits_remaining: updatedCredits,
          })
          .eq("user_id", user_id);

        if (updateError) {
          console.error("Supabase update error:", updateError);
          return res.status(500).json({ error: "Failed to upgrade to VIP" });
        }
      }

      return res.status(200).json({
        ok: true,
        created: false,
        plan: updatedPlan,
        credits_remaining: updatedCredits,
      });
    }
  } catch (e) {
    console.error("Handler error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
