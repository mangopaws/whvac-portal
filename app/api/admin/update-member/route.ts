import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminSetUserField, adminGetUser } from "@/lib/db";
import { updateMemberStatus, getMemberByEmail } from "@/lib/nocodb";
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
  email: string;
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

  const { userId, email, nocoDbId, action, tier } = body;
  if (!userId || !email || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  try {
    if (action === "activate") {
      // Update Better Auth user
      adminSetUserField(userId, "membershipStatus", "paid");
      if (tier) adminSetUserField(userId, "membershipTier", tier);

      // Update NocoDB
      const nocId = nocoDbId ?? (await getMemberByEmail(email))?.id;
      if (nocId) await updateMemberStatus(nocId, "paid");

      // Send welcome email with a fresh magic link now that the account is active
      const authUser = adminGetUser(userId);
      const displayName = authUser?.name ?? email;
      const displayTier = tier ?? authUser?.membershipTier ?? "individual";

      const capturePromise = captureMagicLink(email);
      await auth.api.signInMagicLink({
        body: { email, callbackURL: "/dashboard" },
        headers: new Headers(),
      });
      const magicLink = await capturePromise;

      await sendWelcomeEmail(email, displayName, magicLink, displayTier);

      console.log(`[update-member] Activated ${email} — welcome email sent`);
      return NextResponse.json({ success: true, action: "activated" });
    }

    if (action === "deactivate") {
      adminSetUserField(userId, "membershipStatus", "pending");

      const nocId = nocoDbId ?? (await getMemberByEmail(email))?.id;
      if (nocId) await updateMemberStatus(nocId, "pending");

      return NextResponse.json({ success: true, action: "deactivated" });
    }

    if (action === "resend-magic-link") {
      // Use the email from the request directly — no NocoDB lookup needed.
      // Get name + tier from Better Auth (works even if no NocoDB record exists).
      const authUser = adminGetUser(userId);
      const displayName = authUser?.name ?? email;
      const displayTier = authUser?.membershipTier ?? tier ?? "individual";

      const capturePromise = captureMagicLink(email);
      await auth.api.signInMagicLink({
        body: { email, callbackURL: "/dashboard" },
        headers: new Headers(),
      });
      const magicLink = await capturePromise;

      await sendWelcomeEmail(email, displayName, magicLink, displayTier);

      return NextResponse.json({ success: true, action: "magic-link-sent", magicLink });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("update-member error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
