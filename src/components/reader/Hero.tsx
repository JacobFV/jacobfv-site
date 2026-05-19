import Link from "next/link";
import { nodeHref, type Node } from "@/lib/graph";

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
      className="mb-10 border-b border-[var(--color-bg-2)]/60 pb-8"
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

      <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink-dim)]">{node.summary}</p>

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
    case "reading":
      return <ReadingMeta node={node} />;
    case "update":
      return <UpdateMeta node={node} />;
    case "skill":
      return <SkillMeta node={node} />;
    case "friend":
      return <FriendMeta node={node} />;
    case "event":
      return <EventMeta node={node} />;
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
            className="rounded-full bg-[var(--color-bg-1)] px-3 py-1 text-[var(--color-ink-dim)] no-underline hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
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
      {node.authors && node.authors.length > 0 && <div>{node.authors.join(", ")}</div>}
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

function ReadingMeta({ node }: { node: Node }) {
  return (
    <div className="mt-5 grid gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      <div>{[node.workType, node.readingStatus].filter(Boolean).join(" · ")}</div>
      {node.authors && node.authors.length > 0 && <div>{node.authors.join(", ")}</div>}
      {node.source && <div>{node.source}</div>}
      {node.url && (
        <a
          href={node.url}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-ink-dim)] hover:text-[var(--color-accent)]"
        >
          source ↗
        </a>
      )}
    </div>
  );
}

function UpdateMeta({ node }: { node: Node }) {
  return (
    <div className="mt-5 grid gap-4">
      <div className="flex flex-wrap gap-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        {node.updateType && <span>{node.updateType}</span>}
        {node.url && (
          <a
            href={node.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-accent)]"
          >
            source ↗
          </a>
        )}
      </div>
      {node.embed && <EmbedPreview node={node} />}
    </div>
  );
}

function EmbedPreview({ node }: { node: Node }) {
  const embed = node.embed;
  if (!embed) return null;

  if (embed.kind === "html" && embed.html) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-[var(--color-bg-1)]"
        aria-label={embed.alt ?? node.summary}
        dangerouslySetInnerHTML={{ __html: embed.html }}
      />
    );
  }

  if (embed.kind === "x" && embed.url) {
    return (
      <div className="rounded-2xl bg-[var(--color-bg-1)] p-4">
        <blockquote className="twitter-tweet" data-theme="dark">
          <a href={embed.url}>{embed.alt ?? node.title}</a>
        </blockquote>
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8" />
      </div>
    );
  }

  if (embed.url) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl bg-[var(--color-bg-1)] p-4 text-sm text-[var(--color-ink-dim)] no-underline transition-colors hover:bg-[var(--color-bg-2)]"
      >
        {embed.alt ?? embed.url}
      </a>
    );
  }

  return null;
}

function SkillMeta({ node }: { node: Node }) {
  return (
    <div className="mt-5 grid gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      <div>{[node.category, node.level].filter(Boolean).join(" · ")}</div>
      {node.tools && node.tools.length > 0 && <div>{node.tools.join(", ")}</div>}
      {node.evidence && node.evidence.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {node.evidence.map((id) => (
            <Link key={id} href={`/${id}`} className="hover:text-[var(--color-accent)]">
              {id}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendMeta({ node }: { node: Node }) {
  const links = node.links ? Object.entries(node.links).filter(([, v]) => Boolean(v)) : [];
  return (
    <div className="mt-5 grid gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      <div>{[node.relation, node.location].filter(Boolean).join(" · ")}</div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {links.map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-accent)]"
            >
              {label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function EventMeta({ node }: { node: Node }) {
  const parts = [node.eventType, node.eventStatus, node.role].filter(Boolean);
  return (
    <div className="mt-5 grid gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
      {parts.length > 0 && <div>{parts.join(" · ")}</div>}
      {(node.venue || node.location) && (
        <div>{[node.venue, node.location].filter(Boolean).join(" · ")}</div>
      )}
      {node.url && (
        <a
          href={node.url}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-ink-dim)] hover:text-[var(--color-accent)]"
        >
          source ↗
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
        href={`${nodeHref(node)}?scene=1`}
        className="rounded-full bg-[var(--color-bg-1)] px-3 py-1 no-underline hover:bg-[var(--color-bg-2)]"
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
