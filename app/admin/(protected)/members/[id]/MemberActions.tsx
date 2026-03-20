"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  email: string;
  nocoDbId: string;
  currentStatus: string;
  tier: string;
  isAdmin?: boolean;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconSendReset() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MemberActions({ userId, email, nocoDbId, currentStatus, tier, isAdmin = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function run(action: "activate" | "deactivate" | "resend-magic-link") {
    setLoading(action);
    setFeedback(null);
    setMagicLink(null);

    const res = await fetch("/api/admin/update-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, nocoDbId, action, tier }),
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
          msg: action === "activate" ? "Member activated" : "Member deactivated",
        });
        router.refresh();
      }
    }
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    setFeedback(null);

    const res = await fetch("/api/admin/delete-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFeedback({ type: "error", msg: data.error ?? "Delete failed" });
      setLoading(null);
      setConfirmDelete(false);
    } else {
      router.replace("/admin/members");
    }
  }

  async function handleSendReset() {
    setLoading("send-reset");
    setFeedback(null);

    const res = await fetch("/api/admin/send-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    setFeedback(
      res.ok
        ? { type: "success", msg: `Password reset email sent to ${email}.` }
        : { type: "error", msg: data.error ?? "Failed to send reset email" }
    );
    setLoading(null);
  }

  async function handleSetPassword() {
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: "error", msg: "Password must be at least 8 characters." });
      return;
    }

    setLoading("set-password");
    setFeedback(null);

    const res = await fetch("/api/admin/set-member-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFeedback({ type: "error", msg: data.error ?? "Failed to set password" });
    } else {
      setFeedback({ type: "success", msg: "Password set successfully." });
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(null);
  }

  function cancelPasswordForm() {
    setShowPasswordForm(false);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Actions</h2>

      {/* ── Row 1: Account actions ───────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {/* Edit */}
        <a
          href={`/admin/members/${userId}/edit`}
          className="h-9 px-4 bg-white/8 hover:bg-white/15 border border-white/10 text-white/80 text-sm rounded-lg transition flex items-center gap-2"
        >
          <IconEdit /> Edit
        </a>

        {/* Activate / Deactivate */}
        {currentStatus !== "paid" ? (
          <button
            onClick={() => run("activate")}
            disabled={!!loading}
            className="h-9 px-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[110px] justify-center"
          >
            {loading === "activate" ? <Spinner /> : <><IconCheck /> Activate</>}
          </button>
        ) : (
          <button
            onClick={() => run("deactivate")}
            disabled={!!loading}
            className="h-9 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[130px] justify-center"
          >
            {loading === "deactivate" ? <Spinner /> : <><IconPause /> Deactivate</>}
          </button>
        )}

        {/* Send magic link */}
        <button
          onClick={() => run("resend-magic-link")}
          disabled={!!loading}
          className="h-9 px-4 bg-[#E8006A]/10 hover:bg-[#E8006A]/20 border border-[#E8006A]/20 text-[#E8006A] text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 min-w-[160px] justify-center"
        >
          {loading === "resend-magic-link" ? <Spinner /> : <><IconMail /> Send Login Link</>}
        </button>

        {/* Delete — hidden for admin accounts */}
        {isAdmin ? (
          <div
            className="h-9 px-4 bg-[#E8006A]/5 border border-[#E8006A]/15 text-[#E8006A]/50 text-sm rounded-lg flex items-center gap-2 cursor-not-allowed select-none"
            title="Admin accounts are protected from deletion"
          >
            <IconShield /> Admin Account
          </div>
        ) : !confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={!!loading}
            className="h-9 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            <IconTrash /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-sm">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={loading === "delete"}
              className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading === "delete" ? <Spinner /> : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-9 px-3 text-white/40 hover:text-white/70 text-sm transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Row 2: Password management ──────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-white/8">
        <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Password</p>
        <div className="flex flex-wrap gap-2">
          {/* Send password reset email */}
          <button
            onClick={handleSendReset}
            disabled={!!loading}
            className="h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading === "send-reset" ? <Spinner /> : <><IconSendReset /> Send Reset Link</>}
          </button>

          {/* Set password (toggle inline form) */}
          <button
            onClick={() => setShowPasswordForm((v) => !v)}
            disabled={!!loading}
            className={`h-9 px-4 border text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${
              showPasswordForm
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <IconLock /> Set Password
          </button>
        </div>

        {/* Inline password form */}
        {showPasswordForm && (
          <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              autoComplete="new-password"
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSetPassword}
                disabled={loading === "set-password" || !newPassword || !confirmPassword}
                className="h-8 px-4 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs rounded-lg transition disabled:opacity-40 flex items-center gap-1.5 min-w-[110px] justify-center"
              >
                {loading === "set-password" ? <Spinner /> : "Save Password"}
              </button>
              <button
                onClick={cancelPasswordForm}
                className="h-8 px-3 text-white/40 hover:text-white/70 text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback ────────────────────────────────────────────── */}
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
