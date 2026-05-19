import Image from "next/image";
import Link from "next/link";
import { CmdK } from "@/components/chrome/CmdK";
import { NowDock } from "@/components/chrome/NowDock";
import { getGraph, type Lane, type Node, type NodeKind } from "@/lib/graph";
import now from "../../.velite/now.json";

const laneClass: Record<Lane, string> = {
  research: "text-[var(--color-lane-research)]",
  building: "text-[var(--color-lane-building)]",
  writing: "text-[var(--color-lane-writing)]",
  personal: "text-[var(--color-lane-personal)]",
};

const laneBg: Record<Lane, string> = {
  research: "bg-[var(--color-lane-research)]",
  building: "bg-[var(--color-lane-building)]",
  writing: "bg-[var(--color-lane-writing)]",
  personal: "bg-[var(--color-lane-personal)]",
};

const fmtYear = (iso: string) => new Date(iso).getUTCFullYear();
const fmtDate = (iso: string) => new Date(iso).toISOString().slice(0, 10);

// Featured projects: shipped or active first, then by recency. Cap at 6.
function pickFeatured(nodes: Node[]): Node[] {
  const candidates = nodes.filter(
    (n) => n.kind === "project" && (n.status === "active" || n.status === "shipped"),
  );
  // Manual override — pin a few load-bearing ones to the top regardless of date.
  const pinned = ["computatrum", "limboid", "jacobfv-site", "canvas-engineering"];
  const pinnedNodes = pinned
    .map((id) => candidates.find((n) => n.id === id))
    .filter((n): n is Node => Boolean(n));
  const rest = candidates
    .filter((n) => !pinned.includes(n.id))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return [...pinnedNodes, ...rest].slice(0, 6);
}

export default function HomePage() {
  const { nodes } = getGraph();

  const featured = pickFeatured(nodes);
  const recentPosts = nodes
    .filter((n) => n.kind === "post")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const recentPapers = nodes
    .filter((n) => n.kind === "paper")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);
  const recentReadings = nodes
    .filter((n) => n.kind === "reading")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 4);

  const searchable = nodes.map((n) => ({
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
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-32">
        {/* ---- Hero ---- */}
        <section className="mb-32 flex flex-col items-center text-center">
          <Image
            src="/img/prof_pic.jpg"
            alt="Jacob Valdez"
            width={200}
            height={200}
            priority
            className="rounded-full border border-[var(--color-bg-2)] grayscale-[15%]"
            style={{ width: 200, height: 200, objectFit: "cover" }}
          />
          <h1
            className="mt-6 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--color-ink)] sm:text-6xl"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            Jacob Valdez
          </h1>

          {/* TODO: wire this up — for now it's a UI-only stub with no handler. */}
          <input
            type="text"
            placeholder="Ask me anything!"
            aria-label="Ask me anything"
            className="mt-8 w-full max-w-xl rounded-full bg-[var(--color-bg-1)] px-5 py-3.5 text-base text-[var(--color-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)_inset] outline-none placeholder:text-[var(--color-ink-mute)] focus:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_var(--color-accent)_inset]"
          />

          <div className="mt-5 flex flex-wrap justify-center gap-2 font-[family-name:var(--font-mono)] text-xs">
            <Link
              href="/graph"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink)] no-underline shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              explore as a graph →
            </Link>
            <Link
              href="/t"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              timeline
            </Link>
            <Link
              href="/loop"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              /loop — book notes
            </Link>
            <Link
              href="/resume"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              resume
            </Link>
          </div>

          <p className="mt-10 max-w-2xl text-left text-lg leading-[1.65] text-[var(--color-ink-dim)]">
            Currently building{" "}
            <a
              href="https://vibestartup.pro"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-ink)] underline decoration-[var(--color-ink-mute)] underline-offset-2 hover:decoration-[var(--color-accent)]"
            >
              VibeStartup
            </a>{" "}
            — a platform for building startups end to end. Most recently API/Integration Architect
            at{" "}
            <a
              href="https://agi.app"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-ink)] underline decoration-[var(--color-ink-mute)] underline-offset-2 hover:decoration-[var(--color-accent)]"
            >
              AGI, Inc.
            </a>
            , shipping APIs, integrations, and agent infrastructure for on-device mobile AI agents.
            Earlier: Breezy, Deepshard, Motio, and UTA research labs. BS Computer Science from UT
            Arlington. I love science and engineering and people — this site maps the arguments
            behind the work.
          </p>
        </section>

        {/* ---- Featured projects ---- */}
        <Section
          eyebrow="Selected work"
          title="Active Threads:"
          link={{ href: "/list", label: "every project →" }}
        >
          <ul className="flex flex-col gap-2">
            {featured.map((n) => (
              <li key={n.id}>
                <ProjectListItem node={n} />
              </li>
            ))}
          </ul>
        </Section>

        {/* ---- Recent posts ---- */}
        <Section
          eyebrow="Writing"
          title="Recent posts"
          link={{ href: "/list", label: "all posts →" }}
        >
          <ul className="divide-y divide-[var(--color-bg-2)]">
            {recentPosts.map((n) => (
              <li key={n.id}>
                <RowLink node={n} />
              </li>
            ))}
          </ul>
        </Section>

        {/* ---- Readings ---- */}
        {recentReadings.length > 0 && (
          <Section
            eyebrow="Reading"
            title="What I'm reading"
            link={{ href: "/list", label: "all readings →" }}
          >
            <ul className="divide-y divide-[var(--color-bg-2)]">
              {recentReadings.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Papers ---- */}
        {recentPapers.length > 0 && (
          <Section eyebrow="Research" title="Papers & notes">
            <ul className="divide-y divide-[var(--color-bg-2)]">
              {recentPapers.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Footer ---- */}
        <footer className="mt-32 border-t border-[var(--color-bg-2)] pt-8 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <Link
                href="/introduction"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                /introduction
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <Link
                href="/focus-statement"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                /the-robot
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <Link
                href="/now"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                /now
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <a
                href="/feed.xml"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                rss
              </a>
            </div>
            <div className="opacity-60">
              Press{" "}
              <kbd className="rounded border border-[var(--color-bg-2)] bg-[var(--color-bg-1)] px-1.5 py-0.5 font-[family-name:var(--font-mono)]">
                ⌘K
              </kbd>{" "}
              to search.
            </div>
          </div>
        </footer>
      </main>

      <CmdK nodes={searchable} />
      <NowDock building={now.building} reading={now.reading} updated={now.updated} />
    </>
  );
}

function Section({
  eyebrow,
  title,
  link,
  children,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-24">
      <div className="mb-8 flex items-baseline justify-between gap-6">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.16em] text-[var(--color-ink-mute)] uppercase">
            {eyebrow}
          </p>
          <h2
            className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            {title}
          </h2>
        </div>
        {link && (
          <Link
            href={link.href}
            className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProjectListItem({ node }: { node: Node }) {
  const status = node.status ?? "active";
  return (
    <Link
      href={`/${node.id}`}
      className="group block rounded border border-[var(--color-bg-2)] p-5 no-underline transition-colors hover:border-[var(--color-accent)]/40"
    >
      <div className="mb-3 flex items-baseline gap-2 font-[family-name:var(--font-mono)] text-[10px] tracking-wider text-[var(--color-ink-mute)] uppercase">
        <span className={laneClass[node.lane]}>{node.lane}</span>
        <span className="opacity-40">·</span>
        <span>{status}</span>
        <span className="opacity-40">·</span>
        <span>{fmtYear(node.date)}</span>
      </div>
      <div className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {node.title}
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-dim)]">
        {node.summary}
      </p>
    </Link>
  );
}

function RowLink({ node }: { node: Node }) {
  return (
    <Link href={`/${node.id}`} className="group flex items-baseline gap-4 py-3 no-underline">
      <time className="w-20 shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        {fmtDate(node.date)}
      </time>
      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded ${laneBg[node.lane]}`} aria-hidden />
      <span className="text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {node.title}
      </span>
    </Link>
  );
}
