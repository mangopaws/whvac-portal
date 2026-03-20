"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordForm() {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (next !== confirm) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }

    setStatus("loading");

    const result = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: false,
    });

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message ?? "Failed to change password. Check your current password.");
    } else {
      setStatus("success");
      setMessage("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-white/50 text-xs mb-1.5">Current Password</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#E8006A]/50 transition"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-white/50 text-xs mb-1.5">New Password</label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#E8006A]/50 transition"
          placeholder="••••••••"
        />
        <p className="text-white/25 text-[10px] mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label className="block text-white/50 text-xs mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#E8006A]/50 transition"
          placeholder="••••••••"
        />
      </div>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-10 px-6 bg-[#E8006A] hover:bg-[#c8005a] text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
      >
        {status === "loading" ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}
