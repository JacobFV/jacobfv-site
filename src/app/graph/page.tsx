import { Constellation } from "@/components/graph/Constellation";
import { CmdK } from "@/components/chrome/CmdK";
import { NowDock } from "@/components/chrome/NowDock";
import { getGraph } from "@/lib/graph";
import { now } from "#content";

export const metadata = {
  title: "Constellation · Jacob Valdez",
  description:
    "Every node — projects, posts, papers, visions — laid out by force. Hover to see neighbors; click to open.",
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
      <Constellation nodes={nodesLite as never} edges={edges} />
      <CmdK nodes={searchable} />
      <NowDock
        building={now.building}
        reading={now.reading}
        updated={now.updated}
      />
    </>
  );
}
