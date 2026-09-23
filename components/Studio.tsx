"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import CreateScreen from "./CreateScreen";
import type { FormatId } from "./formats";
import styles from "./Studio.module.css";
import { useContentTheme } from "./useContentTheme";

type Step = "brief" | "loading" | "directions" | "editor";
type Theme = "white" | "dark" | "orange";
type Layout = "statement" | "keystats" | "benefits" | "cardgrid" | "textimage";
type EditorFormat = "square" | "landscape" | "wide" | "story" | "banner" | "docs";

const EDITOR_FORMATS: { id: EditorFormat; name: string; ratio: string; aspect: number }[] = [
  { id: "square", name: "Square", ratio: "1:1", aspect: 1 / 1 },
  { id: "landscape", name: "Landscape", ratio: "1.91:1", aspect: 1.91 / 1 },
  { id: "wide", name: "Wide", ratio: "16:9", aspect: 16 / 9 },
  { id: "story", name: "Story", ratio: "9:16", aspect: 9 / 16 },
  { id: "banner", name: "Banner", ratio: "4:1", aspect: 4 / 1 },
  { id: "docs", name: "Docs", ratio: "A4", aspect: 1 / 1.414 },
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
    titleInk: hasBrief ? "" : "Make something ",
    titleAccent: hasBrief ? brief.trim() : "on brand",
    sub: "Click any element to edit it. Or describe what you want below. Everything stays on brand.",
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
  const [history, setHistory] = useState<DesignState[]>([]);
  const [histIndex, setHistIndex] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [imgMode, setImgMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 480, height: 480 });
  const [contentTheme, toggleContentTheme] = useContentTheme();
  const isLight = contentTheme === "world";

  const design = history[histIndex];

  const formatMeta = useMemo(
    () => EDITOR_FORMATS.find((f) => f.id === design?.format) ?? EDITOR_FORMATS[0],
    [design]
  );

  // Fit the canvas into a comfortable, consistent-footprint box (like a real
  // design tool's canvas, not something that balloons to fill the screen),
  // shrinking further only if the stage itself is smaller than that box.
  // Text inside uses cqmin (the frame's smaller dimension), so a thin Banner
  // or narrow Story gets proportionally smaller type instead of overflowing.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || step !== "editor") return;

    const STAGE_PADDING = 32;
    const BOX = 560;

    function fit() {
      if (formatMeta.id === "docs") {
        // A document scrolls at a comfortable reading width rather than
        // being squeezed into a square-ish box — height is natural/auto.
        const width = Math.min(480, Math.max(120, stage!.clientWidth - STAGE_PADDING));
        setFrameSize({ width: Math.round(width), height: 0 });
        return;
      }
      const availW = Math.min(BOX, Math.max(120, stage!.clientWidth - STAGE_PADDING));
      const availH = Math.min(BOX, Math.max(120, stage!.clientHeight - STAGE_PADDING));
      const ratio = formatMeta.aspect;
      let width = Math.min(availW, availH * ratio);
      let height = width / ratio;
      if (height > availH) {
        height = availH;
        width = height * ratio;
      }
      setFrameSize({ width: Math.round(width), height: Math.round(height) });
    }

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [step, formatMeta.aspect]);

  function startFromBrief(text: string, _visual: string, format: FormatId) {
    setBrief(text);
    setStep("loading");
    window.setTimeout(() => setStep("directions"), 1400);
    const mapped: EditorFormat = format === "document" ? "docs" : format;
    setHistory([defaultDesign(mapped, text)]);
    setHistIndex(0);
  }

  function skipToEditor(format: FormatId) {
    const mapped: EditorFormat = format === "document" ? "docs" : format;
    setHistory([defaultDesign(mapped, "")]);
    setHistIndex(0);
    setStep("editor");
  }

  function pickDirection(dir: (typeof DIRECTIONS)[number]) {
    setHistory((h) => {
      const base = h[0] ?? defaultDesign("square", brief);
      return [{ ...base, theme: dir.theme, layout: dir.layout }];
    });
    setHistIndex(0);
    setStep("editor");
  }

  function commit(patch: Partial<DesignState>) {
    setHistory((h) => {
      const next = { ...h[histIndex], ...patch };
      const truncated = h.slice(0, histIndex + 1);
      return [...truncated, next];
    });
    setHistIndex((i) => i + 1);
  }

  function undo() {
    setHistIndex((i) => Math.max(0, i - 1));
  }
  function redo() {
    setHistIndex((i) => Math.min(history.length - 1, i + 1));
  }
  function resetDesign() {
    setHistory((h) => [h[0]]);
    setHistIndex(0);
  }

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }

  function sendMessage() {
    const text = message.trim().toLowerCase();
    if (!text || !design) return;
    let handled = false;
    if (/dark/.test(text)) { commit({ theme: "dark" }); handled = true; }
    else if (/orange/.test(text)) { commit({ theme: "orange" }); handled = true; }
    else if (/white|light/.test(text)) { commit({ theme: "white" }); handled = true; }
    if (/stat/.test(text)) { commit({ layout: "keystats" }); handled = true; }
    else if (/benefit/.test(text)) { commit({ layout: "benefits" }); handled = true; }
    else if (/grid|card/.test(text)) { commit({ layout: "cardgrid" }); handled = true; }
    else if (/image|photo/.test(text)) { commit({ layout: "textimage" }); handled = true; }
    else if (/statement|headline/.test(text)) { commit({ layout: "statement" }); handled = true; }

    setMessage("");
    if (handled) showToast("Applied — this preview edits via keywords, live AI isn't connected yet.");
    else showToast("AI editing isn't connected in this preview. Try the panels, or say “dark”, “stats”, “benefits”, “grid”.");
  }

  async function exportPng() {
    if (!frameRef.current) return;
    try {
      const dataUrl = await toPng(frameRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "brand-os-design.png";
      a.click();
    } catch {
      showToast("Export failed — try again.");
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
          <div className={styles.loadingTitle}>Creating your directions</div>
          <p className={styles.loadingSub}>
            Analyzing your brief and generating four distinct creative concepts tailored to your message.
          </p>
          <div className={styles.loadingHint}>Usually takes 10–20 seconds</div>
        </div>
      </div>
    );
  }

  if (step === "directions") {
    return (
      <div className={`${styles.studio} ${isLight ? styles.light : ""}`}>
        <div className={styles.topbar}>
          <button type="button" className={styles.btnGhostSm} onClick={() => setStep("brief")}>
            ← Back to brief
          </button>
          <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>Choose a direction to continue</div>
          <div className={styles.headerRight}>
            <ThemeToggleBtn isLight={isLight} onToggle={toggleContentTheme} />
            <button
              type="button"
              className={styles.btnGhostSm}
              onClick={() => {
                setStep("loading");
                window.setTimeout(() => setStep("directions"), 1000);
              }}
            >
              ↻ Regenerate
            </button>
          </div>
        </div>
        <div className={styles.directionsBody}>
          <div className={styles.directionsGrid}>
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={styles.directionCard}
                onClick={() => pickDirection(d)}
              >
                <div
                  className={styles.directionPreview}
                  style={{
                    background:
                      d.theme === "dark"
                        ? "linear-gradient(162deg, #121215 0%, #070708 100%)"
                        : d.theme === "orange"
                        ? "linear-gradient(#fa660f 0%, #fa660f 56%, #ffffff 100%)"
                        : "#ffffff",
                    color: d.theme === "white" ? "#0a0a0b" : d.theme === "orange" ? "#0a0a0b" : "#fff",
                  }}
                >
                  <span>{brief.trim() || "Make something on brand"}</span>
                </div>
                <div className={styles.directionMeta}>
                  <div className={styles.directionName}>{d.name}</div>
                  <div className={styles.directionDesc}>{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // editor
  return (
    <div className={`${styles.studio} ${isLight ? styles.light : ""}`}>
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
            <DocsFrame frameRef={frameRef} design={design} width={frameSize.width} commit={commit} />
          ) : (
            <div
              ref={frameRef}
              className={`${styles.frame} ${
                design.theme === "white" ? styles.frameThemeWhite : design.theme === "dark" ? styles.frameThemeDark : styles.frameThemeOrange
              } ${design.format === "banner" ? styles.frameBanner : ""}`}
              style={
                {
                  width: frameSize.width,
                  height: frameSize.height,
                  "--cqmin": `${Math.min(frameSize.width, frameSize.height) / 100}px`,
                } as React.CSSProperties
              }
            >
              <img className={styles.logoImg} src={LOGO_BY_THEME[design.theme]} alt="Strategy" />

              <div className={`${styles.frameMain} ${design.format !== "square" && design.format !== "story" ? styles.frameMainNarrow : ""}`}>
                <div
                  className={`${styles.frameTitle} ${styles.frameInk}`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => commit({ titleInk: "", titleAccent: e.currentTarget.textContent || "" })}
                >
                  {design.titleInk}
                  <span className={styles.frameInk} style={{ color: "var(--accent)" }}>
                    {design.titleAccent}
                  </span>
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
                  <div className={styles.bodyText}>{design.body}</div>
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
                <span
                  className={styles.urlText}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => commit({ url: e.currentTarget.textContent || "" })}
                >
                  {design.url}
                </span>
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
          <button type="button" className={styles.composerBtn} title="How this works">
            ?
          </button>
          <textarea
            placeholder="Ask for any change: copy, layout, theme, or an image"
            value={message}
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
            🖼
          </button>
          <button type="button" className={`${styles.composerBtn} ${styles.sendBtn}`} title="Send" onClick={sendMessage}>
            ↑
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
