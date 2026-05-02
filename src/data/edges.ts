// Hand-curated cross-cutting relationships between content nodes.
// Most edges live in node frontmatter (`influences`, `realizes`, `critiques`).
// Add an entry here only when the relationship doesn't fit cleanly inside any
// single node's frontmatter — e.g., retroactive observations, or relationships
// that span many nodes at once.
//
// See docs/CONTENT_MODEL.md for the schema.

import type { ManualEdge } from "../../velite.config";

export const manualEdges: ManualEdge[] = [
  // Example (uncomment after Phase 2 migration):
  // {
  //   source: "self-organized-criticality",
  //   target: "the-fertile-crescent",
  //   kind: "influence",
  //   weight: 0.8,
  //   note: "SOC framing reappears as the dynamics layer.",
  // },
];
