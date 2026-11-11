# 🧱 Vibrant Castle — AI Operating Hub & Backlog

## 1. Project Overview & Mission Statement

*Vibrant Castle* is a metroidvania. Design direction (canonical: `docs/manifesto/MASTERMAP.md` §1, "Design Pillars"):

* **Movement** feels like *Mario*.
* **Maps, heroes and enemies** follow the style and feeling of *Castlevania: Aria of Sorrow*.
* **Palette and mood** are autumn.
* **Narration** follows *Bastion*.
* **Gameplay** is simplified Castlevania, good on keyboard or pad. The pad layout is restricted to 2 triggers, 4 face buttons, and bumpers used as action selectors.
* **Menu** has two levels: one for the game, one for development.

* **Simulation Core (`src/game/`)**: Deterministic Canvas 2D engine with decoupled fixed-update tick loop (30/60/90/120 Hz). Pure TypeScript, zero UI dependencies.
* **Presentation Layer (`src/game-menu/`, `src/hud/`, `src/ui/`)**: Passive React 19 UI overlay consuming immutable engine snapshots via React Context (`src/context/`).
* **Content Layer (`src/data/`)**: Universal declarative JSON schemas as the Single Source of Truth (SSOT).
* **Tooling**: Built and managed strictly with **Bun**. Node.js and npm are prohibited.

---

## 2. 4-Pillar Documentation Map

All AI assistants must consult the authoritative documentation pillars rather than guessing architectural contracts:

| Pillar | Location | Primary Purpose & Contents |
| :--- | :--- | :--- |
| **Organizer & Backlog** | [`AGENTS.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/AGENTS.md) | **AI Executive Dispatcher**. Project mission, active sprint milestone, tooling commands, and task backlog. |
| **Engineering Rules** | [`.agents/rules/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules) | **How to write code & work**. Mandatory standards: [`development_workflow.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/development_workflow.md) (Phase-Gate protocol), [`code_cleanliness.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/code_cleanliness.md) (no `new Error`, no `any`), [`engine_architecture.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/engine_architecture.md), [`frontend_ui.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/frontend_ui.md), [`testing_standards.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/testing_standards.md), [`content_and_assets.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/.agents/rules/content_and_assets.md). |
| **System Specifications** | [`docs/manifesto/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto) | **How the system works in runtime**. Canonical specifications: [`MASTERMAP.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/MASTERMAP.md) (Design Pillars & Roadmap M0–M3), [`CICD.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/CICD.md) (Two-branch CI/CD & GitHub Pages), [`ENGINEERING.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/ENGINEERING.md) (Loop, clocks, asset lifecycle & EventBus), [`PARALLAX_AND_RENDERING.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/PARALLAX_AND_RENDERING.md) (5 layers, FAR opaque rule, parallax geometry, culling, atlas tiers), [`GAMEPLAY.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/GAMEPLAY.md) (Combat & Kinematics), [`USERINTERFACE.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/USERINTERFACE.md) (Context & Design System), [`CONTENT_PIPELINE.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/CONTENT_PIPELINE.md) (Schemas, Bestiary, sprite/atlas tooling & level validator). |
| **Narrative Lore** | [`docs/lore/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/lore) | **World, characters & story**. Citadel sectors, Duelist lore (Valen / Aurelia), reactive narrator scripts. |

---

## 3. Tooling & Execution Quick-Reference (Bun Only)

```bash
bun dev              # Launch local development server (Vite, port 3000)
bun run typecheck    # Static TypeScript typecheck (tsc --noEmit)
bun run lint         # Static TypeScript verification (tsc --noEmit)
bun test:unit        # Execute AAA unit test suite (1574 pass)
bun test:integration # Execute integration test suite (105 pass)
bun test:scripts     # Execute tooling & scripts test suite (105 pass)
bun test:arch        # Execute AST Architecture & Boundary test suite (124 pass)
bun test:e2e         # Execute distribution package smoke test suite (6 pass)
bun test             # Execute full test suite
bun run coverage:gate # Evaluate test suite coverage quality gates
bun run build:game   # Compile pure production game client (src/)
bun run build:pages  # Full production distribution assembly (dist/)
bun run build        # Production bundle build & packaging check

# Content tooling
bun scripts/validate-level.ts <id>     # Level-logic validator for one location (exit 1 on ERROR)
bun scripts/sprites/compile.ts <id>    # Compile NES/SNES class enemy SVG sheets (--all, --check, --preview <dir>)
bun scripts/repack-atlas.ts <id>       # Repack an AI sheet into a grid-clean *_packed_high.png (--all, --dry-run, --overlay <dir>)
bun scripts/check-parallax-seams.ts    # Report horizontal seam quality of src/assets/bg layers (warn layers need mirrorTile)
```

---

## 4. Current Milestone: M1 — Courtyard & Duelists

* **Milestone M0 (Deterministic Core)**: COMPLETED.
* **Active Milestone M1**: Implementation and polish of the Courtyard sector, dual-duelist combat mechanics (Valen / Aurelia), inventory paperdoll, and visual novel dialogues.
* **Delivered on `feat/sprites-enemies-maps`**: five rebuilt maps (6000-8000 px wide, clocktower 3000 px tall) validated by the level-logic suite, 19 enemy templates with 11 NES/SNES class SVG sheets, grid-clean repacked PNG sheets, atlas quality tiers, view culling, parallax geometry with mirrored tiles, background preload/eviction, levers that open their gate.
* **Still open for M1**: enemies deal no damage and only patrol; no ability gating; pad layout does not match the design restriction; in-game visual novel and reactive narrator are not wired. See backlog.

---

## 5. Active AI Engineering Backlog (TODO)

* [x] `[CI/CD]` Implement multi-stage CI/CD pipeline on Bun with main/release branching, promotion gate, and GitHub Pages deployment.
* [ ] `[ENGINE]` Calibrate subpixel camera damping in `src/game/engine/cameraManager.ts` under ultrawide aspect ratios.
* [ ] `[COMBAT]` Polish enemy stagger recovery and hurtbox invulnerability frames during dual-champion co-op strikes.
* [ ] `[COMBAT]` Validate poise reduction thresholds for boss-type constructs in `src/game/engine/combatSystem.ts`.
* [ ] `[UI]` Implement choice branching tree for visual novel scenes in `src/game-menu/character/`.
* [x] `[UI]` Expand `@ui` Design System with accessible gothic modal focus-trap primitives, Base UI, CVA, and semantic tokens.
* [ ] `[CONTENT]` Verify slicing presets in Atlas Studio for new clockwork gargoyle and lever variants.
* [ ] `[LORE]` Complete narrative trigger manifests for Act 1 Courtyard transitions in `src/data/narrative/`.

Delivered by `feat/sprites-enemies-maps`:

* [x] `[CONTENT]` Pixel sprite compiler (`scripts/sprites/`), NES/SNES class SVG sheets for 11 enemies, atlas repack tool (`scripts/repack-atlas.ts`) and frame-geometry tests.
* [x] `[CONTENT]` Rebuild all five maps and add the level-logic validator (`src/tests/arch/levelLogic.test.ts`, `scripts/validate-level.ts`) with design grammar in `.agents/rules/content_and_assets.md` §7.
* [x] `[ENGINE]` Atlas quality tiers with fallback chain and one-time SVG rasterisation; enemy atlas auto-discovery and `bodyBox` scaling.
* [x] `[ENGINE]` View culling, parallax upscale cap with mirrored tiles, location background preload/eviction, simulation-owned enemy and structure animation clocks.
* [x] `[ENGINE]` Levers open their `targetGateId` gate.

Gaps found by the design-pillar audit (see `docs/manifesto/MASTERMAP.md` §1.2):

* [ ] `[COMBAT]` Enemy contact damage and attacks: enemies only patrol (`src/game/physics/physics.ts`); add telegraphed attacks, player damage, knockback and the `attack` animation rows that sheets already carry.
* [ ] `[ENGINE]` Ability gating for a true metroidvania structure: portals only carry unused `isLocked`/`unlockTriggerId` fields; add ability pickups (e.g. double jump, dash) that gate routes and force backtracking, and make the level validator aware of them.
* [ ] `[ENGINE]` Mario-feel pass on movement: add run/sprint tier, tune acceleration and turn-around, review the fixed apex float threshold (1.8) and squash/stretch against the pillar.
* [ ] `[UI]` Pad layout restricted to 2 triggers, 4 face buttons and bumpers as action selectors: today bumpers and triggers are bound directly to magic1/potions in `src/data/defaults/defaultControls.json`; introduce selector semantics (LB/RB cycle spell and potion slot, triggers fire) and update the gamepad mapper and help.
* [ ] `[UI]` Two-level menu: game menu (menu, help, inventory, skills) and a separate development level; today the developer modal is a fifth tab ("C") in the same navigation bar, gated only by `showCreationTab`.
* [ ] `[ENGINE]` In-game opening animation for gates; today `openGate` in `src/game/locations/leverGateUnlock.ts` teleports the gate to `y = -1000`. Needs a collision flag instead of the off-screen hack.
* [ ] `[CONTENT]` Painted (`high`) sheets for the 11 enemies that only have NES/SNES class SVG tiers (only `training_dummy` and `clockwork_owl_gargoyle` have painted sheets).
* [ ] `[CONTENT]` Art for `shadow_knight`: the template exists in `enemies.json` but no sheet folder exists, so it renders procedurally.
* [ ] `[CONTENT]` Register the remaining structure sheets (`chrono_lever`, `grand_portcullis`, `hazard_thorns`) as atlases and repack them; only `aether_gate` is registered.
* [ ] `[CONTENT]` Autumn palette review of `aether_sanctuary` (blue/cyan theme) and the UI Aurelia cyan identity against the autumn pillar.
* [ ] `[LORE]` Wire the Bastion-style narrator: `ReactiveNarratorManager` and `DialogueGraphRunner` (`src/game/logic/narrative/`) are not connected to the engine; runtime narration is timed subtitles from i18n keys (`narrationSystem.ts`). Connect `narrator_reactive.json` events (hazard, lever, low health, boss) and `triggers.json`.

---

## 6. Hard Architectural Invariants

1. **Bun Runtime Discipline**: Never run or propose `npm`, `npx`, `yarn`, or `pnpm` commands.
2. **Layer Isolation**: Game engine (`src/game/`) must remain pure TypeScript with zero DOM/React imports.
3. **Passive UI Axiom**: React 19 is strictly a presentation overlay ($UI = f(\text{Snapshot})$). No gameplay state in React.
4. **Structured Error Hierarchy**: `new Error(...)` is strictly forbidden in production code; use structured domain classes inheriting from `GameBaseError`.
5. **Zero Render Allocations & FAR Opaque**: No object allocations inside `render()` loops. Parallax layer `FAR` must be 100% opaque without alpha transparency (`opaque: true`).
