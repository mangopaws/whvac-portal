import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminSetUserField } from "@/lib/db";
import { updateMemberStatus, getMemberByUserId } from "@/lib/nocodb";
import { captureMagicLink } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/resend";

export const runtime = "nodejs";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

interface UpdateBody {
  userId: string;
  nocoDbId?: string;
  action: "activate" | "deactivate" | "resend-magic-link";
  tier?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, nocoDbId, action, tier } = body;
  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  try {
    if (action === "activate") {
      // Update Better Auth user
      adminSetUserField(userId, "membershipStatus", "active");
      if (tier) adminSetUserField(userId, "membershipTier", tier);

      // Update NocoDB
      const nocId = nocoDbId ?? (await getMemberByUserId(userId))?.id;
      if (nocId) await updateMemberStatus(nocId, "active");

      return NextResponse.json({ success: true, action: "activated" });
    }

    if (action === "deactivate") {
      adminSetUserField(userId, "membershipStatus", "pending");

      const nocId = nocoDbId ?? (await getMemberByUserId(userId))?.id;
      if (nocId) await updateMemberStatus(nocId, "pending");

      return NextResponse.json({ success: true, action: "deactivated" });
    }

    if (action === "resend-magic-link") {
      // Get user email from NocoDB or Better Auth session context
      const member = await getMemberByUserId(userId);
      if (!member?.email) {
        return NextResponse.json({ error: "Member email not found" }, { status: 404 });
      }

      const capturePromise = captureMagicLink(member.email);
      await auth.api.signInMagicLink({
        body: { email: member.email, callbackURL: "/dashboard" },
        headers: new Headers(),
      });
      const magicLink = await capturePromise;

      // Send welcome email with new link
      await sendWelcomeEmail(member.email, member.name, magicLink, member.tier);

      return NextResponse.json({ success: true, action: "magic-link-sent", magicLink });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("update-member error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
