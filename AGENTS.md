# Vibrant Castle — AI Operating Hub

## 1. Project Overview

*Vibrant Castle* is a 2D metroidvania. The direction is set in [`docs/tasks/VISION.md`](./docs/tasks/VISION.md):

* **Structure** is closer to 2D *Mario*: 8 worlds x 8 maps, with responsive, forgiving movement.
* **Maps, heroes and enemies** take elements of *Castlevania: Aria of Sorrow*.
* **Narration** follows *Bastion*. **Palette and mood** are autumn.
* **Controls** use a restricted pad layout (2 triggers, 4 face buttons, bumpers as selectors) or the keyboard.
* **Menus** are split: a game dialog and a separate dev dialog "Tworzenie" (dev builds only).
* **Assets** come in three tiers: `hi8bit` / `hi16bit` / `high`.
* **Characters** have six D&D-like attributes stored as D20 x10.

Codebase layout:

* **Simulation Core (`src/game/`)**: a deterministic Canvas 2D engine with a fixed-step loop (30/60/90/120 Hz). Pure TypeScript, zero UI dependencies.
* **Presentation Layer (`src/game-menu/`, `src/hud/`, `src/ui/`, `src/developer/`)**: a passive React 19 overlay. It reads immutable engine snapshots through React Context (`src/context/`).
* **Content Layer (`src/data/`, `src/assets/`)**: declarative JSON as the single source of truth, plus the PNG / SVG art tiers.
* **Tooling**: **Bun** only. Node.js and npm are not used.

---

## 2. Documentation Map

| Pillar | Location | Purpose |
| :--- | :--- | :--- |
| **Organizer** | [`AGENTS.md`](./AGENTS.md) | This hub: mission, tooling, invariants and where to look. |
| **Vision, roadmap, tasks** | [`docs/tasks/`](./docs/tasks) | [`VISION.md`](./docs/tasks/VISION.md): what we build. [`ROADMAP.md`](./docs/tasks/ROADMAP.md): phases, quality gates, planned / done cards. [`task-board.md`](./docs/tasks/task-board.md): the VC-xxx task cards. |
| **Engineering rules** | [`.agents/rules/`](./.agents/rules) | Mandatory standards, listed below. |
| **Design docs** | [`docs/design/`](./docs/design) | Approved designs, e.g. [`menu-ux-plan.md`](./docs/design/menu-ux-plan.md). Map and character contracts land here (VC-020, VC-030). |

The engineering rules are:

* [`orchestration_and_phases.md`](./.agents/rules/orchestration_and_phases.md): delegation, merge, phases.
* [`development_workflow.md`](./.agents/rules/development_workflow.md): plan, execute, verify.
* [`code_cleanliness.md`](./.agents/rules/code_cleanliness.md): no `new Error`, no `any`.
* [`engine_architecture.md`](./.agents/rules/engine_architecture.md).
* [`frontend_ui.md`](./.agents/rules/frontend_ui.md).
* [`testing_standards.md`](./.agents/rules/testing_standards.md).
* [`content_and_assets.md`](./.agents/rules/content_and_assets.md).
* `graphify*.md`.

The system specifications (`docs/manifesto/`) and the lore (`docs/lore/`) were removed in 2784276. VC-050 restores them; until then, the code and the rules are the reference. `docs/plan/` is git-ignored scratch space for local plans and never holds tracked files.

---

## 3. Orchestration, Phases and Merging

Full rules: [`.agents/rules/orchestration_and_phases.md`](./.agents/rules/orchestration_and_phases.md).

* A Claude **orchestrator** delegates task cards by model **class**: `tiny` / `small` / `medium` / `large` / `huge`. Docs name classes only, never models.
* The orchestrator reviews every result. It merges the PR itself once review and CI pass. It asks the owner only for decisions that shape future direction or carry great weight.
* One small PR per task card. Branch from `origin/main`. At most 4 concurrent delegated tasks that run builds or tests.
* Delegates never push or merge. Commits end with the `Co-Authored-By:` trailer.
* Work runs in **phases tied to versions**. Phase 4 = `0.3.x` (current); closing it starts phase 5 and `0.4.0`.
* Every phase ends with a **quality gate**, in this order:
  1. docs conformance check;
  2. docs update;
  3. general review;
  4. release;
  5. version bump.
* Releases and version bumps happen only at a gate.

---

## 4. Tooling Quick Reference (Bun Only)

```bash
bun dev               # Local dev server (Vite, port 3000)
bun run typecheck     # tsc --noEmit
bun run lint          # tsc --noEmit
bun test:unit         # Unit tests (AAA)
bun test:integration  # Integration tests (BDT)
bun test:scripts      # Tooling and script tests
bun test:arch         # AST architecture and boundary tests (src/tests/arch)
bun test:e2e          # Distribution smoke tests (need `bun run build:pages` first)
bun test              # Full suite
bun run coverage:gate # Coverage quality gate
bun run build:game    # Production game client
bun run build:pages   # Full distribution (dist/), game plus wiki

bun scripts/validate-level.ts <id>     # Level-logic validator for one location (exit 1 on ERROR)
```

The sprite compiler (`scripts/sprites/`), atlas repack and parallax seam tools were removed in 2784276. VC-003 restores them, and they are documented again when it merges.

Art quality tiers (`hi8bit` = code key `low`, `hi16bit` = `mid`, `high` = `high`) are defined in [`.agents/rules/content_and_assets.md`](./.agents/rules/content_and_assets.md) §6.1.

---

## 5. Current Phase and Backlog

Current phase: **phase 4, version 0.3.x**. The goals, exit criteria and card table are in [`docs/tasks/ROADMAP.md`](./docs/tasks/ROADMAP.md). The backlog is [`docs/tasks/task-board.md`](./docs/tasks/task-board.md). Gaps against the pillars are listed in [`VISION.md`](./docs/tasks/VISION.md) and planned in the roadmap. Do not keep a second backlog here.

---

## 6. Hard Architectural Invariants

1. **Bun Runtime Discipline**: never run or propose `npm`, `npx`, `yarn` or `pnpm` commands.
2. **Layer Isolation**: the game engine (`src/game/`) stays pure TypeScript, with zero DOM or React imports.
3. **Passive UI Axiom**: React 19 is only a presentation overlay ($UI = f(\text{Snapshot})$). No gameplay state lives in React.
4. **Structured Error Hierarchy**: `new Error(...)` is forbidden in production code. Use domain classes that inherit from `GameBaseError`.
5. **Zero Render Allocations & FAR Opaque**: no object allocations inside `render()` loops. The parallax `FAR` layer is 100% opaque (`opaque: true`).
6. **Trademark-free text**: no console brand names anywhere in the repo (enforced by `src/tests/arch/trademarkNames.test.ts`). No local absolute user paths in docs, commits or PRs.
