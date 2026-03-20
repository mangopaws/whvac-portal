/**
 * Direct SQLite access for admin operations on Better Auth users.
 * Used to update custom user fields (membershipStatus, membershipTier, etc.)
 * that aren't exposed through the Better Auth API.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.resolve(
      process.cwd(),
      process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
    );
    _db = new Database(dbPath);
  }
  return _db;
}

/** Update a single custom field on a Better Auth user row */
export function adminSetUserField(
  userId: string,
  field: "membershipStatus" | "membershipTier" | "stripeCustomerId" | "province" | "careerRole",
  value: string | null
) {
  getDb()
    .prepare(`UPDATE "user" SET "${field}" = ? WHERE id = ?`)
    .run(value, userId);
}

/** Fetch a single user by ID (for admin display) */
export function adminGetUser(userId: string): AdminUser | null {
  const row = getDb()
    .prepare(`SELECT id, name, email, "membershipStatus", "membershipTier", "createdAt" FROM "user" WHERE id = ?`)
    .get(userId) as AdminUser | undefined;
  return row ?? null;
}

/** Fetch a single user by email (used by webhooks that only have email, not userId) */
export function adminGetUserByEmail(email: string): AdminUser | null {
  const row = getDb()
    .prepare(`SELECT id, name, email, "membershipStatus", "membershipTier", "createdAt" FROM "user" WHERE email = ?`)
    .get(email) as AdminUser | undefined;
  return row ?? null;
}

/** Count users by membershipStatus */
export function adminCountByStatus(): StatusCounts {
  const rows = getDb()
    .prepare(`SELECT "membershipStatus", COUNT(*) as count FROM "user" GROUP BY "membershipStatus"`)
    .all() as { membershipStatus: string; count: number }[];

  const result: StatusCounts = { active: 0, pending: 0, total: 0 };
  for (const row of rows) {
    result.total += Number(row.count);
    if (row.membershipStatus === "paid") result.active = Number(row.count);
    if (row.membershipStatus === "pending") result.pending = Number(row.count);
  }
  return result;
}

/** Count users registered this calendar month */
export function adminCountThisMonth(): number {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const row = getDb()
    .prepare(`SELECT COUNT(*) as count FROM "user" WHERE "createdAt" >= ?`)
    .get(start.toISOString()) as { count: number };
  return Number(row?.count ?? 0);
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  membershipStatus: string;
  membershipTier: string | null;
  createdAt: string;
}

export interface StatusCounts {
  active: number;
  pending: number;
  total: number;
}
