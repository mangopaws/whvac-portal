"use client";

import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const NAV = [
  { href: "/admin",          label: "Dashboard", icon: "◈", exact: true },
  { href: "/admin/members",  label: "Members",   icon: "⊞" },
  { href: "/admin/settings", label: "Settings",  icon: "⚙" },
];

export default function AdminShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#0A0A14] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0F0F1E] border-r border-white/8 flex flex-col fixed left-0 top-0 bottom-0 z-20">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#E8006A] flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider">WHVAC</p>
              <p className="text-white/30 text-[9px] uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm min-h-[44px] transition ${
                  active
                    ? "bg-[#E8006A]/10 text-[#E8006A] font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User strip */}
        <div className="p-3 border-t border-white/8 space-y-1">
          <div className="px-3 py-2">
            <p className="text-white/70 text-xs font-medium truncate">{userName}</p>
            <p className="text-white/30 text-[10px] truncate">{userEmail}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-white/40 hover:text-white hover:bg-white/5 text-xs rounded-lg transition min-h-[36px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">{children}</main>
    </div>
  );
}
