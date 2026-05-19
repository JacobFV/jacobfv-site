"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { nodeHref, type Lane, type NodeKind } from "@/lib/graph-types";

// Drifting body system around the pfp. Two layers:
//
//   - Planets: real projects from the graph. Each has its own slow
//     Lissajous drift (sin/cos with different angular speeds) so motion
//     is bounded but never aligned, and orbits 1–2 moons (related
//     nodes pulled from the project's edge neighborhood server-side).
//   - Dust: a handful of hardcoded decorative dots near the face, for
//     cosmic ambience.
//
// Returns a fragment so bodies share the pfp's stacking context — see
// OrbitDecor.tsx for the same trick.

export type PlanetMoon = {
  id: string;
  title: string;
  lane: Lane;
  kind: NodeKind;
  asset?: string;
  r: number; // orbital radius around the planet (px)
  w: number; // angular speed (rad/sec, signed)
  phase: number; // start angle
};

export type Planet = {
  id: string;
  title: string;
  lane: Lane;
  kind: NodeKind;
  asset?: string;
  // Drift center + Lissajous params.
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  wx: number;
  wy: number;
  px: number;
  py: number;
  size: number;
  moons: PlanetMoon[];
};

type Dust = {
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  wx: number;
  wy: number;
  px: number;
  py: number;
  size: number;
  opacity: number;
};

const DUST: Dust[] = [
  { cx: -132, cy: -86, ax: 14, ay: 10, wx: 0.6, wy: 0.4, px: 0.0, py: 1.0, size: 6, opacity: 0.55 },
  { cx:  138, cy: -98, ax: 12, ay: 14, wx: 0.5, wy: 0.7, px: 1.0, py: 0.0, size: 7, opacity: 0.5 },
  { cx:  -92, cy: 122, ax: 10, ay: 12, wx: 0.4, wy: 0.6, px: 2.0, py: 3.0, size: 5, opacity: 0.45 },
  { cx:  108, cy: 132, ax: 16, ay:  8, wx: 0.7, wy: 0.5, px: 4.0, py: 5.0, size: 6, opacity: 0.45 },
  { cx: -362, cy:  178, ax: 40, ay: 28, wx: 0.08, wy: 0.06, px: 0.5, py: 2.2, size: 4, opacity: 0.4 },
  { cx:  336, cy: -182, ax: 36, ay: 30, wx: 0.09, wy: 0.07, px: 1.3, py: 0.7, size: 4, opacity: 0.4 },
];

const laneText: Record<Lane, string> = {
  research: "text-[var(--color-lane-research)]",
  building: "text-[var(--color-lane-building)]",
  writing: "text-[var(--color-lane-writing)]",
  personal: "text-[var(--color-lane-personal)]",
};

export function Planetoids({ planets }: { planets: Planet[] }) {
  const planetRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const moonRefs = useRef<(HTMLAnchorElement | null)[][]>([]);
  const dustRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        const el = planetRefs.current[i];
        if (!el) continue;
        const x = p.cx + p.ax * Math.sin(p.wx * t + p.px);
        const y = p.cy + p.ay * Math.cos(p.wy * t + p.py);
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        const moons = p.moons;
        const row = moonRefs.current[i];
        if (!row) continue;
        for (let j = 0; j < moons.length; j++) {
          const m = moons[j];
          const mel = row[j];
          if (!mel) continue;
          const a = m.phase + m.w * t;
          const mx = x + m.r * Math.cos(a);
          const my = y + m.r * Math.sin(a);
          mel.style.transform = `translate(-50%, -50%) translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
        }
      }
      for (let i = 0; i < DUST.length; i++) {
        const d = DUST[i];
        const el = dustRefs.current[i];
        if (!el) continue;
        const x = d.cx + d.ax * Math.sin(d.wx * t + d.px);
        const y = d.cy + d.ay * Math.cos(d.wy * t + d.py);
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [planets]);

  return (
    <>
      {/* Project planets + their moons. */}
      {planets.map((p, i) => (
        <Fragment key={`planet-${p.id}`}>
          <Link
            href={nodeHref({ kind: p.kind, id: p.id })}
            ref={(el) => {
              planetRefs.current[i] = el;
            }}
            aria-label={p.title}
            title={p.title}
            className={`pointer-events-auto absolute top-1/2 left-1/2 grid place-items-center overflow-hidden rounded-full bg-[var(--color-bg-1)] no-underline shadow-[var(--ring-soft)] transition-colors hover:bg-[var(--color-bg-2)] ${laneText[p.lane]}`}
            style={{
              width: p.size,
              height: p.size,
              transform: `translate(-50%, -50%) translate3d(${p.cx}px, ${p.cy}px, 0)`,
              zIndex: 5,
            }}
          >
            {p.asset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.asset} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span
                className="grid h-full w-full place-items-center"
                style={{
                  background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--color-lane-${p.lane}) 55%, transparent) 0%, var(--color-bg-1) 78%)`,
                }}
              >
                <ProjectCube />
              </span>
            )}
          </Link>
          {p.moons.map((m, j) => {
            if (!moonRefs.current[i]) moonRefs.current[i] = [];
            const moonSize = 14;
            // Render position for SSR; RAF overwrites once mounted.
            const mx = p.cx + m.r * Math.cos(m.phase);
            const my = p.cy + m.r * Math.sin(m.phase);
            return (
              <Link
                key={`moon-${p.id}-${m.id}`}
                href={nodeHref({ kind: m.kind, id: m.id })}
                ref={(el) => {
                  moonRefs.current[i][j] = el;
                }}
                aria-label={m.title}
                title={m.title}
                className="pointer-events-auto absolute top-1/2 left-1/2 grid place-items-center overflow-hidden rounded-full bg-[var(--color-bg-1)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)]"
                style={{
                  width: moonSize,
                  height: moonSize,
                  transform: `translate(-50%, -50%) translate3d(${mx}px, ${my}px, 0)`,
                  zIndex: 6,
                }}
              >
                {m.asset ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.asset} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span
                    className="block h-full w-full"
                    style={{ background: `var(--color-lane-${m.lane})`, opacity: 0.7 }}
                  />
                )}
              </Link>
            );
          })}
        </Fragment>
      ))}

      {/* Decorative dust — non-interactive bg specks. */}
      {DUST.map((d, i) => (
        <div
          key={`dust-${i}`}
          ref={(el) => {
            dustRefs.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: d.size,
            height: d.size,
            background: "var(--color-ink-mute)",
            opacity: d.opacity,
            transform: `translate(-50%, -50%) translate3d(${d.cx}px, ${d.cy}px, 0)`,
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}

function ProjectCube() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7l9-5 9 5-9 5-9-5z" />
      <path d="M3 7v10l9 5 9-5V7" />
      <path d="M12 12v10" />
    </svg>
  );
}
