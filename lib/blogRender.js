import MarkdownIt from "markdown-it";
import { formatPostDate, getCategoryLabel } from "./blog.js";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderGlobalNav(active = "") {
  return `
<header class="og-nav" id="site-nav">
  <div class="og-nav-inner">
    <a class="brand-lockup" href="/" aria-label="Odds Gods">
      <img class="brand-logo" src="/logo-icon.png?v=20260225b" alt="Odds Gods" width="32" height="32" />
      <span class="og-wordmark"><span>ODDS</span> <strong>GODS</strong></span>
    </a>
    <nav class="og-links" id="nav-links">
      <a href="https://bracket.oddsgods.net/" class="nav-link${active === "bracket" ? " is-active" : ""}">The Bracket Lab <span class="beta-badge">BETA</span></a>
      <a href="https://wato.oddsgods.net/" class="nav-link${active === "odds" ? " is-active" : ""}">What Are the Odds? <span class="beta-badge">BETA</span></a>
      <a href="/blog" class="nav-link${active === "blog" ? " is-active" : ""}">Blog</a>
    </nav>
  </div>
</header>`;
}

function renderFooter() {
  return `
<footer class="og-footer">
  <div class="footer-brand">
    <img src="/logo-icon.png?v=20260225b" class="footer-logo-icon" alt="Odds Gods" />
    <p class="footer-wordmark"><span>ODDS</span> <strong>GODS</strong></p>
    <p class="footer-tool-links">
      <a href="https://bracket.oddsgods.net/">The Bracket Lab <span class="beta-badge">BETA</span></a>
      <span>&middot;</span>
      <a href="https://wato.oddsgods.net/">What Are the Odds? <span class="beta-badge">BETA</span></a>
      <span>&middot;</span>
      <a href="/blog">Blog</a>
    </p>
    <p class="footer-coming">More tools coming. These are the first two.</p>
  </div>
  <div>
    <p>&copy; 2026 Odds Gods</p>
    <p>For entertainment purposes only.</p>
    <p>Not financial or betting advice.</p>
  </div>
  <div class="footer-links">
    <a href="https://x.com" target="_blank" rel="noreferrer">X / Twitter</a>
  </div>
</footer>`;
}

function renderArticleCard(post) {
  return `
<a href="/blog/${encodeURIComponent(post.slug)}" class="article-card">
  <div class="article-card-meta">
    <span class="article-category-tag category-${escapeHtml(post.category)}">${escapeHtml(getCategoryLabel(post.category))}</span>
    <span class="article-read-time">${escapeHtml(post.readTime)} min</span>
  </div>
  <h2 class="article-card-title">${escapeHtml(post.title)}</h2>
  <p class="article-card-excerpt">${escapeHtml(post.excerpt)}</p>
  <div class="article-card-footer">
    <span class="article-date">${escapeHtml(formatPostDate(post.date))}</span>
    <span class="article-card-arrow">&rarr;</span>
  </div>
</a>`;
}

function wrapHtml({ title, description, active, content, ogTitle, ogDescription }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(ogTitle || title)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription || description)}" />
    <meta property="og:type" content="article" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/blog.css" />
  </head>
  <body>
    <div class="bg-glow" aria-hidden="true"></div>
    <canvas id="bg-stats" class="bg-canvas" aria-hidden="true"></canvas>
    <canvas id="bg-lightning" class="bg-canvas" aria-hidden="true"></canvas>
    <canvas id="bg-text" class="bg-canvas" aria-hidden="true"></canvas>
    ${renderGlobalNav(active)}
    ${content}
    ${renderFooter()}
    <script src="/blog.js"></script>
  </body>
</html>`;
}

export function renderBlogIndexPage(posts = []) {
  const cards = posts.map((post) => renderArticleCard(post)).join("\n");
  return wrapHtml({
    title: "Odds Gods | Blog",
    description: "From the Gods: the math behind the takes. Odds explained, arguments priced.",
    active: "blog",
    content: `
<main>
  <section class="blog-hero">
    <p class="blog-hero-eyebrow">FROM THE GODS</p>
    <h1 class="blog-hero-headline">The math behind the takes.</h1>
    <p class="blog-hero-sub">Odds explained. Arguments priced. No picks, no predictions.</p>
  </section>
  <section class="article-grid" aria-label="Blog articles">
    ${cards}
  </section>
</main>`,
  });
}

export function renderBlogPostPage(post) {
  const safeContent = String(post.content || "").replace(/className=/g, "class=");
  const htmlBody = md.render(safeContent);
  const hasCta = Boolean(post.meta.relatedTool && post.meta.ctaText && post.meta.ctaHref);
  return wrapHtml({
    title: `Odds Gods | ${post.meta.title}`,
    description: post.meta.excerpt,
    ogTitle: post.meta.title,
    ogDescription: post.meta.excerpt,
    active: "blog",
    content: `
<main>
  <article class="article-page">
    <header class="article-header">
      <div class="article-header-meta">
        <span class="article-category-tag category-${escapeHtml(post.meta.category)}">${escapeHtml(getCategoryLabel(post.meta.category))}</span>
        <span class="article-header-date-time">${escapeHtml(formatPostDate(post.meta.date))} &middot; ${escapeHtml(post.meta.readTime)} min read</span>
      </div>
      <h1 class="article-title">${escapeHtml(post.meta.title)}</h1>
      <div class="article-rule"></div>
    </header>

    <div class="article-body">
      ${htmlBody}
    </div>

    ${
      hasCta
        ? `<section class="article-cta">
      <p class="article-cta-eyebrow">TRY THE TOOL</p>
      <h2 class="article-cta-headline">${escapeHtml(post.meta.ctaText)}</h2>
      <a class="article-cta-btn" href="${escapeHtml(post.meta.ctaHref)}">${escapeHtml(post.meta.ctaText)} &rarr;</a>
    </section>`
        : ""
    }
  </article>
</main>`,
  });
}
