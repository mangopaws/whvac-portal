import { adminCountByStatus, adminCountThisMonth, getAllAdminUsers } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard — WHVAC" };
export const dynamic = "force-dynamic";

const TIER_COLORS: Record<string, string> = {
  individual: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  student: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  corporate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  paid:    "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default async function AdminDashboardPage() {
  const [counts, thisMonth] = await Promise.all([
    adminCountByStatus(),
    adminCountThisMonth(),
  ]);
  const recent = getAllAdminUsers(1, 8);

  const stats = [
    { label: "Total Members", value: counts.total, color: "text-white" },
    { label: "Active", value: counts.active, color: "text-green-400" },
    { label: "Pending Payment", value: counts.pending, color: "text-yellow-400" },
    { label: "New This Month", value: thisMonth, color: "text-[#E8006A]" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">WHVAC membership overview</p>
        </div>
        <Link
          href="/admin/members/new"
          className="inline-flex items-center gap-2 h-9 px-4 bg-[#E8006A] hover:bg-[#c8005a] text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent members */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Recent Members</h2>
          <Link href="/admin/members" className="text-[#E8006A] text-xs hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 font-medium px-5 py-3 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left text-white/40 font-medium px-5 py-3 text-xs uppercase tracking-wider">Tier</th>
                <th className="text-left text-white/40 font-medium px-5 py-3 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left text-white/40 font-medium px-5 py-3 text-xs uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {recent.list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-white/30 py-10 text-sm">
                    No members yet
                  </td>
                </tr>
              ) : (
                recent.list.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-white/40 text-xs">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {u.membershipTier ? (
                        <span className={`inline-block border rounded-full px-2 py-0.5 text-xs capitalize ${TIER_COLORS[u.membershipTier] ?? "text-white/50"}`}>
                          {u.membershipTier}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block border rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[u.membershipStatus] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                        {u.membershipStatus === "paid" ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/members/${u.id}`}
                        className="text-[#E8006A] text-xs hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
