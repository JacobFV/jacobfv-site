// The merged graph: every Velite collection plus hand-curated edges.
// One source of truth; every view (constellation, timeline, document) is a
// projection of this. See docs/ARCHITECTURE.md.

import {
  posts as rawPosts,
  projects as rawProjects,
  papers as rawPapers,
  visions as rawVisions,
  experience as rawExperience,
} from "#content";
import { manualEdges } from "@/data/edges";
import type { ManualEdge } from "../../velite.config";

export type NodeKind = "post" | "project" | "paper" | "vision" | "experience";
export type Lane = "research" | "building" | "writing" | "personal";
export type EdgeKind = ManualEdge["kind"];
export type Edge = ManualEdge;

export type ProjectStatus = "idea" | "active" | "shipped" | "shelved";

export type Node = {
  id: string;
  slug: string;
  kind: NodeKind;
  title: string;
  date: string;
  endDate?: string;
  lane: Lane;
  tags: string[];
  summary: string;
  body: string;
  hero?: { src: string; alt: string };
  influences: string[];
  realizes: string[];
  critiques: string[];

  // kind-specific (all optional on the union)
  status?: ProjectStatus;
  links?: Record<string, string | undefined>;
  authors?: string[];
  venue?: string;
  bibKey?: string;
  pdf?: string;
  sceneId?: string;
  org?: string;
};

export type Graph = {
  nodes: Node[];
  edges: Edge[];
  byId: Map<string, Node>;
  neighbors: (id: string) => Edge[];
};

const slugBase = (p: string) => p.split("/").pop() ?? p;

type RawCollectionItem = {
  slug: string;
  title: string;
  date: string;
  lane: Lane;
  summary: string;
  body: string;
  tags?: string[];
  endDate?: string;
  hero?: { src: string; alt: string };
  influences?: string[];
  realizes?: string[];
  critiques?: string[];
};

const toNode = (kind: NodeKind) => (raw: RawCollectionItem): Node => {
  const id = slugBase(raw.slug);
  const extra = raw as Record<string, unknown>;
  return {
    id,
    slug: raw.slug,
    kind,
    title: raw.title,
    date: raw.date,
    endDate: raw.endDate,
    lane: raw.lane,
    tags: raw.tags ?? [],
    summary: raw.summary,
    body: raw.body,
    hero: raw.hero,
    influences: raw.influences ?? [],
    realizes: raw.realizes ?? [],
    critiques: raw.critiques ?? [],
    status: extra.status as ProjectStatus | undefined,
    links: extra.links as Node["links"],
    authors: extra.authors as string[] | undefined,
    venue: extra.venue as string | undefined,
    bibKey: extra.bibKey as string | undefined,
    pdf: extra.pdf as string | undefined,
    sceneId: extra.sceneId as string | undefined,
    org: extra.org as string | undefined,
  };
};

let cached: Graph | null = null;

export function getGraph(): Graph {
  if (cached) return cached;

  const nodes: Node[] = [
    ...rawPosts.map(toNode("post")),
    ...rawProjects.map(toNode("project")),
    ...rawPapers.map(toNode("paper")),
    ...rawVisions.map(toNode("vision")),
    ...rawExperience.map(toNode("experience")),
  ];

  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (byId.has(n.id)) {
      throw new Error(
        `Duplicate node id "${n.id}" — slugs must be unique across all content folders.`,
      );
    }
    byId.set(n.id, n);
  }

  // Derive edges from frontmatter, then merge manualEdges. Dedupe by
  // (source, target, kind). Frontmatter wins on first-seen.
  const edgeMap = new Map<string, Edge>();
  const addEdge = (e: Edge) => {
    const key = `${e.source}->${e.target}:${e.kind}`;
    if (!edgeMap.has(key)) edgeMap.set(key, e);
  };

  for (const n of nodes) {
    for (const t of n.influences)
      addEdge({ source: n.id, target: t, kind: "influence" });
    for (const t of n.realizes)
      addEdge({ source: n.id, target: t, kind: "realization" });
    for (const t of n.critiques)
      addEdge({ source: n.id, target: t, kind: "critique" });
  }
  for (const e of manualEdges) addEdge(e);

  const edges = Array.from(edgeMap.values());

  // Edges may reference nodes that don't exist yet (work in progress).
  // Phase 1 logs a warning rather than throwing — strict validation moves to
  // Phase 3 once the graph view depends on edge integrity.
  if (process.env.NODE_ENV !== "production") {
    for (const e of edges) {
      if (!byId.has(e.source) || !byId.has(e.target)) {
        console.warn(
          `[graph] edge references missing node: ${e.source} -> ${e.target} (${e.kind})`,
        );
      }
    }
  }

  const adjacency = new Map<string, Edge[]>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    if (!adjacency.has(e.target)) adjacency.set(e.target, []);
    adjacency.get(e.source)!.push(e);
    adjacency.get(e.target)!.push(e);
  }

  cached = {
    nodes,
    edges,
    byId,
    neighbors: (id) => adjacency.get(id) ?? [],
  };
  return cached;
}
