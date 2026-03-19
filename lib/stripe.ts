import Stripe from "stripe";

// Lazy initialization — avoids build-time throw when env vars aren't set
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

const TIER_PRICE_MAP: Record<string, string | undefined> = {
  individual: process.env.STRIPE_PRICE_INDIVIDUAL,
  student: process.env.STRIPE_PRICE_STUDENT,
  corporate: process.env.STRIPE_PRICE_CORPORATE,
};

export async function createCheckoutSession(
  email: string,
  tier: string,
  priceId: string,
  magicLink: string
): Promise<Stripe.Checkout.Session> {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3002";

  return getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { email, tier, magicLink },
    success_url: `${baseUrl}/welcome?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard`,
  });
}

export function constructWebhookEvent(body: string, sig: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export function getPriceIdForTier(tier: string): string | undefined {
  return TIER_PRICE_MAP[tier];
}
