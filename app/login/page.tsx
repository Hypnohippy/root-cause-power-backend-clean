"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      }

      // ✅ REDIRECT AFTER SUCCESSFUL LOGIN / SIGNUP
      router.push("/dashboard/glass");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-black bg-cover bg-center flex items-center justify-center relative"
      style={{ backgroundImage: "url('/glass-human.png')" }}
    >
      {/* Dark overlay so text is readable */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-black/80 border border-emerald-500/40 rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Root Health Ops
          </h1>
          <p className="text-emerald-200/80 text-center mb-6">
            Sign in to access your Root Health Ops Dashboard
          </p>

          {/* Toggle Login / Register */}
          <div className="flex mb-6 border border-emerald-500/40 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-emerald-500 text-black"
                  : "bg-transparent text-emerald-100"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-semibold ${
                mode === "signup"
                  ? "bg-emerald-500 text-black"
                  : "bg-transparent text-emerald-100"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-emerald-100 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2 bg-slate-900 text-white border border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-emerald-100 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 bg-slate-900 text-white border border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="At least 6 characters"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg disabled:opacity-60"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                ? "Login"
                : "Register"}
            </button>
          </form>

          <p className="text-xs text-emerald-100/70 mt-4 text-center">
            Once you&apos;re in, you&apos;ll go straight to your Glass Human
            Diagnostic inside Root Health Ops.
          </p>
        </div>
      </div>
    </div>
  );
}
