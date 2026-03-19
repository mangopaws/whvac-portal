"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  tier: "individual" | "student" | "corporate";
  province: string;
  careerRole: string;
  paymentMethod: "stripe" | "emt" | "cash";
}

const CA_PROVINCES = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT",
];

const TIER_PRICES = { individual: 75, student: 25, corporate: 250 };

interface Result {
  userId: string;
  memberId: string;
  magicLink: string;
  paymentMethod: string;
}

export default function CreateMemberForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    tier: "individual",
    province: "",
    careerRole: "",
    paymentMethod: "emt",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Uses session-authenticated portal route (not the Bearer-token automation endpoint)
    const res = await fetch("/api/admin/portal-create-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create member");
      setLoading(false);
      return;
    }

    setResult(data as Result);
    setLoading(false);
  }

  function copyLink() {
    if (!result?.magicLink) return;
    navigator.clipboard.writeText(result.magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <span className="text-green-400 text-lg">✓</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">Member created!</h2>
            <p className="text-white/40 text-sm">
              {form.paymentMethod !== "stripe"
                ? "Payment instructions sent by email."
                : "No email sent — payment handled by Stripe on checkout."}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <Row label="Auth User ID" value={result.userId} mono />
          <Row label="NocoDB Record ID" value={result.memberId} mono />
          <Row label="Payment Method" value={result.paymentMethod} />
        </div>

        <div>
          <p className="text-white/40 text-xs mb-1.5">Magic Login Link</p>
          <div className="bg-black/30 border border-white/10 rounded-lg p-3 flex items-start gap-2">
            <code className="text-white/70 text-xs break-all flex-1">{result.magicLink}</code>
            <button
              onClick={copyLink}
              className="flex-shrink-0 text-xs text-[#E8006A] hover:underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => { setResult(null); setForm({ firstName: "", lastName: "", email: "", tier: "individual", province: "", careerRole: "", paymentMethod: "emt" }); }}
            className="h-9 px-4 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition"
          >
            Add Another
          </button>
          <button
            onClick={() => router.push("/admin/members")}
            className="h-9 px-4 bg-[#E8006A] hover:bg-[#c8005a] text-white text-sm font-medium rounded-lg transition"
          >
            View All Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required>
          <Input
            value={form.firstName}
            onChange={(v) => set("firstName", v)}
            placeholder="Jane"
            required
          />
        </Field>
        <Field label="Last Name" required>
          <Input
            value={form.lastName}
            onChange={(v) => set("lastName", v)}
            placeholder="Smith"
            required
          />
        </Field>
      </div>

      <Field label="Email" required>
        <Input
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          placeholder="jane@example.com"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Membership Tier" required>
          <Select
            value={form.tier}
            onChange={(v) => set("tier", v as FormState["tier"])}
            options={[
              { value: "individual", label: `Individual — $${TIER_PRICES.individual}` },
              { value: "student", label: `Student — $${TIER_PRICES.student}` },
              { value: "corporate", label: `Corporate — $${TIER_PRICES.corporate}` },
            ]}
          />
        </Field>

        <Field label="Payment Method" required>
          <Select
            value={form.paymentMethod}
            onChange={(v) => set("paymentMethod", v as FormState["paymentMethod"])}
            options={[
              { value: "emt", label: "e-Transfer" },
              { value: "cash", label: "Cash" },
              { value: "stripe", label: "Stripe (card)" },
            ]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Province">
          <Select
            value={form.province}
            onChange={(v) => set("province", v)}
            options={[
              { value: "", label: "— Select —" },
              ...CA_PROVINCES.map((p) => ({ value: p, label: p })),
            ]}
          />
        </Field>

        <Field label="Career Role">
          <Input
            value={form.careerRole}
            onChange={(v) => set("careerRole", v)}
            placeholder="e.g. HVAC Technician"
          />
        </Field>
      </div>

      {/* Note about payment method */}
      <div className="bg-white/[0.03] border border-white/8 rounded-lg px-4 py-3 text-xs text-white/50">
        {form.paymentMethod === "emt" && (
          <>✉ e-Transfer instructions will be emailed to {form.email || "the member"}</>
        )}
        {form.paymentMethod === "cash" && (
          <>✉ Cash payment instructions will be emailed to {form.email || "the member"}</>
        )}
        {form.paymentMethod === "stripe" && (
          <>No email sent. You'll get back a Stripe checkout URL to share with the member.</>
        )}
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
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
        ) : (
          "Create Member & Send Email"
        )}
      </button>
    </form>
  );
}

/* Small field components */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
        {label}{required && <span className="text-[#E8006A] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, required }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 bg-[#1A1A2E] border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-white/40 w-36 flex-shrink-0">{label}</span>
      <span className={`text-white/80 ${mono ? "font-mono text-xs" : ""} break-all`}>{value}</span>
    </div>
  );
}
