import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/nocodb";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    membershipStatus?: string;
    membershipTier?: string;
  };

  // DEBUG: trace membership gate inputs
  console.log("[Dashboard] session email:", user.email);
  console.log("[Dashboard] Better Auth membershipStatus:", user.membershipStatus);
  console.log("[Dashboard] gate fires (membershipStatus !== 'paid'):", user.membershipStatus !== "paid");
  const _debugMember = await getMemberByEmail(user.email);
  console.log("[Dashboard] NocoDB payment_status for this email:", _debugMember?.payment_status ?? "(record not found)");

  return (
    <DashboardShell user={user} membershipStatus={user.membershipStatus ?? "pending"}>
      {children}
    </DashboardShell>
  );
}
