import { Constellation } from "@/components/graph/Constellation";
import { CmdK } from "@/components/chrome/CmdK";
import { NowDock } from "@/components/chrome/NowDock";
import { getGraph } from "@/lib/graph";
import { now } from "#content";

export default function HomePage() {
  const { nodes, edges } = getGraph();

  // Trim payload sent to the client: bodies are heavy and unused here.
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
