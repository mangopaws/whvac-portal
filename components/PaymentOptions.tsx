"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentOptionsProps {
  tier: string;
  variant?: "dark" | "light";
}

const TIER_PRICES: Record<string, number> = {
  individual: 75,
  student: 25,
  corporate: 250,
};

const TIER_LABELS: Record<string, string> = {
  individual: "Individual Membership",
  student: "Student Membership",
  corporate: "Corporate Membership",
};

type Method = "stripe" | "emt" | "cash";

const EMT_EMAIL = "treasurer@womeninhvac.ca";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="ml-2 inline-flex items-center gap-1 text-xs bg-[#E8006A]/10 border border-[#E8006A]/30 text-[#E8006A] px-2 py-0.5 rounded hover:bg-[#E8006A]/20 transition"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function PaymentOptions({
  tier,
  variant = "dark",
}: PaymentOptionsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Method | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = TIER_PRICES[tier] ?? 75;
  const tierLabel = TIER_LABELS[tier] ?? tier;

  const isDark = variant === "dark";
  const cardBg = isDark ? "bg-white/5" : "bg-gray-50";
  const cardBorder = isDark ? "border-white/10" : "border-gray-200";
  const selectedBorder = "border-[#E8006A]";
  const selectedBg = isDark ? "bg-[#E8006A]/5" : "bg-[#E8006A]/5";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-white/60" : "text-gray-500";
  const detailBg = isDark ? "bg-white/5" : "bg-gray-100";

  const OPTIONS: {
    method: Method;
    label: string;
    badge: string;
    badgeColor: string;
    description: string;
    detail: React.ReactNode;
  }[] = [
    {
      method: "stripe",
      label: "Credit / Debit Card",
      badge: "Instant",
      badgeColor: "bg-green-500/10 text-green-500 border-green-500/30",
      description: "Pay securely via Stripe. Membership activates immediately.",
      detail: (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${textPrimary}`}>Steps:</p>
          <ol className={`text-sm ${textSecondary} space-y-1 list-decimal list-inside`}>
            <li>Click "Pay with Card" below</li>
            <li>Complete Stripe checkout (secure, PCI-compliant)</li>
            <li>Membership activates instantly after payment</li>
            <li>Check your email for a welcome link</li>
          </ol>
        </div>
      ),
    },
    {
      method: "emt",
      label: "e-Transfer",
      badge: "1–2 days",
      badgeColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      description:
        "Send an Interac e-Transfer. Account activates within 1–2 business days.",
      detail: (
        <div className="space-y-3">
          <p className={`text-sm font-medium ${textPrimary}`}>Steps:</p>
          <ol className={`text-sm ${textSecondary} space-y-1 list-decimal list-inside`}>
            <li>
              Send ${price} CAD via e-Transfer to{" "}
              <span className="font-mono text-[#E8006A]">{EMT_EMAIL}</span>
              <CopyButton text={EMT_EMAIL} />
            </li>
            <li>
              Use message: <span className="font-mono">WHVAC {tierLabel}</span>
            </li>
            <li>We'll activate your account within 1–2 business days</li>
            <li>You'll receive a welcome email with your login link</li>
          </ol>
        </div>
      ),
    },
    {
      method: "cash",
      label: "Cash",
      badge: "Manual",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      description:
        "Pay cash at an event or to a WHVAC coordinator. Activation upon receipt.",
      detail: (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${textPrimary}`}>Steps:</p>
          <ol className={`text-sm ${textSecondary} space-y-1 list-decimal list-inside`}>
            <li>Confirm your cash payment method below</li>
            <li>
              Pay ${price} CAD at the next WHVAC event or to a coordinator
            </li>
            <li>Our team will activate your account upon receipt</li>
            <li>You'll receive an email confirmation</li>
          </ol>
        </div>
      ),
    },
  ];

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: selected, tier }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      if (selected === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.replace("/welcome?tier=" + tier);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  const ctaLabel =
    selected === "stripe"
      ? `Pay $${price} with Card`
      : selected === "emt"
      ? "I'll Send the e-Transfer"
      : selected === "cash"
      ? "I'll Pay Cash"
      : "Select a Payment Method";

  return (
    <div className="space-y-3">
      <p className={`text-sm font-medium ${textSecondary} mb-4`}>
        Choose how you'd like to pay for your{" "}
        <span className={textPrimary}>{tierLabel}</span> (${price} CAD/year)
      </p>

      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.method;
        return (
          <div
            key={opt.method}
            className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${
              isSelected
                ? `${selectedBorder} ${selectedBg}`
                : `${cardBorder} ${cardBg} hover:border-white/20`
            }`}
            onClick={() => setSelected(isSelected ? null : opt.method)}
          >
            {/* Option header */}
            <div className="flex items-center gap-3 p-4 min-h-[52px]">
              {/* Radio */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                  isSelected ? "border-[#E8006A]" : isDark ? "border-white/30" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E8006A]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${textPrimary}`}>
                    {opt.label}
                  </span>
                  <span
                    className={`text-xs border rounded-full px-2 py-0.5 ${opt.badgeColor}`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className={`text-xs ${textSecondary} mt-0.5 leading-snug`}>
                  {opt.description}
                </p>
              </div>
            </div>

            {/* Expanded detail */}
            {isSelected && (
              <div className={`px-4 pb-4 pt-1 ${detailBg} border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                {opt.detail}
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selected || loading}
        className="w-full h-12 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          ctaLabel
        )}
      </button>
    </div>
  );
}
