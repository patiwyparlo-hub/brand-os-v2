"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import CreateScreen from "./CreateScreen";
import HeroBackground from "./HeroBackground";
import type { FormatId } from "./formats";
import styles from "./Studio.module.css";
import { useContentTheme } from "./useContentTheme";

type Step = "brief" | "loading" | "editor";
type Theme = "white" | "dark" | "orange";
type Layout = "statement" | "keystats" | "benefits" | "cardgrid" | "textimage";
type EditorFormat = "square" | "landscape" | "wide" | "story" | "banner" | "docs";

// True export pixel dimensions (matching the real ad specs in the brand's
// Figma file), not anything derived from the viewport. The canvas always
// lays out at these exact sizes — see the scale-wrapper in the editor
// step — so text wrapping and spacing never change with window size or
// browser (that inconsistency was the root cause of a layout bug where
// the same design looked fine in one browser and broken in another).
const EDITOR_FORMATS: { id: EditorFormat; name: string; ratio: string; aspect: number; width: number }[] = [
  { id: "square", name: "Square", ratio: "1:1", aspect: 1 / 1, width: 1080 },
  { id: "landscape", name: "Landscape", ratio: "1.91:1", aspect: 1.91 / 1, width: 1910 },
  { id: "wide", name: "Wide", ratio: "16:9", aspect: 16 / 9, width: 1920 },
  { id: "story", name: "Story", ratio: "9:16", aspect: 9 / 16, width: 1080 },
  { id: "banner", name: "Banner", ratio: "4:1", aspect: 4 / 1, width: 1910 },
  { id: "docs", name: "Docs", ratio: "A4", aspect: 1 / 1.414, width: 1240 },
];

const LAYOUTS: { id: Layout; name: string; icon: string }[] = [
  { id: "statement", name: "Statement", icon: "𝗧" },
  { id: "keystats", name: "Key stats", icon: "📊" },
  { id: "benefits", name: "Benefits", icon: "✓" },
  { id: "cardgrid", name: "Card grid", icon: "▦" },
  { id: "textimage", name: "Text + image", icon: "▤" },
];

const LOGO_BY_THEME: Record<Theme, string> = {
  white: "/brand/strategy-logo-orange.png",
  dark: "/brand/strategy-logo-orange.png",
  orange: "/brand/strategy-logo-black.png",
};

type UseCase = { icon: string; title: string; desc: string };

type DesignState = {
  format: EditorFormat;
  theme: Theme;
  layout: Layout;
  titleInk: string;
  titleAccent: string;
  sub: string;
  cta: string;
  url: string;
  stats: { v: string; l: string }[];
  benefits: string[];
  cards: { v: string; l: string }[];
  body: string;
  imageUrl: string;
  // Docs-only fields
  about: string;
  statsHeading: string;
  challenge: string;
  solution: string;
  impact: string;
  quoteName: string;
  quoteRole: string;
  quoteText: string;
  result: string;
  useCases: UseCase[];
  closingHeading: string;
  closingSub: string;
};

function defaultDesign(format: EditorFormat, brief: string): DesignState {
  const hasBrief = brief.trim().length > 0;
  return {
    format,
    theme: "white",
    layout: "statement",
    titleInk: hasBrief ? "" : "Make something",
    titleAccent: hasBrief ? brief.trim() : "on brand",
    sub: "Click any element to edit it.\nOr describe what you want below.\nEverything stays on brand.",
    cta: "Learn More",
    url: "software.strategy.com",
    stats: [
      { v: "250+", l: "Projects delivered" },
      { v: "98%", l: "Customer satisfaction" },
      { v: "3x", l: "Faster results" },
    ],
    benefits: ["Click to edit any element", "Describe changes in plain words", "Export when you are ready"],
    cards: [
      { v: "250+", l: "Projects delivered" },
      { v: "98%", l: "Customer satisfaction" },
      { v: "3x", l: "Faster results" },
      { v: "#1", l: "Category leader" },
      { v: "24/7", l: "Always available" },
      { v: "10x", l: "Return on investment" },
    ],
    body: "Use this space to describe your product, service or story. Click to edit this text, or ask for a rewrite in plain language.",
    imageUrl: "",
    about:
      "Introduce your company or product here. Explain what you do and who you serve in a few clear sentences. Click any text to edit it, or ask for a rewrite.",
    statsHeading: "Success by the Numbers",
    challenge: "Describe the problem your customer faced before working with you. What was slow, costly or unclear about the old way of doing things.",
    solution: "Explain how your product or service solved the problem. Keep it concrete and focused on the outcome you delivered.",
    impact: "Summarise the results. Use specific numbers where you can, and let the story show the value you created.",
    quoteName: "Add a name",
    quoteRole: "Add a title and company",
    quoteText: "Add a customer quote here. A short, specific testimonial builds trust faster than any claim you could make yourself.",
    result: "Close with where the customer is now and what comes next. A clear, confident finish works best.",
    useCases: [
      { icon: "📊", title: "Add a use case", desc: "Describe one way customers get value from what you offer. Keep it to a sentence or two." },
      { icon: "🛡", title: "Add another", desc: "Highlight a second benefit or scenario. Click any text to edit it, or ask for a rewrite." },
      { icon: "✓", title: "And a third", desc: "Round out the picture with one more use case that shows range." },
    ],
    closingHeading: "Ready to get started?",
    closingSub: "Add a closing line that invites the reader to take the next step.",
  };
}

const DIRECTIONS: { id: string; name: string; desc: string; theme: Theme; layout: Layout }[] = [
  { id: "bold", name: "Bold statement", desc: "Dark canvas, big claim", theme: "dark", layout: "statement" },
  { id: "minimal", name: "Minimal light", desc: "White canvas, clean type", theme: "white", layout: "statement" },
  { id: "data", name: "Data-led", desc: "Orange canvas, key stats", theme: "orange", layout: "keystats" },
  { id: "editorial", name: "Editorial", desc: "Dark canvas, benefits list", theme: "dark", layout: "benefits" },
];

export default function Studio() {
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  // history + index live in one state object, updated atomically, so
  // multiple commit() calls in the same event handler (e.g. an AI edit
  // that changes both theme and layout) can't read a stale index — that
  // was a real bug: two commits in one tick could advance histIndex past
  // the end of history, crashing on design=history[histIndex]=undefined.
  const [historyState, setHistoryState] = useState<{ list: DesignState[]; index: number }>({ list: [], index: 0 });
  const history = historyState.list;
  const histIndex = historyState.index;
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [imgMode, setImgMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [docsWidth, setDocsWidth] = useState(480);
  const [contentTheme, toggleContentTheme] = useContentTheme();
  const isLight = contentTheme === "world";

  const design = history[histIndex];

  const formatMeta = useMemo(
    () => EDITOR_FORMATS.find((f) => f.id === design?.format) ?? EDITOR_FORMATS[0],
    [design]
  );

  // The canvas always lays out at its true export pixel size (formatMeta.width
  // x width/aspect) — never something derived from the viewport — so text
  // wrapping and spacing are identical everywhere the app runs. Only the
  // *display* is shrunk to fit the stage, via a CSS transform: scale on a
  // wrapper around the untransformed frame, so what gets exported (frameRef)
  // and what gets measured for --cqmin is always the real size.
  const frameSize = useMemo(() => {
    const width = formatMeta.width;
    return { width, height: Math.round(width / formatMeta.aspect) };
  }, [formatMeta]);

  // Every font size in the frame is a multiple of --cqmin, normally the
  // frame's shorter side. Banner is 4:1 -- at that aspect the shorter
  // side (height) is so small that text/CTA shrink to near-illegible,
  // which the reference doesn't do: its type reads at roughly the same
  // scale as the taller formats. Give banner a taller effective basis so
  // it doesn't get punished for being short — this only feeds font-size
  // calc()s, not layout, so wrapping/positioning are unaffected.
  const cqminBasis =
    formatMeta.id === "banner"
      ? Math.min(frameSize.width, frameSize.height * 1.6)
      : Math.min(frameSize.width, frameSize.height);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || step !== "editor" || formatMeta.id === "docs") return;

    const STAGE_PADDING = 32;

    function fit() {
      const availW = Math.max(80, stage!.clientWidth - STAGE_PADDING);
      const availH = Math.max(80, stage!.clientHeight - STAGE_PADDING);
      setScale(Math.min(1, availW / frameSize.width, availH / frameSize.height));
    }

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [step, formatMeta.id, frameSize.width, frameSize.height]);

  // Docs reads as a scrollable document at a comfortable reading width
  // rather than a fixed-aspect canvas, so it keeps its own responsive width.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || step !== "editor" || formatMeta.id !== "docs") return;

    const STAGE_PADDING = 32;

    function fit() {
      setDocsWidth(Math.round(Math.min(480, Math.max(120, stage!.clientWidth - STAGE_PADDING))));
    }

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [step, formatMeta.id]);

  async function startFromBrief(text: string, _visual: string, format: FormatId) {
    setBrief(text);
    setStep("loading");
    const mapped: EditorFormat = format === "document" ? "docs" : format;
    const dir = DIRECTIONS[0];
    const base = { ...defaultDesign(mapped, text), theme: dir.theme, layout: dir.layout };
    setHistoryState({ list: [base], index: 0 });

    // Ask Claude to invent on-brand headline copy for the brief instead of
    // just echoing it back verbatim, and to pick the format/layout itself
    // (e.g. a LinkedIn brief asking for a photo -> landscape + text+image)
    // rather than always using the manually-selected format and a fixed
    // direction. Falls back to the literal-brief version already set above
    // if the assistant isn't configured or the request fails.
    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text }),
      });
      const data = await res.json();
      if (res.ok) {
        const aiMapped: EditorFormat = data.format === "document" ? "docs" : data.format ?? mapped;
        setHistoryState({
          list: [
            {
              ...defaultDesign(aiMapped, text),
              theme: dir.theme,
              layout: data.layout ?? dir.layout,
              titleInk: data.titleInk,
              titleAccent: data.titleAccent,
              sub: data.sub,
              imageUrl: data.imageUrl ?? "",
            },
          ],
          index: 0,
        });
      } else {
        showToast(data.error ?? "Couldn't generate copy — using your brief as the headline instead.");
      }
    } catch {
      showToast("Couldn't reach the assistant — using your brief as the headline instead.");
    } finally {
      setStep("editor");
    }
  }

  function skipToEditor(format: FormatId) {
    const mapped: EditorFormat = format === "document" ? "docs" : format;
    setHistoryState({ list: [defaultDesign(mapped, "")], index: 0 });
    setStep("editor");
  }

  function commit(patch: Partial<DesignState>) {
    setHistoryState((s) => {
      const truncated = s.list.slice(0, s.index + 1);
      const next = { ...truncated[s.index], ...patch };
      const list = [...truncated, next];
      return { list, index: list.length - 1 };
    });
  }

  function undo() {
    setHistoryState((s) => ({ ...s, index: Math.max(0, s.index - 1) }));
  }
  function redo() {
    setHistoryState((s) => ({ ...s, index: Math.min(s.list.length - 1, s.index + 1) }));
  }
  function resetDesign() {
    setHistoryState((s) => ({ list: [s.list[0]], index: 0 }));
  }

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }

  // Keyword-only fallback for when the assistant isn't configured or the
  // request fails — keeps the composer at least somewhat useful offline.
  function applyKeywordEdit(text: string): boolean {
    const lower = text.toLowerCase();
    let handled = false;
    if (/dark/.test(lower)) { commit({ theme: "dark" }); handled = true; }
    else if (/orange/.test(lower)) { commit({ theme: "orange" }); handled = true; }
    else if (/white|light/.test(lower)) { commit({ theme: "white" }); handled = true; }
    if (/stat/.test(lower)) { commit({ layout: "keystats" }); handled = true; }
    else if (/benefit/.test(lower)) { commit({ layout: "benefits" }); handled = true; }
    else if (/grid|card/.test(lower)) { commit({ layout: "cardgrid" }); handled = true; }
    else if (/image|photo/.test(lower)) { commit({ layout: "textimage" }); handled = true; }
    else if (/statement|headline/.test(lower)) { commit({ layout: "statement" }); handled = true; }
    return handled;
  }

  async function sendMessage() {
    const text = message.trim();
    if (!text || !design) return;
    setMessage("");
    setSendingMessage(true);

    try {
      const res = await fetch("/api/edit-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, design }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(applyKeywordEdit(text) ? "Applied via keywords — the assistant isn't configured." : data.error ?? "The assistant isn't configured.");
        return;
      }
      if (data.patch) {
        commit(data.patch as Partial<DesignState>);
        showToast(data.reply || "Applied.");
      } else {
        showToast(data.reply || "Not sure what to change — try being more specific.");
      }
    } catch {
      showToast(applyKeywordEdit(text) ? "Applied via keywords — couldn't reach the assistant." : "Couldn't reach the assistant.");
    } finally {
      setSendingMessage(false);
    }
  }

  async function exportPng() {
    const el = frameRef.current;
    if (!el) return;
    // The canvas is shown scaled down to fit the stage (see the
    // frameScaleWrap above) — reset that for the capture so the export is
    // always the full, true design size, then restore it.
    const prevTransform = el.style.transform;
    el.style.transform = "none";
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "brand-os-design.png";
      a.click();
    } catch {
      showToast("Export failed — try again.");
    } finally {
      el.style.transform = prevTransform;
    }
  }

  if (step === "brief") {
    return (
      <CreateScreen
        onCreate={startFromBrief}
        onSkip={skipToEditor}
        theme={contentTheme}
        onToggleTheme={toggleContentTheme}
      />
    );
  }

  if (step === "loading") {
    return (
      <div className={`${styles.studio} ${isLight ? styles.light : ""}`}>
        <HeroBackground isLight={isLight} />
        <div className={styles.topbar}>
          <div className={styles.brand} onClick={() => setStep("brief")} style={{ cursor: "pointer" }}>
            <span>Strategy</span>
            <span style={{ color: "var(--ink-tertiary)" }}>
              Brand <em>OS</em>
            </span>
          </div>
          <div className={styles.headerRight}>
            <ThemeToggleBtn isLight={isLight} onToggle={toggleContentTheme} />
          </div>
        </div>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpark}>✨</div>
          <div className={styles.loadingTitle}>Creating your design</div>
          <p className={styles.loadingSub}>
            Analyzing your brief and generating an on-brand design tailored to your message.
          </p>
          <div className={styles.loadingHint}>Usually takes 10–20 seconds</div>
        </div>
      </div>
    );
  }

  // editor
  return (
    <div className={`${styles.studio} ${isLight ? styles.light : ""}`}>
      <HeroBackground isLight={isLight} />
      <div className={styles.topbar}>
        <div className={styles.brand} onClick={() => setStep("brief")} style={{ cursor: "pointer" }}>
          <span>Strategy</span>
          <span style={{ color: "var(--ink-tertiary)" }}>
            Brand <em>OS</em>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" className={styles.btnGhostSm} onClick={() => setLeftOpen((v) => !v)}>
            ⚙ Design
          </button>
          <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
            {formatMeta.name} · {formatMeta.ratio}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggleBtn isLight={isLight} onToggle={toggleContentTheme} />
          <button type="button" className={styles.btnGhostSm} onClick={() => setRightOpen((v) => !v)}>
            ⋮
          </button>
          <button type="button" className={styles.btnPrimary} onClick={exportPng}>
            ⬇ Export
          </button>
        </div>
      </div>

      <div className={styles.editorBody}>
        <div className={`${styles.sideMenu} ${leftOpen ? styles.open : ""}`}>
          <div className={styles.sideMenuHeader}>
            <div className={styles.sideMenuTitle}>Design Controls</div>
            <button type="button" className={styles.sideMenuClose} onClick={() => setLeftOpen(false)}>
              ✕
            </button>
          </div>
          <div className={styles.sideMenuContent}>
            <div>
              <div className={styles.sectionLabel}>Format</div>
              <div className={styles.cardGrid2}>
                {EDITOR_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.smCard} ${design.format === f.id ? styles.active : ""}`}
                    onClick={() => commit({ format: f.id })}
                  >
                    <div className={styles.smCardName}>{f.name}</div>
                    <div className={styles.smCardDesc}>{f.ratio}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.sectionLabel}>Theme</div>
              <div className={styles.cardGrid3}>
                {(["white", "dark", "orange"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.smCard} ${design.theme === t ? styles.active : ""}`}
                    onClick={() => commit({ theme: t })}
                  >
                    <span
                      className={styles.swatch}
                      style={{ background: t === "white" ? "#fff" : t === "dark" ? "#0a0a0b" : "#fa660f" }}
                    />
                    <div className={styles.smCardDesc}>{t[0].toUpperCase() + t.slice(1)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.sectionLabel}>Layout</div>
              <div className={styles.cardGrid2}>
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`${styles.smCard} ${design.layout === l.id ? styles.active : ""}`}
                    onClick={() => commit({ layout: l.id })}
                  >
                    <span className={styles.smCardIcon}>{l.icon}</span>
                    <div className={styles.smCardName}>{l.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.sideMenuFooter}>💡 Design tips appear here</div>
        </div>

        <div className={`${styles.stage} ${design.format === "docs" ? styles.stageDoc : ""}`} ref={stageRef}>
          {design.format === "docs" ? (
            <DocsFrame frameRef={frameRef} design={design} width={docsWidth} commit={commit} />
          ) : (
            <div
              className={styles.frameScaleWrap}
              style={{ width: frameSize.width * scale, height: frameSize.height * scale }}
            >
            <div
              ref={frameRef}
              className={`${styles.frame} ${
                design.theme === "white" ? styles.frameThemeWhite : design.theme === "dark" ? styles.frameThemeDark : styles.frameThemeOrange
              } ${design.format === "banner" ? styles.frameBanner : ""}`}
              style={
                {
                  width: frameSize.width,
                  height: frameSize.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  "--cqmin": `${cqminBasis / 100}px`,
                } as React.CSSProperties
              }
            >
              {design.layout === "textimage" && (
                <div
                  className={styles.frameImageLayer}
                  style={design.imageUrl ? { backgroundImage: `url(${design.imageUrl})` } : undefined}
                />
              )}

              <img className={styles.logoImg} src={LOGO_BY_THEME[design.theme]} alt="Strategy" />

              <div
                className={`${styles.frameMain} ${
                  design.layout === "textimage"
                    ? styles.frameMainImageNarrow
                    : design.format !== "square" && design.format !== "story"
                    ? styles.frameMainNarrow
                    : ""
                } ${design.format === "story" ? styles.frameMainCentered : ""}`}
              >
                <div className={styles.frameTitle}>
                  <div
                    className={styles.frameInk}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => commit({ titleInk: e.currentTarget.textContent || "" })}
                  >
                    {design.titleInk}
                  </div>
                  <div
                    className={styles.accent}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => commit({ titleAccent: e.currentTarget.textContent || "" })}
                  >
                    {design.titleAccent}
                  </div>
                </div>

                {design.layout === "statement" && (
                  <div
                    className={styles.frameSub}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => commit({ sub: e.currentTarget.textContent || "" })}
                  >
                    {design.sub}
                  </div>
                )}

                {design.layout === "keystats" && (
                  <div className={styles.statsRow}>
                    {design.stats.map((s, i) => (
                      <div className={styles.stat} key={i}>
                        <div className={styles.statValue}>{s.v}</div>
                        <div className={styles.statLabel}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {design.layout === "benefits" && (
                  <div className={styles.benefits}>
                    {design.benefits.map((b, i) => (
                      <div className={styles.benefit} key={i}>
                        <span className={styles.benefitDot} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {design.layout === "cardgrid" && (
                  <div className={styles.gridWrap}>
                    {design.cards.map((c, i) => (
                      <div className={styles.gridCard} key={i}>
                        <span className={styles.gridCardValue}>{c.v}</span>
                        <span className={styles.gridCardLabel}>{c.l}</span>
                      </div>
                    ))}
                  </div>
                )}

                {design.layout === "textimage" && (
                  <div
                    className={styles.frameSub}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => commit({ sub: e.currentTarget.textContent || "" })}
                  >
                    {design.sub}
                  </div>
                )}
              </div>
              <div className={styles.frameFooter}>
                <span
                  className={styles.ctaBtn}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => commit({ cta: e.currentTarget.textContent || "" })}
                >
                  {design.cta}
                </span>
              </div>
            </div>
            </div>
          )}
        </div>

        <div className={`${styles.sideMenu} ${styles.right} ${rightOpen ? styles.open : ""}`}>
          <div className={styles.sideMenuHeader}>
            <div className={styles.sideMenuTitle}>History &amp; State</div>
            <button type="button" className={styles.sideMenuClose} onClick={() => setRightOpen(false)}>
              ✕
            </button>
          </div>
          <div className={styles.sideMenuContent}>
            <div>
              <div className={styles.sectionLabel}>Save</div>
              <button type="button" className={styles.sideMenuButton} onClick={() => showToast("Saved (preview only — not persisted).")}>
                🔖 Save this design
              </button>
            </div>
            <div>
              <div className={styles.sectionLabel}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" className={styles.sideMenuButton} onClick={undo} disabled={histIndex === 0}>
                  ↶ Undo
                </button>
                <button type="button" className={styles.sideMenuButton} onClick={redo} disabled={histIndex >= history.length - 1}>
                  ↷ Redo
                </button>
              </div>
            </div>
            <button type="button" className={styles.sideMenuButton} onClick={resetDesign}>
              ⟲ Reset Design
            </button>
          </div>
        </div>
      </div>

      <div className={styles.composerWrap}>
        <div className={styles.composer}>
          <button type="button" className={styles.composerBtn} title="Attach a reference file">
            <AttachIcon />
          </button>
          <textarea
            placeholder={sendingMessage ? "Thinking…" : "Ask for any change: copy, layout, theme, or an image"}
            value={message}
            disabled={sendingMessage}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
          />
          <button
            type="button"
            className={`${styles.composerBtn} ${imgMode ? styles.on : ""}`}
            title="Image prompt mode"
            onClick={() => setImgMode((v) => !v)}
          >
            <ImageIcon />
          </button>
          <button
            type="button"
            className={`${styles.composerBtn} ${styles.sendBtn}`}
            title="Send"
            onClick={sendMessage}
            disabled={sendingMessage || !message.trim()}
          >
            {sendingMessage ? "…" : "↑"}
          </button>
        </div>
        <div className={styles.composerHint}>One change at a time gets the sharpest results.</div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

function Edit({
  as: Tag = "div",
  className,
  value,
  field,
  commit,
}: {
  as?: "div" | "span" | "h2";
  className?: string;
  value: string;
  field: keyof DesignState;
  commit: (patch: Partial<DesignState>) => void;
}) {
  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => commit({ [field]: e.currentTarget.textContent || "" } as Partial<DesignState>)}
    >
      {value}
    </Tag>
  );
}

function DocsFrame({
  frameRef,
  design,
  width,
  commit,
}: {
  frameRef: React.RefObject<HTMLDivElement | null>;
  design: DesignState;
  width: number;
  commit: (patch: Partial<DesignState>) => void;
}) {
  const s = styles;
  return (
    <div ref={frameRef} className={s.docFrame} style={{ width }}>
      <div className={s.docHeader}>
        <img className={s.docHeaderLogo} src={LOGO_BY_THEME.orange} alt="Strategy" />
        <div
          className={s.docHeaderTitle}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => commit({ titleInk: "", titleAccent: e.currentTarget.textContent || "" })}
        >
          {design.titleInk}
          <strong>{design.titleAccent}</strong>
        </div>
        <Edit className={s.docHeaderSub} value={design.sub} field="sub" commit={commit} />
      </div>

      <div className={s.docBody}>
        <Edit as="h2" className={s.docH2} value="About" field="about" commit={commit} />
        <Edit className={s.docP} value={design.about} field="about" commit={commit} />

        <div className={s.docStatsBox}>
          <Edit className={s.docStatsHeading} value={design.statsHeading} field="statsHeading" commit={commit} />
          <div className={s.docStatsRow}>
            {design.stats.map((st, i) => (
              <div className={s.docStat} key={i}>
                <div className={s.docStatValue}>{st.v}</div>
                <div className={s.docStatLabel}>{st.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={s.docSection}>
          <div className={s.docH2}>The Challenge</div>
          <Edit className={s.docP} value={design.challenge} field="challenge" commit={commit} />
        </div>

        <div className={s.docSection}>
          <div className={s.docH2}>The Solution</div>
          <Edit className={s.docP} value={design.solution} field="solution" commit={commit} />
        </div>

        <div className={s.docSection}>
          <div className={s.docH2}>The Impact</div>
          <Edit className={s.docP} value={design.impact} field="impact" commit={commit} />
        </div>

        <div className={s.docQuoteBlock}>
          <div className={s.docQuoteName}>
            <Edit as="span" value={design.quoteName} field="quoteName" commit={commit} />
          </div>
          <Edit className={s.docQuoteRole} value={design.quoteRole} field="quoteRole" commit={commit} />
          <Edit className={s.docQuoteText} value={design.quoteText} field="quoteText" commit={commit} />
        </div>

        <div className={s.docSection}>
          <div className={s.docH2}>The Result</div>
          <Edit className={s.docP} value={design.result} field="result" commit={commit} />
        </div>

        <div className={s.docH2} style={{ marginTop: 8 }}>
          Most Important Use Cases
        </div>
        <div className={s.docUseCases}>
          {design.useCases.map((u, i) => (
            <div className={s.docUseCase} key={i}>
              <div className={s.docUseCaseIcon}>{u.icon}</div>
              <div className={s.docUseCaseTitle}>{u.title}</div>
              <div className={s.docUseCaseDesc}>{u.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.docFooter}>
        <div className={s.docFooterLeft}>
          <Edit as="h2" className={s.docFooterHeading} value={design.closingHeading} field="closingHeading" commit={commit} />
          <Edit className={s.docFooterSub} value={design.closingSub} field="closingSub" commit={commit} />
          <span
            className={s.docFooterCta}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => commit({ cta: e.currentTarget.textContent || "" })}
          >
            {design.cta}
          </span>
        </div>
        <div className={s.docFooterRight}>
          <div className={s.docQr}>QR</div>
          <span
            className={s.docFooterUrl}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => commit({ url: e.currentTarget.textContent || "" })}
          >
            {design.url}
          </span>
        </div>
      </div>
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 -960 960 960" fill="currentColor">
      <path d="M480-80 397-263 214-180l83-183-183-83 183-83-83-183 183 83 83-183 83 183 183-83-83 183 183 83-183 83 83 183-183-83-83 183Z" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="17" height="17" viewBox="0 -960 960 960" fill="currentColor">
      <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" />
    </svg>
  );
}

function ThemeToggleBtn({ isLight, onToggle }: { isLight: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={onToggle}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 14.5A8.5 8.5 0 019.5 3.5a8.5 8.5 0 1011 11z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
        </svg>
      )}
    </button>
  );
}
