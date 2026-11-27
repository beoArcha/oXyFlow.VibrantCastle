# Vibrant Castle: roadmap

Updated: 2026-11-27. The [vision](./VISION.md) says what we are building. The [task board](./task-board.md) holds the cards. This file says in which phase each part lands.

## How phases work

- Each phase is tied to one minor version. Phase N ships as `0.(N-1).x`.
- Phase 4 is current, with version `0.3.x` (`package.json` is `0.3.0`).
- Closing a phase starts the next phase and the next minor version. Closing phase 4 starts phase 5 and `0.4.0`.
- Releases and version bumps happen only at a phase gate. A hotfix release inside a phase needs the owner's decision.
- Every card on the task board has a `Phase` field. A card that is not done when its phase closes is moved to the next phase on purpose, at the gate.

### Quality gate (end of every phase, in this order)

1. **Docs quality and conformance check.** The docs match the code: paths, commands, test names, counts and behaviour. Fix or file every mismatch.
2. **Docs update.** Update the vision, roadmap, task board, `AGENTS.md`, `.agents/rules/`, the README, lore and wiki to the phase's final state.
3. **General review.** Review the phase's changes against `.agents/rules/`. Check for regressions, dead code and open risks. Run the full suite and a headless browser pass.
4. **Release.** Promote `main` through the release workflow and publish the release artifacts.
5. **Version bump.** Only after the release: bump the minor version, which opens the next phase.

The orchestrator runs the gate as one `review` / `workflow` card per phase (phase 4: VC-090). The owner approves the bump.

---

## Phase 1: engine core (0.0.x, history)

**Built:** the deterministic fixed-step loop, AABB collisions, `GameEventBus`, the `GameBaseError` hierarchy and logger, React contexts, the developer suite and the first AST architecture tests. Ended 2026-10-25.

## Phase 2: specifications (0.1.x, history)

**Built:** the canonical system specifications (manifesto) and the removal of obsolete policies. A short documentation phase. Ended 2026-10-25.

## Phase 3: playable vertical slice (0.2.x, history)

**Built:**
- the UI split into `src/game-menu` / `src/hud` / `src/ui` with Base UI and semantic tokens;
- the GitHub Pages distribution, multi-stage CI and the coverage gate;
- five rebuilt maps with the level-logic validator, enemy sheets and atlas quality tiers;
- the art pipeline (hero hi-bit sheets, tilesets, decor props, gate opening).

Closed by the bump to `0.3.0` on 2026-11-14.

## Phase 4: stabilise and set direction (0.3.x, current)

**Goal:** recover from the post-0.3.0 cleanup (2784276), which deleted tilesets, props, the sprite pipeline, tests and docs. Rebuild the menu to the two-level design. Restore the docs, the tests and the CI gates. Write the design contracts that phase 5 builds on: maps and characters.

**Exit criteria:**
- all suites are green and the coverage gate is restored;
- assets render at every tier;
- the menu is one game dialog, and the dev dialog appears in dev builds only;
- the docs match the code;
- the map and character contracts are approved.

| Area | Planned | Done |
| :--- | :--- | :--- |
| Stabilisation | VC-004 | VC-001 (#62), VC-002 (#65), VC-003 (#71), VC-005 (#69), VC-006 (#70) |
| Assets | VC-010, VC-012 | |
| Design contracts | VC-020, VC-030 | |
| Inventory | VC-035 | |
| Menu | VC-042, VC-043, VC-044, VC-045, VC-046 | VC-040 (#63), VC-041 (#68) |
| Docs, settings, controls | VC-050, VC-051, VC-054, VC-055, VC-056, VC-057 | VC-052 (#66), VC-053 (#67) |
| CI and tests | VC-060, VC-061, VC-062, VC-063 | |
| Developer tools | VC-070, VC-071, VC-072, VC-081 | |
| Quality gate | VC-090 | |

## Phase 5: worlds and characters (0.4.x, next)

**Goal:**
- build on the contracts from phase 4: hybrid and fixed maps to the map contract;
- the attribute model in the engine, monsters on the same scale, progression trees and equipment;
- the `hi16bit` build-time bake;
- first gameplay gaps from the vision: enemy attacks, pad selector semantics, narrator wiring.

**Exit criteria:**
- 8 worlds each have a contract-compliant map 1;
- attributes drive HP/MP/Stamina and combat;
- enemies deal damage;
- the phase 5 quality gate passes.

| Area | Planned | Done |
| :--- | :--- | :--- |
| Assets | VC-011 | |
| Maps | VC-021 … VC-025, VC-026 … VC-028 | |
| Characters and balance | VC-031, VC-032, VC-033, VC-034, VC-080 | |
| Inventory visuals | VC-036 | |
| Gameplay gaps (cards to be written) | enemy attacks and contact damage; pad layout with bumpers as selectors in gameplay; reactive narrator wired to the engine | |
| Quality gate | phase 5 gate card (to be written) | |

## Later phases (outline)

- **Phase 6 (0.5.x): metroidvania depth.** Ability pickups that gate routes, a map screen and maps 2-8 of the first worlds. Also a Mario-feel tuning pass and painted `high` sheets for the enemies that only have SVG tiers.
- **Phase 7 (0.6.x): story and co-op.** The in-game visual novel and dialogue graph, Bastion narration that reacts to play style, two-player co-op polish and bosses.
- **Phase 8+ (towards 1.0): full campaign.** All 8 x 8 maps, the autumn palette review of every world, EN/PL parity in all content, and release hardening.

These outlines become task cards only when their phase is next.
