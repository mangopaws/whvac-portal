import { getMemberById } from "@/lib/nocodb";
import { adminGetUser } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import MemberActions from "./MemberActions";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const authUser = member.userId ? adminGetUser(member.userId) : null;

  const fields = [
    { label: "Full Name", value: member.full_name },
    { label: "Email", value: member.email },
    { label: "Province", value: member.province ?? "—" },
    { label: "Membership Tier", value: member.membership_type },
    { label: "Payment Method", value: member.payment_method ?? "—" },
    { label: "Payment Status", value: member.payment_status },
    { label: "Stripe Payment ID", value: member.stripe_payment_id ?? "—" },
    {
      label: "Activated At",
      value: member.activated_at
        ? new Date(member.activated_at).toLocaleString("en-CA")
        : "—",
    },
    {
      label: "Join Date",
      value: member.join_date
        ? new Date(member.join_date).toLocaleString("en-CA")
        : "—",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/admin/members" className="hover:text-white/70 transition">Members</Link>
        <span>/</span>
        <span className="text-white/70">{member.full_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8006A]/10 border border-[#E8006A]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#E8006A] text-lg font-bold">
              {member.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{member.full_name}</h1>
            <p className="text-white/40 text-sm">{member.email}</p>
          </div>
        </div>
        <span className={`inline-block border rounded-full px-3 py-1 text-xs font-medium capitalize ${
          member.payment_status === "active"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        }`}>
          {member.payment_status}
        </span>
      </div>

      {/* Actions */}
      <MemberActions
        userId={member.userId ?? ""}
        nocoDbId={member.id ?? ""}
        currentStatus={member.payment_status}
        tier={member.membership_type}
      />

      {/* NocoDB fields */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Member Record</h2>
        </div>
        <dl className="divide-y divide-white/5">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex px-5 py-3 gap-4">
              <dt className="text-white/40 text-xs w-40 flex-shrink-0 pt-0.5">{label}</dt>
              <dd className="text-white text-sm break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Better Auth user info */}
      {authUser && (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">Auth Account</h2>
          </div>
          <dl className="divide-y divide-white/5">
            {[
              { label: "Auth User ID", value: authUser.id },
              { label: "Auth Status", value: authUser.membershipStatus },
              { label: "Auth Tier", value: authUser.membershipTier ?? "—" },
              { label: "Registered", value: new Date(authUser.createdAt).toLocaleString("en-CA") },
            ].map(({ label, value }) => (
              <div key={label} className="flex px-5 py-3 gap-4">
                <dt className="text-white/40 text-xs w-40 flex-shrink-0 pt-0.5">{label}</dt>
                <dd className="text-white/80 text-sm font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
