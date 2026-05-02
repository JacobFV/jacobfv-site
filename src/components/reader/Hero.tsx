import Link from "next/link";
import type { Node } from "@/lib/graph";

const fmt = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : null);

// Polymorphic hero. The shared `view-transition-name` lets the browser
// FLIP-morph the constellation card into this block on navigation.
export function Hero({ node }: { node: Node }) {
  const start = fmt(node.date);
  const end = fmt(node.endDate);
  const range = end ? `${start} – ${end}` : start;

  return (
    <header
      style={{
        viewTransitionName: `node-${node.id}`,
      }}
      className="mb-10 border-b border-[var(--color-bg-2)] pb-8"
    >
      <div className="mb-3 flex items-baseline gap-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        <time>{range}</time>
        <span>·</span>
        <span>{node.lane}</span>
        <span>·</span>
        <span>{node.kind}</span>
        {node.kind === "project" && node.status && (
          <>
            <span>·</span>
            <StatusBadge status={node.status} />
          </>
        )}
      </div>

      <h1
        className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--color-ink)] sm:text-5xl"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {node.title}
      </h1>

      <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink-dim)]">
        {node.summary}
      </p>

      <KindMeta node={node} />
    </header>
  );
}

function KindMeta({ node }: { node: Node }) {
  switch (node.kind) {
    case "project":
      return <ProjectMeta node={node} />;
    case "paper":
      return <PaperMeta node={node} />;
    case "experience":
      return <ExperienceMeta node={node} />;
    case "vision":
      return <VisionMeta node={node} />;
    default:
      return null;
  }
}

function ProjectMeta({ node }: { node: Node }) {
  if (!node.links || Object.keys(node.links).length === 0) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-3 font-[family-name:var(--font-mono)] text-xs">
      {Object.entries(node.links).map(([k, v]) =>
        v ? (
          <a
            key={k}
            href={v}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--color-bg-2)] px-2 py-1 text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
          >
            {k} ↗
          </a>
        ) : null,
      )}
    </div>
  );
}

function PaperMeta({ node }: { node: Node }) {
  return (
    <div className="mt-5 grid gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      {node.authors && node.authors.length > 0 && (
        <div>{node.authors.join(", ")}</div>
      )}
      {node.venue && <div>{node.venue}</div>}
      {node.bibKey && (
        <div>
          cite key: <code>{node.bibKey}</code>
        </div>
      )}
      {node.pdf && (
        <a
          href={node.pdf}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-ink-dim)] hover:text-[var(--color-accent)]"
        >
          PDF ↗
        </a>
      )}
    </div>
  );
}

function ExperienceMeta({ node }: { node: Node }) {
  if (!node.org) return null;
  const orgUrl = node.links?.org;
  return (
    <div className="mt-5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-dim)]">
      at{" "}
      {orgUrl ? (
        <a
          href={orgUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]"
        >
          {node.org}
        </a>
      ) : (
        <span className="text-[var(--color-ink)]">{node.org}</span>
      )}
    </div>
  );
}

function VisionMeta({ node }: { node: Node }) {
  if (!node.sceneId) return null;
  return (
    <div className="mt-5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      <Link
        href={`/${node.id}?scene=1`}
        className="rounded border border-[var(--color-bg-2)] px-2 py-1 no-underline"
      >
        enter the room (3D — Phase 7)
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: NonNullable<Node["status"]> }) {
  const color =
    status === "active"
      ? "var(--color-accent)"
      : status === "shipped"
      ? "var(--color-ink-dim)"
      : "var(--color-ink-mute)";
  return (
    <span style={{ color }} className="uppercase">
      {status}
    </span>
  );
}
