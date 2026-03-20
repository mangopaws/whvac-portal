import { adminGetUser } from "@/lib/db";
import { getMemberByEmail } from "@/lib/nocodb";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditMemberForm from "./EditMemberForm";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authUser = adminGetUser(id);
  if (!authUser) notFound();

  const nocoMember = await getMemberByEmail(authUser.email).catch(() => null);

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/admin/members" className="hover:text-white/70 transition">Members</Link>
        <span>/</span>
        <Link href={`/admin/members/${id}`} className="hover:text-white/70 transition">{authUser.name}</Link>
        <span>/</span>
        <span className="text-white/70">Edit</span>
      </div>

      <h1 className="text-xl font-bold text-white mb-6">Edit Member</h1>

      <EditMemberForm
        userId={authUser.id}
        email={authUser.email}
        nocoDbId={nocoMember?.id ?? ""}
        defaults={{
          name: authUser.name,
          membershipStatus: authUser.membershipStatus,
          membershipTier: authUser.membershipTier ?? "",
          phone: nocoMember?.phone ?? "",
          province: nocoMember?.province ?? "",
          payment_method: nocoMember?.payment_method ?? "",
          payment_status: nocoMember?.payment_status ?? "",
          job_title: nocoMember?.job_title ?? "",
          company_name: nocoMember?.company_name ?? "",
          trade_affiliation: nocoMember?.trade_affiliation ?? "",
          sector: nocoMember?.sector ?? "",
          school_program: nocoMember?.school_program ?? "",
          graduation_year: nocoMember?.graduation_year ?? "",
          mentor_areas: nocoMember?.mentor_areas ?? "",
          mentor_hours: nocoMember?.mentor_hours ?? "",
          referral_source: nocoMember?.referral_source ?? "",
          interested: nocoMember?.interested ?? "",
          anything_else: nocoMember?.anything_else ?? "",
        }}
      />
    </div>
  );
}
