/**
 * Jekyll → MDX migration. One-shot port from ../jacobfv.github.io.
 *
 * Reads:
 *   _posts/YYYY-MM-DD-slug.md       → content/posts/<slug>.mdx
 *   _projects/<slug>.md              → content/projects/<slug>.mdx
 *   _bio/<slug>.md                   → content/visions/<slug>.mdx
 *   _bibliography/{papers,references}.bib
 *                                    → content/papers/refs.bib (concatenated)
 *   assets/img/<file>                → public/img/migrated/<file>
 *
 * Does NOT touch content/papers/*.mdx (hand-authored), content/experience/,
 * or content/now/. Does NOT fill influences/realizes/critiques — that's
 * hand work, per docs/CONTENT_MODEL.md.
 *
 * Run with `pnpm migrate`. Output is committed; the script is kept for
 * re-runs but is not part of CI.
 */

import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
  stat,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

type Lane = "research" | "building" | "writing" | "personal";

const OLD = path.resolve(process.cwd(), "../jacobfv.github.io");
const NEW = process.cwd();
const IMG_SRC = path.join(OLD, "assets/img");
const IMG_DST = path.join(NEW, "public/img/migrated");
const PAPERS_DST = path.join(NEW, "content/papers");

const POSTS_DST = path.join(NEW, "content/posts");
const PROJECTS_DST = path.join(NEW, "content/projects");
const VISIONS_DST = path.join(NEW, "content/visions");

let warnings = 0;
let writtenPosts = 0;
let writtenProjects = 0;
let writtenVisions = 0;
let copiedImages = 0;
const referencedImages = new Set<string>();

// Slugs are URLs and node ids. Across folders they must be unique. The
// migrator processes projects first, then posts, then visions — when a
// later collection wants a slug that's already taken, the kind suffix is
// appended (e.g. `computatrum-post`).
const takenSlugs = new Set<string>();

async function seedTakenFromHandAuthored() {
  // content/papers and content/experience are never written by this script;
  // their hand-authored Phase 1 slugs are reserved.
  const dirs = [
    path.join(NEW, "content/papers"),
    path.join(NEW, "content/experience"),
  ];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of await readdir(d)) {
      if (f.endsWith(".mdx")) takenSlugs.add(f.replace(/\.mdx$/, ""));
    }
  }
}

function reserveSlug(base: string, kind: string): string {
  let slug = base;
  if (takenSlugs.has(slug)) slug = `${base}-${kind}`;
  // If even the disambiguated form collides, append a numeric suffix.
  let n = 2;
  while (takenSlugs.has(slug)) slug = `${base}-${kind}-${n++}`;
  takenSlugs.add(slug);
  return slug;
}

// ---------- text helpers ----------

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const stripHtmlTags = (s: string) =>
  s
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isoDate = (d: unknown, fallback = "2020-01-01"): string => {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(d);
    if (m) return m[1];
    const parsed = new Date(d);
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString().slice(0, 10);
  }
  return fallback;
};

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string")
    return v
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

// MDX parses every `{` as a JSX expression. Migrated bodies frequently
// contain literal braces (LaTeX math, code-shaped prose). Escape them as
// HTML entities, but only outside fenced code blocks — readers expect
// braces to render verbatim inside code.
function escapeBracesOutsideCode(text: string): string {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      // Walk character-by-character so inline code spans (`...`) are
      // preserved unescaped.
      let out = "";
      let i = 0;
      while (i < line.length) {
        const ch = line[i];
        if (ch === "`") {
          const end = line.indexOf("`", i + 1);
          if (end > i) {
            out += line.slice(i, end + 1);
            i = end + 1;
            continue;
          }
        }
        if (ch === "{") out += "&#123;";
        else if (ch === "}") out += "&#125;";
        else out += ch;
        i++;
      }
      return out;
    })
    .join("\n");
}

// MDX is strict about JSX-looking constructs. These rewrites make Jekyll
// markdown safe for an mdx parser. Order matters — Liquid first, then HTML
// cleanups, then bare-`<` escapes.
function jekyllToMdx(input: string): string {
  let s = input;

  // Strip jekyll meta-refresh stubs that some _projects/*.md inject.
  s = s.replace(/<meta\s+http-equiv=["']refresh["'][^>]*\/?>/gi, "");

  // {% cite key1 key2 %}  →  [cite: key1 key2]
  s = s.replace(/\{%\s*cite\s+([^%]+?)\s*%\}/g, (_m, k) => `[cite: ${k.trim()}]`);

  // {% bibliography ... %}  →  drop (Phase 8 renders the bib inline).
  s = s.replace(/\{%\s*bibliography[^%]*%\}/g, "");

  // {% pdf URL %}  →  [PDF](URL)
  s = s.replace(/\{%\s*pdf\s+(\S+)\s*%\}/g, (_m, url) => `[PDF](${url})`);

  // {% link _posts/2021-01-01-foo.md %}  →  /foo
  s = s.replace(/\{%\s*link\s+(\S+?)\s*%\}/g, (_m, p) => {
    const base = path.basename(p).replace(/\.[a-z]+$/, "");
    const stripped = base.replace(/^\d{4}-\d{1,2}-\d{1,2}-/, "");
    return `/${slugify(stripped)}`;
  });

  // {% quote handle %} ... {% endquote %}  →  blockquote
  s = s.replace(
    /\{%\s*quote\s+\S+\s*%\}([\s\S]*?)\{%\s*endquote\s*%\}/g,
    (_m, body) =>
      "\n" +
      String(body)
        .trim()
        .split(/\r?\n/)
        .map((line) => `> ${line}`)
        .join("\n") +
      "\n",
  );

  // Any remaining {% ... %} or {{ ... }} liquid → drop.
  s = s.replace(/\{%[\s\S]*?%\}/g, "");
  s = s.replace(/\{\{[\s\S]*?\}\}/g, "");

  // kramdown {:.class} attribute lists — MDX would parse these as JSX
  // expressions and fail.
  s = s.replace(/\{:[^}\n]*\}/g, "");

  // Convert raw HTML lists to markdown. JSX requires strict tag nesting,
  // and several migrated files contain unbalanced `<li>`/`<ul>` (the
  // browser is forgiving, MDX is not). Markdown lists render the same and
  // sidestep the parser entirely.
  s = s.replace(/<\/?[uo]l\b[^>]*>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ");
  s = s.replace(/<\/li>/gi, "");

  // Self-close every HTML void element so MDX parses them as JSX.
  const voidTags =
    "img|source|input|br|hr|meta|link|area|base|col|embed|param|track|wbr";
  s = s.replace(
    new RegExp(`<(${voidTags})\\b([^>]*?)(?<!/)>`, "gi"),
    (_m, name, attrs) => `<${name}${attrs}/>`,
  );

  // Convert TeX-style math delimiters to dollar form so remark-math picks
  // them up: `\(x\)` → `$x$`, `\[x\]` → `$$x$$`.
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, body) => `$${body}$`);
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, body) => `$$${body}$$`);

  // Drop FontAwesome icon stubs — they reference CSS we don't ship.
  s = s.replace(/<i\b[^>]*><\/i>/gi, "");

  // JSX requires `style` to be an object literal. Migrated HTML carries
  // CSS strings (`style="color: red"`) that React rejects. Strip the
  // attribute entirely; presentation isn't load-bearing in migration.
  s = s.replace(/\s+style="[^"]*"/gi, "");
  // Same with `class=` — JSX expects `className`. Convert.
  s = s.replace(/(<[A-Za-z][\w-]*\b[^>]*?)\sclass=/gi, "$1 className=");

  // Image path rewrites: /assets/img/foo.jpg → /img/migrated/foo.jpg
  s = s.replace(
    /(\(|"|'|=)(\s*)\/?assets\/img\/([^)\s"']+)/g,
    (_m, lead, ws, file) => {
      referencedImages.add(file);
      return `${lead}${ws}/img/migrated/${file}`;
    },
  );

  // Markdown image syntax with bare path.
  s = s.replace(/!\[([^\]]*)\]\(\/?assets\/img\/([^)\s]+)\)/g, (_m, alt, f) => {
    referencedImages.add(f);
    return `![${alt}](/img/migrated/${f})`;
  });

  // Escape stray `<` that MDX would parse as the start of a JSX tag.
  // Allow letters, `/`, `!`, and `?` after `<` to keep real HTML/JSX/comments.
  s = s.replace(/<(?![a-zA-Z!/?])/g, "&lt;");

  // Quote bare HTML attribute values: `<img width=50%/>` → `<img width="50%"/>`.
  // JSX/MDX rejects unquoted attribute values. The value pattern stops at
  // `/` so we don't eat the self-closing slash.
  s = s.replace(
    /(<[A-Za-z][\w-]*\b[^>]*?\s)([\w-]+)=([^\s"'>{/][^\s>/]*)/g,
    (_m, lead, name, value) => `${lead}${name}="${value.replace(/"/g, "&quot;")}"`,
  );

  // Now escape every literal `{` and `}` outside fenced code so the MDX
  // parser doesn't try to read them as expressions.
  s = escapeBracesOutsideCode(s);

  // Convert HTML comments to MDX comments. (MDX 3 disallows `<!-- -->`.)
  // Run after brace-escaping so the `{/* */}` we emit isn't itself escaped.
  s = s.replace(/<!--([\s\S]*?)-->/g, (_m, body) => `{/*${body}*/}`);

  return s;
}

// ---------- summary fallback ----------

function deriveSummary(body: string, fallbackTitle: string): string {
  const cleaned = body
    .replace(/^#+\s.*$/gm, "")
    .replace(/^>\s.*$/gm, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return `${fallbackTitle} — migrated from the previous site.`;
  const trimmed =
    cleaned.length > 280 ? cleaned.slice(0, 277).trimEnd() + "…" : cleaned;
  return trimmed;
}

// ---------- lane heuristics ----------

function laneForPost(categories: string[], tags: string[]): Lane {
  const all = [...categories, ...tags].map((s) => s.toLowerCase());
  if (
    all.some((x) =>
      ["tutorial", "code", "engineering", "infrastructure"].includes(x),
    )
  )
    return "building";
  if (all.some((x) => ["theory", "math", "experiment"].includes(x)))
    return "research";
  if (all.some((x) => ["ai", "ml", "agi", "rl"].includes(x))) return "research";
  if (all.some((x) => ["notes"].includes(x))) return "research";
  if (
    all.some((x) =>
      ["reflection", "idea", "ideas", "art", "music", "philosophy"].includes(x),
    )
  )
    return "writing";
  return "writing";
}

// ---------- frontmatter writer ----------

type Frontmatter = Record<string, unknown>;

function yamlScalar(v: string): string {
  if (v === "") return '""';
  if (/^[\w\-./:@]+$/.test(v) && !/^[-?:|>!&*%@`]/.test(v)) return v;
  return JSON.stringify(v);
}

function yamlValue(v: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return yamlScalar(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.every((x) => typeof x === "string"))
      return "[" + v.map((x) => yamlScalar(String(x))).join(", ") + "]";
    return (
      "\n" + v.map((x) => `${pad}  - ${yamlValue(x, indent + 4)}`).join("\n")
    );
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val !== undefined && val !== null && val !== "",
    );
    if (entries.length === 0) return "{}";
    return (
      "\n" +
      entries
        .map(([k, val]) => `${pad}  ${k}: ${yamlValue(val, indent + 2)}`)
        .join("\n")
    );
  }
  return "null";
}

function emitFrontmatter(fm: Frontmatter): string {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v === "") continue;
    if (Array.isArray(v) && v.length === 0 && k !== "tags") continue;
    lines.push(`${k}: ${yamlValue(v, 0)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

// ---------- post migration ----------

async function migratePosts() {
  const dir = path.join(OLD, "_posts");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    try {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);

      const dateMatch = /^(\d{4}-\d{1,2}-\d{1,2})-(.+)\.md$/.exec(file);
      if (!dateMatch) {
        console.warn(`[posts] skipped ${file}: filename doesn't parse`);
        warnings++;
        continue;
      }
      const fileDate = dateMatch[1].replace(/-(\d)(?=-|$)/g, "-0$1");
      const slugRaw = dateMatch[2];
      const slug = reserveSlug(slugify(slugRaw), "post");

      const title = stripHtmlTags(String(data.title ?? slugRaw)) || slugRaw;
      const date = isoDate(data.date, fileDate);
      const categories = toArray(data.categories);
      const tagsList = Array.from(
        new Set(
          [...categories, ...toArray(data.tags)]
            .map((t) => t.toLowerCase())
            .filter((t) => t && t !== "ai"),
        ),
      ).slice(0, 8);
      const lane = laneForPost(categories, toArray(data.tags));

      const body = jekyllToMdx(content).trim();
      const description = String(data.description ?? "").trim();
      const summary = description || deriveSummary(body, title);

      const fm: Frontmatter = {
        title,
        date,
        lane,
        tags: tagsList,
        summary: summary.slice(0, 380),
        influences: [],
        realizes: [],
        critiques: [],
      };

      const out = emitFrontmatter(fm) + body + "\n";
      const dst = path.join(POSTS_DST, `${slug}.mdx`);
      await writeFile(dst, out, "utf8");
      writtenPosts++;
    } catch (err) {
      console.error(`[posts] ${file} failed:`, err);
      warnings++;
    }
  }
}

// ---------- project migration ----------

// Some _projects/*.md duplicate keys inside frontmatter (e.g. two
// `bullet_points:` blocks). gray-matter rejects those — collapse duplicates
// to the *last* occurrence before parsing.
function dedupeFrontmatterKeys(raw: string): string {
  const m = /^---\s*\n([\s\S]*?)\n---/m.exec(raw);
  if (!m) return raw;
  const fmText = m[1];
  const lines = fmText.split(/\r?\n/);
  const seen = new Map<string, number>(); // top-level key → last line index
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const km = /^([A-Za-z_][\w-]*)\s*:/.exec(line);
    if (km) seen.set(km[1], i);
  }
  // Walk again; keep only the line owning the last occurrence and any line
  // that belongs to the *kept* key's block (indented continuation).
  const keep = new Array(lines.length).fill(false);
  let activeKey: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const km = /^([A-Za-z_][\w-]*)\s*:/.exec(line);
    if (km) {
      activeKey = km[1];
      keep[i] = seen.get(activeKey) === i;
    } else {
      // continuation of the most recent top-level key block
      keep[i] = activeKey !== null && seen.get(activeKey) !== undefined &&
        // the active key block is the one starting at seen.get(activeKey);
        // continuation is owned by it only if we're past that line and
        // still inside the indented region.
        (() => {
          const start = seen.get(activeKey!) ?? -1;
          return i > start;
        })();
    }
  }
  // Above logic over-keeps continuation lines that belong to dropped blocks.
  // Re-walk with explicit block tracking.
  const finalKeep: boolean[] = new Array(lines.length).fill(false);
  let droppingBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const km = /^([A-Za-z_][\w-]*)\s*:/.exec(line);
    if (km) {
      const key = km[1];
      const isLast = seen.get(key) === i;
      droppingBlock = !isLast;
      finalKeep[i] = isLast;
    } else {
      finalKeep[i] = !droppingBlock;
    }
  }
  const newFm = lines.filter((_, i) => finalKeep[i]).join("\n");
  return raw.replace(/^---\s*\n[\s\S]*?\n---/m, `---\n${newFm}\n---`);
}

async function migrateProjects() {
  const dir = path.join(OLD, "_projects");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    try {
      const rawIn = await readFile(path.join(dir, file), "utf8");
      const raw = dedupeFrontmatterKeys(rawIn);
      const { data, content } = matter(raw);
      const baseSlug = slugify(file.replace(/\.md$/, ""));
      const slug = reserveSlug(baseSlug, "project");

      const title = stripHtmlTags(String(data.title ?? baseSlug)) || baseSlug;
      const startDate = isoDate(data.start ?? data.date);
      const endValue = data.end;
      const endDate =
        endValue !== undefined && endValue !== null && String(endValue) !== ""
          ? isoDate(endValue, undefined)
          : undefined;

      const status: "active" | "shipped" =
        endDate && endDate < new Date().toISOString().slice(0, 10)
          ? "shipped"
          : data.under_construction
          ? "active"
          : endDate
          ? "shipped"
          : "active";

      const cats = toArray(data.category).map((c) => c.toLowerCase());
      const tagsList = Array.from(
        new Set(cats.filter((t) => t && t !== "ai")),
      ).slice(0, 8);

      const links: Record<string, string> = {};
      const githubVal = String(data.github ?? "").trim();
      if (githubVal) {
        const ghUrl = /^https?:/.test(githubVal)
          ? githubVal
          : `https://github.com/${githubVal}`;
        links.github = ghUrl;
      }
      const redirectVal = String(data.redirect ?? "").trim();
      if (redirectVal && redirectVal !== links.github) {
        links.demo = redirectVal;
      }

      // Body assembly: bullet_points list (if any) + remaining content.
      const bulletsRaw = String(data.bullet_points ?? "").trim();
      const bullets = bulletsRaw ? bulletsRaw + "\n\n" : "";
      const body = jekyllToMdx(bullets + content).trim();

      const description = String(data.description ?? "").trim();
      const summary =
        description ||
        bullets.split("\n")[0]?.replace(/^[-*]\s*/, "") ||
        deriveSummary(body, title);

      const heroFromImg = (() => {
        const img = String(data.img ?? "").trim();
        if (!img) return undefined;
        if (/^https?:/.test(img)) return { src: img, alt: title };
        const m = /\/?assets\/img\/(.+)$/.exec(img);
        if (m) {
          referencedImages.add(m[1]);
          return { src: `/img/migrated/${m[1]}`, alt: title };
        }
        return undefined;
      })();

      const fm: Frontmatter = {
        title,
        date: startDate,
        endDate,
        lane: "building" as Lane,
        status,
        tags: tagsList,
        summary: summary.slice(0, 380),
        hero: heroFromImg,
        links: Object.keys(links).length ? links : undefined,
        influences: [],
        realizes: [],
        critiques: [],
      };

      const out =
        emitFrontmatter(fm) +
        (body ||
          (links.demo || links.github
            ? `Lives at ${links.demo ?? links.github}.\n`
            : `Migrated stub. Original page had no body.\n`)) +
        "\n";

      const dst = path.join(PROJECTS_DST, `${slug}.mdx`);
      await writeFile(dst, out, "utf8");
      writtenProjects++;
    } catch (err) {
      console.error(`[projects] ${file} failed:`, err);
      warnings++;
    }
  }
}

// ---------- vision (bio) migration ----------

async function migrateVisions() {
  const dir = path.join(OLD, "_bio");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    try {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const baseSlug = slugify(file.replace(/\.md$/, ""));
      const slug = reserveSlug(baseSlug, "vision");

      const topic = String(data.topic ?? "").trim();
      const title =
        stripHtmlTags(topic) ||
        baseSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      // Bio files have no date frontmatter; use file mtime.
      const st = await stat(path.join(dir, file));
      const date = st.mtime.toISOString().slice(0, 10);

      const body = jekyllToMdx(content).trim();
      const summary = deriveSummary(body, title);

      const sceneId = slug === "focus-statement" ? "focus-statement" : undefined;
      const hero =
        slug === "focus-statement"
          ? { src: "/img/migrated/focus-statement.png", alt: title }
          : undefined;
      if (slug === "focus-statement") referencedImages.add("focus-statement.png");

      const fm: Frontmatter = {
        title,
        date,
        lane: "personal" as Lane,
        tags: ["bio"],
        summary: summary.slice(0, 380),
        sceneId,
        hero,
        influences: [],
        realizes: [],
        critiques: [],
      };

      const out = emitFrontmatter(fm) + body + "\n";
      const dst = path.join(VISIONS_DST, `${slug}.mdx`);
      await writeFile(dst, out, "utf8");
      writtenVisions++;
    } catch (err) {
      console.error(`[visions] ${file} failed:`, err);
      warnings++;
    }
  }
}

// ---------- bibliography ----------

async function copyBibliography() {
  const srcs = [
    path.join(OLD, "_bibliography/papers.bib"),
    path.join(OLD, "_bibliography/references.bib"),
  ];
  const parts: string[] = [
    "% Concatenated from ../jacobfv.github.io/_bibliography/.",
    "% Source of citation data for content/papers/*.mdx (Phase 8).",
    "",
  ];
  for (const src of srcs) {
    if (existsSync(src)) {
      const txt = await readFile(src, "utf8");
      // Strip jekyll's leading frontmatter `---\n---\n` if present.
      const cleaned = txt.replace(/^---\s*\n---\s*\n?/m, "");
      parts.push(`% --- from ${path.basename(src)} ---`, cleaned, "");
    }
  }
  await writeFile(path.join(PAPERS_DST, "refs.bib"), parts.join("\n"), "utf8");
}

// ---------- images ----------

async function copyImages() {
  // Copy every image referenced by a migrated body/hero.
  if (!existsSync(IMG_SRC)) return;
  const all = await readdir(IMG_SRC);
  const present = new Set(all);
  for (const file of referencedImages) {
    // Allow subpaths like `posts/foo.png`.
    const segments = file.split("/");
    if (segments.length === 1 && present.has(file)) {
      await copyFile(
        path.join(IMG_SRC, file),
        path.join(IMG_DST, file),
      );
      copiedImages++;
      continue;
    }
    const direct = path.join(IMG_SRC, file);
    if (existsSync(direct)) {
      await mkdir(path.dirname(path.join(IMG_DST, file)), { recursive: true });
      await copyFile(direct, path.join(IMG_DST, file));
      copiedImages++;
      continue;
    }
    // Some bio assets sit alongside the .md file.
    const bioPath = path.join(OLD, "_bio", file);
    if (existsSync(bioPath)) {
      await copyFile(bioPath, path.join(IMG_DST, file));
      copiedImages++;
      continue;
    }
    console.warn(`[img] missing: ${file}`);
    warnings++;
  }
}

// ---------- main ----------

async function ensureDirs() {
  for (const d of [POSTS_DST, PROJECTS_DST, VISIONS_DST, IMG_DST, PAPERS_DST]) {
    await mkdir(d, { recursive: true });
  }
}

// Files in the migrated folders that did NOT come from the old site.
// Preserved across re-runs.
const PRESERVE_PHASE1: Record<string, Set<string>> = {
  [POSTS_DST]: new Set(["why-i-rebuilt-the-site.mdx"]),
  [PROJECTS_DST]: new Set(["jacobfv-site.mdx"]),
  [VISIONS_DST]: new Set([
    "vision-navigable-mind.mdx",
    "where-i-see-myself-in-5-years.mdx",
  ]),
};

async function clearMigratedOutputs() {
  // Re-runs must not leave stale files behind. Drop everything in
  // posts/, projects/, visions/ that the script is responsible for, then
  // re-emit. Phase 1 net-new files survive via the preserve list.
  const { rm } = await import("node:fs/promises");
  for (const [dir, keep] of Object.entries(PRESERVE_PHASE1)) {
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (!f.endsWith(".mdx")) continue;
      if (keep.has(f)) continue;
      await rm(path.join(dir, f));
    }
  }
}

async function main() {
  console.log("[migrate] reading from", OLD);
  await ensureDirs();
  await clearMigratedOutputs();
  await seedTakenFromHandAuthored();
  // The preserved Phase 1 slugs are also reserved.
  for (const [, keep] of Object.entries(PRESERVE_PHASE1)) {
    for (const f of keep) takenSlugs.add(f.replace(/\.mdx$/, ""));
  }
  // Order matters for slug priority: projects own their canonical name,
  // posts and visions append their kind suffix on collision.
  await migrateProjects();
  await migratePosts();
  await migrateVisions();
  await copyBibliography();
  await copyImages();
  console.log(
    `[migrate] done — ${writtenPosts} posts, ${writtenProjects} projects, ${writtenVisions} visions, ${copiedImages} images, ${warnings} warnings.`,
  );
  if (warnings > 0) process.exitCode = 0; // non-fatal; review the log.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
