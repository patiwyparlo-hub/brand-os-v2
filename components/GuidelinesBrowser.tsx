"use client";

import { useEffect, useState } from "react";
import type { GuidelineEntry } from "@/lib/types";

export default function GuidelinesBrowser() {
  const [entries, setEntries] = useState<GuidelineEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/guidelines")
      .then((r) => r.json())
      .then((d) => setEntries(d.guidelines ?? []));
  }, []);

  const grouped = (entries ?? []).reduce<Record<string, GuidelineEntry[]>>((acc, g) => {
    (acc[g.section] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 p-5">
      {entries === null && <div className="text-sm text-[var(--text-3)]">Loading…</div>}
      {Object.entries(grouped).map(([section, items]) => (
        <div key={section}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">{section}</h3>
          <div className="mt-2 flex flex-col gap-3">
            {items.map((g) => (
              <div key={g.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{g.title}</h4>
                  {g.access === "internal" && (
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-3)]">
                      Internal
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-2)]">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
