import Link from "next/link";
import { notFound } from "next/navigation";
import { loop as chapters } from "#content";
import { MDXContent } from "@/lib/mdx";
import { Scene } from "@/components/loop/Scene";
import { Figure } from "@/components/loop/Figure";
import { Sidetrack } from "@/components/loop/Sidetrack";
import { readerComponents } from "@/components/reader/components";

const chapterComponents = {
  ...readerComponents,
  Scene,
  Figure,
  Sidetrack,
};

const chapterSlug = (s: string) =>
  s.replace(/^loop\//, "").replace(/\.mdx?$/, "");

export function generateStaticParams() {
  return chapters.map((c) => ({ chapter: chapterSlug(c.slug) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const c = chapters.find((x) => chapterSlug(x.slug) === chapter);
  if (!c) return {};
  return { title: `${c.title} · A beautiful loop`, description: c.summary };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const ordered = [...chapters].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((x) => chapterSlug(x.slug) === chapter);
  if (idx < 0) notFound();
  const current = ordered[idx];
  const prev = ordered[idx - 1];
  const next = ordered[idx + 1];

  return (
    <article>
      {/* Sticky chapter title — visible while scrolling. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(251, 250, 246, 0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-bg-2)",
          zIndex: 10,
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--color-ink-mute)",
          }}
        >
          <Link href="/loop" style={{ color: "inherit", textDecoration: "none" }}>
            ← chapters
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            {String(current.order).padStart(2, "0")} — {current.title}
          </span>
        </div>
      </div>

      <MDXContent code={current.body} components={chapterComponents} />

      <nav
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "12vh 24px 24vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      >
        <div>
          {prev && (
            <Link
              href={`/loop/${chapterSlug(prev.slug)}`}
              style={{ color: "var(--color-ink-dim)", textDecoration: "none" }}
            >
              ←{" "}
              <span style={{ color: "var(--color-ink)" }}>{prev.title}</span>
            </Link>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {next && (
            <Link
              href={`/loop/${chapterSlug(next.slug)}`}
              style={{ color: "var(--color-ink-dim)", textDecoration: "none" }}
            >
              <span style={{ color: "var(--color-ink)" }}>{next.title}</span> →
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
