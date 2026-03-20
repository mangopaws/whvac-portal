/**
 * /api/admin/test-emails  —  TEMPORARY TEST ROUTE
 *
 * Sends all three email types to a specified address so you can preview
 * them in a real email client before going live.
 *
 * DELETE THIS FILE after testing is complete.
 *
 * Usage:
 *   curl -X POST https://your-portal-domain/api/admin/test-emails \
 *     -H "Authorization: Bearer <ADMIN_ACTIVATION_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"to":"ae.breeze@pm.me"}'
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendWelcomeEmail,
  sendEMTInstructionsEmail,
  sendCashInstructionsEmail,
} from "@/lib/resend";

export const runtime = "nodejs";

// Realistic-looking placeholder data so the templates render properly
const PREVIEW_NAME     = "Amanda Breeze";
const PREVIEW_TIER     = "individual";
const PREVIEW_PRICE    = 79;
const PREVIEW_LINK     = "https://portal.womeninhvaccanada.ca/login?token=preview-test";
const PREVIEW_DATE     = new Date().toLocaleDateString("en-CA", {
  year: "numeric", month: "long", day: "numeric",
});

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let to = "ae.breeze@pm.me";
  try {
    const body = await request.json();
    if (body?.to) to = body.to;
  } catch { /* use default */ }

  const results: Record<string, string> = {};

  // 1. Welcome email (paid / activated member)
  try {
    await sendWelcomeEmail(to, PREVIEW_NAME, PREVIEW_LINK, PREVIEW_TIER, {
      province: "Ontario",
      paymentDate: PREVIEW_DATE,
      paymentIntentId: "pi_test_preview123",
      amount: PREVIEW_PRICE,
    });
    results.welcome = "sent ✓";
  } catch (e) {
    results.welcome = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2. EMT instructions email (pending e-Transfer member)
  try {
    await sendEMTInstructionsEmail(to, PREVIEW_NAME, PREVIEW_TIER, PREVIEW_PRICE, PREVIEW_LINK);
    results.emt = "sent ✓";
  } catch (e) {
    results.emt = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Cash instructions email (pending cash member)
  try {
    await sendCashInstructionsEmail(to, PREVIEW_NAME, PREVIEW_TIER, PREVIEW_PRICE);
    results.cash = "sent ✓";
  } catch (e) {
    results.cash = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  console.log(`[test-emails] Sent to ${to}:`, results);
  return NextResponse.json({ to, results });
}
