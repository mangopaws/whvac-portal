import { NextRequest, NextResponse } from "next/server";
import { auth, captureMagicLink } from "@/lib/auth";
import { createMemberRecord } from "@/lib/nocodb";
import {
  sendEMTInstructionsEmail,
  sendCashInstructionsEmail,
  sendWelcomeEmail,
  addToAudience,
} from "@/lib/resend";

export const runtime = "nodejs";

const TIER_PRICES: Record<string, number> = {
  individual: 75,
  student: 25,
  corporate: 250,
};

interface CreateMemberBody {
  email: string;
  firstName: string;
  lastName: string;
  tier: "individual" | "student" | "corporate";
  province?: string;
  careerRole?: string;
  paymentMethod: "stripe" | "emt" | "cash";
}

export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get("authorization");
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateMemberBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, firstName, lastName, tier, province, careerRole, paymentMethod } = body;
  if (!email || !firstName || !lastName || !tier || !paymentMethod) {
    return NextResponse.json(
      { error: "Missing required fields: email, firstName, lastName, tier, paymentMethod" },
      { status: 400 }
    );
  }

  const name = `${firstName} ${lastName}`.trim();
  const price = TIER_PRICES[tier] ?? 75;

  try {
    // Create Better Auth user
    const userResponse = await auth.api.signUpEmail({
      body: {
        email,
        password: crypto.randomUUID(), // random — user authenticates via magic link
        name,
      },
    });

    const userId = (userResponse as { user?: { id: string } })?.user?.id;
    if (!userId) {
      throw new Error("Failed to create Better Auth user");
    }

    // Create NocoDB member record
    const member = await createMemberRecord({
      userId,
      email,
      name,
      firstName,
      lastName,
      tier,
      price,
      province,
      careerRole,
      paymentMethod,
      paymentStatus: "pending",
    });

    // Generate magic link — capture URL via sendMagicLink callback
    const capturePromise = captureMagicLink(email);
    await auth.api.signInMagicLink({
      body: { email, callbackURL: "/dashboard" },
      headers: new Headers(),
    });
    const magicLink = await capturePromise;

    // Add to Resend audience
    await addToAudience(email, name);

    // Send appropriate email (stripe sends welcome after webhook)
    if (paymentMethod === "emt") {
      await sendEMTInstructionsEmail(email, name, tier, price, magicLink);
    } else if (paymentMethod === "cash") {
      await sendCashInstructionsEmail(email, name, tier, price);
    } else {
      await sendWelcomeEmail(email, name, magicLink, tier);
    }

    return NextResponse.json({
      userId,
      memberId: member.id,
      magicLink,
      paymentMethod,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-member error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
