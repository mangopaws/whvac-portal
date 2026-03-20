import { getAllAdminUsers } from "@/lib/db";
import Link from "next/link";
import MembersSearchBar from "./MembersSearchBar";

export const metadata = { title: "Members — WHVAC Admin" };
export const dynamic = "force-dynamic";

const TIER_COLORS: Record<string, string> = {
  individual: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  student:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  corporate:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  paid:    "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  paid:    "Active",
  pending: "Pending",
};

export default async function MembersListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page     = Math.max(1, Number(params.page ?? 1));
  const search   = params.q?.trim() || undefined;
  const pageSize = 20;

  const { list, total } = getAllAdminUsers(page, pageSize, search);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Members</h1>
          <p className="text-white/40 text-sm mt-0.5">{total} total members</p>
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

      {/* Search */}
      <MembersSearchBar defaultValue={search} />

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Name / Email", "Tier", "Status", "Registered", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-white/40 font-medium px-5 py-3 text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-white/30 py-12">
                    {search ? `No results for "${search}"` : "No members yet"}
                  </td>
                </tr>
              ) : (
                list.map((u) => (
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
                        {STATUS_LABELS[u.membershipStatus] ?? u.membershipStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/members/${u.id}`}
                        className="text-[#E8006A] text-xs hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <p className="text-white/40 text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/members?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg transition flex items-center"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/members?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg transition flex items-center"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
