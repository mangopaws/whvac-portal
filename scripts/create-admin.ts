/**
 * One-time script to create an admin user in Better Auth.
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

// Load .env before Better Auth initialises — env vars are read when lib/auth
// is first imported (betterAuth() runs at module level).
try {
  const lines = readFileSync(join(process.cwd(), ".env"), "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // Fallback: rely on env vars already in the environment
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  // Dynamic import runs AFTER env vars are set above
  const { auth } = await import("../lib/auth");

  // Ensure DB schema exists before inserting
  const ctx = await auth.$context;
  await ctx.runMigrations();

  console.log(`Creating user: ${email} …`);

  const result = await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  console.log("Done. User ID:", result.user?.id);
  console.log("Email:", result.user?.email);
}

main().catch((err) => {
  console.error("Failed:", err?.message ?? err);
  process.exit(1);
});
