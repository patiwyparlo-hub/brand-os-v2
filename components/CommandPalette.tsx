"use client";

import { useEffect, useState } from "react";
import AssetsBrowser from "@/components/AssetsBrowser";
import GuidelinesBrowser from "@/components/GuidelinesBrowser";

type View = "menu" | "assets" | "guidelines";

export default function CommandPalette({
  open,
  onClose,
  onNewPost,
}: {
  open: boolean;
  onClose: () => void;
  onNewPost: () => void;
}) {
  const [view, setView] = useState<View>("menu");

  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 px-4 pt-20" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        {view !== "menu" && (
          <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
            <button onClick={() => setView("menu")} type="button" className="text-sm text-[var(--text-2)] hover:text-[var(--text)]">
              ← Back
            </button>
            <button onClick={onClose} type="button" className="text-sm text-[var(--text-2)] hover:text-[var(--text)]">
              Esc
            </button>
          </div>
        )}

        {view === "menu" && (
          <div className="p-2">
            <PaletteItem label="Browse assets" hint="Logos & brandmark files" onClick={() => setView("assets")} />
            <PaletteItem label="Browse guidelines" hint="Values, color, type, voice" onClick={() => setView("guidelines")} />
            <PaletteItem
              label="New post"
              hint="Open the post editor"
              onClick={() => {
                onClose();
                onNewPost();
              }}
            />
          </div>
        )}
        {view === "assets" && <AssetsBrowser />}
        {view === "guidelines" && <GuidelinesBrowser />}
      </div>
    </div>
  );
}

function PaletteItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-[var(--surface-2)]"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-[var(--text-3)]">{hint}</span>
    </button>
  );
}
