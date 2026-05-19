// 2nd-degree neighborhood for a node — server-rendered SVG.
// Includes: the focus node, every direct neighbor (1°), every neighbor
// of those (2°), and all edges connecting any pair within that set.
//
// Layout: d3-force on the subgraph, scaled to a ~720×360 panel.

import Link from "next/link";
import { computeForceLayout } from "@/lib/layout";
import {
  getGraph,
  nodeHref,
  type Edge,
  type EdgeKind,
  type Lane,
  type Node,
} from "@/lib/graph";

const W = 720;
const H = 360;
const PAD = 24;
const NODE_R_FOCUS = 7;
const NODE_R_1 = 5;
const NODE_R_2 = 3.5;

const laneColor: Record<Lane, string> = {
  research: "#6FA8DC",
  building: "#93C47D",
  writing: "#C27BA0",
  personal: "#F1C232",
};

const dashFor: Record<EdgeKind, string | undefined> = {
  influence: undefined,
  realization: "5 4",
  critique: "2 3",
  collaboration: undefined,
};

function neighborhood(focusId: string): {
  nodes: Node[];
  edges: Edge[];
  rings: Map<string, 0 | 1 | 2>;
} {
  const { byId, edges } = getGraph();
  const focus = byId.get(focusId);
  if (!focus) return { nodes: [], edges: [], rings: new Map() };

  const rings = new Map<string, 0 | 1 | 2>();
  rings.set(focusId, 0);

  // 1° neighbors
  for (const e of edges) {
    if (e.source === focusId) rings.set(e.target, 1);
    else if (e.target === focusId) rings.set(e.source, 1);
  }
  // 2° neighbors (any node adjacent to a 1° neighbor that isn't already
  // in the set)
  const oneRing = Array.from(rings.entries())
    .filter(([, r]) => r === 1)
    .map(([id]) => id);
  for (const e of edges) {
    if (oneRing.includes(e.source) && !rings.has(e.target))
      rings.set(e.target, 2);
    if (oneRing.includes(e.target) && !rings.has(e.source))
      rings.set(e.source, 2);
  }

  const ids = new Set(rings.keys());
  const nodes = Array.from(ids)
    .map((id) => byId.get(id))
    .filter((n): n is Node => Boolean(n));
  const subEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  return { nodes, edges: subEdges, rings };
}

export function LocalGraph({ focusId }: { focusId: string }) {
  const { nodes, edges, rings } = neighborhood(focusId);
  if (nodes.length <= 1) return null; // no neighbors → nothing to draw

  // Layout the subgraph in a wider canvas, then fit to the panel.
  const raw = computeForceLayout(nodes, edges, {
    width: 1000,
    height: 500,
    ticks: 200,
  });

  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const scaleX = (W - 2 * PAD) / dx;
  const scaleY = (H - 2 * PAD) / dy;

  const positions = new Map(
    raw.map((p) => [
      p.id,
      {
        x: PAD + (p.x - minX) * scaleX,
        y: PAD + (p.y - minY) * scaleY,
      },
    ]),
  );

  const oneCount = Array.from(rings.values()).filter((r) => r === 1).length;
  const twoCount = Array.from(rings.values()).filter((r) => r === 2).length;

  return (
    <section className="mt-16 border-t border-[var(--color-bg-2)]/50 pt-8">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
            Neighborhood
          </p>
          <h2
            className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            How this connects
          </h2>
        </div>
        <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
          {oneCount} direct · {twoCount} two-hop
        </div>
      </div>

      <div
        style={{
          background: "rgba(8, 9, 11, 0.4)",
          border: "1px solid var(--color-bg-2)",
          borderRadius: 6,
          padding: 12,
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block", height: "auto", maxHeight: H }}
          role="img"
          aria-label="Local graph: this node, its direct neighbors, and their neighbors"
        >
          {/* Edges */}
          {edges.map((e, i) => {
            const a = positions.get(e.source);
            const b = positions.get(e.target);
            if (!a || !b) return null;
            const isOnFocus = e.source === focusId || e.target === focusId;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isOnFocus ? "#FF6B35" : "#5A6070"}
                strokeWidth={isOnFocus ? 1.2 : 0.6}
                strokeDasharray={dashFor[e.kind]}
                opacity={isOnFocus ? 0.7 : 0.32}
              />
            );
          })}

          {/* Nodes — render 2° behind 1° behind focus so the focus sits on top */}
          {[...nodes]
            .sort((a, b) => (rings.get(b.id) ?? 0) - (rings.get(a.id) ?? 0))
            .map((n) => {
              const p = positions.get(n.id);
              if (!p) return null;
              const ring = rings.get(n.id) ?? 2;
              const r = ring === 0 ? NODE_R_FOCUS : ring === 1 ? NODE_R_1 : NODE_R_2;
              const opacity = ring === 0 ? 1 : ring === 1 ? 0.95 : 0.55;
              const stroke = ring === 0 ? "#FF6B35" : "transparent";

              if (ring === 0) {
                return (
                  <g key={n.id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill={laneColor[n.lane]}
                      stroke={stroke}
                      strokeWidth={2}
                      opacity={opacity}
                    />
                    <text
                      x={p.x}
                      y={p.y - r - 6}
                      textAnchor="middle"
                      fontSize={10}
                      fontFamily="var(--font-mono)"
                      fill="#F2F4F8"
                    >
                      {n.title.length > 32 ? n.title.slice(0, 30) + "…" : n.title}
                    </text>
                  </g>
                );
              }

              return (
                <a key={n.id} href={nodeHref(n)}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={laneColor[n.lane]}
                    opacity={opacity}
                  >
                    <title>{n.title}</title>
                  </circle>
                  {ring === 1 && (
                    <text
                      x={p.x}
                      y={p.y - r - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fontFamily="var(--font-mono)"
                      fill="#9097A3"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.title.length > 28 ? n.title.slice(0, 26) + "…" : n.title}
                    </text>
                  )}
                </a>
              );
            })}
        </svg>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-mute)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-4 bg-[#FF6B35]" /> direct edge
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="2">
              <line x1="0" y1="1" x2="20" y2="1" stroke="#5A6070" strokeWidth="1" />
            </svg>
            influence
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="2">
              <line x1="0" y1="1" x2="20" y2="1" stroke="#5A6070" strokeDasharray="5 4" strokeWidth="1" />
            </svg>
            realization
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="2">
              <line x1="0" y1="1" x2="20" y2="1" stroke="#5A6070" strokeDasharray="2 3" strokeWidth="1" />
            </svg>
            critique
          </span>
        </div>
      </div>

      <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        This view: the node, every node it links to or from, and theirs in turn.
        Click a circle to jump.{" "}
        <Link
          href="/graph"
          className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
        >
          full constellation →
        </Link>
      </p>
    </section>
  );
}
