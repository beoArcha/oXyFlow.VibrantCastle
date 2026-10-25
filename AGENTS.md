# 🧱 Vibrant Castle — AI Operating Hub & Backlog

## 1. Project Overview & Mission Statement

*Vibrant Castle* is a responsive, gothic fantasy action-adventure platformer marrying *Castlevania*-style combat, *Bastion*-inspired warm atmospheric lighting, and *Owlboy*-level pixel art clarity.

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
| **System Specifications** | [`docs/manifesto/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto) | **How the system works in runtime**. Canonical specifications: [`MASTERMAP.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/MASTERMAP.md) (Roadmap M0–M3), [`CICD.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/CICD.md) (Two-branch CI/CD & GitHub Pages), [`ENGINEERING.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/ENGINEERING.md) (Loop & EventBus), [`PARALLAX_AND_RENDERING.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/PARALLAX_AND_RENDERING.md) (5 layers & FAR opaque rule), [`GAMEPLAY.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/GAMEPLAY.md) (Combat & Kinematics), [`USERINTERFACE.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/USERINTERFACE.md) (Context & Design System), [`CONTENT_PIPELINE.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/manifesto/CONTENT_PIPELINE.md) (Schemas & Bestiary). |
| **Narrative Lore** | [`docs/lore/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/docs/lore) | **World, characters & story**. Citadel sectors, Duelist lore (Valen / Aurelia), reactive narrator scripts. |

---

## 3. Tooling & Execution Quick-Reference (Bun Only)

```bash
bun dev              # Launch local development server (Vite, port 3000)
bun run typecheck    # Static TypeScript typecheck (tsc --noEmit)
bun run lint         # Static TypeScript verification (tsc --noEmit)
bun test:unit        # Execute AAA unit test suite (1310 pass)
bun test:integration # Execute integration test suite (94 pass)
bun test:arch        # Execute AST Architecture & Boundary test suite (84 pass)
bun test:e2e         # Execute distribution package smoke test suite (6 pass)
bun test             # Execute full test suite
bun run build:pages  # Full production distribution assembly (dist/)
bun run build        # Production bundle build & packaging check
```

---

## 4. Current Milestone: M1 — Courtyard & Duelists

* **Milestone M0 (Deterministic Core)**: COMPLETED.
* **Active Milestone M1**: Implementation and polish of the Courtyard sector, dual-duelist combat mechanics (Valen / Aurelia), inventory paperdoll, and visual novel dialogues.

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

---

## 6. Hard Architectural Invariants

1. **Bun Runtime Discipline**: Never run or propose `npm`, `npx`, `yarn`, or `pnpm` commands.
2. **Layer Isolation**: Game engine (`src/game/`) must remain pure TypeScript with zero DOM/React imports.
3. **Passive UI Axiom**: React 19 is strictly a presentation overlay ($UI = f(\text{Snapshot})$). No gameplay state in React.
4. **Structured Error Hierarchy**: `new Error(...)` is strictly forbidden in production code; use structured domain classes inheriting from `GameBaseError`.
5. **Zero Render Allocations & FAR Opaque**: No object allocations inside `render()` loops. Parallax layer `FAR` must be 100% opaque without alpha transparency (`opaque: true`).
