"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Background,
  ReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { NodeCard, type NodeCardData } from "./NodeCard";
import { CustomEdge, type EdgeStyleData } from "./CustomEdge";
import { computeForceLayout } from "@/lib/layout";
import type { Edge, Node } from "@/lib/graph";

type Props = {
  nodes: Node[];
  edges: Edge[];
};

const nodeTypes = { card: NodeCard };
const edgeTypes = { thread: CustomEdge };

function neighborSet(edges: Edge[], focusId: string): Set<string> {
  const set = new Set<string>([focusId]);
  for (const e of edges) {
    if (e.source === focusId) set.add(e.target);
    if (e.target === focusId) set.add(e.source);
  }
  return set;
}

export function Constellation({ nodes, edges }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const focusId = pinnedId ?? hoverId;
  const neighbors = useMemo(
    () => (focusId ? neighborSet(edges, focusId) : null),
    [edges, focusId],
  );

  // Layout is deterministic for a given (nodes, edges) set; memoize it once.
  const positions = useMemo(
    () => computeForceLayout(nodes, edges),
    [nodes, edges],
  );

  const rfNodes: RFNode<NodeCardData>[] = useMemo(() => {
    const byId = new Map(positions.map((p) => [p.id, p]));
    return nodes.map((n) => {
      const p = byId.get(n.id) ?? { x: 0, y: 0 };
      const dim = neighbors ? !neighbors.has(n.id) : false;
      return {
        id: n.id,
        type: "card",
        position: { x: p.x, y: p.y },
        data: {
          id: n.id,
          title: n.title,
          lane: n.lane,
          kind: n.kind,
          status: n.status,
          dim,
        },
      };
    });
  }, [nodes, positions, neighbors]);

  const rfEdges: RFEdge<EdgeStyleData>[] = useMemo(() => {
    return edges.map((e, i) => ({
      id: `${e.source}->${e.target}:${e.kind}:${i}`,
      source: e.source,
      target: e.target,
      type: "thread",
      data: {
        kind: e.kind,
        weight: e.weight ?? 0.6,
        dim: neighbors
          ? !(neighbors.has(e.source) && neighbors.has(e.target))
          : false,
      },
    }));
  }, [edges, neighbors]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => {
    if (!node) return;
    setHoverId(node.id);
  }, []);
  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoverId(null);
  }, []);
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (!node) return;
    setPinnedId((cur) => (cur === node.id ? null : node.id));
  }, []);

  const pinned = pinnedId
    ? nodes.find((n) => n.id === pinnedId) ?? null
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, var(--color-bg-0) 0%, #04050a 100%)",
      }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={onNodeClick}
        onPaneClick={() => setPinnedId(null)}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        minZoom={0.2}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#1a1d24" gap={48} size={1} />
      </ReactFlow>

      {pinned && (
        <PinnedCard
          node={pinned}
          onClose={() => setPinnedId(null)}
        />
      )}

      <CornerLegend />
    </div>
  );
}

function PinnedCard({
  node,
  onClose,
}: {
  node: Node;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 320,
        background: "rgba(14, 16, 20, 0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-bg-2)",
        borderRadius: 6,
        padding: 16,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--color-ink-mute)",
          marginBottom: 6,
        }}
      >
        <span>
          {node.lane} · {node.kind}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: 0,
            color: "var(--color-ink-mute)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          letterSpacing: "-0.01em",
          color: "var(--color-ink)",
          marginBottom: 6,
        }}
      >
        {node.title}
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-ink-dim)",
          marginBottom: 12,
        }}
      >
        {node.summary}
      </p>
      <Link
        href={`/${node.id}`}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--color-accent)",
          textDecoration: "none",
        }}
      >
        open →
      </Link>
    </div>
  );
}

function CornerLegend() {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--color-ink-mute)",
        display: "grid",
        gap: 4,
        zIndex: 5,
      }}
    >
      <LegendRow color="var(--color-lane-research)" label="research" />
      <LegendRow color="var(--color-lane-building)" label="building" />
      <LegendRow color="var(--color-lane-writing)" label="writing" />
      <LegendRow color="var(--color-lane-personal)" label="personal" />
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 4,
          background: color,
          borderRadius: 1,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
