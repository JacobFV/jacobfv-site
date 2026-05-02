import Link from "next/link";
import { notFound } from "next/navigation";
import { getGraph, type Edge, type Node } from "@/lib/graph";
import { MDXContent } from "@/lib/mdx";
import { Hero } from "@/components/reader/Hero";
import { Lineage } from "@/components/reader/Lineage";

export function generateStaticParams() {
  const { nodes } = getGraph();
  return nodes.map((n) => ({ slug: n.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const node = getGraph().byId.get(slug);
  if (!node) return {};
  return { title: node.title, description: node.summary };
}

function lineageFor(node: Node, edges: Edge[], byId: Map<string, Node>) {
  const inbound: { node: Node; edge: Edge }[] = [];
  const outbound: { node: Node; edge: Edge }[] = [];
  for (const e of edges) {
    if (e.target === node.id) {
      const src = byId.get(e.source);
      if (src) inbound.push({ node: src, edge: e });
    } else if (e.source === node.id) {
      const tgt = byId.get(e.target);
      if (tgt) outbound.push({ node: tgt, edge: e });
    }
  }
  return { inbound, outbound };
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const graph = getGraph();
  const node = graph.byId.get(slug);
  if (!node) notFound();

  const { inbound, outbound } = lineageFor(node, graph.edges, graph.byId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        <Link href="/" className="no-underline">
          ← constellation
        </Link>
        <Link href="/list" className="no-underline">
          index
        </Link>
      </div>

      <article className="mt-8">
        <Lineage
          current={{ id: node.id, title: node.title, lane: node.lane }}
          inbound={inbound.map((x) => ({
            node: { id: x.node.id, title: x.node.title, lane: x.node.lane },
            edge: x.edge,
          }))}
          outbound={outbound.map((x) => ({
            node: { id: x.node.id, title: x.node.title, lane: x.node.lane },
            edge: x.edge,
          }))}
        />

        <Hero node={node} />

        <div className="prose-mdx">
          <MDXContent code={node.body} />
        </div>
      </article>
    </main>
  );
}
