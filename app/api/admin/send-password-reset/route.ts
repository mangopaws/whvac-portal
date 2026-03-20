import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function isAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  try {
    // Call Better Auth's forget-password endpoint directly (server-to-server)
    const appUrl = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const resetRes = await fetch(`${appUrl}/api/auth/forget-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: `${appUrl}/reset-password` }),
    });

    if (!resetRes.ok) {
      const text = await resetRes.text().catch(() => "");
      throw new Error(`Better Auth returned ${resetRes.status}: ${text}`);
    }

    console.log(`[send-password-reset] Sent password reset email to ${email}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-password-reset] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
