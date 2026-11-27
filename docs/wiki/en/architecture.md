# Technical Architecture

Vibrant Castle keeps the rules of the game apart from what you see on screen. The simulation is plain TypeScript. The menus and the HUD are a React overlay that only reads the state. Engineering rules are in `.agents/rules/`, and architecture tests in `src/tests/arch/` enforce them.

## The layers

- **Content (`src/data/`, `src/assets/`).** JSON files define the maps, enemies, controls and defaults. Art comes in three quality tiers, as PNG and SVG files.
- **Simulation (`src/game/`).** A pure TypeScript engine on Canvas 2D, with no React or DOM imports. It runs a fixed-step loop at 30, 60, 90 or 120 Hz (60 Hz by default), and drawing interpolates between steps.
- **Presentation (`src/game-menu/`, `src/hud/`, `src/ui/`, `src/developer/`).** A passive React 19 overlay. Each screen is a function of an immutable snapshot of the engine. It never changes gameplay directly. The developer dialog exists only in development builds.
- **Bridge (`src/context/`).** Typed React contexts carry commands from the overlay to the engine, and snapshots back.

## Rules that are enforced

- The engine has no UI dependencies.
- Errors are domain classes that inherit from `GameBaseError`, never a plain `Error`.
- Render loops do not allocate objects.
- Every map is checked by a level validator, which confirms that it can be finished.

## Parallax

Backgrounds use five depth bands (`far`, `mid_far`, `mid`, `mid_close`, `close`) declared in per-world meta files under `src/assets/parallax/`: an opaque `far` horizon plus variations that load progressively (`far` first, then layers, zone variants, effects and neighbour preloads) and crossfade in `boss` and `rest` zones. Display settings expose `auto`, `high`, `mid`, `low`, `simplified` and `off` parallax modes, with automatic frame-time downgrade when needed.

## Build and checks

- **Bun only.** No npm, npx, yarn or pnpm.
- **`bun run build:pages`** builds the distribution in `dist/`: the wiki at the root and the game under `/game/`. **`bun run preview:pages`** serves it locally for testing.
- **Test suites.** `bun test:unit`, `bun test:integration`, `bun test:arch`, `bun test:scripts` and `bun test:e2e`. The end-to-end suite checks the built distribution.
- **Coverage gate.** `bun run coverage:gate` enforces line-coverage minimums for each suite: unit 74%, integration 58%, and 73% for the combined view.
- **Level checks.** `bun scripts/validate-level.ts <id>` checks one map, and `--all` checks all eight worlds.

## Continuous integration

- Every push to `main` runs the full verification: typecheck, unit and integration tests with coverage, architecture and level checks, the coverage gate, the distribution build and the end-to-end smoke test.
- The release workflow runs manually at phase quality gates (`workflow_dispatch`). It checks `main` again, moves the `release` branch to the verified commit, and creates a versioned GitHub Release with the game archive.
- Pushing `release` deploys the wiki and the game to GitHub Pages.

## Phases and quality gates

Work runs in phases, and each phase is tied to a version (phase 4 is 0.3.x). A phase ends with a quality gate: a docs check, a docs update, a review, a release and a version bump. The roadmap and the per-phase task cards are in the repository's `docs/tasks/` folder.
