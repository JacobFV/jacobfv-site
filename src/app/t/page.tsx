import { Timeline } from "@/components/graph/Timeline";
import { CmdK } from "@/components/chrome/CmdK";
import { getGraph } from "@/lib/graph";

export const metadata = {
  title: "Timeline · Jacob Valdez",
};

export default function TimelinePage() {
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
      <Timeline nodes={nodesLite as never} edges={edges} />
      <CmdK nodes={searchable} />
    </>
  );
}
