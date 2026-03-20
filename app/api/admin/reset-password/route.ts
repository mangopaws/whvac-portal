/**
 * /api/admin/reset-password  — ONE-TIME USE, DELETE AFTER LOGIN
 * Protected by ADMIN_ACTIVATION_SECRET.
 * POST body: { email: string; newPassword: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email: string; newPassword: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, newPassword } = body;
  if (!email || !newPassword) {
    return NextResponse.json({ error: "Missing email or newPassword" }, { status: 400 });
  }

  // Use Better Auth's own internal password hasher — guaranteed to match verifyPassword
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(newPassword);

  const dbPath = path.resolve(
    process.cwd(),
    process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
  );
  const db = new Database(dbPath);

  const user = db
    .prepare(`SELECT id FROM "user" WHERE email = ?`)
    .get(email) as { id: string } | undefined;

  if (!user) {
    db.close();
    return NextResponse.json({ error: `No user found: ${email}` }, { status: 404 });
  }

  const existing = db
    .prepare(`SELECT id FROM "account" WHERE "userId" = ? AND "providerId" = 'credential'`)
    .get(user.id) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE "account" SET "password" = ?, "updatedAt" = datetime('now') WHERE "userId" = ? AND "providerId" = 'credential'`
    ).run(hashed, user.id);
  } else {
    const accountId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO "account" (id, "userId", "providerId", "accountId", "password", "createdAt", "updatedAt")
       VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))`
    ).run(accountId, user.id, user.id, hashed);
  }

  db.close();
  return NextResponse.json({ success: true, userId: user.id });
}
