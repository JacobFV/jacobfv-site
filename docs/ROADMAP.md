# Roadmap

Phased plan from empty repo to cutover. Don't skip phases.

## Phase 0 — Skeleton (this commit)

Already done: directory layout, docs, configs, package manifest. No code yet.

## Phase 1 — Walking skeleton (1–2 days)

Goal: a Next app that boots, reads MDX from `content/`, and renders a placeholder list of nodes at `/`. No graph, no animation. Proves the content pipeline.

Deliverables:

- `pnpm dev` starts the app.
- Velite reads frontmatter and produces typed JSON.
- `/` renders `<ul>` of titles linking to `/[slug]`.
- `/[slug]` renders MDX body with default styles.
- `pnpm build` produces a static export.
- Three sample MDX files committed in each content folder so the layout has things to render.

Definition of done: ship to a Vercel preview URL.

## Phase 2 — Migration (1 day)

Goal: pull all content from `../jacobfv.github.io` into `content/` so subsequent phases have real material.

Deliverables:

- `scripts/migrate-jekyll.ts` runnable via `pnpm migrate`.
- Reads from `../jacobfv.github.io/_posts/`, `_projects/`, `_bio/`, `_pages/`, `_bibliography/`.
- Maps Jekyll frontmatter → CONTENT_MODEL.md schema.
- Copies images to `public/img/migrated/`.
- Rewrites internal links.
- Does NOT fill `influences`/`realizes`/`critiques` — those are hand-curated later.
- Output committed; script kept for re-runs but not part of CI.

Definition of done: every existing post and project resolves at `/[slug]` after migration, even if visually plain.

## Phase 3 — Constellation (3–5 days)

Goal: the headline experience. The graph view at `/` with proper visual design.

Deliverables:

- `src/components/graph/Constellation.tsx` using React Flow + a custom force-layout pass (d3-force) computed once on mount.
- Custom node renderer: lane stripe, title, status dot.
- Edge renderer: solid/dashed/dotted by kind, opacity by weight.
- Hover dims non-neighbors.
- Click pins a popover card with summary + "open" affordance.
- Performance: 60fps with 150 nodes on a M1 Air.
- Cmd-K opens, searches, switches modes (placeholder for `/t`).

Definition of done: a stranger can land on `/`, find the project they want, and click into it within 10 seconds without instructions.

## Phase 4 — Document mode + transitions (2–3 days)

Goal: the magic — clicking a node animates *that card* into the document hero.

Deliverables:

- `app/[slug]/page.tsx` polymorphic by `node.kind`.
- Framer Motion shared `layoutId` between the graph card and the document hero.
- Graph slides to a sidebar minimap on document mount; back button reverses.
- Lineage widget at the top of every detail page.
- MDX components map: typography, images with lightbox, citations.
- Reduced-motion path: cross-fade only.

Definition of done: navigation between graph and any node feels physical, never blinks, works with browser back/forward.

## Phase 5 — Timeline (2 days)

Goal: `/t` projects the same graph onto a date axis with lanes.

Deliverables:

- `app/t/page.tsx` shares the graph layout with `/`.
- Mode switch interpolates node positions from force-layout to (date, lane).
- Year labels, lane bands, curved cross-lane influence arrows.
- Filters: by lane, by tag, by status.

Definition of done: scrubbing a year visibly highlights what was alive then; cross-references between years are immediately visible.

## Phase 6 — A Beautiful Loop (3–5 days)

Goal: `/loop` scrollytelling for the book draft.

Deliverables:

- Lenis smooth scroll.
- Custom MDX components: `<Scene>`, `<Figure>`, `<Sidetrack>`.
- Per-chapter MDX in `content/loop/`.
- Right-rail mini-constellation.
- Light-mode by default; dark toggle preserved.
- One real chapter ported from `../jacobfv.github.io/a-beautiful-loop/`.

Definition of done: the first chapter reads well on desktop and mobile; sidetracks open and close without scroll position loss.

## Phase 7 — 3D vision room (3–4 days)

Goal: the focus statement and 5-year vision rendered as an r3f scene.

Deliverables:

- `src/components/three/VisionRoom.tsx` with `<ScrollControls>`.
- Floating frosted-glass panels rendering MDX-to-texture for each essay section.
- Bezier camera path; ambient pad audio with mute toggle.
- WebGL fallback to plain MDX layout.
- One real vision (`focus-statement`) ported and presented.

Definition of done: a visitor leaves the room understanding what you're building and why, not just having seen a cool effect.

## Phase 8 — Polish (ongoing)

- Pagefind/Fuse search index built at build time.
- `now` dock pulled from `content/now/index.mdx`.
- Resume generated from experience nodes; PDF export.
- OG image generation per node via `next/og`.
- Lighthouse passes: 95+ across the board.
- Backfill `influences`/`realizes`/`critiques` for top 30 nodes by hand.

## Phase 9 — Cutover (1 day)

- Domain points to the new site.
- Old slugs 301 to new slugs (mapping in `next.config.mjs`).
- `../jacobfv.github.io` archived but not deleted.
- Announcement post about the new site, naturally added as the most recent node.

## What NOT to do

- Don't build a CMS.
- Don't add SSR for anything that can be static.
- Don't ship the 3D scene before phase 4. The transitions are the soul; 3D is the spice.
- Don't try to migrate edges automatically. The relationships are the human work.
