/**
 * /api/admin/reset-password
 *
 * ONE-TIME endpoint to reset a user's password in the Better Auth SQLite DB.
 * Protected by ADMIN_ACTIVATION_SECRET.
 *
 * POST body: { email: string; newPassword: string }
 *
 * IMPORTANT: Delete or disable this route after use.
 */

import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { scryptSync, randomBytes } from "crypto";

export const runtime = "nodejs";

/**
 * Replicates Better Auth's internal hashPassword exactly:
 *   format:  "<salt_hex>:<key_hex>"
 *   salt:    16 random bytes, hex-encoded
 *   key:     scrypt(password.normalize("NFKC"), salt, { N:16384, r:16, p:1, dkLen:64 })
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

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

  const dbPath = path.resolve(
    process.cwd(),
    process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
  );
  const db = new Database(dbPath);

  // Find the user
  const user = db
    .prepare(`SELECT id FROM "user" WHERE email = ?`)
    .get(email) as { id: string } | undefined;

  if (!user) {
    db.close();
    return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  // Hash using Better Auth's exact internal scrypt implementation
  const hashed = hashPassword(newPassword);

  // Check if a credential account row already exists
  const existing = db
    .prepare(`SELECT id FROM "account" WHERE "userId" = ? AND "providerId" = 'credential'`)
    .get(user.id) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE "account" SET "password" = ?, "updatedAt" = datetime('now') WHERE "userId" = ? AND "providerId" = 'credential'`
    ).run(hashed, user.id);
  } else {
    // accountId = user.id is Better Auth's convention for credential accounts
    const accountId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO "account" (id, "userId", "providerId", "accountId", "password", "createdAt", "updatedAt")
       VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))`
    ).run(accountId, user.id, user.id, hashed);
  }

  db.close();

  console.log(`[reset-password] Password updated for ${email} (userId: ${user.id})`);
  return NextResponse.json({ success: true, userId: user.id });
}
