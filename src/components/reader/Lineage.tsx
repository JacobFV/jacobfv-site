import Link from "next/link";
import type { Edge, EdgeKind, Lane, Node } from "@/lib/graph";

type ChipNode = Pick<Node, "id" | "title" | "lane">;

const laneColor: Record<Lane, string> = {
  research: "var(--color-lane-research)",
  building: "var(--color-lane-building)",
  writing: "var(--color-lane-writing)",
  personal: "var(--color-lane-personal)",
};

const kindLabel: Record<EdgeKind, string> = {
  influence: "influences",
  realization: "realizes",
  critique: "critiques",
  collaboration: "collaborators",
};

export function Lineage({
  current,
  inbound,
  outbound,
}: {
  current: ChipNode;
  inbound: { node: ChipNode; edge: Edge }[];
  outbound: { node: ChipNode; edge: Edge }[];
}) {
  if (inbound.length === 0 && outbound.length === 0) return null;

  return (
    <nav
      aria-label="Lineage"
      className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 16,
        alignItems: "center",
        padding: "12px 0 24px",
      }}
    >
      <Side direction="in" items={inbound} />
      <span style={{ opacity: 0.6 }}>{current.title.slice(0, 32)}</span>
      <Side direction="out" items={outbound} />
    </nav>
  );
}

function Side({
  direction,
  items,
}: {
  direction: "in" | "out";
  items: { node: ChipNode; edge: Edge }[];
}) {
  if (items.length === 0)
    return (
      <span
        style={{
          textAlign: direction === "in" ? "right" : "left",
          opacity: 0.4,
        }}
      >
        —
      </span>
    );

  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: direction === "in" ? "flex-end" : "flex-start",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {items.slice(0, 4).map(({ node, edge }) => (
        <li key={`${edge.kind}:${node.id}`}>
          <Link
            href={`/${node.id}`}
            title={`${kindLabel[edge.kind]} → ${node.title}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              border: "1px solid var(--color-bg-2)",
              borderRadius: 999,
              color: "var(--color-ink-dim)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: laneColor[node.lane],
                flexShrink: 0,
              }}
            />
            <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {direction === "in" ? "← " : ""}
              {node.title}
              {direction === "out" ? " →" : ""}
            </span>
          </Link>
        </li>
      ))}
      {items.length > 4 && (
        <li style={{ opacity: 0.5, alignSelf: "center" }}>
          +{items.length - 4}
        </li>
      )}
    </ul>
  );
}
