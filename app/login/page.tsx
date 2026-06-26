"use client";

import { useState } from "react";
import { AlertCircle, Hammer, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Force a full reload so middleware re-evaluates cookies
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7ff] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <Hammer size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-indigo-950">Golden Hardwares</h1>
          <p className="mt-1 text-sm text-gray-400">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-purple-100 px-3 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-purple-100 px-3 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
