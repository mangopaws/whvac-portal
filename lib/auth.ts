import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Database initialisation
//
// better-auth uses `database instanceof Database` to detect the SQLite adapter,
// so it MUST receive a real Database instance — a Proxy breaks that check and
// causes "Failed to initialize database adapter" at runtime.
//
// The Dockerfile builder stage runs `mkdir -p /app/data` before `npm run build`
// so the directory always exists when Next.js evaluates route modules at build
// time. No :memory: fallback is needed or used.
// ---------------------------------------------------------------------------
function openDatabase(): Database.Database {
  const dbPath = path.resolve(
    process.cwd(),
    process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
  );

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return new Database(dbPath);
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
  database: openDatabase(),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3002",

  // IMPORTANT — useSecureCookies: false is required behind Nginx SSL termination.
  //
  // When true, Better Auth prefixes the session cookie name with "__Secure-",
  // making it "__Secure-better-auth.session_token". The Edge middleware checks
  // for "better-auth.session_token" (no prefix) and never finds it →
  // infinite redirect loop back to /login after every magic-link verify.
  //
  // With false: cookie name = "better-auth.session_token". Nginx handles SSL
  // so we don't need browser-level Secure enforcement inside the app itself.
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

// Run DB migrations once at startup (idempotent — safe to call on every boot)
auth.$context
  .then((ctx) => ctx.runMigrations())
  .then(() => console.log("[auth] DB migrations complete"))
  .catch((err) => console.error("[auth] DB migration error:", err));
