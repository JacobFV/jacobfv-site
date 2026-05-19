import Link from "next/link";
import { AskInput } from "@/components/chrome/AskInput";
import { CmdK } from "@/components/chrome/CmdK";
import { OrbitDecor } from "@/components/chrome/OrbitDecor";
import { PfpReveal } from "@/components/chrome/PfpReveal";
import { Planetoids } from "@/components/chrome/Planetoids";
import { UpdateDock } from "@/components/chrome/UpdateDock";
import { getGraph, getLatestUpdate, nodeHref, type Lane, type Node, type NodeKind } from "@/lib/graph";

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
const eventRank = (n: Node) => (n.eventStatus === "upcoming" ? 0 : 1);

const socialLinks = [
  { label: "email", href: "mailto:jacob@humanrobots.ai" },
  { label: "text/call", href: "tel:+19724606353" },
  { label: "x", href: "https://twitter.com/jvboid" },
  { label: "github", href: "https://github.com/JacobFV" },
  { label: "instagram", href: "https://www.instagram.com/jvboid/" },
  { label: "art", href: "https://jvboid.art" },
  { label: "anonymous feedback", href: "https://www.admonymous.co/jvboid" },
];

// Featured projects: shipped or active first, then by recency. Cap at 6.
function pickFeatured(nodes: Node[]): Node[] {
  const candidates = nodes.filter(
    (n) => n.kind === "project" && (n.status === "active" || n.status === "shipped"),
  );
  // Manual override — pin a few load-bearing ones to the top regardless of date.
  const pinned = ["windows-web", "computatrum", "limboid", "jacobfv-site", "canvas-engineering"];
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
  const recentUpdates = nodes
    .filter((n) => n.kind === "update")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const recentEvents = nodes
    .filter((n) => n.kind === "event")
    .sort((a, b) => {
      const rank = eventRank(a) - eventRank(b);
      if (rank !== 0) return rank;
      if (a.eventStatus === "upcoming" && b.eventStatus === "upcoming") {
        return a.date > b.date ? 1 : -1;
      }
      return a.date < b.date ? 1 : -1;
    })
    .slice(0, 4);
  const featuredSkills = nodes
    .filter((n) => n.kind === "skill")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const featuredFriends = nodes
    .filter((n) => n.kind === "friend")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);
  const latestUpdate = getLatestUpdate(nodes);

  // Lite shape consumed by OrbitDecor — never includes summary/body, so
  // the hero payload stays small.
  const toOrbiter = <K extends "friend" | "skill" | "project" | "post" | "event">(kind: K) =>
    (n: Node) => ({
      id: n.id,
      title: n.title,
      lane: n.lane,
      kind,
      asset: n.orbitAsset,
      embed: n.orbitEmbed,
    });
  const orbiterProps = {
    friends: featuredFriends.map(toOrbiter("friend")),
    skills: featuredSkills.map(toOrbiter("skill")),
    projects: featured.map(toOrbiter("project")),
    posts: recentPosts.map(toOrbiter("post")),
    events: recentEvents.map(toOrbiter("event")),
  };

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
          <div className="relative grid h-[200px] w-[200px] place-items-center">
            <Planetoids />
            <OrbitDecor {...orbiterProps} />
            <PfpReveal />
          </div>
          <h1
            className="mt-6 font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--color-ink)] sm:text-6xl"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            Jacob Valdez
          </h1>

          <AskInput />

          <div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-2 font-[family-name:var(--font-mono)] text-xs">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="text-[var(--color-ink-dim)] no-underline underline-offset-4 hover:text-[var(--color-accent)] hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 font-[family-name:var(--font-mono)] text-xs">
            <Link
              href="/graph"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              explore as a graph →
            </Link>
            <Link
              href="/t"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              timeline
            </Link>
            <Link
              href="/loop"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              /loop — book notes
            </Link>
            <Link
              href="/resume"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              resume
            </Link>
            <Link
              href="/list"
              className="rounded-full bg-[var(--color-bg-1)] px-4 py-1.5 text-[var(--color-ink-dim)] no-underline shadow-[var(--ring-soft)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-accent)]"
            >
              all writing & projects
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
            <Link
              href="/introduction"
              className="ml-1 text-[var(--color-ink)] underline decoration-[var(--color-ink-mute)] underline-offset-2 hover:decoration-[var(--color-accent)]"
            >
              More about me.
            </Link>
          </p>
        </section>

        {/* ---- Latest updates ---- */}
        {recentUpdates.length > 0 && (
          <Section
            eyebrow="Latest"
            title="Updates"
            link={{ href: "/updates", label: "all updates →" }}
          >
            <ul className="flex flex-col">
              {recentUpdates.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Events ---- */}
        {recentEvents.length > 0 && (
          <Section
            eyebrow="Events"
            title="Places & Things"
            link={{ href: "/events", label: "all events →" }}
          >
            <ul className="flex flex-col">
              {recentEvents.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Featured projects ---- */}
        <Section
          eyebrow="Selected work"
          title="Active Threads:"
          link={{ href: "/list", label: "every project →" }}
        >
          <ul className="flex flex-col">
            {featured.map((n) => (
              <li key={n.id}>
                <ProjectRow node={n} />
              </li>
            ))}
          </ul>
        </Section>

        {/* ---- Skills ---- */}
        {featuredSkills.length > 0 && (
          <Section
            eyebrow="Capabilities"
            title="Skills"
            link={{ href: "/list", label: "all skills →" }}
          >
            <ul className="flex flex-col">
              {featuredSkills.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Recent posts ---- */}
        <Section
          eyebrow="Writing"
          title="Recent posts"
          link={{ href: "/list", label: "all posts →" }}
        >
          <ul className="flex flex-col">
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
            <ul className="flex flex-col">
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
            <ul className="flex flex-col">
              {recentPapers.map((n) => (
                <li key={n.id}>
                  <RowLink node={n} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ---- Footer ---- */}
        <footer className="mt-32 border-t border-[var(--color-bg-2)]/50 pt-8 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
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
                href="/updates"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                /updates
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <Link
                href="/events"
                className="text-[var(--color-ink-dim)] no-underline hover:text-[var(--color-accent)]"
              >
                /events
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
              <kbd className="rounded-md bg-[var(--color-bg-1)] px-1.5 py-0.5 font-[family-name:var(--font-mono)]">
                ⌘K
              </kbd>{" "}
              to search.
            </div>
          </div>
        </footer>
      </main>

      <CmdK nodes={searchable} />
      {latestUpdate && (
        <UpdateDock
          id={latestUpdate.id}
          title={latestUpdate.title}
          summary={latestUpdate.summary}
          date={fmtDate(latestUpdate.date)}
        />
      )}
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
          <p className="text-xs text-[var(--color-ink-mute)]">{eyebrow}</p>
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

function ProjectRow({ node }: { node: Node }) {
  const status = node.status ?? "active";
  return (
    <Link
      href={nodeHref(node)}
      className="group block rounded-xl px-3 py-4 no-underline transition-colors hover:bg-[var(--color-bg-1)]/60"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-3">
          <span
            className={`h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full ${laneBg[node.lane]}`}
            aria-hidden
          />
          <span className="text-lg text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
            {node.title}
          </span>
        </div>
        <div className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] tracking-wider text-[var(--color-ink-mute)] uppercase">
          <span>{status}</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span>{fmtYear(node.date)}</span>
        </div>
      </div>
      <p className="mt-1.5 ml-5 text-sm leading-relaxed text-[var(--color-ink-dim)]">
        {node.summary}
      </p>
    </Link>
  );
}

function RowLink({ node }: { node: Node }) {
  return (
    <Link
      href={nodeHref(node)}
      className="group flex items-baseline gap-4 rounded-xl px-3 py-3 no-underline transition-colors hover:bg-[var(--color-bg-1)]/60"
    >
      <time className="w-20 shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]">
        {fmtDate(node.date)}
      </time>
      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${laneBg[node.lane]}`} aria-hidden />
      <span className="text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {node.title}
      </span>
    </Link>
  );
}
