// public/js/supabaseClient.js
// Lightweight Supabase client for browser use on the login page.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 👉 TODO: Put your real Supabase URL + anon key here.
// You can find them in Supabase under: Project Settings → API.
const SUPABASE_URL = "https://bechmxbywqhsauhctewo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlY2hteGJ5d3Foc2F1aGN0ZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODE0OTcsImV4cCI6MjA3OTA1NzQ5N30.kE3AfgQLI4WWq7je8_0noTvjpObVuW9hPMRUwwxRiFo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
