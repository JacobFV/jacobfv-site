"use client";

import { Fragment, useEffect, useRef } from "react";

// Decorative dust + planetoids + their moons. Not orbiting the pfp —
// each body drifts on its own Lissajous (sin/cos) curve so motion stays
// bounded but never repeats in lock-step with anything else. Moons DO
// orbit their parent planetoid in tight circles.
//
// Coordinates are px offsets from the pfp center (positive Y is down).
// The component returns a fragment so it shares the pfp's stacking
// context — same trick OrbitDecor uses to layer behind/in front.

const COLORS = {
  research: "var(--color-lane-research)",
  building: "var(--color-lane-building)",
  writing: "var(--color-lane-writing)",
  personal: "var(--color-lane-personal)",
  dust: "var(--color-ink-mute)",
};

type Moon = { r: number; w: number; p: number; size: number; color: string };
type Body = {
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  wx: number;
  wy: number;
  px: number;
  py: number;
  size: number;
  color: string;
  opacity: number;
  moons?: Moon[];
};

const BODIES: Body[] = [
  // Close-in dust — small + fast micro-drift right around the face.
  { cx: -132, cy: -86, ax: 14, ay: 10, wx: 0.6, wy: 0.4, px: 0.0, py: 1.0, size: 6, color: COLORS.dust, opacity: 0.55 },
  { cx:  138, cy: -98, ax: 12, ay: 14, wx: 0.5, wy: 0.7, px: 1.0, py: 0.0, size: 7, color: COLORS.dust, opacity: 0.55 },
  { cx:  -92, cy: 122, ax: 10, ay: 12, wx: 0.4, wy: 0.6, px: 2.0, py: 3.0, size: 5, color: COLORS.dust, opacity: 0.45 },
  { cx:  108, cy: 132, ax: 16, ay:  8, wx: 0.7, wy: 0.5, px: 4.0, py: 5.0, size: 6, color: COLORS.dust, opacity: 0.5  },

  // Mid-distance neighbor planetoids with their own moons.
  { cx: -262, cy: -38, ax: 30, ay: 22, wx: 0.18, wy: 0.13, px: 0.0, py: 2.0, size: 18, color: COLORS.research, opacity: 0.7,
    moons: [
      { r: 28, w:  0.60, p: 0.0, size: 5, color: COLORS.dust },
      { r: 40, w: -0.42, p: 1.6, size: 4, color: COLORS.dust },
    ] },
  { cx:  282, cy:  42, ax: 26, ay: 18, wx: 0.16, wy: 0.10, px: 1.0, py: 3.0, size: 16, color: COLORS.building, opacity: 0.7,
    moons: [
      { r: 26, w: 0.55, p: 1.0, size: 5, color: COLORS.dust },
    ] },
  { cx:   -8, cy: -258, ax: 24, ay: 18, wx: 0.12, wy: 0.15, px: 2.0, py: 0.0, size: 14, color: COLORS.writing, opacity: 0.6 },
  { cx:   12, cy:  262, ax: 20, ay: 14, wx: 0.20, wy: 0.18, px: 3.0, py: 1.0, size: 12, color: COLORS.personal, opacity: 0.6 },

  // Far drifters.
  { cx: -362, cy:  178, ax: 40, ay: 28, wx: 0.08, wy: 0.06, px: 0.5, py: 2.2, size: 5, color: COLORS.dust, opacity: 0.4 },
  { cx:  336, cy: -182, ax: 36, ay: 30, wx: 0.09, wy: 0.07, px: 1.3, py: 0.7, size: 5, color: COLORS.dust, opacity: 0.4 },
];

export function Planetoids() {
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moonRefs = useRef<(HTMLDivElement | null)[][]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      for (let i = 0; i < BODIES.length; i++) {
        const b = BODIES[i];
        const el = bodyRefs.current[i];
        if (!el) continue;
        const x = b.cx + b.ax * Math.sin(b.wx * t + b.px);
        const y = b.cy + b.ay * Math.cos(b.wy * t + b.py);
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        if (b.moons) {
          const moonRow = moonRefs.current[i];
          if (!moonRow) continue;
          for (let j = 0; j < b.moons.length; j++) {
            const m = b.moons[j];
            const mel = moonRow[j];
            if (!mel) continue;
            const a = m.p + m.w * t;
            const mx = x + m.r * Math.cos(a);
            const my = y + m.r * Math.sin(a);
            mel.style.transform = `translate(-50%, -50%) translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {BODIES.map((b, i) => (
        <Fragment key={`body-${i}`}>
          <div
            ref={(el) => {
              bodyRefs.current[i] = el;
            }}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: b.size,
              height: b.size,
              background: b.color,
              opacity: b.opacity,
              transform: `translate(-50%, -50%) translate3d(${b.cx}px, ${b.cy}px, 0)`,
              zIndex: 0,
            }}
          />
          {b.moons?.map((m, j) => {
            if (!moonRefs.current[i]) moonRefs.current[i] = [];
            return (
              <div
                key={`moon-${i}-${j}`}
                ref={(el) => {
                  moonRefs.current[i][j] = el;
                }}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: m.size,
                  height: m.size,
                  background: m.color,
                  opacity: 0.45,
                  transform: `translate(-50%, -50%) translate3d(${b.cx + m.r}px, ${b.cy}px, 0)`,
                  zIndex: 0,
                }}
              />
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
