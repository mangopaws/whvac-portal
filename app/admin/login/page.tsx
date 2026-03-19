import { Suspense } from "react";
import AdminLoginClient from "./AdminLoginClient";

export const metadata = { title: "Admin — WHVAC Portal" };

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E8006A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminLoginClient />
    </Suspense>
  );
}
