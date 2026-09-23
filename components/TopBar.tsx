"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { UserSession } from "@/lib/types";

export default function TopBar({ user, onBrowse }: { user: UserSession; onBrowse: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  function toggleContentTheme() {
    const current = document.documentElement.getAttribute("data-content-theme");
    const next = current === "corporations" ? "world" : "corporations";
    document.documentElement.setAttribute("data-content-theme", next);
    localStorage.setItem("brandos-content-theme", next);
  }

  return (
    <div className="relative z-10 flex h-14 shrink-0 items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
          <Image src="/brand/strategy-logo-white.png" alt="" width={12} height={12} />
        </span>
        <span className="text-sm font-semibold">Brand OS</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBrowse}
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--text)]"
        >
          Browse
          <kbd className="rounded border border-[var(--border)] px-1 text-[10px]">⌘K</kbd>
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-3)]">{user.role}</div>
              </div>
              <button
                onClick={toggleContentTheme}
                type="button"
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)]"
              >
                Toggle World / Corporations look
              </button>
              <button
                onClick={async () => {
                  await fetch("/api/session", { method: "DELETE" });
                  router.refresh();
                }}
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
