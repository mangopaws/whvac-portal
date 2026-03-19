import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Sign In — WHVAC Member Portal",
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8006A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
