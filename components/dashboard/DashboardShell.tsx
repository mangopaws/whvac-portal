"use client";

import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  membershipStatus?: string;
  membershipTier?: string;
}

interface DashboardShellProps {
  user: User;
  membershipStatus: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Overview",   icon: HomeIcon,     comingSoon: false },
  { href: "/dashboard/events",     label: "Events",     icon: CalendarIcon, comingSoon: true  },
  { href: "/dashboard/directory",  label: "Directory",  icon: UsersIcon,    comingSoon: true  },
  { href: "/dashboard/resources",  label: "Resources",  icon: BookIcon,     comingSoon: true  },
  { href: "/dashboard/profile",    label: "Profile",    icon: UserIcon,     comingSoon: false },
];

export default function DashboardShell({
  user,
  membershipStatus,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#0F0F1E] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#1A1A2E] border-r border-white/10 fixed left-0 top-0 bottom-0 z-20">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-[#E8006A] font-bold tracking-widest text-sm uppercase">
            WHVAC
          </span>
          <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wider">
            Member Portal
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  title="Coming soon"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/25 cursor-not-allowed min-h-[44px] select-none"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/25 leading-none">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition min-h-[44px] ${
                  active
                    ? "bg-[#E8006A]/10 text-[#E8006A] font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Bottom strip */}
        <div className="p-3 border-t border-white/10 space-y-0.5">
          <a
            href="https://womeninhvac.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-sm transition min-h-[44px]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Website
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition min-h-[44px]"
          >
            <SignOutIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <TopBar
          firstName={firstName}
          email={user.email}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 pb-20 lg:pb-0">
          {/* ── Banners ────────────────────────────────────────────── */}
          <div className="px-6 lg:px-8 pt-6 space-y-3">
            {/* Coming soon banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#E8006A]/8 border border-[#E8006A]/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ConstructionIcon className="w-4 h-4 text-[#E8006A] flex-shrink-0" />
                <p className="text-sm text-white/70">
                  <span className="font-semibold text-white">
                    Member portal features coming soon!
                  </span>{" "}
                  We're building the full experience — profile editing is
                  available now.
                </p>
              </div>
              <a
                href="https://womeninhvac.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 self-start sm:self-auto h-8 px-3 bg-white/8 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white text-xs rounded-lg transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Back to Website
              </a>
            </div>

            {/* Pending membership banner */}
            {membershipStatus !== "paid" && (
              <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                <ClockIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/80">
                  <span className="font-semibold text-amber-300">
                    Your membership is pending payment confirmation.
                  </span>{" "}
                  You'll receive an email once it's been activated.
                </p>
              </div>
            )}
          </div>
          {/* ── Page content ──────────────────────────────────────── */}
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-white/10 z-20 flex">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs text-white/20 cursor-not-allowed select-none"
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">{item.label}</span>
              </div>
            );
          }

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs transition ${
                active ? "text-[#E8006A]" : "text-white/40"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({
  firstName,
  email,
  onSignOut,
}: {
  firstName: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <header className="h-14 lg:h-16 bg-[#1A1A2E] border-b border-white/10 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      {/* Mobile logo */}
      <span className="lg:hidden text-[#E8006A] font-bold tracking-widest text-sm uppercase">
        WHVAC
      </span>
      {/* Desktop: breadcrumb placeholder */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium leading-tight">
            {firstName}
          </p>
          <p className="text-white/40 text-xs leading-tight">{email}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#E8006A]/20 border border-[#E8006A]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#E8006A] text-sm font-bold">
            {firstName[0]?.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="hidden lg:flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition min-h-[44px] px-2"
          title="Sign out"
        >
          <SignOutIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ── Icon components ───────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ConstructionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
