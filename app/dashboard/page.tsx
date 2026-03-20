import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const STATUS_CARDS = [
  {
    title: "Mentorship",
    description: "Get paired with an industry mentor",
    icon: "🤝",
  },
  {
    title: "Scholarships",
    description: "Apply for professional development grants",
    icon: "🎓",
  },
  {
    title: "Resources",
    description: "Guides, templates & industry reports",
    icon: "📚",
  },
  {
    title: "Events",
    description: "Upcoming WHVAC events & workshops",
    icon: "📅",
  },
];

const CHECKLIST = [
  "Complete your profile",
  "Browse the member directory",
  "Join the members-only newsletter",
  "Attend an upcoming event",
];

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName =
    (session?.user?.name ?? "").split(" ")[0] || "Member";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Welcome heading */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-white/50 mt-1">
          Here's what's happening in the WHVAC community.
        </p>
      </div>

      {/* Status cards — all coming soon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {STATUS_CARDS.map((card) => (
          <div
            key={card.title}
            className="bg-white/5 border border-white/10 rounded-xl p-5 opacity-70"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-semibold text-white mb-1">{card.title}</h3>
            <p className="text-white/50 text-sm mb-3">{card.description}</p>
            <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-white/40 text-xs">
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      {/* Onboarding checklist */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 opacity-70">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-[#E8006A]">✓</span> Getting Started
        </h2>
        <ul className="space-y-3">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" />
              <span className="text-white/70 text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
