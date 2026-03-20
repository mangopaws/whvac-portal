import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminDeleteUser } from "@/lib/db";
import { getMemberByEmail } from "@/lib/nocodb";

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

  let body: { userId: string; email: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, email } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
  }

  try {
    // 1. Remove from Better Auth (sessions → accounts → user)
    adminDeleteUser(userId);

    // 2. Remove from NocoDB if a record exists (best-effort)
    const nocoMember = await getMemberByEmail(email).catch(() => null);
    if (nocoMember?.id) {
      await fetch(
        `${process.env.NOCODB_BASE_URL}/api/v1/db/data/noco/${process.env.NOCODB_BASE_ID}/${process.env.NOCODB_MEMBERS_TABLE_ID}/${nocoMember.id}`,
        {
          method: "DELETE",
          headers: { "xc-token": process.env.NOCODB_API_TOKEN! },
        }
      );
    }

    console.log(`[delete-member] Deleted user ${email} (${userId})`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[delete-member] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
