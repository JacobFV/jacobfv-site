import Link from "next/link";
import now from "../../../.velite/now.json";
import { MDXContent } from "@/lib/mdx";

export const metadata = {
  title: "Now · Jacob Valdez",
  description: "What's alive this week.",
};

export default function NowPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-mute)]"
      >
        ← home
      </Link>

      <header className="mb-8 mt-8">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-ink-mute)]">
          now · updated {now.updated}
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--color-ink)]"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          What&rsquo;s alive
        </h1>
      </header>

      <dl className="mb-10 grid grid-cols-[88px_1fr] gap-y-3 font-[family-name:var(--font-mono)] text-sm">
        <dt className="text-[var(--color-ink-mute)]">building</dt>
        <dd className="text-[var(--color-ink)]">{now.building}</dd>
        {now.reading && (
          <>
            <dt className="text-[var(--color-ink-mute)]">reading</dt>
            <dd className="text-[var(--color-ink)]">{now.reading}</dd>
          </>
        )}
      </dl>

      <div className="prose-mdx">
        <MDXContent code={now.body} />
      </div>
    </main>
  );
}
