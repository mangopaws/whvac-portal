"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ProfileClient({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isDirty = name.trim() !== userName;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || !name.trim()) return;
    setSaving(true);
    setError("");

    const res = await authClient.updateUser({ name: name.trim() });
    if (res?.error) {
      setError("Failed to update name. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => { setSaved(false); router.refresh(); }, 1500);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/8">
        <h2 className="text-sm font-semibold text-white">Account</h2>
      </div>
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-lg px-3 text-white/40 text-sm cursor-not-allowed"
          />
          <p className="text-white/25 text-xs mt-1">Email cannot be changed. Contact support to update.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {isDirty && (
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? "✓ Saved!" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setName(userName)}
              className="h-9 px-4 bg-white/5 hover:bg-white/10 text-white/50 text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
