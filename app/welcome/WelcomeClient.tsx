"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const NEXT_STEPS = [
  "Complete your member profile",
  "Explore the member directory",
  "Browse upcoming events",
  "Sign up for the members newsletter",
];

const TIER_LABELS: Record<string, string> = {
  individual: "Individual Member",
  student: "Student Member",
  corporate: "Corporate Member",
};

export default function WelcomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const tier = searchParams.get("tier") ?? "individual";
  const tierLabel = TIER_LABELS[tier] ?? "Member";

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(id);
          router.replace("/dashboard");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#E8006A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-[#E8006A]/10 border-2 border-[#E8006A]/30 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-[#E8006A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <span className="inline-block bg-[#E8006A]/10 border border-[#E8006A]/30 rounded-full px-3 py-1 text-[#E8006A] text-xs font-semibold uppercase tracking-wider mb-4">
          {tierLabel}
        </span>

        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-3">
          Welcome to WHVAC!
        </h1>
        <p className="text-white/60 text-lg mb-10">
          Your membership is confirmed. We're so glad to have you in our
          community.
        </p>

        {/* What's next */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-white font-semibold mb-4">What's next</h2>
          <ol className="space-y-3">
            {NEXT_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E8006A]/10 border border-[#E8006A]/30 text-[#E8006A] text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-white/70 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={() => router.replace("/dashboard")}
          className="w-full h-11 bg-[#E8006A] hover:bg-[#c8005a] text-white font-semibold rounded-lg transition mb-3"
        >
          Go to My Dashboard
        </button>

        <p className="text-white/30 text-sm">
          Redirecting automatically in {countdown}s…
        </p>
      </div>
    </div>
  );
}
