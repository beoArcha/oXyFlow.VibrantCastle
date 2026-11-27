# Technical Architecture

Vibrant Castle separates a deterministic simulation from a passive presentation layer. The rules are in `.agents/rules/`, and architecture tests in `src/tests/arch/` enforce them.

## The layers

- **Content (`src/data/`, `src/assets/`).** Declarative JSON is the single source of truth for maps, enemies and controls. Art comes in tiers as PNG and SVG files.
- **Simulation (`src/game/`).** A pure TypeScript engine on Canvas 2D. It has no React or DOM imports. It runs a fixed-step loop at 30, 60, 90 or 120 Hz (default 60 Hz), and rendering interpolates between steps.
- **Presentation (`src/game-menu/`, `src/hud/`, `src/ui/`).** A passive React 19 overlay: the interface is a function of an immutable snapshot of the engine state. It never changes gameplay state directly.
- **Bridge (`src/context/`).** Typed React contexts carry commands from the interface to the engine, and snapshots and domain events back.

Discrete events go through `GameEventBus`. Continuous state goes through immutable snapshots.

## Rules that are enforced

- The engine has zero UI dependencies.
- Production code uses domain error classes that inherit from `GameBaseError`, not plain `Error`.
- Render loops do not allocate objects.
- Map data is checked by a level validator: `bun scripts/validate-level.ts <id>` confirms that a map can be finished.

## Parallax

Backgrounds use five depth tiers: `FAR` (an opaque sky), `MID_FAR` (distant architecture), `MID` (ramparts behind the gameplay plane), `MID_CLOSE` (near stonework) and `CLOSE` (foreground flora). They scroll at different speeds, and layers that are too small are mirrored to tile without seams.

## Build and checks

- `bun run build:pages` builds the wiki portal and the game under `/game/` into `dist/`.
- `bun test:unit`, `bun test:integration`, `bun test:arch`, `bun test:e2e` and `bun test:scripts` run the suites. A coverage gate runs per suite in CI.
- The release workflow promotes `main` and publishes the artifacts at a phase gate.
