"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  nocoDbId: string;
  currentStatus: string;
  tier: string;
}

export default function MemberActions({ userId, nocoDbId, currentStatus, tier }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  async function run(action: "activate" | "deactivate" | "resend-magic-link") {
    setLoading(action);
    setFeedback(null);
    setMagicLink(null);

    const res = await fetch("/api/admin/update-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, nocoDbId, action, tier }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFeedback({ type: "error", msg: data.error ?? "Something went wrong" });
    } else {
      if (action === "resend-magic-link" && data.magicLink) {
        setMagicLink(data.magicLink);
        setFeedback({ type: "success", msg: "Magic link generated and sent." });
      } else {
        setFeedback({
          type: "success",
          msg: action === "activate" ? "Member activated ✓" : "Member deactivated",
        });
        router.refresh();
      }
    }
    setLoading(null);
  }

  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Actions</h2>

      <div className="flex flex-wrap gap-2">
        {currentStatus !== "paid" ? (
          <button
            onClick={() => run("activate")}
            disabled={!!loading}
            className="h-9 px-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[110px] justify-center"
          >
            {loading === "activate" ? <Spinner /> : "✓ Activate"}
          </button>
        ) : (
          <button
            onClick={() => run("deactivate")}
            disabled={!!loading}
            className="h-9 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[130px] justify-center"
          >
            {loading === "deactivate" ? <Spinner /> : "⏸ Deactivate"}
          </button>
        )}

        <button
          onClick={() => run("resend-magic-link")}
          disabled={!!loading}
          className="h-9 px-4 bg-[#E8006A]/10 hover:bg-[#E8006A]/20 border border-[#E8006A]/20 text-[#E8006A] text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[160px] justify-center"
        >
          {loading === "resend-magic-link" ? <Spinner /> : "✉ Send Login Link"}
        </button>
      </div>

      {feedback && (
        <p className={`text-sm mt-3 ${feedback.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {feedback.msg}
        </p>
      )}

      {magicLink && (
        <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-white/40 text-xs mb-1">Magic link (also emailed):</p>
          <div className="flex items-center gap-2">
            <code className="text-white/70 text-xs break-all flex-1">{magicLink}</code>
            <button
              onClick={() => navigator.clipboard.writeText(magicLink)}
              className="text-[#E8006A] text-xs whitespace-nowrap hover:underline"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}
