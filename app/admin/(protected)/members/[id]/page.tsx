import { adminGetUser } from "@/lib/db";
import { getMemberByEmail } from "@/lib/nocodb";
import { notFound } from "next/navigation";
import Link from "next/link";
import MemberActions from "./MemberActions";

export const dynamic = "force-dynamic";

function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Better Auth is the source of truth — page key is the BA user ID
  const authUser = adminGetUser(id);
  if (!authUser) notFound();

  const isAdmin = isAdminEmail(authUser.email);

  // Load NocoDB extended profile if it exists (optional — may be null for pre-existing users)
  const nocoMember = await getMemberByEmail(authUser.email).catch(() => null);

  const authFields = [
    { label: "Full Name",  value: authUser.name },
    { label: "Email",      value: authUser.email },
    { label: "User ID",    value: authUser.id },
    { label: "Status",     value: authUser.membershipStatus === "paid" ? "Active" : authUser.membershipStatus },
    { label: "Tier",       value: authUser.membershipTier ?? "—" },
    { label: "Registered", value: new Date(authUser.createdAt).toLocaleString("en-CA") },
  ];

  const nocoFields = nocoMember
    ? [
        { label: "Phone",             value: nocoMember.phone ?? "—" },
        { label: "Province",          value: nocoMember.province ?? "—" },
        { label: "Payment Method",    value: nocoMember.payment_method ?? "—" },
        { label: "Payment Status",    value: nocoMember.payment_status },
        { label: "Stripe ID",         value: nocoMember.stripe_payment_id ?? "—" },
        { label: "Trade Affiliation", value: nocoMember.trade_affiliation ?? "—" },
        { label: "Sector",            value: nocoMember.sector ?? "—" },
        { label: "Job Title",         value: nocoMember.job_title ?? "—" },
        { label: "Company",           value: nocoMember.company_name ?? "—" },
        { label: "School Program",    value: nocoMember.school_program ?? "—" },
        { label: "Graduation Year",   value: nocoMember.graduation_year ?? "—" },
        { label: "Mentor Areas",      value: nocoMember.mentor_areas ?? "—" },
        { label: "Mentor Hours",      value: nocoMember.mentor_hours ?? "—" },
        { label: "Referral Source",   value: nocoMember.referral_source ?? "—" },
        { label: "Interested In",     value: nocoMember.interested ?? "—" },
        { label: "Anything Else",     value: nocoMember.anything_else ?? "—" },
        {
          label: "Activated At",
          value: nocoMember.activated_at
            ? new Date(nocoMember.activated_at).toLocaleString("en-CA")
            : "—",
        },
      ]
    : [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/admin/members" className="hover:text-white/70 transition">Members</Link>
        <span>/</span>
        <span className="text-white/70">{authUser.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8006A]/10 border border-[#E8006A]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#E8006A] text-lg font-bold">
              {authUser.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{authUser.name}</h1>
              {isAdmin && (
                <span className="text-[10px] bg-[#E8006A]/10 border border-[#E8006A]/25 text-[#E8006A] rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm">{authUser.email}</p>
          </div>
        </div>
        <span className={`inline-block border rounded-full px-3 py-1 text-xs font-medium ${
          authUser.membershipStatus === "paid"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        }`}>
          {authUser.membershipStatus === "paid" ? "Active" : "Pending"}
        </span>
      </div>

      {/* Actions */}
      <MemberActions
        userId={authUser.id}
        email={authUser.email}
        nocoDbId={nocoMember?.id ?? ""}
        currentStatus={authUser.membershipStatus}
        tier={authUser.membershipTier ?? nocoMember?.membership_type ?? "individual"}
        isAdmin={isAdmin}
      />

      {/* Auth Account */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Account</h2>
        </div>
        <dl className="divide-y divide-white/5">
          {authFields.map(({ label, value }) => (
            <div key={label} className="flex px-5 py-3 gap-4">
              <dt className="text-white/40 text-xs w-40 flex-shrink-0 pt-0.5">{label}</dt>
              <dd className="text-white text-sm break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* NocoDB extended profile */}
      {nocoMember ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">Member Profile</h2>
            <p className="text-white/30 text-xs mt-0.5">From membership form submission</p>
          </div>
          <dl className="divide-y divide-white/5">
            {nocoFields.map(({ label, value }) => (
              <div key={label} className="flex px-5 py-3 gap-4">
                <dt className="text-white/40 text-xs w-40 flex-shrink-0 pt-0.5">{label}</dt>
                <dd className="text-white/80 text-sm break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4">
          <p className="text-white/30 text-sm">No form submission on file for this member.</p>
          <p className="text-white/20 text-xs mt-1">
            Profile data appears here once a member completes the Lygotype signup form.
          </p>
        </div>
      )}
    </div>
  );
}
