(function () {
  const path = window.location.pathname;
  const isBlogRoute = path === "/blog" || path === "/blog/" || path.startsWith("/blog/");
  const isAdminRoute = path === "/admin/blog" || path === "/admin/blog/";

  if (!isBlogRoute && !isAdminRoute) return;

  window.__OG_BLOG_ACTIVE = true;

  const SUPABASE_URL = window.OG_SUPABASE_URL || "https://etmawpdabjkagpazerqf.supabase.co";
  const SUPABASE_ANON_KEY =
    window.OG_SUPABASE_ANON_KEY || "sb_publishable_AW8cDxLzpxWxbw3g-KfQ9A_gKfjK31d";

  const supabaseFactory = window.supabase && typeof window.supabase.createClient === "function" ? window.supabase : null;
  const supabase = supabaseFactory ? supabaseFactory.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const state = {
    currentPostId: null,
    htmlView: false,
    authUser: null,
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const slugify = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderShell = () => {
    document.body.classList.add("blog-mode");

    const main = document.querySelector("main");
    if (!main) return;

    const navLinks = document.querySelector("#nav-links");
    if (navLinks && !navLinks.querySelector('[href="/blog"]')) {
      navLinks.insertAdjacentHTML(
        "beforeend",
        '<a href="/blog" class="nav-link" data-blog-link="true">Blog</a>'
      );
    }

    const footerLinks = document.querySelector(".footer-tool-links");
    if (footerLinks && !footerLinks.querySelector('[href="/blog"]')) {
      footerLinks.insertAdjacentHTML("beforeend", '<a href="/blog">Blog</a>');
    }

    main.innerHTML = '<div id="blog-root"></div>';
  };

  const ensureSupabase = () => {
    if (supabase) return true;
    const root = document.getElementById("blog-root");
    if (root) {
      root.innerHTML = `
        <section class="blog-fallback">
          <h1>Blog unavailable</h1>
          <p>Supabase client failed to load. Add <code>@supabase/supabase-js</code> browser bundle to <code>index.html</code>.</p>
        </section>
      `;
    }
    return false;
  };

  const getRoot = () => document.getElementById("blog-root");

  const renderNotFound = () => {
    const root = getRoot();
    if (!root) return;
    root.innerHTML = `
      <section class="blog-fallback">
        <h1>Article not found</h1>
        <p>The article you're looking for isn't published.</p>
        <a class="blog-fallback-link" href="/blog">← Back to all articles</a>
      </section>
    `;
  };

  const loadBlogPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, slug, title, subtitle, excerpt, cover_image_url, cover_image_alt, author, tags, published_at, featured")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  };

  const loadArticle = async (slug) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) return null;
    return data;
  };

  const renderFeaturedPost = (post) => {
    if (!post) {
      return "";
    }

    const safeTitle = escapeHtml(post.title || "Untitled");
    const safeSubtitle = escapeHtml(post.subtitle || "");
    const safeExcerpt = escapeHtml(post.excerpt || "");
    const safeCoverAlt = escapeHtml(post.cover_image_alt || post.title || "");
    const safeAuthor = escapeHtml(post.author || "Odds Gods");

    return `
      <a href="/blog/${encodeURIComponent(post.slug)}" class="blog-hero-link" data-blog-link="true">
        <div class="blog-hero-image-wrap">
          ${
            post.cover_image_url
              ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${safeCoverAlt}" class="blog-hero-image" />`
              : '<div class="blog-hero-image-placeholder"></div>'
          }
          <div class="blog-hero-image-overlay"></div>
        </div>
        <div class="blog-hero-content">
          ${
            Array.isArray(post.tags) && post.tags.length
              ? `<div class="blog-hero-tags">${post.tags
                  .map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`)
                  .join("")}</div>`
              : ""
          }
          <h1 class="blog-hero-title">${safeTitle}</h1>
          ${safeSubtitle ? `<p class="blog-hero-subtitle">${safeSubtitle}</p>` : ""}
          ${safeExcerpt ? `<p class="blog-hero-excerpt">${safeExcerpt}</p>` : ""}
          <div class="blog-hero-meta">
            <span class="blog-meta-author">${safeAuthor}</span>
            <span class="blog-meta-dot">·</span>
            <time class="blog-meta-date">${formatDate(post.published_at)}</time>
          </div>
        </div>
      </a>
    `;
  };

  const renderPostCard = (post) => {
    const safeTitle = escapeHtml(post.title || "Untitled");
    const safeExcerpt = escapeHtml(post.excerpt || "");
    const safeCoverAlt = escapeHtml(post.cover_image_alt || post.title || "");

    return `
      <a href="/blog/${encodeURIComponent(post.slug)}" class="blog-card" data-blog-link="true">
        <div class="blog-card-image-wrap">
          ${
            post.cover_image_url
              ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${safeCoverAlt}" class="blog-card-image" loading="lazy" />`
              : '<div class="blog-card-image-placeholder"></div>'
          }
        </div>
        <div class="blog-card-content">
          ${
            Array.isArray(post.tags) && post.tags.length
              ? `<div class="blog-card-tags">${post.tags
                  .slice(0, 2)
                  .map((tag) => `<span class="blog-tag blog-tag--sm">${escapeHtml(tag)}</span>`)
                  .join("")}</div>`
              : ""
          }
          <h2 class="blog-card-title">${safeTitle}</h2>
          ${safeExcerpt ? `<p class="blog-card-excerpt">${safeExcerpt}</p>` : ""}
          <div class="blog-card-meta"><time>${formatDate(post.published_at)}</time></div>
        </div>
      </a>
    `;
  };

  const renderBlogListing = async () => {
    const root = getRoot();
    if (!root) return;

    root.innerHTML = `
      <main class="blog-page">
        <article class="blog-hero" id="blog-hero"></article>
        <section class="blog-grid" id="blog-grid"></section>
      </main>
    `;

    try {
      const posts = await loadBlogPosts();
      if (!posts.length) {
        root.innerHTML = `
          <section class="blog-fallback">
            <h1>Blog</h1>
            <p>No published posts yet.</p>
          </section>
        `;
        return;
      }

      const featured = posts.find((post) => post.featured) || posts[0];
      const rest = posts.filter((post) => post.id !== featured.id);

      const hero = document.getElementById("blog-hero");
      const grid = document.getElementById("blog-grid");
      if (hero) hero.innerHTML = renderFeaturedPost(featured);
      if (grid) grid.innerHTML = rest.map(renderPostCard).join("");
    } catch (error) {
      root.innerHTML = `
        <section class="blog-fallback">
          <h1>Blog unavailable</h1>
          <p>${escapeHtml(error?.message || "Could not load posts")}</p>
        </section>
      `;
    }
  };

  const renderArticle = async (slug) => {
    const root = getRoot();
    if (!root) return;

    const post = await loadArticle(slug);
    if (!post) {
      renderNotFound();
      return;
    }

    const safeTitle = escapeHtml(post.title || "Untitled");
    const safeSubtitle = escapeHtml(post.subtitle || "");
    const safeAuthor = escapeHtml(post.author || "Odds Gods");
    const safeCoverAlt = escapeHtml(post.cover_image_alt || post.title || "");

    root.innerHTML = `
      <article class="blog-article">
        <header class="blog-article-header">
          <div class="blog-article-tags">
            ${(post.tags || []).map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <h1 class="blog-article-title">${safeTitle}</h1>
          ${safeSubtitle ? `<p class="blog-article-subtitle">${safeSubtitle}</p>` : ""}
          <div class="blog-article-meta">
            <span>${safeAuthor}</span>
            <span>·</span>
            <time>${formatDate(post.published_at)}</time>
          </div>
        </header>

        <div class="blog-article-cover">
          ${
            post.cover_image_url
              ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${safeCoverAlt}" />`
              : ""
          }
        </div>

        <div class="blog-article-body" id="article-body"></div>

        <footer class="blog-article-footer">
          <a href="https://bracket.oddsgods.net" class="blog-article-cta" target="_blank" rel="noopener">
            <span class="blog-article-cta-icon">🏀</span>
            <div>
              <strong>Try Bracket Lab</strong>
              <span>Pick any upset. Watch the entire tournament reprice.</span>
            </div>
            <span class="blog-article-cta-arrow">→</span>
          </a>
          <a href="/blog" class="blog-article-back" data-blog-link="true">← Back to all articles</a>
        </footer>
      </article>
    `;

    const body = document.getElementById("article-body");
    if (body) {
      body.innerHTML = post.body || "";
    }
  };

  const execCmd = (command) => {
    document.execCommand(command, false, null);
  };

  const insertHtml = (html) => {
    document.execCommand("insertHTML", false, html);
  };

  const insertHeading = () => insertHtml("<h2>Section heading</h2>");
  const insertSubheading = () => insertHtml("<h3>Subheading</h3>");

  const insertLink = () => {
    const url = window.prompt("URL:");
    if (!url) return;
    const label = window.prompt("Link text:") || url;
    insertHtml(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`);
  };

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    const alt = window.prompt("Image alt text:") || "";
    insertHtml(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`);
  };

  const insertPullQuote = () => {
    const quote = window.prompt("Enter the pull quote text:");
    if (!quote) return;
    insertHtml(`<blockquote class="og-pullquote">${escapeHtml(quote)}</blockquote>`);
  };

  const insertOddsCallout = () => {
    const team = window.prompt("Team name:");
    if (!team) return;
    const odds = window.prompt("Odds (e.g., +650 or 13.3%):") || "";
    const context = window.prompt("Context line:") || "";
    insertHtml(`
      <div class="og-odds-callout" contenteditable="false">
        <span class="og-odds-callout-team">${escapeHtml(team)}</span>
        <span class="og-odds-callout-odds">${escapeHtml(odds)}</span>
        <span class="og-odds-callout-context">${escapeHtml(context)}</span>
      </div>
    `);
  };

  const insertBracketLabEmbed = () => {
    insertHtml(`
      <a class="og-bracketlab-cta" href="https://bracket.oddsgods.net" contenteditable="false" target="_blank" rel="noopener">
        <span class="og-bracketlab-cta-icon">🏀</span>
        <span class="og-bracketlab-cta-text">
          <strong>Try it yourself in Bracket Lab</strong>
          <span>Pick any upset and watch the entire tournament reprice.</span>
        </span>
        <span class="og-bracketlab-cta-arrow">→</span>
      </a>
    `);
  };

  const toggleHTMLView = () => {
    const body = document.getElementById("post-body");
    if (!body) return;

    if (!state.htmlView) {
      body.textContent = body.innerHTML;
      body.classList.add("html-mode");
      state.htmlView = true;
      return;
    }

    body.innerHTML = body.textContent || "";
    body.classList.remove("html-mode");
    state.htmlView = false;
  };

  const normalizeTags = (text) =>
    String(text || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const fillEditor = (post) => {
    const titleInput = document.getElementById("post-title");
    const subtitleInput = document.getElementById("post-subtitle");
    const slugInput = document.getElementById("post-slug");
    const excerptInput = document.getElementById("post-excerpt");
    const tagsInput = document.getElementById("post-tags");
    const coverInput = document.getElementById("post-cover-url");
    const coverAltInput = document.getElementById("post-cover-alt");
    const authorInput = document.getElementById("post-author");
    const featuredInput = document.getElementById("post-featured");
    const bodyInput = document.getElementById("post-body");

    if (!titleInput || !slugInput || !bodyInput) return;

    titleInput.value = post?.title || "";
    subtitleInput.value = post?.subtitle || "";
    slugInput.value = post?.slug || "";
    excerptInput.value = post?.excerpt || "";
    tagsInput.value = Array.isArray(post?.tags) ? post.tags.join(", ") : "";
    coverInput.value = post?.cover_image_url || "";
    coverAltInput.value = post?.cover_image_alt || "";
    authorInput.value = post?.author || "Odds Gods";
    featuredInput.checked = !!post?.featured;
    bodyInput.innerHTML = post?.body || "";

    const coverPreview = document.getElementById("cover-preview");
    if (coverPreview) {
      coverPreview.innerHTML = post?.cover_image_url
        ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.cover_image_alt || "")}" />`
        : "";
    }

    state.currentPostId = post?.id || null;
  };

  const fetchPostForEdit = async (id) => {
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
    if (error) {
      window.alert(`Failed to load post: ${error.message}`);
      return;
    }
    fillEditor(data);
  };

  const renderPostList = async () => {
    const listEl = document.getElementById("admin-post-list");
    if (!listEl) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, status, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      listEl.innerHTML = `<p class="admin-error">${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data?.length) {
      listEl.innerHTML = '<p class="admin-empty">No posts yet.</p>';
      return;
    }

    listEl.innerHTML = data
      .map(
        (post) => `
          <button class="blog-admin-post-item${state.currentPostId === post.id ? " active" : ""}" data-post-id="${post.id}">
            <span class="blog-admin-post-title">${escapeHtml(post.title || "Untitled")}</span>
            <span class="blog-admin-status blog-admin-status--${escapeHtml(post.status)}">${escapeHtml(post.status)}</span>
          </button>
        `
      )
      .join("");

    listEl.querySelectorAll(".blog-admin-post-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-post-id");
        if (!id) return;
        fetchPostForEdit(id).then(renderPostList);
      });
    });
  };

  const handleCoverUpload = async (event) => {
    const input = event.target;
    const file = input?.files?.[0];
    if (!file) return;

    const fileName = `blog/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("public-assets").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      window.alert(`Upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("public-assets").getPublicUrl(fileName);
    const urlInput = document.getElementById("post-cover-url");
    const preview = document.getElementById("cover-preview");
    if (urlInput) urlInput.value = data.publicUrl;
    if (preview) preview.innerHTML = `<img src="${escapeHtml(data.publicUrl)}" alt="" />`;
  };

  const savePost = async (status) => {
    const titleInput = document.getElementById("post-title");
    const subtitleInput = document.getElementById("post-subtitle");
    const slugInput = document.getElementById("post-slug");
    const excerptInput = document.getElementById("post-excerpt");
    const tagsInput = document.getElementById("post-tags");
    const coverInput = document.getElementById("post-cover-url");
    const coverAltInput = document.getElementById("post-cover-alt");
    const authorInput = document.getElementById("post-author");
    const featuredInput = document.getElementById("post-featured");
    const bodyInput = document.getElementById("post-body");

    const title = String(titleInput?.value || "").trim();
    const body = String(bodyInput?.innerHTML || "").trim();
    const slug = String(slugInput?.value || "").trim() || slugify(title);

    if (!title || !body) {
      window.alert("Title and body are required.");
      return;
    }

    if (slugInput && !slugInput.value.trim()) {
      slugInput.value = slug;
    }

    const payload = {
      title,
      subtitle: String(subtitleInput?.value || "").trim() || null,
      slug,
      excerpt: String(excerptInput?.value || "").trim() || null,
      body,
      cover_image_url: String(coverInput?.value || "").trim() || null,
      cover_image_alt: String(coverAltInput?.value || "").trim() || null,
      author: String(authorInput?.value || "").trim() || "Odds Gods",
      tags: normalizeTags(tagsInput?.value || ""),
      featured: !!featuredInput?.checked,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    let result;
    if (state.currentPostId) {
      result = await supabase.from("posts").update(payload).eq("id", state.currentPostId).select().single();
    } else {
      result = await supabase.from("posts").insert(payload).select().single();
    }

    if (result.error) {
      window.alert(`Save failed: ${result.error.message}`);
      return;
    }

    state.currentPostId = result.data?.id || state.currentPostId;
    window.alert(status === "published" ? "Published." : "Draft saved.");
    await renderPostList();
  };

  const previewPost = () => {
    const body = document.getElementById("post-body");
    const title = document.getElementById("post-title");
    if (!body || !title) return;

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>${escapeHtml(title.value || "Preview")}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;700&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="/blog.css" />
        </head>
        <body class="blog-mode">
          <article class="blog-article" style="padding-top:24px;">
            <h1 class="blog-article-title">${escapeHtml(title.value || "Preview")}</h1>
            <div class="blog-article-body">${body.innerHTML}</div>
          </article>
        </body>
      </html>
    `);
    w.document.close();
  };

  const bindAdminEvents = () => {
    const titleInput = document.getElementById("post-title");
    const slugInput = document.getElementById("post-slug");
    const uploadInput = document.getElementById("post-cover-upload");

    titleInput?.addEventListener("input", () => {
      if (!slugInput) return;
      if (!slugInput.dataset.touched) {
        slugInput.value = slugify(titleInput.value);
      }
    });

    slugInput?.addEventListener("input", () => {
      slugInput.dataset.touched = "true";
    });

    uploadInput?.addEventListener("change", handleCoverUpload);

    document.getElementById("admin-new-post")?.addEventListener("click", () => {
      state.currentPostId = null;
      fillEditor(null);
      renderPostList();
    });

    document.getElementById("admin-save-draft")?.addEventListener("click", () => savePost("draft"));
    document.getElementById("admin-publish")?.addEventListener("click", () => savePost("published"));
    document.getElementById("admin-preview")?.addEventListener("click", previewPost);

    document.getElementById("admin-bold")?.addEventListener("click", () => execCmd("bold"));
    document.getElementById("admin-italic")?.addEventListener("click", () => execCmd("italic"));
    document.getElementById("admin-ul")?.addEventListener("click", () => execCmd("insertUnorderedList"));
    document.getElementById("admin-ol")?.addEventListener("click", () => execCmd("insertOrderedList"));
    document.getElementById("admin-h2")?.addEventListener("click", insertHeading);
    document.getElementById("admin-h3")?.addEventListener("click", insertSubheading);
    document.getElementById("admin-link")?.addEventListener("click", insertLink);
    document.getElementById("admin-image")?.addEventListener("click", insertImage);
    document.getElementById("admin-quote")?.addEventListener("click", insertPullQuote);
    document.getElementById("admin-odds")?.addEventListener("click", insertOddsCallout);
    document.getElementById("admin-cta")?.addEventListener("click", insertBracketLabEmbed);
    document.getElementById("admin-html")?.addEventListener("click", toggleHTMLView);
  };

  const renderAdminLogin = () => {
    const root = getRoot();
    if (!root) return;

    root.innerHTML = `
      <section class="blog-admin-login">
        <div class="blog-admin-login-card">
          <h1>Blog Admin</h1>
          <p>Sign in to manage posts.</p>
          <input id="admin-email" type="email" placeholder="Email" />
          <input id="admin-password" type="password" placeholder="Password" />
          <div class="blog-admin-login-actions">
            <button id="admin-login-password">Sign in</button>
            <button id="admin-login-magic">Send magic link</button>
          </div>
          <p id="admin-login-status" class="blog-admin-login-status"></p>
        </div>
      </section>
    `;

    const status = document.getElementById("admin-login-status");
    const emailInput = document.getElementById("admin-email");
    const passwordInput = document.getElementById("admin-password");

    document.getElementById("admin-login-password")?.addEventListener("click", async () => {
      const email = String(emailInput?.value || "").trim();
      const password = String(passwordInput?.value || "");
      if (!email || !password) {
        if (status) status.textContent = "Enter email and password.";
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (status) status.textContent = error.message;
        return;
      }
      route(window.location.pathname, { replace: true });
    });

    document.getElementById("admin-login-magic")?.addEventListener("click", async () => {
      const email = String(emailInput?.value || "").trim();
      if (!email) {
        if (status) status.textContent = "Enter your email first.";
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/admin/blog` },
      });
      if (status) {
        status.textContent = error ? error.message : "Magic link sent.";
      }
    });
  };

  const renderAdminEditor = async () => {
    const root = getRoot();
    if (!root) return;

    root.innerHTML = `
      <div class="blog-admin">
        <aside class="blog-admin-sidebar">
          <h2 class="blog-admin-title">Blog Manager</h2>
          <button class="blog-admin-new-btn" id="admin-new-post">+ New Post</button>
          <div class="blog-admin-post-list" id="admin-post-list"></div>
        </aside>

        <section class="blog-admin-editor">
          <div class="blog-editor-form">
            <div class="blog-editor-meta">
              <input type="text" id="post-title" class="blog-editor-title-input" placeholder="Article title" />
              <input type="text" id="post-subtitle" class="blog-editor-subtitle-input" placeholder="Subtitle (optional)" />
              <input type="text" id="post-slug" class="blog-editor-slug-input" placeholder="url-slug" />
              <input type="text" id="post-excerpt" class="blog-editor-excerpt-input" placeholder="Short excerpt" />
              <input type="text" id="post-tags" class="blog-editor-tags-input" placeholder="Tags: march-madness, bracket-lab" />
              <input type="text" id="post-author" class="blog-editor-tags-input" placeholder="Author" value="Odds Gods" />
              <label class="blog-editor-checkbox"><input type="checkbox" id="post-featured" /> Featured</label>
              <div class="blog-editor-cover">
                <label>Cover Image</label>
                <input type="file" id="post-cover-upload" accept="image/*" />
                <input type="text" id="post-cover-url" placeholder="Or paste image URL" />
                <input type="text" id="post-cover-alt" placeholder="Cover image alt text" />
                <div id="cover-preview"></div>
              </div>
            </div>

            <div class="blog-editor-body">
              <div class="blog-editor-toolbar">
                <button type="button" id="admin-bold" title="Bold"><strong>B</strong></button>
                <button type="button" id="admin-italic" title="Italic"><em>I</em></button>
                <button type="button" id="admin-ul" title="Bullet List">•</button>
                <button type="button" id="admin-ol" title="Numbered List">1.</button>
                <button type="button" id="admin-h2" title="Heading">H2</button>
                <button type="button" id="admin-h3" title="Subheading">H3</button>
                <button type="button" id="admin-link" title="Link">🔗</button>
                <button type="button" id="admin-image" title="Image">📷</button>
                <button type="button" id="admin-quote" title="Pull Quote">❝</button>
                <button type="button" id="admin-odds" title="Odds Callout">📊</button>
                <button type="button" id="admin-cta" title="Bracket Lab CTA">🏀</button>
                <button type="button" id="admin-html" title="View HTML">&lt;/&gt;</button>
              </div>
              <div class="blog-editor-content" id="post-body" contenteditable="true"></div>
            </div>

            <div class="blog-editor-actions">
              <button class="blog-editor-save-btn" id="admin-save-draft">Save Draft</button>
              <button class="blog-editor-preview-btn" id="admin-preview">Preview</button>
              <button class="blog-editor-publish-btn" id="admin-publish">Publish</button>
            </div>
          </div>
        </section>
      </div>
    `;

    bindAdminEvents();
    fillEditor(null);
    await renderPostList();
  };

  const renderAdmin = async () => {
    const root = getRoot();
    if (!root) return;

    root.innerHTML = '<section class="blog-fallback"><p>Loading admin...</p></section>';

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      renderAdminLogin();
      return;
    }

    state.authUser = data?.user || null;
    if (!state.authUser) {
      renderAdminLogin();
      return;
    }

    await renderAdminEditor();
  };

  const handleRoute = async (pathname) => {
    if (!ensureSupabase()) return;

    if (pathname === "/blog" || pathname === "/blog/") {
      document.title = "Blog | Odds Gods";
      await renderBlogListing();
      return;
    }

    if (pathname.startsWith("/blog/")) {
      const slug = decodeURIComponent(pathname.replace(/^\/blog\//, "").replace(/\/$/, ""));
      document.title = "Article | Odds Gods";
      await renderArticle(slug);
      return;
    }

    if (pathname === "/admin/blog" || pathname === "/admin/blog/") {
      document.title = "Blog Admin | Odds Gods";
      await renderAdmin();
      return;
    }

    renderNotFound();
  };

  const route = async (pathname, options = {}) => {
    const target = pathname || window.location.pathname;
    if (!options.replace && window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    await handleRoute(target);
  };

  const setupRouting = () => {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="/blog"], a[href^="/admin/blog"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      route(href);
    });

    window.addEventListener("popstate", () => {
      handleRoute(window.location.pathname);
    });
  };

  renderShell();
  setupRouting();
  handleRoute(window.location.pathname);
})();
