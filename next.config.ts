import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_LYGOTYPE_FORM_URL: process.env.NEXT_PUBLIC_LYGOTYPE_FORM_URL,
    NEXT_PUBLIC_LAUNCH_DATE: process.env.NEXT_PUBLIC_LAUNCH_DATE,
  },
};

export default nextConfig;
