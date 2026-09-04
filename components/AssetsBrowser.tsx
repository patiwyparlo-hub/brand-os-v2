"use client";

import { useEffect, useState } from "react";
import type { BrandAsset } from "@/lib/types";

export default function AssetsBrowser() {
  const [assets, setAssets] = useState<BrandAsset[] | null>(null);
  const [active, setActive] = useState<BrandAsset | null>(null);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((d) => setAssets(d.assets ?? []));
  }, []);

  if (active) {
    return (
      <div className="p-5">
        <button onClick={() => setActive(null)} type="button" className="mb-4 text-sm text-[var(--text-2)] hover:text-[var(--text)]">
          ← Back to assets
        </button>
        <div className="flex h-56 items-center justify-center rounded-xl bg-[var(--surface-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.file} alt={active.name} className="max-h-44 w-auto object-contain" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{active.name}</h3>
        <p className="mt-1 text-sm text-[var(--text-2)]">{active.note}</p>
        <div className="mt-3 flex gap-2 text-xs text-[var(--text-3)]">
          <span>{active.variant}</span>
          <span>·</span>
          <span>{active.format}</span>
          <span>·</span>
          <span>{active.access}</span>
        </div>
        <a
          href={active.file}
          download
          className="mt-4 inline-block rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
        >
          Download
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-5">
      {(assets ?? []).map((a) => (
        <button
          key={a.id}
          onClick={() => setActive(a)}
          type="button"
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-[var(--brand)]"
        >
          <div className="flex h-20 items-center justify-center rounded-lg bg-[var(--surface-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.file} alt={a.name} className="max-h-14 w-auto object-contain" />
          </div>
          <div className="text-xs font-medium leading-snug">{a.name}</div>
        </button>
      ))}
      {assets === null && <div className="col-span-3 text-sm text-[var(--text-3)]">Loading…</div>}
    </div>
  );
}
