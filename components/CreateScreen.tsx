"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CreateScreen.module.css";
import { FORMATS, type FormatId } from "./formats";
import { useContentTheme, type ContentTheme } from "./useContentTheme";

const RECENT_EXAMPLES = [
  { title: "Q4 product launch", format: "Landscape", time: "2 days ago" },
  { title: "Weekly metrics report", format: "Document", time: "5 days ago" },
  { title: "Bitcoin treasury update", format: "Square", time: "1 week ago" },
];

export default function CreateScreen({
  onCreate,
  onSkip,
  theme,
  onToggleTheme,
}: {
  onCreate?: (brief: string, visual: string, format: FormatId) => void;
  onSkip?: (format: FormatId) => void;
  /** Optional: pass the shared theme down so it stays in sync with a parent
   * (e.g. Studio). If omitted, this component manages its own. */
  theme?: ContentTheme;
  onToggleTheme?: () => void;
}) {
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<FormatId | null>(null);
  const [ownTheme, toggleOwnTheme] = useContentTheme();
  const contentTheme = theme ?? ownTheme;
  const toggleContentTheme = onToggleTheme ?? toggleOwnTheme;
  const isLight = contentTheme === "world";
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The color blobs behind the hero stay put — a canvas on top paints an
  // opaque cover over them and erases a soft round "brush dab" wherever
  // the (lerped, lagging) pointer has been, uncovering the color like a
  // brush stroke. Erased areas stay revealed permanently — the canvas is
  // never re-covered — so the painted trail accumulates as the pointer
  // moves around. Runs on the canvas 2D context directly — no React
  // state — so it stays smooth regardless of render cost elsewhere.
  useEffect(() => {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!page || !canvas || !ctx) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceMotionQuery.matches;

    const brushRadius = 170;
    const lerp = 0.14;

    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let width = 0;
    let height = 0;

    function paintCover() {
      const stops = isLight
        ? ["#fcfcfa", "#f7f7f4", "#f0efe9", "#f0efe9"]
        : ["#060607", "#0b0b0e", "#131318", "#17161a"];
      const grad = ctx!.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, stops[0]);
      grad.addColorStop(0.46, stops[1]);
      grad.addColorStop(0.78, stops[2]);
      grad.addColorStop(1, stops[3]);
      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);
    }

    function dab(x: number, y: number) {
      const grad = ctx!.createRadialGradient(x, y, 0, x, y, brushRadius);
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(0.6, "rgba(0, 0, 0, 0.55)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.globalCompositeOperation = "destination-out";
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(x, y, brushRadius, 0, Math.PI * 2);
      ctx!.fill();
    }

    // Resting position (no pointer yet, or pointer left the section) —
    // a bit above center, roughly where the headline sits.
    function restingTarget() {
      return { x: width * 0.5, y: height * 0.38 };
    }

    function resize() {
      const rect = page!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCover();
    }

    resize();
    target = restingTarget();
    current = { ...target };
    dab(current.x, current.y);

    function onMove(e: PointerEvent) {
      const rect = page!.getBoundingClientRect();
      target = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (reduceMotion) {
        current = { ...target };
        paintCover();
        dab(current.x, current.y);
      }
    }
    function onLeave() {
      target = restingTarget();
      if (reduceMotion) {
        current = { ...target };
        paintCover();
        dab(current.x, current.y);
      }
    }
    function onResize() {
      resize();
      target = restingTarget();
      current = { ...target };
      dab(current.x, current.y);
    }
    function onMotionChange() {
      reduceMotion = reduceMotionQuery.matches;
      if (reduceMotion) {
        paintCover();
        dab(current.x, current.y);
      }
    }

    page.addEventListener("pointermove", onMove);
    page.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    reduceMotionQuery.addEventListener("change", onMotionChange);

    let raf = 0;
    if (!reduceMotion) {
      const tick = () => {
        current.x += (target.x - current.x) * lerp;
        current.y += (target.y - current.y) * lerp;
        dab(current.x, current.y);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      page.removeEventListener("pointermove", onMove);
      page.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      reduceMotionQuery.removeEventListener("change", onMotionChange);
    };
  }, [isLight]);

  return (
    <div ref={pageRef} className={`${styles.page} ${isLight ? styles.light : ""}`}>
      <div className={`${styles.layer} ${styles.grid}`} />
      <div className={`${styles.layer} ${styles.scrim}`} />
      <div className={styles.heroGlow}>
        <div className={`${styles.heroBlob} ${styles.heroBlobPurple}`} />
        <div className={`${styles.heroBlob} ${styles.heroBlobOrange}`} />
        <canvas ref={canvasRef} className={styles.heroCanvas} />
      </div>

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Strategy</span>
          <span className={styles.brandProduct}>
            Brand <em>OS</em>
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleContentTheme}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroGroup}>
        <div className={styles.greeting}>Hi, Patrycja.</div>

        <h1 className={styles.heading}>
          What are we <em>creating</em> today?
        </h1>

        <div style={{ width: "100%", marginTop: 16 }}>
          <div className={styles.sectionLabel} style={{ marginBottom: 12 }}>
            1. Select format
          </div>
          <div className={styles.formats}>
            {FORMATS.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`${styles.formatCard} ${format === f.id ? styles.formatCardSelected : ""}`}
                onClick={() => setFormat(f.id)}
              >
                <span className={styles.formatIcon}>
                  <span style={{ aspectRatio: f.ratio, width: f.ratio === "9 / 16" ? 14 : 26, height: f.ratio === "9 / 16" ? 24 : undefined }} />
                </span>
                <span className={styles.formatName}>{f.name}</span>
                <span className={styles.formatHint}>{f.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%" }}>
          <div className={styles.sectionLabel} style={{ marginBottom: 12 }}>
            2. Describe your idea
          </div>
          <div className={styles.inputCard}>
          <button type="button" className={styles.iconBtn} title="Attach a document" aria-label="Attach a document">
            <PaperclipIcon />
          </button>
          <textarea
            className={styles.textarea}
            placeholder="A launch post, a bold claim, a weekly report…"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={1}
          />
          <button type="button" className={styles.iconBtn} title="Sharpen your brief with AI" aria-label="Sharpen your brief with AI">
            <SparkleIcon />
          </button>
          </div>
        </div>

        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!format}
            onClick={() => format && onCreate?.(brief, "", format)}
          >
            <SparklesIcon />
            Generate directions
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={!format}
            onClick={() => format && onSkip?.(format)}
          >
            Skip to editor
          </button>
        </div>
        </div>

        <div className={styles.recentSection}>
          <div className={styles.sectionLabel} style={{ marginBottom: 12 }}>
            Recent
          </div>
          <div className={styles.recentGrid}>
            {RECENT_EXAMPLES.map((r) => (
              <button type="button" key={r.title} className={styles.recentCard}>
                <span className={styles.recentCardTitle}>{r.title}</span>
                <span className={styles.recentCardMeta}>
                  {r.format} · {r.time}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 14.5A8.5 8.5 0 019.5 3.5a8.5 8.5 0 1011 11z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" opacity="0.7" />
    </svg>
  );
}
