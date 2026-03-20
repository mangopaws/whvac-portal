import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminUpdateUser } from "@/lib/db";
import { getMemberByEmail, updateMemberRecord } from "@/lib/nocodb";

export const runtime = "nodejs";

function isAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

interface EditBody {
  userId: string;
  email: string;
  nocoDbId?: string;
  // Better Auth fields
  name?: string;
  membershipStatus?: string;
  membershipTier?: string;
  // NocoDB fields
  phone?: string;
  province?: string;
  payment_method?: string;
  payment_status?: string;
  job_title?: string;
  company_name?: string;
  trade_affiliation?: string;
  sector?: string;
  school_program?: string;
  graduation_year?: string;
  mentor_areas?: string;
  mentor_hours?: string;
  referral_source?: string;
  interested?: string;
  anything_else?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: EditBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, email, nocoDbId, name, membershipStatus, membershipTier, ...nocoFields } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
  }

  try {
    // 1. Update Better Auth user fields
    adminUpdateUser(userId, {
      ...(name !== undefined && { name }),
      ...(membershipStatus !== undefined && { membershipStatus }),
      ...(membershipTier !== undefined && { membershipTier: membershipTier || null }),
    });

    // 2. Update NocoDB — find record by nocoDbId or fall back to email lookup
    const nocoBodId = nocoDbId || (await getMemberByEmail(email).catch(() => null))?.id;
    if (nocoBodId) {
      // Strip undefined values so we only PATCH what was actually sent
      const patch = Object.fromEntries(
        Object.entries(nocoFields).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(patch).length > 0) {
        await updateMemberRecord(nocoBodId, patch);
      }
    }

    console.log(`[edit-member] Updated ${email} (${userId})`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[edit-member] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
