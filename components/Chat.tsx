"use client";

import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import CommandPalette from "@/components/CommandPalette";
import PostOverlay, { DEFAULT_POST } from "@/components/PostOverlay";
import HeroBackground from "@/components/HeroBackground";
import { useContentTheme } from "@/components/useContentTheme";
import type { BrandAsset, PostState, UserSession } from "@/lib/types";

interface Turn {
  role: "user" | "assistant";
  content: string;
  assets?: BrandAsset[];
  post?: PostState;
}

const SUGGESTIONS = [
  "Where's the reversed white brandmark?",
  "What's our signature color?",
  "Build a LinkedIn post about Bitcoin treasury",
];

export default function Chat({ user }: { user: UserSession }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [post, setPost] = useState<PostState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentTheme] = useContentTheme();
  const isLight = contentTheme === "world";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function ask(text: string) {
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const postPatch: PostState | undefined = data.post ? { ...DEFAULT_POST, ...data.post } : undefined;
      setTurns((prev) => [...prev, { role: "assistant", content: data.reply ?? "", assets: data.assets, post: postPatch }]);
      if (postPatch) setPost((prev) => ({ ...(prev ?? DEFAULT_POST), ...postPatch }));
    } catch {
      setError("Couldn't reach the assistant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <HeroBackground isLight={isLight} />

      <TopBar user={user} onBrowse={() => setPaletteOpen(true)} />

      <div className="relative z-10 flex-1 overflow-y-auto px-6">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold">{`Hi ${user.name.split(" ")[0]}.`}</h1>
            <p className="mt-2 max-w-md text-sm text-[var(--text-2)]">
              Ask for a brand asset, a guideline, or a finished on-brand post — one input, no menus.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--text)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 py-6">
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    t.role === "user"
                      ? "bg-[var(--bubble-user-bg)] text-[var(--bubble-user-text)]"
                      : "border border-[var(--bubble-ai-border)] bg-[var(--bubble-ai-bg)]"
                  }`}
                >
                  {t.content}
                  {t.assets && t.assets.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {t.assets.map((a) => (
                        <a
                          key={a.id}
                          href={a.file}
                          download
                          className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 hover:border-[var(--brand)]"
                        >
                          <div className="flex h-14 items-center justify-center rounded bg-[var(--surface-2)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.file} alt={a.name} className="max-h-10 w-auto object-contain" />
                          </div>
                          <div className="text-xs font-medium">{a.name}</div>
                        </a>
                      ))}
                    </div>
                  )}
                  {t.post && (
                    <button
                      onClick={() => setPost(t.post!)}
                      type="button"
                      className="mt-3 flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left hover:border-[var(--brand)]"
                    >
                      <span>
                        <span className="block text-xs font-semibold">{t.post.headline}</span>
                        <span className="block text-[11px] text-[var(--text-3)]">{t.post.sub}</span>
                      </span>
                      <span className="text-xs font-medium text-[var(--brand)]">Open editor →</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-[var(--text-3)]">Thinking…</div>}
            {error && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) ask(input.trim());
        }}
        className="relative z-10 mx-auto flex w-full max-w-2xl gap-2 px-6 pb-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about assets, guidelines, or brand usage…"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNewPost={() => setPost(DEFAULT_POST)} />
      {post && <PostOverlay post={post} onChange={setPost} onClose={() => setPost(null)} />}
    </div>
  );
}
