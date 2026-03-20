"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const BENEFITS = [
  { icon: "🤝", text: "Mentorship from senior industry leaders" },
  { icon: "📚", text: "Exclusive resources, guides & job board" },
  { icon: "🎓", text: "Scholarships & professional development" },
  { icon: "🗂️", text: "Members-only directory & networking" },
];

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const joinUrl =
    process.env.NEXT_PUBLIC_LYGOTYPE_FORM_URL ?? "https://lygo.abreeze.studio";

  // Magic links go directly to /api/auth/magic-link/verify — this handles the
  // edge case where a user lands on /login with a ?token= param (e.g. redirected
  // from email client) and forwards them to the proper verification endpoint.
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    setMagicLoading(true);
    // Redirect to Better Auth's verify endpoint
    const verifyUrl = `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=/dashboard`;
    router.replace(verifyUrl);
  }, [searchParams, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (res?.error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
    } else {
      router.replace(searchParams.get("redirect") ?? "/dashboard");
    }
  }

  if (magicLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#E8006A] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/70 text-sm">Verifying your magic link…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A2E] flex-col justify-center px-16 py-20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E8006A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#E8006A]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-md">
          {/* Logo / wordmark */}
          <div className="mb-10">
            <img src="/whvac-logo.svg" alt="WHVAC" className="h-9 w-auto" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-serif font-bold text-white leading-tight mb-6">
            Your career,{" "}
            <span className="text-[#E8006A]">connected.</span>
          </h1>

          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Join Canada's community for women advancing in the HVAC &
            refrigeration industry.
          </p>

          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{b.icon}</span>
                <span className="text-white/80 text-base">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-[#1E1E30] flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex justify-center">
          <img src="/whvac-logo.svg" alt="WHVAC" className="h-8 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-2">Member Sign In</h2>
          <p className="text-white/50 text-sm mb-8">
            Access your WHVAC member portal
          </p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 pr-10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Forgot your password?{" "}
            <a
              href={`mailto:hello@womeninhvac.ca?subject=Password%20Reset%20Request`}
              className="text-[#E8006A] hover:underline"
            >
              Contact support
            </a>
          </p>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">
              Not a member yet?{" "}
              <a
                href={joinUrl}
                className="text-[#E8006A] font-medium hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join WHVAC →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
