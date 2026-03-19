import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_URL?.replace("./", "") ?? "data/portal.db"
);

// Capture mechanism for magic link URLs (used by admin create-member)
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

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3002",
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
        // Resolve any pending capture (admin create-member flow)
        const capture = pendingCaptures.get(email);
        if (capture) {
          capture.resolve(url);
          pendingCaptures.delete(email);
        } else {
          // Direct magic link request — log only; Resend handles actual delivery
          console.log(`Magic link for ${email}: ${url}`);
        }
      },
    }),
  ],
  user: {
    additionalFields: {
      membershipTier: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      membershipStatus: {
        type: "string",
        required: false,
        defaultValue: "pending",
      },
      stripeCustomerId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      province: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      careerRole: {
        type: "string",
        required: false,
        defaultValue: null,
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3002",
    "http://localhost:3002",
    "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
