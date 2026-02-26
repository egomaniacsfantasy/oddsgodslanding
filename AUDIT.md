# Odds Gods Infrastructure Audit

Date: 2026-02-26
Audited by: Codex

## Scope audited
- `/Users/andrevlahakis/Documents/New project` (oddsgodslanding repo)
- `/Users/andrevlahakis/Documents/EgomaniacsWidget-livefix` (EgomaniacsWidget repo clone)
- `/Users/andrevlahakis/Documents/New project/EgomaniacsBracketOdds` (EgomaniacsBracket repo)
- Live DNS/HTTP checks for:
  - `oddsgods.net`
  - `wato.oddsgods.net`
  - `bracket.oddsgods.net`

## Part 1 Findings

### Structure
- Repositories:
  - `oddsgodslanding` and `EgomaniacsBracket` are separate Git repositories.
  - `EgomaniacsWidget` is also a separate Git repository (cloned locally for inspection).
- Current organization is **multi-repo**, not a single monorepo.
- Shared/duplicated code patterns exist between `oddsgodslanding` and `EgomaniacsWidget`:
  - Duplicated engine files (identical hash):
    - `engine/outcomes.js`
    - `engine/intent.js`
    - `engine/baselines.js`
    - `engine/consistency.js`
  - Near-duplicated application surface (diverged versions):
    - `server.js`
    - `app.js`
    - `styles.css`
    - `what-are-the-odds/index.html`
  - Duplicate static assets pattern:
    - `logo-icon.png` in multiple repos and in `assets/`.
- Package manifests found:
  - `/Users/andrevlahakis/Documents/New project/package.json`
  - `/Users/andrevlahakis/Documents/New project/EgomaniacsBracketOdds/package.json`
  - `/Users/andrevlahakis/Documents/EgomaniacsWidget-livefix/package.json`
- Environment variable names referenced (names only):
  - `ACCOLADES_INDEX_FILE`
  - `ACCOLADES_OUT_FILE`
  - `BASE_URL`
  - `BRACKET_APP_URL`
  - `CACHE_TTL_MS`
  - `FEATURE_ENABLE_TRACE`
  - `FEEDBACK_EVENTS_FILE`
  - `HEADSHOT_TIMEOUT_MS`
  - `LIVE_CONTEXT_ENABLED`
  - `LIVE_CONTEXT_TIMEOUT_MS`
  - `LIVE_STATE_REFRESH_MS`
  - `LIVE_STATE_TIMEOUT_MS`
  - `MAJOR_EVENT_DIGEST_TTL_MS`
  - `MONOTONIC_TIMEOUT_MS`
  - `MVP_PRIORS_FILE`
  - `NFL_INDEX_REFRESH_MS`
  - `NFL_INDEX_TIMEOUT_MS`
  - `ODDS_API_BASE`
  - `ODDS_API_BOOKMAKERS`
  - `ODDS_API_KEY`
  - `ODDS_API_REGIONS`
  - `ODDS_QUERY_EVENTS_FILE`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_REASONING_EFFORT`
  - `OPENAI_TIMEOUT_MS`
  - `PHASE2_CALIBRATION_FILE`
  - `PLAYER_STATUS_TIMEOUT_MS`
  - `PORT`
  - `SEMANTIC_CACHE_TTL_MS`
  - `SPORTSBOOK_REF_CACHE_TTL_MS`
  - `SPORTSDB_API_KEY`
  - `STABLE_CACHE_TTL_MS`
  - `STRICT_BOOT_SELFTEST`
  - `WATO_APP_URL`

### Landing page
- Implementation: static HTML/CSS/JS (no React/Next/Vite runtime).
  - Key files: `index.html`, `landing.css`, `landing.js`.
- Runtime API calls from landing JS:
  - `GET /api/health`
  - `POST /api/odds`
- Runtime external assets fetched directly:
  - ESPN headshots URLs in demo content.
- Imports from WATO/Bracket service:
  - No code imports.
  - Uses links to `https://wato.oddsgods.net/` and `https://bracket.oddsgods.net/`.
- Approx build/runtime payload size (landing shell files):
  - `index.html` ~20 KB
  - `landing.css` ~41 KB
  - `landing.js` ~52 KB
  - `logo-icon.png` ~175 KB
  - Combined approx: ~300 KB (not counting fonts/cached assets/CDN transfers)

### Bracket Lab
- Runtime type: static front-end (Vite React build output under `dist/`).
- External API calls at runtime:
  - No `fetch()` calls found in `src/`.
- Framework: React + Vite + TypeScript.
- Current build output size:
  - `dist/` approx `1.5 MB`.

### What Are the Odds (WATO)
- Backend behavior in `server.js`:
  - Accepts prompt requests at `/api/odds`.
  - Calls OpenAI Responses API.
  - Applies deterministic parsing, consistency rules, and market anchoring.
  - Exposes additional endpoints for suggestions, player outcomes, metrics, feedback, and calibration reload.
  - Persists feedback/query events to local JSONL files.
  - Serves static front-end assets for WATO page.
- Always-on vs request-driven:
  - Request-driven compute path, but warm process significantly improves latency due to in-memory caches and preloaded indexes.
- Database connections:
  - None found (no Postgres/MySQL/Redis/Mongo/SQLite libraries/references).
  - Data persistence is file-based JSON/JSONL.
- Measured primary endpoint latency (`POST https://wato.oddsgods.net/api/odds`, 5 runs):
  - Run1: 14.73s
  - Run2: 0.15s
  - Run3: 0.16s
  - Run4: 0.14s
  - Run5: 0.22s
  - Warm average (runs 2-5): ~0.17s
  - Overall average (including cold): ~3.08s
  - Observation: cold-start-like first request penalty is present.
- Server-side state risk on restart:
  - In-memory caches/indexes reset on restart.
  - Persistent files remain.
- Node version:
  - Explicit `NODE_VERSION=22` found in `oddsgodslanding` `render.yaml`.
  - WATO service exact live Node version not verifiable from code alone.

### Render-specific
- Current domain mapping (verified by DNS):
  - `oddsgods.net` -> `216.24.57.1`
  - `www.oddsgods.net` CNAME -> `oddsgods-landing.onrender.com`
  - `wato.oddsgods.net` CNAME -> `egomaniacswidget.onrender.com`
  - `bracket.oddsgods.net` CNAME -> `egomaniacsbracket.onrender.com`
- Service plans (Free/Starter/Standard):
  - Not fully verifiable from repository code.
  - Requires Render dashboard confirmation.
- Cron jobs/workers beyond listed services:
  - Not discoverable from code alone.
  - Requires Render dashboard confirmation.
- `render.yaml` presence:
  - Exists in `oddsgodslanding`.
  - Defines one Node web service, not all three deployed services.

### Code quality flags
- `console.log` in production code:
  - Present in `server.js` startup/self-test logs in both `oddsgodslanding` and `EgomaniacsWidget`.
  - Also present in build/regression scripts (non-runtime scripts).
- Hardcoded API keys/secrets in source:
  - No concrete secret values detected.
  - API keys referenced via env vars.
- Unused dependencies:
  - `oddsgodslanding`: `gray-matter`, `markdown-it` currently used by blog files.
  - `EgomaniacsWidget`: dependency set appears used for its Node app.
  - `EgomaniacsBracket`: dependency set appears consistent with Vite/React build.
  - Full certainty on unused deps would require dedicated static dependency analyzer; no obvious unused packages flagged from quick import scan.
- `node_modules` committed to git:
  - None found in tracked files for audited repos.
- `.gitignore` coverage:
  - `oddsgodslanding` currently includes `node_modules/`, `.env`, `.DS_Store`, `EgomaniacsBracketOdds/`.
  - Missing explicit ignores for `dist/`, `build/`, `.env.local`.
  - Bracket and Widget `.gitignore` files are more complete.

## Part 2 Recommendation

### Consolidate landing + bracket?
Recommendation: **Keep separate for now.**

Reason: They are built with different stacks and deployment modes (landing is static HTML/JS with optional Node proxy context, bracket is Vite React static build). Consolidating today would require repo/build-system migration with non-trivial risk and limited immediate payoff. There is shared styling/nav duplication, but the fastest low-risk improvement is governance/process standardization, not codebase merge.

### WATO Node service configuration
- WATO should remain a Node service.
- Health endpoint currently exposed as `/api/health`, not `/health`.
- Auto-deploy, plan level, and health check path configuration require Render dashboard validation.

### Cold-start warning
⚠️ **Cold-start behavior observed.** First `POST /api/odds` call measured ~14.7s, then warm calls ~0.17s. This is consistent with idle wakeup and/or heavy warm-up path. If WATO is on Free tier, upgrading to Starter is strongly recommended to keep service warm and avoid first-request penalty on core interaction.

## Part 3/4/5/6 planned changes (not yet applied at this stage)
- Remove blog feature and related files/routes/dependencies.
- Add `/health` lightweight endpoint if missing.
- Expand `render.yaml` to clearly describe intended service topology.
- Clean .gitignore and safe logging cleanup.

---

## Post-Audit Execution Summary (applied after audit)

Completed after the audit phase:

- Blog removed from `oddsgodslanding`:
  - Removed blog routes from `server.js`.
  - Removed blog files and content:
    - `blog.css`, `blog.js`
    - `lib/blog.js`, `lib/blogRender.js`
    - `content/blog/*`
  - Removed Blog nav links and landing \"From the Gods\" section.
  - Removed blog dependencies from `package.json` and lockfile (`gray-matter`, `markdown-it`).
- Added lightweight `/health` endpoint in `oddsgodslanding/server.js`.
- Added lightweight `/health` endpoint in `EgomaniacsWidget/server.js` and pushed upstream commit `4777af6`.
- Removed runtime startup `console.log` calls from production server startup path in both Node services.
- Updated root `.gitignore` to include `.env.local`, `dist/`, `build/`.
- Updated `render.yaml` to a 3-service blueprint with `/health` check for Node service.

Validation checks completed locally:

- `node --check server.js` passed.
- `/` renders without Blog nav/link/section.
- `/blog` returns 404 after removal.
- `/health` returns fast 200 JSON.
- `/api/health` remains unchanged and operational.
