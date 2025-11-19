import { useState, FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
    else setStatus("Check your email — login link sent!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 backdrop-blur-xl">
        <h1 className="text-xl font-semibold text-center">
          Log in to Root Health
        </h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="w-full rounded-xl bg-emerald-500 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400">
            Send magic link
          </button>
        </form>
        {status && (
          <p className="text-xs text-emerald-300 text-center">{status}</p>
        )}
        {error && (
          <p className="text-xs text-red-300 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
