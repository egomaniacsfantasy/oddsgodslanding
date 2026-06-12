# Odds Gods Repo And Render Topology

## Current split

The logical product split is sound:

1. `oddsgods.net` and `blog.oddsgods.net` share a public shell and can live together.
2. `bracket.oddsgods.net` is a separate application with separate deployment needs and should stay in its own repo.
3. The WATO backend is its own service, but it is small enough to stay in the root repo for now.

The part that is not ideal is the local workspace shape: the Bracket Lab repo is nested inside the landing repo checkout. That is manageable if it stays ignored by the root repo, but it is easy to confuse during deploy or git operations.

## Repos

### Root repo

- GitHub: `git@github.com:egomaniacsfantasy/oddsgodslanding.git`
- Purpose: marketing site, blog shell, article templates, WATO backend, shared public assets
- Important files:
  - [`index.html`](/Users/andrevlahakis/Documents/New%20project/index.html)
  - [`landing.css`](/Users/andrevlahakis/Documents/New%20project/landing.css)
  - [`landing.js`](/Users/andrevlahakis/Documents/New%20project/landing.js)
  - [`blog/index.html`](/Users/andrevlahakis/Documents/New%20project/blog/index.html)
  - [`blog.css`](/Users/andrevlahakis/Documents/New%20project/blog.css)
  - [`blog.js`](/Users/andrevlahakis/Documents/New%20project/blog.js)
  - [`server.js`](/Users/andrevlahakis/Documents/New%20project/server.js)
  - [`render.yaml`](/Users/andrevlahakis/Documents/New%20project/render.yaml)

### Bracket Lab repo

- GitHub: `https://github.com/egomaniacsfantasy/EgomaniacsBracket.git`
- Local checkout: [`EgomaniacsBracketOdds/`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds)
- Purpose: live bracket application, predictor, rankings, leaderboard, groups
- Important files:
  - [`EgomaniacsBracketOdds/src/App.tsx`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/App.tsx)
  - [`EgomaniacsBracketOdds/src/PredictorPage.tsx`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/PredictorPage.tsx)
  - [`EgomaniacsBracketOdds/src/RankingsPage.tsx`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/RankingsPage.tsx)
  - [`EgomaniacsBracketOdds/src/Leaderboard.tsx`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/Leaderboard.tsx)
  - [`EgomaniacsBracketOdds/src/olympus-tokens.css`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/olympus-tokens.css)
  - [`EgomaniacsBracketOdds/src/olympus-overrides.css`](/Users/andrevlahakis/Documents/New%20project/EgomaniacsBracketOdds/src/olympus-overrides.css)

## Render products

`render.yaml` currently defines three services:

1. `odds-gods-wato`
   - Node service
   - root repo
   - starts from `npm start`

2. `odds-gods-landing`
   - static site
   - root repo
   - publishes the root directory
   - handles `/blog` and `/admin/blog` rewrites

3. `odds-gods-bracket`
   - static site
   - separate GitHub repo
   - builds `dist/`

## Current page inventory

### Marketing

- Homepage sections in [`index.html`](/Users/andrevlahakis/Documents/New%20project/index.html):
  - hero
  - mechanic
  - pricing layers
  - board
  - proof
  - roadmap
  - email closer

### Blog

- Blog index: [`blog/index.html`](/Users/andrevlahakis/Documents/New%20project/blog/index.html)
- Static articles:
  - [`blog/round-of-64-best-bets.html`](/Users/andrevlahakis/Documents/New%20project/blog/round-of-64-best-bets.html)
  - [`blog/predicting-college-basketball-methodology.html`](/Users/andrevlahakis/Documents/New%20project/blog/predicting-college-basketball-methodology.html)
  - [`blog/march-madness-2026-floors-and-ceilings.html`](/Users/andrevlahakis/Documents/New%20project/blog/march-madness-2026-floors-and-ceilings.html)
  - [`blog/picks-march-10.html`](/Users/andrevlahakis/Documents/New%20project/blog/picks-march-10.html)
- Dynamic blog router and admin shell: [`blog.js`](/Users/andrevlahakis/Documents/New%20project/blog.js)

### Bracket Lab

- main bracket app
- predictor
- rankings
- leaderboard
- groups
- cascade demo

## Shared styling and assets

### Shared shell components

- top nav
- footer row
- brand lockup
- board-row styling on marketing and blog

### Shared brand assets

- root public icons and manifest files
- [`assets/logo-icon.png`](/Users/andrevlahakis/Documents/New%20project/assets/logo-icon.png)
- root Olympus token sheet for marketing/blog
- Bracket Lab Olympus token sheet for the app

## Fonts in active use

### Marketing and blog shell

- `Archivo`
- `Bodoni Moda`
- `Cinzel`

### Bracket Lab

- `Archivo`
- `Bodoni Moda`
- `Cinzel`

There are still legacy font variables and old hardcoded styles inside some Bracket Lab files. Those should be removed as part of the remaining product polish pass rather than during repo cleanup.

## Color-state note

The root shell now centers on the Olympus token palette. The Bracket Lab repo has the new token sheet in place, but some older files still contain hardcoded legacy colors and should be normalized in a follow-up pass.

## Recommendation

Keep the product split. Do not merge the bracket repo into the landing repo.

Recommended operating model:

1. Root repo owns `oddsgods.net`, `blog.oddsgods.net`, and the WATO backend.
2. Bracket repo owns `bracket.oddsgods.net`.
3. Shared visual identity changes are applied intentionally in both repos, not through fragile relative imports.
4. If you want cleaner local ergonomics later, move `EgomaniacsBracketOdds/` to a sibling directory outside the root repo checkout. That is optional and should be done as a separate housekeeping task.
