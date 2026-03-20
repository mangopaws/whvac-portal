import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMemberByEmail, updateMemberPaymentMethod } from "@/lib/nocodb";
import { createCheckoutSession, getPriceIdForTier } from "@/lib/stripe";

export const runtime = "nodejs";

interface PaymentMethodBody {
  method: "emt" | "cash" | "stripe";
  tier: string;
}

export async function POST(request: NextRequest) {
  // Require valid session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PaymentMethodBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { method, tier } = body;
  if (!method || !tier) {
    return NextResponse.json(
      { error: "Missing required fields: method, tier" },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const email = session.user.email;

  try {
    // Get NocoDB record
    const member = await getMemberByEmail(session.user.email);

    if (member?.id) {
      await updateMemberPaymentMethod(member.id, method);
    }

    // Notify n8n
    const n8nUrl = process.env.N8N_PAYMENT_METHOD_WEBHOOK_URL;
    if (n8nUrl) {
      await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          method,
          tier,
          memberId: member?.id,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.error("n8n webhook error:", err));
    }

    // For Stripe: create checkout session and return URL
    if (method === "stripe") {
      const priceId = getPriceIdForTier(tier);
      if (!priceId) {
        return NextResponse.json(
          { error: `No price configured for tier: ${tier}` },
          { status: 400 }
        );
      }

      const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3002";
      const magicLink = `${baseUrl}/login?email=${encodeURIComponent(email)}`;

      const checkoutSession = await createCheckoutSession(
        email,
        tier,
        priceId,
        magicLink
      );

      return NextResponse.json({ checkoutUrl: checkoutSession.url });
    }

    return NextResponse.json({ success: true, method });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("payment-method error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
