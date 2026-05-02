# Content model

What every node looks like and how to write one.

## Node kinds

| Kind | Source folder | Example |
|---|---|---|
| `post` | `content/posts/` | A dated essay or note |
| `project` | `content/projects/` | A built thing — code, hardware, paper-grade research |
| `paper` | `content/papers/` | Academic-style writeups; cites the bib |
| `vision` | `content/visions/` | Bio-level statements: focus, 5-year outlook, "what makes AI interesting" |
| `experience` | `content/experience/` | A role, residency, education entry |

Slugs are filenames minus extension. Treat them as permanent — they're the URL and the graph id.

## Frontmatter

Every MDX file starts with frontmatter. Required fields per kind:

### post

```yaml
---
title: Reaching for the intangible
date: 2021-09-12
lane: writing            # research | building | writing | personal
tags: [philosophy, AI]
summary: One or two sentences, shown in graph hover and cards.
hero: { src: /img/posts/intangible.jpg, alt: "..." }
influences: [the-api, the-node-neural-network]
realizes: []
critiques: []
---
```

### project

```yaml
---
title: Computatrum
date: 2021-10-19          # start date
endDate: 2022-06-01       # optional, for completed projects
lane: building
status: shipped           # idea | active | shipped | shelved
tags: [agents, infra]
summary: ...
hero: { src: /img/projects/computatrum.png, alt: "..." }
links:
  github: https://github.com/...
  demo: https://...
influences: [full-stack-artificial-intelligence]
realizes: [vision-agent-os]
---
```

### paper

```yaml
---
title: ...
date: 2024-03-01
lane: research
tags: [...]
summary: ...
authors: [Jacob Valdez, ...]
venue: arXiv
bibKey: valdez2024foo     # matches an entry in content/papers/refs.bib
pdf: /papers/foo.pdf
influences: [...]
---
```

### vision

```yaml
---
title: Where I see myself in 5 years
date: 2025-01-01          # date written; revise the date when you revise the doc
lane: personal
tags: [vision]
summary: ...
hero: { src: /img/visions/focus.png, alt: "..." }
sceneId: focus-statement  # which r3f scene to mount; null = plain MDX
realizes: []
---
```

### experience

```yaml
---
title: API/Integration Architect
org: AGI, Inc.
date: 2024-01-01
endDate: 2024-12-01       # omit for current
lane: building
tags: [agents, mobile]
summary: One-sentence role description.
links:
  org: https://agi.app
---
```

## Edges file

`src/data/edges.ts` adds relationships that don't fit naturally inside any single node's frontmatter — usually retroactive observations.

```ts
import type { Edge } from "@/lib/graph";

export const manualEdges: Edge[] = [
  {
    source: "self-organized-criticality",
    target: "the-fertile-crescent",
    kind: "influence",
    weight: 0.8,
    note: "SOC framing reappears as the dynamics layer.",
  },
  // ...
];
```

Rules:

- Source and target must be valid node ids. Build fails otherwise.
- Don't duplicate frontmatter relationships here.
- Add `note` whenever the edge isn't self-explanatory — it shows on hover.

## Now dock

`content/now/index.mdx` — a single file, kept fresh weekly:

```yaml
---
updated: 2026-05-01
building: VibeStartup
reading: A Beautiful Loop ch. 4
---

What's alive this week. Two or three sentences max.
```

## Lanes

Lanes are the timeline's horizontal swimlanes. Pick exactly one per node:

- `research` — papers, theory, deep notes
- `building` — projects, products, infra, hardware
- `writing` — posts, essays, the book
- `personal` — visions, life, experience entries

Don't add new lanes without a design discussion — they shape the timeline.

## Status (projects only)

- `idea` — written down, not started
- `active` — currently working on
- `shipped` — released, in use
- `shelved` — paused or abandoned, kept for the record

Visualized as the project node's color/opacity in both views.

## Migration from Jekyll

`scripts/migrate-jekyll.ts` reads `../jacobfv.github.io/_posts/`, `_projects/`, `_bio/`, etc., and emits MDX into `content/`. It:

1. Maps Jekyll frontmatter → the schemas above.
2. Slugifies `_bio` essays into `content/visions/`.
3. Rewrites internal links from Jekyll's `{% link %}` to MDX-relative.
4. Copies referenced images into `public/img/migrated/`.
5. Leaves `influences/realizes/critiques` empty — those are filled by hand afterward.

Run once, commit the output, then iterate manually.

## Authoring rules

- Every new node gets at least one `influences` entry. Empty influence lists are a red flag.
- `summary` is required; if you can't write one, the node isn't ready.
- Hero images are optional but heavily preferred — the graph cards look thin without them.
