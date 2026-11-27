# Phase 2: specifications (0.1.x, done)

Part of the [task folder](./README.md). A summary of past work; this phase had no task cards.

## About this phase

**Goal:** write down how the systems work before building content on them. A short documentation phase. **Period:** ended 2026-10-25, closed by the bump to `0.2.1` (14bb1fe). All work went straight to `main`, without PRs.

## What was built

- **Manifesto.** Six canonical system specifications, replacing obsolete policies (0945c20).
- **Agent operating hub.** `AGENTS.md` rewritten from 764 to 65 lines: a documentation map pointing to `.agents/rules`, the manifesto and the lore, the Bun command reference, the first milestone and five hard architectural invariants (c902a6b).
- **Agent rules.** New rules for AI agents and a reorganised docs folder (6e56252, 5e2dbdc).

## What was learned

- A short, link-only `AGENTS.md` saves prompt tokens and keeps one source of truth per topic.
- Specs drift unless something checks them. This led to the "docs match the code" step that now opens every quality gate (see [ROADMAP.md](./ROADMAP.md)).
