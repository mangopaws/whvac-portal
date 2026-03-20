"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Defaults {
  name: string;
  membershipStatus: string;
  membershipTier: string;
  phone: string;
  province: string;
  payment_method: string;
  payment_status: string;
  job_title: string;
  company_name: string;
  trade_affiliation: string;
  sector: string;
  school_program: string;
  graduation_year: string;
  mentor_areas: string;
  mentor_hours: string;
  referral_source: string;
  interested: string;
  anything_else: string;
}

interface Props {
  userId: string;
  email: string;
  nocoDbId: string;
  defaults: Defaults;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition";

const selectCls =
  "w-full h-10 bg-[#1E1E30] border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition";

export default function EditMemberForm({ userId, email, nocoDbId, defaults }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Defaults>(defaults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: keyof Defaults, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/admin/edit-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        email,
        nocoDbId: nocoDbId || undefined,
        ...form,
        // Send empty string as undefined so we don't overwrite with blank
        membershipTier: form.membershipTier || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => router.push(`/admin/members/${userId}`), 800);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Account section */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/8">
          Account
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
            />
          </Field>

          <Field label="Email">
            <input
              className={`${inputCls} opacity-50 cursor-not-allowed`}
              value={email}
              disabled
              title="Email cannot be changed here"
            />
          </Field>

          <Field label="Membership Status">
            <select
              className={selectCls}
              value={form.membershipStatus}
              onChange={(e) => set("membershipStatus", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Active (Paid)</option>
            </select>
          </Field>

          <Field label="Membership Tier">
            <select
              className={selectCls}
              value={form.membershipTier}
              onChange={(e) => set("membershipTier", e.target.value)}
            >
              <option value="">— None —</option>
              <option value="individual">Individual</option>
              <option value="student">Student</option>
              <option value="corporate">Corporate</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Payment section */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/8">
          Payment
          {!nocoDbId && (
            <span className="ml-2 text-white/30 font-normal text-xs">(no form record — changes will be stored on next signup)</span>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment Method">
            <select
              className={selectCls}
              value={form.payment_method}
              onChange={(e) => set("payment_method", e.target.value)}
              disabled={!nocoDbId}
            >
              <option value="">— None —</option>
              <option value="stripe">Stripe</option>
              <option value="emt">e-Transfer</option>
              <option value="cash">Cash</option>
              <option value="paid">Paid (other)</option>
            </select>
          </Field>

          <Field label="Payment Status">
            <select
              className={selectCls}
              value={form.payment_status}
              onChange={(e) => set("payment_status", e.target.value)}
              disabled={!nocoDbId}
            >
              <option value="">— None —</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Contact section */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/8">
          Contact &amp; Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Phone number"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Province">
            <input
              className={inputCls}
              value={form.province}
              onChange={(e) => set("province", e.target.value)}
              placeholder="e.g. Ontario"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Job Title">
            <input
              className={inputCls}
              value={form.job_title}
              onChange={(e) => set("job_title", e.target.value)}
              placeholder="Job title"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Company Name">
            <input
              className={inputCls}
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="Company or organization"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Trade Affiliation">
            <input
              className={inputCls}
              value={form.trade_affiliation}
              onChange={(e) => set("trade_affiliation", e.target.value)}
              placeholder="Union, trade org, etc."
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Sector">
            <input
              className={inputCls}
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
              placeholder="Sector / industry"
              disabled={!nocoDbId}
            />
          </Field>
        </div>
      </section>

      {/* Student fields */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/8">
          Student Fields
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="School / Program">
            <input
              className={inputCls}
              value={form.school_program}
              onChange={(e) => set("school_program", e.target.value)}
              placeholder="School and program"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Graduation Year">
            <input
              className={inputCls}
              value={form.graduation_year}
              onChange={(e) => set("graduation_year", e.target.value)}
              placeholder="e.g. 2025"
              disabled={!nocoDbId}
            />
          </Field>
        </div>
      </section>

      {/* Mentor / other */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/8">
          Mentorship &amp; Other
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Mentor Areas">
            <input
              className={inputCls}
              value={form.mentor_areas}
              onChange={(e) => set("mentor_areas", e.target.value)}
              placeholder="Areas of mentorship"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Mentor Hours / Week">
            <input
              className={inputCls}
              value={form.mentor_hours}
              onChange={(e) => set("mentor_hours", e.target.value)}
              placeholder="Availability"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Referral Source">
            <input
              className={inputCls}
              value={form.referral_source}
              onChange={(e) => set("referral_source", e.target.value)}
              placeholder="How they heard about WHVAC"
              disabled={!nocoDbId}
            />
          </Field>

          <Field label="Interested In">
            <input
              className={inputCls}
              value={form.interested}
              onChange={(e) => set("interested", e.target.value)}
              placeholder="Areas of interest"
              disabled={!nocoDbId}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Anything Else">
              <textarea
                className={`${inputCls} h-20 py-2 resize-none`}
                value={form.anything_else}
                onChange={(e) => set("anything_else", e.target.value)}
                placeholder="Additional notes"
                disabled={!nocoDbId}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Errors / success */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
          Saved! Redirecting…
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 bg-[#E8006A] hover:bg-[#c8005a] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <a
          href={`/admin/members/${userId}`}
          className="h-10 px-5 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition flex items-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
