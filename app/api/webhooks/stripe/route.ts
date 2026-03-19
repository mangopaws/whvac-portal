import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { getMemberByEmail, updateMemberStatus } from "@/lib/nocodb";
import { addToAudience, sendWelcomeEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.metadata?.email;
    const tier = session.metadata?.tier;
    const magicLink = session.metadata?.magicLink;
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : undefined;

    if (!email || !tier) {
      console.error("Missing metadata in checkout session", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    try {
      // Update NocoDB record to active
      const member = await getMemberByEmail(email);
      if (member?.id) {
        await updateMemberStatus(member.id, "active", {
          stripeCustomerId,
          paymentMethod: "stripe",
        });
      }

      // Add to Resend audience for broadcasts
      const name = member?.name ?? email;
      await addToAudience(email, name);

      // Send welcome email with magic link
      if (magicLink) {
        await sendWelcomeEmail(email, name, magicLink, tier);
      }

      console.log(`Membership activated for ${email} (${tier})`);
    } catch (err) {
      console.error("Error processing checkout.session.completed:", err);
      return NextResponse.json(
        { error: "Internal processing error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
