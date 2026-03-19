"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MembersSearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/admin/members?q=${encodeURIComponent(q)}` : "/admin/members");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name or email…"
        className="flex-1 h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#E8006A] focus:ring-1 focus:ring-[#E8006A] transition"
      />
      <button
        type="submit"
        className="h-9 px-4 bg-white/8 hover:bg-white/12 text-white/60 text-sm rounded-lg transition"
      >
        Search
      </button>
      {value && (
        <button
          type="button"
          onClick={() => { setValue(""); router.push("/admin/members"); }}
          className="h-9 px-3 text-white/30 hover:text-white/60 text-sm transition"
        >
          Clear
        </button>
      )}
    </form>
  );
}
