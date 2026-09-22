"use client";

import { useState } from "react";
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

  return (
    <div className={`${styles.page} ${isLight ? styles.light : ""}`}>
      <div className={`${styles.layer} ${styles.glow}`} />
      <div className={`${styles.layer} ${styles.grid}`} />
      <div className={`${styles.layer} ${styles.scrim}`} />

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
            Pick your canvas
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

        <div className={styles.ctaRow}>
          <button type="button" className={styles.primaryBtn} onClick={() => onCreate?.(brief, "", format)}>
            <SparklesIcon />
            Create four directions
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => onSkip?.(format)}>
            Skip to editor
          </button>
        </div>

        <button type="button" className={styles.helpBtn}>
          <HelpIcon />
          How does this work?
        </button>
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

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 114.2 1.8c-.6.6-1.7 1-1.7 2.2" />
      <path d="M12 17h.01" />
    </svg>
  );
}
