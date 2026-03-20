import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminGetUser, adminSetUserPassword } from "@/lib/db";

export const runtime = "nodejs";

function isAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { userId: string; newPassword: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, newPassword } = body;
  if (!userId || !newPassword) {
    return NextResponse.json({ error: "Missing userId or newPassword" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const user = adminGetUser(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Hash using Better Auth's own hasher so the stored format is compatible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hashedPassword = await (auth as any).$context.password.hash(newPassword);
    adminSetUserPassword(userId, user.email, hashedPassword);

    console.log(`[set-member-password] Admin set password for ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[set-member-password] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
