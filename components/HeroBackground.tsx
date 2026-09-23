"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroBackground.module.css";

/**
 * Full-bleed decorative background: a faint grid + scrim over two large,
 * static purple/orange blobs, covered by a canvas that a soft round
 * "brush dab" erases wherever the pointer (lerped, lagging a little)
 * has been — uncovering the color permanently, like a real brush
 * stroke. Absolutely positioned at inset:0, z-index 0. `mix-blend-mode`
 * on the blobs won't composite against the page background from a
 * negative z-index (tried it — the blobs just don't render), so this
 * must be the first child of a `position: relative` parent, and every
 * other child of that same parent needs `position: relative; z-index: 1`
 * (or higher) to paint above it.
 */
export default function HeroBackground({ isLight }: { isLight: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

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

    // Resting position (no pointer yet, or pointer left the viewport) —
    // a bit above center.
    function restingTarget() {
      return { x: width * 0.5, y: height * 0.38 };
    }

    function resize() {
      const rect = root!.getBoundingClientRect();
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
      const rect = root!.getBoundingClientRect();
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

    window.addEventListener("pointermove", onMove);
    document.addEventListener("mouseleave", onLeave);
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
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      reduceMotionQuery.removeEventListener("change", onMotionChange);
    };
  }, [isLight]);

  return (
    <div ref={rootRef} className={`${styles.heroBg} ${isLight ? styles.light : ""}`}>
      <div className={`${styles.layer} ${styles.grid}`} />
      <div className={`${styles.layer} ${styles.scrim}`} />
      <div className={styles.heroGlow}>
        <div className={`${styles.heroBlob} ${styles.heroBlobPurple}`} />
        <div className={`${styles.heroBlob} ${styles.heroBlobOrange}`} />
        <canvas ref={canvasRef} className={styles.heroCanvas} />
      </div>
    </div>
  );
}
