import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/nocodb";
import ProfileClient from "./ProfileClient";

export const metadata = { title: "My Profile — WHVAC" };
export const dynamic = "force-dynamic";

const TIER_LABELS: Record<string, string> = {
  individual: "Individual Member",
  student: "Student Member",
  corporate: "Corporate Member",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as {
    id: string; name: string; email: string;
    membershipStatus?: string; membershipTier?: string;
  };

  const member = await getMemberByEmail(user.email).catch(() => null);

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
      <p className="text-white/40 text-sm mb-8">Your membership details and account settings.</p>

      {/* Membership badge */}
      <div className="bg-[#1A1A2E] border border-[#E8006A]/20 rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E8006A]/10 border-2 border-[#E8006A]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#E8006A] text-2xl font-bold">
            {user.name[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-lg truncate">{user.name}</p>
          <p className="text-white/50 text-sm truncate">{user.email}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`inline-block border rounded-full px-3 py-1 text-xs font-medium ${
            user.membershipStatus === "paid"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          }`}>
            {user.membershipStatus === "paid" ? "Active" : "Pending"}
          </span>
          {user.membershipTier && (
            <p className="text-white/40 text-xs mt-1">
              {TIER_LABELS[user.membershipTier] ?? user.membershipTier}
            </p>
          )}
        </div>
      </div>

      {/* Editable name */}
      <ProfileClient userName={user.name} userEmail={user.email} />

      {/* NocoDB details (read-only) */}
      {member && (
        <div className="mt-6 bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">Membership Details</h2>
          </div>
          <dl className="divide-y divide-white/5">
            {[
              { label: "Province", value: member.province ?? "—" },
              { label: "Payment Method", value: member.payment_method ?? "—" },
              {
                label: "Member Since",
                value: member.activated_at
                  ? new Date(member.activated_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
                  : "Pending activation",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center px-5 py-3 gap-4">
                <dt className="text-white/40 text-sm w-36 flex-shrink-0">{label}</dt>
                <dd className="text-white/80 text-sm capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Support link */}
      <div className="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-white/40 text-sm">
          Need to update your email or membership tier?{" "}
          <a
            href="mailto:hello@womeninhvac.ca?subject=Profile%20Update%20Request"
            className="text-[#E8006A] hover:underline"
          >
            Contact us →
          </a>
        </p>
      </div>
    </div>
  );
}
