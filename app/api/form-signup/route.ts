/**
 * /api/form-signup
 *
 * Receives the Lygotype membership form payload forwarded by n8n.
 * Accepts the form's exact snake_case field names and display-value strings,
 * normalises them, creates the Better Auth user + NocoDB record, and sends
 * the appropriate email (welcome or e-Transfer instructions).
 *
 * Auth: Bearer ${ADMIN_ACTIVATION_SECRET}  (same secret as /api/admin/create-member)
 *
 * n8n should POST the raw form submission body to this endpoint with:
 *   Authorization: Bearer <ADMIN_ACTIVATION_SECRET>
 *   Content-Type: application/json
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, captureMagicLink } from "@/lib/auth";
import { createMemberRecord } from "@/lib/nocodb";
import { adminSetUserField } from "@/lib/db";
import {
  sendEMTInstructionsEmail,
  sendCashInstructionsEmail,
  sendWelcomeEmail,
  addToAudience,
} from "@/lib/resend";

export const runtime = "nodejs";

// ── Value normalisers ────────────────────────────────────────────────────────

/** Form displays e.g. "Individual Member" — map to internal tier key */
const MEMBERSHIP_TYPE_MAP: Record<string, "individual" | "student" | "corporate"> = {
  "Individual Member": "individual",
  "Student Member":    "student",
  "Corporate Member":  "corporate",
  "Ambassador":        "individual", // ambassadors billed as individual
  Individual:          "individual",
  Student:             "student",
  Corporate:           "corporate",
  individual:          "individual",
  student:             "student",
  corporate:           "corporate",
};

/** Form displays e.g. "card", "etransfer", "cash" — map to internal payment method */
const PAYMENT_METHOD_MAP: Record<string, "stripe" | "emt" | "cash" | "paid"> = {
  card:         "stripe",
  Stripe:       "stripe",
  stripe:       "stripe",
  "e-Transfer": "emt",
  "E-Transfer": "emt",
  etransfer:    "emt",
  emt:          "emt",
  Cash:         "cash",
  cash:         "cash",
  paid:         "paid",
};

const TIER_PRICES: Record<string, number> = {
  individual: 79,
  student:    55,
  corporate:  99,
};

// ── Request body shape (mirrors Lygotype form field names) ───────────────────

interface FormSignupBody {
  // Required
  full_name:        string;
  email:            string;
  membership_type:  string;
  payment_method:   string;
  // Optional — passed through directly to NocoDB
  phone?:               string;
  province?:            string;
  referral_source?:     string;
  school_program?:      string;
  graduation_year?:     string;
  company_name?:        string;
  job_title?:           string;
  company_size?:        string;
  billing_contact?:     string;
  ambassador_org?:      string;
  ambassador_why?:      string;
  trade_affiliation?:   string;
  sector?:              string;
  experience_trades?:   string;
  experience_mentor?:   string;
  mentor_areas?:        string;
  mentor_hours?:        string;
  interested?:          string;
  anything_else?:       string;
  social_ref?:          string;
  ambassador_background?: string;
  ambassador_rep?:      string;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Same bearer-token auth as /api/admin/create-member
  const authHeader = request.headers.get("authorization");
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: FormSignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { full_name, email, membership_type, payment_method } = body;

  if (!full_name || !email || !membership_type || !payment_method) {
    return NextResponse.json(
      { error: "Missing required fields: full_name, email, membership_type, payment_method" },
      { status: 400 }
    );
  }

  const tier = MEMBERSHIP_TYPE_MAP[membership_type];
  if (!tier) {
    return NextResponse.json(
      { error: `Unknown membership_type value: "${membership_type}"` },
      { status: 400 }
    );
  }

  const paymentMethod = PAYMENT_METHOD_MAP[payment_method];
  if (!paymentMethod) {
    return NextResponse.json(
      { error: `Unknown payment_method value: "${payment_method}"` },
      { status: 400 }
    );
  }

  // Stripe means payment was collected in the form — activate immediately.
  // e-Transfer is pending until manually confirmed.
  const isPaid = paymentMethod === "stripe" || paymentMethod === "paid";
  const price = TIER_PRICES[tier] ?? 79;

  // Split full_name into firstName / lastName for NocoDB.
  // Use "" for lastName if there's only one word — avoids "Amanda Amanda" doubling.
  const nameParts = full_name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  try {
    // 1. Create Better Auth user (magic-link auth — random password)
    const userResponse = await auth.api.signUpEmail({
      body: {
        email,
        password: crypto.randomUUID(),
        name: full_name,
      },
    });

    const userId = (userResponse as { user?: { id: string } })?.user?.id;
    if (!userId) {
      throw new Error("Failed to create Better Auth user — account may already exist");
    }

    // 2. Activate Better Auth record immediately for paid members so the
    //    dashboard gate clears on first login.
    if (isPaid) {
      adminSetUserField(userId, "membershipStatus", "paid");
      adminSetUserField(userId, "membershipTier", tier);
    }

    // 3. Create NocoDB member record with all form fields
    const member = await createMemberRecord({
      userId,
      email,
      firstName,
      lastName,
      tier,
      price,
      paymentMethod,
      paymentStatus:    isPaid ? "paid" : "pending",
      ...(isPaid && { activatedAt: new Date().toISOString() }),
      // Pass-through form fields — snake_case → CreateMemberInput mapping
      phone:             body.phone,
      province:          body.province,
      company:           body.company_name,
      jobTitle:          body.job_title,
      company_size:      body.company_size,
      tradeAffiliation:  body.trade_affiliation,
      sector:            body.sector,
      experience_trades: body.experience_trades,
      school_program:    body.school_program,
      graduation_year:   body.graduation_year,
      referral_source:   body.referral_source,
      ambassador_org:    body.ambassador_org,
      ambassador_why:    body.ambassador_why,
      mentor_areas:      body.mentor_areas,
      mentor_hours:      body.mentor_hours,
      interested:        body.interested,
      anything_else:     body.anything_else,
    });

    // 4. Generate magic link — only needed for paid (welcome email) and emt
    //    (instructions email includes a preview link). Cash members get no link
    //    until an admin manually activates them.
    let magicLink: string | undefined;
    if (isPaid || paymentMethod === "emt") {
      const capturePromise = captureMagicLink(email);
      await auth.api.signInMagicLink({
        body: { email, callbackURL: "/dashboard" },
        headers: new Headers(),
      });
      magicLink = await capturePromise;
    }

    // 5. Add to Resend audience
    await addToAudience(email, full_name);

    // 6. Send appropriate email
    if (isPaid) {
      await sendWelcomeEmail(email, full_name, magicLink!, tier);
    } else if (paymentMethod === "emt") {
      await sendEMTInstructionsEmail(email, full_name, tier, price, magicLink!);
    } else if (paymentMethod === "cash") {
      await sendCashInstructionsEmail(email, full_name, tier, price);
    }

    console.log(`[form-signup] Created member ${email} (${tier}, ${paymentMethod}, paid=${isPaid})`);

    return NextResponse.json({
      success: true,
      userId,
      memberId: member.id,
      ...(magicLink && { magicLink }),
      tier,
      paymentMethod,
      isPaid,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[form-signup] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
