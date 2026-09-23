"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CreateScreen.module.css";
import { FORMATS, type FormatId } from "./formats";
import { useContentTheme, type ContentTheme } from "./useContentTheme";

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
  const [format, setFormat] = useState<FormatId>("square");
  const [ownTheme, toggleOwnTheme] = useContentTheme();
  const contentTheme = theme ?? ownTheme;
  const toggleContentTheme = onToggleTheme ?? toggleOwnTheme;
  const isLight = contentTheme === "world";
  const pageRef = useRef<HTMLDivElement>(null);
  const blobPurpleRef = useRef<HTMLDivElement>(null);
  const blobOrangeRef = useRef<HTMLDivElement>(null);

  // Hero background blobs drift toward the pointer with inertia (each
  // eased independently, at its own offset and lag, so they don't move
  // as one rigid unit). Position is written straight to the DOM every
  // frame — no React state — so it stays smooth regardless of render
  // cost elsewhere on the page.
  useEffect(() => {
    const page = pageRef.current;
    const blobs = [
      { el: blobPurpleRef.current, offsetX: -0.1, offsetY: -0.08, lerp: 0.045 },
      { el: blobOrangeRef.current, offsetX: 0.12, offsetY: 0.1, lerp: 0.07 },
    ];
    if (!page || blobs.some((b) => !b.el)) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceMotionQuery.matches;

    let target = { x: 0, y: 0 };
    const current = blobs.map(() => ({ x: 0, y: 0 }));
    let initialized = false;

    // Resting position (no pointer yet, or pointer left the section) —
    // a bit above center, roughly where the headline sits.
    function restingTarget() {
      const rect = page!.getBoundingClientRect();
      return { x: rect.width * 0.5, y: rect.height * 0.38 };
    }

    function place(immediate: boolean) {
      const rect = page!.getBoundingClientRect();
      blobs.forEach((b, i) => {
        const tx = target.x + b.offsetX * rect.width;
        const ty = target.y + b.offsetY * rect.height;
        if (immediate) current[i] = { x: tx, y: ty };
        const el = b.el!;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        el.style.transform = `translate3d(${current[i].x - w / 2}px, ${current[i].y - h / 2}px, 0)`;
      });
    }

    function resetTarget() {
      target = restingTarget();
      if (!initialized) {
        place(true);
        initialized = true;
      } else if (reduceMotion) {
        place(true);
      }
    }
    resetTarget();

    function onMove(e: PointerEvent) {
      const rect = page!.getBoundingClientRect();
      target = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (reduceMotion) place(true);
    }
    function onLeave() {
      resetTarget();
    }
    function onMotionChange() {
      reduceMotion = reduceMotionQuery.matches;
      if (reduceMotion) place(true);
    }

    page.addEventListener("pointermove", onMove);
    page.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resetTarget);
    reduceMotionQuery.addEventListener("change", onMotionChange);

    let raf = 0;
    if (!reduceMotion) {
      const tick = () => {
        const rect = page!.getBoundingClientRect();
        blobs.forEach((b, i) => {
          const tx = target.x + b.offsetX * rect.width;
          const ty = target.y + b.offsetY * rect.height;
          current[i].x += (tx - current[i].x) * b.lerp;
          current[i].y += (ty - current[i].y) * b.lerp;
          const el = b.el!;
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          el.style.transform = `translate3d(${current[i].x - w / 2}px, ${current[i].y - h / 2}px, 0)`;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      page.removeEventListener("pointermove", onMove);
      page.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resetTarget);
      reduceMotionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={pageRef} className={`${styles.page} ${isLight ? styles.light : ""}`}>
      <div className={`${styles.layer} ${styles.grid}`} />
      <div className={`${styles.layer} ${styles.scrim}`} />
      <div className={styles.heroGlow}>
        <div ref={blobPurpleRef} className={`${styles.heroBlob} ${styles.heroBlobPurple}`} />
        <div ref={blobOrangeRef} className={`${styles.heroBlob} ${styles.heroBlobOrange}`} />
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
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Internal Preview
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.heading}>
          What are we <em>creating</em> today?
        </h1>

        <p className={styles.sub}>
          One sentence or a full brief. Brand OS turns it into an on-brand design.
        </p>

        <div style={{ width: "100%" }}>
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
          <button type="button" className={styles.primaryBtn} onClick={() => onCreate?.(brief, "", format)}>
            <SparklesIcon />
            Generate directions
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => onSkip?.(format)}>
            Skip to editor
          </button>
        </div>
      </main>

      <footer className={styles.footer}>Strategy · Brand OS · Internal Preview</footer>
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
