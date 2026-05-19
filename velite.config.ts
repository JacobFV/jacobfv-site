import { defineConfig, defineCollection, s } from "velite";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// Shared shape for graph nodes. Frontmatter validation. See docs/CONTENT_MODEL.md.
const lane = s.enum(["research", "building", "writing", "personal"]);
const edgeKind = s.enum(["influence", "realization", "critique", "collaboration"]);

const baseFields = {
  title: s.string().max(140),
  date: s.isodate(),
  endDate: s.isodate().optional(),
  lane,
  tags: s.array(s.string()).default([]),
  summary: s.string().max(400),
  hero: s.object({ src: s.string(), alt: s.string() }).optional(),
  influences: s.array(s.string()).default([]),
  realizes: s.array(s.string()).default([]),
  critiques: s.array(s.string()).default([]),
  // copyLinkedFiles=false: bare-path markdown links like
  // `[txt](Owner/Repo)` are common in migrated content; without this,
  // Velite tries to resolve them as filesystem assets and fails.
  // remark-math: lets `$...$` and `$$...$$` survive MDX brace/angle
  // parsing so LaTeX inside posts doesn't crash the build.
  body: s.mdx({
    copyLinkedFiles: false,
    remarkPlugins: [remarkGfm, remarkMath],
  }),
};

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s
    .object({ ...baseFields, slug: s.path() })
    .transform((d) => ({ ...d, kind: "post" as const })),
});

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.mdx",
  schema: s
    .object({
      ...baseFields,
      slug: s.path(),
      status: s.enum(["idea", "active", "shipped", "shelved"]).default("active"),
      links: s
        .object({
          github: s.string().optional(),
          demo: s.string().optional(),
          paper: s.string().optional(),
        })
        .optional(),
    })
    .transform((d) => ({ ...d, kind: "project" as const })),
});

const papers = defineCollection({
  name: "Paper",
  pattern: "papers/**/*.mdx",
  schema: s
    .object({
      ...baseFields,
      slug: s.path(),
      authors: s.array(s.string()),
      venue: s.string().optional(),
      bibKey: s.string().optional(),
      pdf: s.string().optional(),
    })
    .transform((d) => ({ ...d, kind: "paper" as const })),
});

const readings = defineCollection({
  name: "Reading",
  pattern: "readings/**/*.mdx",
  schema: s
    .object({
      ...baseFields,
      slug: s.path(),
      authors: s.array(s.string()).default([]),
      workType: s.enum(["book", "paper", "article", "course", "other"]).default("book"),
      status: s.enum(["queued", "reading", "finished", "paused", "reference"]).default("reading"),
      source: s.string().optional(),
      url: s.string().optional(),
    })
    .transform((d) => ({ ...d, kind: "reading" as const })),
});

const visions = defineCollection({
  name: "Vision",
  pattern: "visions/**/*.mdx",
  schema: s
    .object({
      ...baseFields,
      slug: s.path(),
      sceneId: s.string().optional(),
    })
    .transform((d) => ({ ...d, kind: "vision" as const })),
});

const experience = defineCollection({
  name: "Experience",
  pattern: "experience/**/*.mdx",
  schema: s
    .object({
      ...baseFields,
      slug: s.path(),
      org: s.string(),
      links: s.object({ org: s.string().optional() }).optional(),
    })
    .transform((d) => ({ ...d, kind: "experience" as const })),
});

const loop = defineCollection({
  name: "LoopChapter",
  pattern: "loop/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(140),
      order: s.number().int(),
      summary: s.string().max(400),
      slug: s.path(),
      body: s.mdx({
        copyLinkedFiles: false,
        remarkPlugins: [remarkGfm, remarkMath],
      }),
    })
    .transform((d) => ({ ...d, kind: "loop" as const })),
});

const now = defineCollection({
  name: "Now",
  pattern: "now/index.mdx",
  single: true,
  schema: s.object({
    updated: s.isodate(),
    building: s.string(),
    reading: s.string().optional(),
    body: s.mdx({
      copyLinkedFiles: false,
      remarkPlugins: [remarkGfm, remarkMath],
    }),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, projects, papers, readings, visions, experience, loop, now },
});

// Type for hand-curated edges, used in src/data/edges.ts.
export type ManualEdge = {
  source: string;
  target: string;
  kind: "influence" | "realization" | "critique" | "collaboration";
  weight?: number;
  note?: string;
};
