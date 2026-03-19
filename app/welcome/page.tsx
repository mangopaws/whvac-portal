import { Suspense } from "react";
import WelcomeClient from "./WelcomeClient";

export const metadata = {
  title: "Welcome to WHVAC!",
};

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8006A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WelcomeClient />
    </Suspense>
  );
}
