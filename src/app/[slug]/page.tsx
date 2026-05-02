import Link from "next/link";
import { notFound } from "next/navigation";
import { getGraph } from "@/lib/graph";
import { MDXContent } from "@/lib/mdx";

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

function formatDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const node = getGraph().byId.get(slug);
  if (!node) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]"
      >
        ← index
      </Link>

      <article className="mt-8">
        <header className="mb-10 border-b border-[var(--color-bg-2)] pb-6">
          <div className="mb-3 flex items-baseline gap-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
            <time>{formatDate(node.date)}</time>
            <span>·</span>
            <span>{node.lane}</span>
            <span>·</span>
            <span>{node.kind}</span>
          </div>
          <h1
            className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {node.title}
          </h1>
          <p className="mt-3 text-lg text-[var(--color-ink-dim)]">
            {node.summary}
          </p>
        </header>

        <div className="prose-mdx">
          <MDXContent code={node.body} />
        </div>
      </article>
    </main>
  );
}
