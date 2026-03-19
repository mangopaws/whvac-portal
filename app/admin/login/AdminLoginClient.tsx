"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });

    if (res?.error) {
      setError("Invalid credentials.");
      setLoading(false);
    } else {
      router.replace("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Badge */}
        <div className="text-center mb-8">
          <span className="inline-block bg-[#E8006A]/10 border border-[#E8006A]/30 text-[#E8006A] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            Admin Access
          </span>
          <h1 className="text-2xl font-bold text-white">WHVAC Portal</h1>
          <p className="text-white/40 text-sm mt-1">Sign in with your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@womeninhvac.ca"
              className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Sign In"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          <a href="/login" className="hover:text-white/50 transition">← Member portal</a>
        </p>
      </div>
    </div>
  );
}
