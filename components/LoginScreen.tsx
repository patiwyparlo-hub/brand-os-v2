"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Role } from "@/lib/types";
import HeroBackground from "./HeroBackground";

type ContentTheme = "world" | "corporations";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("internal");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<ContentTheme>("world");
  const router = useRouter();

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-content-theme") as ContentTheme) || "world";
    setTheme(current);
  }, []);

  function toggleTheme() {
    const next: ContentTheme = theme === "world" ? "corporations" : "world";
    document.documentElement.setAttribute("data-content-theme", next);
    localStorage.setItem("brandos-content-theme", next);
    setTheme(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-4 text-[var(--text)]">
      <HeroBackground isLight={theme === "world"} />

      <button
        onClick={toggleTheme}
        type="button"
        className="absolute right-5 top-5 z-10 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--text)]"
      >
        {theme === "world" ? "☀️ World" : "🌙 Corporations"}
      </button>

      <div className="relative z-10 flex flex-col items-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]">
          <Image src="/brand/strategy-logo-white.png" alt="" width={18} height={18} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Brand OS</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">One input for assets, guidelines, and on-brand content.</p>

        <form onSubmit={submit} className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-center text-sm outline-none focus:border-[var(--brand)]"
          />
          <div className="flex gap-2">
            {(["internal", "external"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-full border px-3 py-2 text-xs ${
                  role === r ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-2)]"
                }`}
              >
                {r === "internal" ? "Employee" : "External guest"}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            {loading ? "Entering…" : "Enter"}
          </button>
        </form>
        <p className="mt-4 text-[11px] text-[var(--text-3)]">Placeholder sign-in — real SSO is a follow-up.</p>
      </div>
    </div>
  );
}
