/**
 * /api/admin/recover
 *
 * ONE-TIME USE: Recreates an admin account that was accidentally deleted.
 * Protected by ADMIN_ACTIVATION_SECRET bearer token (same as /api/form-signup).
 *
 * Usage from server:
 *   curl -X POST https://whvac.abreeze.studio/api/admin/recover \
 *     -H "Authorization: Bearer <ADMIN_ACTIVATION_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"your@email.com","name":"Your Name","password":"NewPassword123!"}'
 *
 * DELETE THIS ROUTE after account recovery is complete.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email: string; name: string; password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, name, password } = body;
  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Missing required fields: email, name, password" },
      { status: 400 }
    );
  }

  try {
    const userResponse = await auth.api.signUpEmail({
      body: { email, name, password },
    });

    const userId = (userResponse as { user?: { id: string } })?.user?.id;
    if (!userId) {
      throw new Error("Failed to create user — account may already exist with this email");
    }

    console.log(`[recover] Recreated admin user ${email} (${userId})`);
    return NextResponse.json({
      success: true,
      userId,
      message: `Admin account recreated. Log in at /admin/login with ${email} and the password you provided. DELETE /api/admin/recover/route.ts once you're back in.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[recover] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
