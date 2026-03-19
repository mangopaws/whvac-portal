"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const FEATURES = [
  "Member Directory",
  "Mentorship Matching",
  "Job Board",
  "Scholarships",
  "Event Access",
  "Resource Library",
];

export default function ComingSoonClient({
  launchDate,
}: {
  launchDate: string;
}) {
  const target = new Date(launchDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(target));
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = setInterval(
      () => setTimeLeft(getTimeLeft(target)),
      1000
    );
    return () => clearInterval(id);
  }, [target]);

  async function handleEarlyAccess(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // n8n early access webhook (optional)
      const webhook = process.env.NEXT_PUBLIC_EARLY_ACCESS_WEBHOOK_URL;
      if (webhook) {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
        });
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show success regardless
    } finally {
      setSubmitting(false);
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#1A1A2E] relative overflow-hidden flex flex-col items-center justify-center px-6 py-16">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,0,106,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,0,106,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E8006A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center">
        <span className="inline-block text-[#E8006A] font-bold text-sm tracking-widest uppercase mb-6">
          WHVAC — Women in HVAC &amp; Refrigeration
        </span>

        <h1 className="text-5xl lg:text-6xl font-serif font-bold text-white mb-4 leading-tight">
          Something big is{" "}
          <span className="text-[#E8006A]">coming.</span>
        </h1>

        <p className="text-white/60 text-lg mb-12 max-w-lg mx-auto">
          Canada's member portal for women advancing in HVAC &amp; refrigeration
          launches soon.
        </p>

        {/* Countdown */}
        <div className="flex justify-center gap-4 mb-14">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Min" },
            { value: timeLeft.seconds, label: "Sec" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-w-[72px]"
            >
              <span className="text-3xl lg:text-4xl font-bold text-white tabular-nums">
                {pad(value)}
              </span>
              <span className="text-white/40 text-xs mt-1 uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Email capture */}
        {submitted ? (
          <div className="bg-[#E8006A]/10 border border-[#E8006A]/30 rounded-xl px-6 py-5 mb-10 inline-block">
            <p className="text-[#E8006A] font-medium">
              ✓ You're on the early access list!
            </p>
            <p className="text-white/50 text-sm mt-1">
              We'll email you when we launch.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleEarlyAccess}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-6 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-60 text-white font-semibold rounded-lg transition whitespace-nowrap"
            >
              {submitting ? "…" : "Get Early Access"}
            </button>
          </form>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8006A]" />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
