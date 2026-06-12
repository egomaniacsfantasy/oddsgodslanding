# Odds Gods Workspace

This root repository powers the public Odds Gods shell:

- `oddsgods.net` marketing
- `blog.oddsgods.net` blog shell and article templates
- `odds-gods-wato` Node service

The live Bracket Lab is a separate GitHub repo and a separate Render product. It is checked out locally at [`EgomaniacsBracketOdds/`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds) for convenience, but it is not part of this repository's git history.

More detail lives in [docs/REPO_TOPOLOGY.md](/Users/andrevlahakis/Documents/New%20project/docs/REPO_TOPOLOGY.md).

## Product Map

| Host / product | Repo | Render service | Local entry |
| --- | --- | --- | --- |
| `oddsgods.net` | this repo | `odds-gods-landing` | [`index.html`](/Users/andrevlahakis/Documents/New%20project/index.html) |
| `blog.oddsgods.net` | this repo | `odds-gods-landing` shell + blog routing | [`blog/index.html`](/Users/andrevlahakis/Documents/New%20project/blog/index.html), [`blog.js`](/Users/andrevlahakis/Documents/New%20project/blog.js) |
| `odds-gods-wato` API | this repo | `odds-gods-wato` | [`server.js`](/Users/andrevlahakis/Documents/New%20project/server.js) |
| `bracket.oddsgods.net` | `EgomaniacsBracket` repo | `odds-gods-bracket` | [`EgomaniacsBracketOdds/src/App.tsx`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/App.tsx) |

## Root Repo Layout

- Marketing shell: [`index.html`](/Users/andrevlahakis/Documents/New%20project/index.html), [`landing.css`](/Users/andrevlahakis/Documents/New%20project/landing.css), [`landing.js`](/Users/andrevlahakis/Documents/New%20project/landing.js), [`olympus-tokens.css`](/Users/andrevlahakis/Documents/New%20project/olympus-tokens.css)
- Blog shell: [`blog/index.html`](/Users/andrevlahakis/Documents/New%20project/blog/index.html), [`blog.css`](/Users/andrevlahakis/Documents/New%20project/blog.css), [`blog.js`](/Users/andrevlahakis/Documents/New%20project/blog.js)
- Static article templates: [`blog/`](/Users/andrevlahakis/Documents/New%20project/blog)
- WATO backend: [`server.js`](/Users/andrevlahakis/Documents/New%20project/server.js), [`engine/`](/Users/andrevlahakis/Documents/New%20project/engine), [`scripts/`](/Users/andrevlahakis/Documents/New%20project/scripts)
- Render config: [`render.yaml`](/Users/andrevlahakis/Documents/New%20project/render.yaml)

## Local Development

Run the WATO backend:

```bash
npm install
npm start
```

The backend reads `.env` values from `.env` or `.env.local`.

Preview the static landing/blog shell with any simple file server from the repo root, for example:

```bash
python3 -m http.server 4173
```

Preview Bracket Lab from its own repo:

```bash
cd EgomaniacsBracketOdds
npm install
npm run dev
```

## Phase 2 Utilities

The historical WATO calibration and regression scripts are still available here:

```bash
npm run phase2:rebuild
npm run test:regression
npm run test:golden
```
