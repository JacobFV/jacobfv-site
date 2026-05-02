import { Hypersphere } from "@/components/graph/Hypersphere";
import { CmdK } from "@/components/chrome/CmdK";
import { getGraph } from "@/lib/graph";

export const metadata = {
  title: "Constellation · Jacob Valdez",
  description:
    "A slow-rotating sphere of every node — projects, posts, papers, visions. Drag to rotate, scroll to zoom, tap a node to read.",
};

export default function GraphPage() {
  const { nodes, edges } = getGraph();

  const nodesLite = nodes.map(({ body, ...rest }) => rest);
  const searchable = nodesLite.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    tags: n.tags,
    lane: n.lane,
    kind: n.kind,
    date: n.date,
  }));

  return (
    <>
      <Hypersphere nodes={nodesLite as never} edges={edges} />
      <CmdK nodes={searchable} />
    </>
  );
}
