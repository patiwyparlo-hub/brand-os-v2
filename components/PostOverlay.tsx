"use client";

import { forwardRef, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { PostState } from "@/lib/types";

export const DEFAULT_POST: PostState = {
  headline: "Your bold headline",
  sub: "Supporting message goes here.",
  cta: "Learn more",
  bg: "white",
  brand: "strategy",
  sizeId: "square",
};

const SIZES = {
  square: { w: 1200, h: 1200, label: "1200 × 1200 — Feed" },
  banner: { w: 1200, h: 627, label: "1200 × 627 — Banner" },
} as const;

const PREVIEW_W = 340;

const PALETTE: Record<PostState["bg"], { bg: string; fg: string }> = {
  white: { bg: "#ffffff", fg: "#18181b" },
  black: { bg: "linear-gradient(135deg,#000 0%,#555 100%)", fg: "#ffffff" },
  orange: { bg: "linear-gradient(135deg,#fa660f 55%,#ffd4b0 100%)", fg: "#ffffff" },
};

function logoPath(brand: PostState["brand"], bg: PostState["bg"]) {
  const onLight = bg === "white";
  if (brand === "mosaic") return onLight ? "/brand/mosaic-logo.png" : "/brand/mosaic-logo-white.png";
  return onLight ? "/brand/strategy-logo-black.png" : "/brand/strategy-logo-white.png";
}

export default function PostOverlay({
  post,
  onChange,
  onClose,
}: {
  post: PostState;
  onChange: (p: PostState) => void;
  onClose: () => void;
}) {
  const [past, setPast] = useState<PostState[]>([post]);
  const [cursor, setCursor] = useState(0);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  function commit(patch: Partial<PostState>) {
    const next = { ...post, ...patch };
    onChange(next);
    const trimmed = past.slice(0, cursor + 1);
    setPast([...trimmed, next]);
    setCursor(trimmed.length);
  }

  function undo() {
    if (cursor === 0) return;
    setCursor(cursor - 1);
    onChange(past[cursor - 1]);
  }

  function redo() {
    if (cursor >= past.length - 1) return;
    setCursor(cursor + 1);
    onChange(past[cursor + 1]);
  }

  async function download() {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const size = SIZES[post.sizeId];
      const url = await toPng(canvasRef.current, { width: size.w, height: size.h, pixelRatio: 1 });
      const a = document.createElement("a");
      a.download = `strategy-post-${post.sizeId}.png`;
      a.href = url;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const size = SIZES[post.sizeId];
  const scale = PREVIEW_W / size.w;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl gap-6 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div className="flex flex-col items-center gap-3">
          <Canvas ref={canvasRef} post={post} size={size} scale={scale} />
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={cursor === 0} type="button" className="rounded px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[var(--surface-2)] disabled:opacity-40">
              Undo
            </button>
            <button onClick={redo} disabled={cursor >= past.length - 1} type="button" className="rounded px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[var(--surface-2)] disabled:opacity-40">
              Redo
            </button>
          </div>
          <button
            onClick={download}
            disabled={exporting}
            type="button"
            className="w-full rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Edit post</span>
            <button onClick={onClose} type="button" className="text-sm text-[var(--text-2)] hover:text-[var(--text)]">
              Close
            </button>
          </div>

          <select
            value={post.sizeId}
            onChange={(e) => commit({ sizeId: e.target.value as PostState["sizeId"] })}
            className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
          >
            {Object.entries(SIZES).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>

          {(["headline", "sub", "cta"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-3)]">{field}</label>
              <input
                value={post[field]}
                onChange={(e) => commit({ [field]: e.target.value } as Partial<PostState>)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-3)]">Background</label>
            <div className="flex gap-2">
              {(["white", "black", "orange"] as const).map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => commit({ bg })}
                  aria-label={bg}
                  className={`h-7 w-7 rounded-full border-2 ${post.bg === bg ? "border-[var(--brand)]" : "border-[var(--border)]"}`}
                  style={{ background: PALETTE[bg].bg }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-3)]">Logo</label>
            <div className="flex gap-2">
              {(["strategy", "mosaic"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => commit({ brand: b })}
                  className={`rounded-md border px-3 py-1.5 text-xs capitalize ${post.brand === b ? "border-[var(--brand)]" : "border-[var(--border)] text-[var(--text-2)]"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Canvas = forwardRef<HTMLDivElement, { post: PostState; size: { w: number; h: number }; scale: number }>(
  function Canvas({ post, size, scale }, ref) {
    const { bg, fg } = PALETTE[post.bg];
    const pad = size.w * 0.07;
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--border)]" style={{ width: size.w * scale, height: size.h * scale }}>
        <div style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div ref={ref} className="flex flex-col justify-between" style={{ width: size.w, height: size.h, padding: pad, background: bg, color: fg }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> captures reliably with html-to-image */}
            <img src={logoPath(post.brand, post.bg)} alt="" style={{ height: size.w * 0.05, width: "auto", alignSelf: "flex-start" }} />
            <div>
              <div style={{ fontSize: size.w * 0.07, fontWeight: 700, lineHeight: 1.1 }}>{post.headline}</div>
              <div style={{ marginTop: size.w * 0.02, fontSize: size.w * 0.03, opacity: 0.9 }}>{post.sub}</div>
              <div
                style={{
                  marginTop: size.w * 0.035,
                  display: "inline-block",
                  borderRadius: size.w * 0.008,
                  padding: `${size.w * 0.018}px ${size.w * 0.032}px`,
                  fontSize: size.w * 0.026,
                  fontWeight: 600,
                  background: post.bg === "white" ? "#fa660f" : "#ffffff",
                  color: post.bg === "white" ? "#ffffff" : "#18181b",
                }}
              >
                {post.cta}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
