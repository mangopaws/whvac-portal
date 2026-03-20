import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Database — lazy singleton so build-time module evaluation never touches disk
// ---------------------------------------------------------------------------
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.resolve(process.cwd(), "data");
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // Silently ignore — will fail at open if truly unavailable
  }

  const dbPath = path.resolve(
    process.cwd(),
    process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
  );

  _db = new Database(dbPath);
  return _db;
}

// ---------------------------------------------------------------------------
// Magic link URL capture (used by admin create-member route)
// ---------------------------------------------------------------------------
type Capture = { resolve: (url: string) => void };
const pendingCaptures = new Map<string, Capture>();

export function captureMagicLink(email: string): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingCaptures.set(email, { resolve });
    setTimeout(() => {
      pendingCaptures.delete(email);
      reject(new Error("Magic link generation timed out"));
    }, 10000);
  });
}

// ---------------------------------------------------------------------------
// Better Auth instance
// ---------------------------------------------------------------------------
export const auth = betterAuth({
  // Pass the lazy getter — better-auth will call it on first request, not at
  // module-evaluation time (which happens during `next build` data collection)
  database: new Proxy({} as Database.Database, {
    get(_target, prop) {
      return getDb()[prop as keyof Database.Database];
    },
  }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3002",

  // IMPORTANT — useSecureCookies: false is required behind Nginx SSL termination.
  //
  // When true, Better Auth prefixes the cookie name with "__Secure-", producing
  // "__Secure-better-auth.session_token". The Edge middleware checks for
  // "better-auth.session_token" (no prefix) so it never finds the cookie →
  // infinite redirect loop back to /login even after a valid magic-link verify.
  //
  // With false: cookie name = "better-auth.session_token". Nginx handles SSL
  // so we don't need the browser-level Secure enforcement inside the app.
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({
        email,
        url,
      }: {
        email: string;
        token: string;
        url: string;
      }) => {
        const capture = pendingCaptures.get(email);
        if (capture) {
          // Admin create-member flow — caller captures the URL itself
          capture.resolve(url);
          pendingCaptures.delete(email);
        } else {
          // Self-service magic link — send via Resend
          const { sendMagicLinkEmail } = await import("./resend");
          await sendMagicLinkEmail(email, url);
        }
      },
    }),
  ],

  user: {
    additionalFields: {
      membershipTier: { type: "string", required: false, defaultValue: null },
      membershipStatus: { type: "string", required: false, defaultValue: "pending" },
      stripeCustomerId: { type: "string", required: false, defaultValue: null },
      province: { type: "string", required: false, defaultValue: null },
      careerRole: { type: "string", required: false, defaultValue: null },
    },
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3002",
    "http://localhost:3002",
    "http://localhost:3000",
  ],
});

export type Auth = typeof auth;

// Run DB migrations once at startup (idempotent)
auth.$context
  .then((ctx) => ctx.runMigrations())
  .then(() => console.log("[auth] DB migrations complete"))
  .catch((err) => console.error("[auth] DB migration error:", err));
