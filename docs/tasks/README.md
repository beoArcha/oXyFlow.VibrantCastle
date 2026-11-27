# Vibrant Castle: tasks

Updated: 2026-11-27. This folder holds the plan for the game and its task cards, one file per phase.

## What is here

| File | Contents |
| :--- | :--- |
| [VISION.md](./VISION.md) | What we are building: the pillars and the gaps against them. |
| [ROADMAP.md](./ROADMAP.md) | The overview: phases, goals, exit criteria, quality gates and the planned / done cards per phase. |
| `phase-N-0.M.x.md` | One file per phase. Each starts with a description of the phase. Past phases are summaries; the current and next phase hold the task cards. |

## Phases, versions and quality gates

- Phase N ships as version `0.(N-1).x`. Phase 4 (`0.3.x`) is current.
- A phase closes with its quality gate, in this order: docs conformance check, docs update, general review, release, then the minor version bump that opens the next phase. The owner approves the bump.
- Releases and version bumps happen only at a gate. A card not done when its phase closes moves to the next phase file at the gate, on purpose.

Detail: [ROADMAP.md](./ROADMAP.md#how-phases-work).

## Phases

| Phase | Version | Status | File |
| :--- | :--- | :--- | :--- |
| 1. Engine core | 0.0.x | done | [phase-1-0.0.x.md](./phase-1-0.0.x.md) (summary) |
| 2. Specifications | 0.1.x | done | [phase-2-0.1.x.md](./phase-2-0.1.x.md) (summary) |
| 3. Playable vertical slice | 0.2.x | done | [phase-3-0.2.x.md](./phase-3-0.2.x.md) (summary) |
| 4. Stabilise and set direction | 0.3.x | current | [phase-4-0.3.x.md](./phase-4-0.3.x.md) (cards) |
| 5. Worlds and characters | 0.4.x | next | [phase-5-0.4.x.md](./phase-5-0.4.x.md) (cards) |
| 6+ | 0.5.x and later | outline | [ROADMAP.md](./ROADMAP.md#later-phases-outline) |

## Card format

Each card is a `###` heading `VC-xxx · Title`, grouped by area (A. Stabilisation, B. Assets, C. Maps, D. Characters, E. Menu, F. Docs and settings, G. CI and tests, H. Developer tools, Z. Phase gate). Card codes never change, even when a card moves to another phase.

```
### VC-xxx · Title
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** the outcome, in one line.
- **Description:** context (optional).
- **How (AI):** the steps for the delegate.
```

**Status:** `todo` · `ready` (dependencies met) · `in-progress` · `review` · `done` (with the PR number) · `blocked`

**Type:** `feat` · `fix` · `refactor` · `test` · `plan` · `review` · `doc` · `chore` · `workflow` · `art`

**Model class** (the class only, not a model name):
- `tiny`: small local or open models.
- `small`: cheap, well-specified edits.
- `medium`: engine and cross-cutting code, larger features.
- `large`: design, plans, hard refactors.
- `huge`: whole-system work.

## Rules for every task

- One small PR per card. The orchestrator reviews and merges ([orchestration rules](../../.agents/rules/orchestration_and_phases.md)).
- No console brand or trademark names anywhere in the repo (enforced by the trademark-free arch test).
- Tiers are `hi8bit` / `hi16bit` / high.
- Commit trailer as in the repo convention.
- Only the 6 E2E dist smoke tests may fail locally (they need `build:pages`).
- When a card's PR merges, update its status in the phase file and the done column in [ROADMAP.md](./ROADMAP.md).
