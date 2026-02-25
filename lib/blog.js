import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

const CATEGORY_LABELS = {
  explainer: "Explainer",
  take: "Take",
  bracket: "Bracket",
  build: "Behind the Build",
};

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function normalizeMeta(data, filename) {
  const fileSlug = filename.replace(/\.mdx?$/i, "");
  return {
    title: String(data.title || fileSlug),
    slug: String(data.slug || fileSlug),
    date: String(data.date || "1970-01-01"),
    category: String(data.category || "build"),
    excerpt: String(data.excerpt || ""),
    readTime: Number(data.readTime || 1),
    relatedTool: data.relatedTool ?? null,
    ctaText: data.ctaText ?? null,
    ctaHref: data.ctaHref ?? null,
  };
}

function parsePostFile(filename) {
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  const meta = normalizeMeta(data, filename);
  return { meta, content, raw };
}

export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  return files
    .map((filename) => parsePostFile(filename).meta)
    .sort((a, b) => safeDate(b.date) - safeDate(a.date));
}

export function getPostBySlug(slug) {
  if (!fs.existsSync(BLOG_DIR)) return null;
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const filename of files) {
    const parsed = parsePostFile(filename);
    const fileSlug = filename.replace(/\.mdx?$/i, "");
    if (parsed.meta.slug === slug || fileSlug === slug) {
      return { meta: parsed.meta, content: parsed.content };
    }
  }
  return null;
}

export function getRecentPosts(limit = 3) {
  return getAllPosts().slice(0, limit);
}

export function formatPostDate(dateInput) {
  return safeDate(dateInput).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "Article";
}
