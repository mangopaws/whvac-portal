import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
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

  return (
    <DashboardShell user={user} membershipStatus={user.membershipStatus ?? "pending"}>
      {children}
    </DashboardShell>
  );
}
