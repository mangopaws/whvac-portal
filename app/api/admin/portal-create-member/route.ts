/**
 * Session-authenticated create-member endpoint for the admin portal UI.
 * The external automation endpoint (/api/admin/create-member) uses Bearer token instead.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, captureMagicLink } from "@/lib/auth";
import { createMemberRecord } from "@/lib/nocodb";
import {
  sendEMTInstructionsEmail,
  sendCashInstructionsEmail,
  addToAudience,
} from "@/lib/resend";

export const runtime = "nodejs";

const TIER_PRICES: Record<string, number> = {
  individual: 75,
  student: 25,
  corporate: 250,
};

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    email: string; firstName: string; lastName: string;
    tier: "individual" | "student" | "corporate";
    province?: string; careerRole?: string;
    paymentMethod: "stripe" | "emt" | "cash";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, firstName, lastName, tier, province, careerRole, paymentMethod } = body;
  if (!email || !firstName || !lastName || !tier || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const name = `${firstName} ${lastName}`.trim();
  const price = TIER_PRICES[tier] ?? 75;

  try {
    const userResponse = await auth.api.signUpEmail({
      body: { email, password: crypto.randomUUID(), name },
    });
    const userId = (userResponse as { user?: { id: string } })?.user?.id;
    if (!userId) throw new Error("Failed to create user");

    const member = await createMemberRecord({
      userId, email, name, firstName, lastName,
      tier, price, province, careerRole,
      paymentMethod, paymentStatus: "pending",
    });

    const capturePromise = captureMagicLink(email);
    await auth.api.signInMagicLink({
      body: { email, callbackURL: "/dashboard" },
      headers: new Headers(),
    });
    const magicLink = await capturePromise;

    await addToAudience(email, name);

    if (paymentMethod === "emt") {
      await sendEMTInstructionsEmail(email, name, tier, price, magicLink);
    } else if (paymentMethod === "cash") {
      await sendCashInstructionsEmail(email, name, tier, price);
    }

    return NextResponse.json({ userId, memberId: member.id, magicLink, paymentMethod });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
