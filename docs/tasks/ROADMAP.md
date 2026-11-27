# Vibrant Castle: roadmap

Updated: 2026-11-28. The [vision](./VISION.md) says what we are building. The [task folder README](./README.md) explains the card format and indexes the phase files, which hold the cards. This file is the overview: in which phase each part lands.

## How phases work

- Each phase is tied to one minor version. Phase N ships as `0.(N-1).x`.
- Phase 4 is current, with version `0.3.x` (`package.json` is `0.3.0`).
- Closing a phase starts the next phase and the next minor version. Closing phase 4 starts phase 5 and `0.4.0`.
- Releases and version bumps happen only at a phase gate. A hotfix release inside a phase needs the owner's decision.
- **Patch number.** Every build on `main` gets a patch number. `package.json` holds only `major.minor` (`x.y.0`), and the minor is bumped at a gate. The patch is the number of first-parent commits on `main` since the commit that set the current minor, so it restarts at 0 after every minor bump. `bun scripts/version.ts` prints the version. `build:pages` writes it into the game (`__APP_VERSION__`), `dist/version.json` and the wiki footer, and `release-promote` uses it for the tag and the zip (`v0.3.<patch>`). Nothing is committed back to `main`.
- Every card lives in its phase file (`phase-N-0.M.x.md`) and has a `Phase` field. A card that is not done when its phase closes is moved to the next phase file on purpose, at the gate.

### Quality gate (end of every phase, in this order)

1. **Docs quality and conformance check.** The docs match the code: paths, commands, test names, counts and behaviour. Fix or file every mismatch.
2. **Docs update.** Update the vision, roadmap, phase files, `AGENTS.md`, `.agents/rules/`, the README, lore and wiki to the phase's final state.
3. **General review.** Review the phase's changes against `.agents/rules/`. Check for regressions, dead code and open risks. Run the full suite and a headless browser pass.
4. **Release.** Promote `main` through the release workflow and publish the release artifacts.
5. **Version bump.** Only after the release: bump the minor version, which opens the next phase.

The orchestrator runs the gate as one `review` / `workflow` card per phase (phase 4: VC-090). The owner approves the bump.

---

## Phase 1: engine core (0.0.x, history)

Summary: [phase-1-0.0.x.md](./phase-1-0.0.x.md).

**Built:** the deterministic fixed-step loop, AABB collisions, `GameEventBus`, the `GameBaseError` hierarchy and logger, React contexts, the developer suite and the first AST architecture tests. Ended 2026-10-25.

## Phase 2: specifications (0.1.x, history)

Summary: [phase-2-0.1.x.md](./phase-2-0.1.x.md).

**Built:** the canonical system specifications (manifesto) and the removal of obsolete policies. A short documentation phase. Ended 2026-10-25.

## Phase 3: playable vertical slice (0.2.x, history)

Summary: [phase-3-0.2.x.md](./phase-3-0.2.x.md) (PRs #1-#61).

**Built:**
- the UI split into `src/game-menu` / `src/hud` / `src/ui` with Base UI and semantic tokens;
- the GitHub Pages distribution, multi-stage CI and the coverage gate;
- five rebuilt maps with the level-logic validator, enemy sheets and atlas quality tiers;
- the art pipeline (hero hi-bit sheets, tilesets, decor props, gate opening).

Closed by the bump to `0.3.0` on 2026-11-14.

## Phase 4: stabilise and set direction (0.3.x, current)

Cards and the "phase 4 so far" summary: [phase-4-0.3.x.md](./phase-4-0.3.x.md).

**Goal:** recover from the post-0.3.0 cleanup (2784276), which deleted tilesets, props, the sprite pipeline, tests and docs. Rebuild the menu to the two-level design. Restore the docs, the tests and the CI gates. Write the design contracts that phase 5 builds on: maps and characters.

**Exit criteria:**
- all suites are green and the coverage gate is restored;
- assets render at every tier;
- the menu is one game dialog, and the dev dialog appears in dev builds only;
- the docs match the code;
- the map and character contracts are approved.

| Area | Planned | Done |
| :--- | :--- | :--- |
| [Stabilisation](./phase-4-0.3.x.md#a-stabilisation) | | VC-001 (#62), VC-002 (#65), VC-003 (#71), VC-004 (#76), VC-005 (#69), VC-006 (#70), VC-007 (#85) |
| [Assets](./phase-4-0.3.x.md#b-assets-and-rendering) | | VC-010 (#92), VC-012 (#101) |
| [Design contracts](./phase-4-0.3.x.md#c-world-and-maps-8-worlds-x-8-maps-today-map-1-of-each-world) | | VC-020 (#77), VC-030 (#78) |
| [Inventory](./phase-4-0.3.x.md#d-characters-stats-and-equipment) | | VC-035 (#117) |
| [Menu](./phase-4-0.3.x.md#e-menu-plan-docsdesignmenu-ux-planmd) | | VC-040 (#63), VC-041 (#68), VC-042 (#74), VC-043 (#81), VC-044 (#84), VC-045 (#94), VC-046 (#80), VC-047 (#99) |
| [Docs, settings, controls](./phase-4-0.3.x.md#f-docs-settings-and-controls) | | VC-050 (#88), VC-051 (#90), VC-052 (#66), VC-053 (#67), VC-054 (#73), VC-055 (#75), VC-056 (#93), VC-057 (#72), VC-058 (#120), VC-082 (#102, #128), VC-083 (#106) |
| [CI and tests](./phase-4-0.3.x.md#g-ci-and-tests) | | VC-060 (#83), VC-061 (#129), VC-062 (#86, #97, #100, #137), VC-063 (#79) |
| [Developer tools & playtests](./phase-4-0.3.x.md#h-developer-tools-and-review) | | VC-070 (#132), VC-071 (#87), VC-072 (#82), VC-073 (#95), VC-074 (#96), VC-075 (#126), VC-076 (#121), VC-081 (#131), VC-084 (#144), VC-085 (#143) |
| [Parallax series](./phase-4-0.3.x.md#p-parallax-series-owner-request-2026-11-27) | *(VC-109b moved to Phase 5)* | VC-100 (#108), VC-101 (101a #109, 101b #114, 101c #123), VC-102 (102a #110, 102b #116), VC-103 (#130), VC-104 (#125), VC-105 (105a #113, 105b #134), VC-106 (#111), VC-107 (#112), VC-108 (r1 #142, r2 #145, r3 #146), VC-109a (#138) |
| [Asset animation fixes](./phase-4-0.3.x.md#q-asset-animation-fixes) | | VC-120 (#133), VC-121 (#124), VC-122 (#135), VC-123 (#136), VC-124 (#127) |
| [Quality gate](./phase-4-0.3.x.md#z-phase-gate) | VC-090 (in-progress) | VC-089 (#147) |

## Phase 5: worlds and characters (0.4.x, next)

Cards: [phase-5-0.4.x.md](./phase-5-0.4.x.md).

**Goal:**
- build on the contracts from phase 4: hybrid and fixed maps to the map contract (`VC-021`..`VC-028`) plus level-2 maps (`VC-161`);
- the attribute model in the engine (`VC-031`), monsters on the same scale (`VC-032`), progression trees, equipment, and Aether elements (`VC-033`, `VC-034`, `VC-038`, `VC-160`);
- the `hi16bit` build-time bake (`VC-011`), bestiary & world props (`VC-130`..`VC-133`), and repainting the remaining 3 JPG parallax worlds as 3-tier PNGs (`VC-109b`);
- gameplay & engine priorities: enemy damage (`VC-037`, `VC-152`), lever/i-frame/coyote/hitstun feel (`VC-150`..`VC-159`), zero-allocation & 60 Hz engine optimisation (`VC-162`..`VC-164`), parallax perf follow-ups (`VC-195`..`VC-197`), rest zones/loot/saves (`VC-167`, `VC-178`..`VC-180`), Tworzenie & UI polish (`VC-140`..`VC-145`, `VC-168`..`VC-169`, `VC-190`..`VC-194`), pad selector semantics, reactive narrator wiring (`VC-155`), and repo/CI/site hardening (`VC-181`..`VC-186`).

**Exit criteria:**
- 8 worlds each have a contract-compliant map 1 (and level-2 map);
- attributes drive HP/MP/Stamina and combat;
- enemies deal damage;
- the phase 5 quality gate (`VC-199`) passes.

| Area | Planned | Done |
| :--- | :--- | :--- |
| [Assets](./phase-5-0.4.x.md#b-assets-and-rendering) | VC-011, VC-109b | |
| [Bestiary and world props](./phase-5-0.4.x.md#b2-bestiary-and-world-props) | VC-130 … VC-133 | |
| [Maps](./phase-5-0.4.x.md#c-world-and-maps-8-worlds-x-8-maps-today-map-1-of-each-world) | VC-021 … VC-025, VC-026 … VC-028, VC-161 | |
| [Characters, combat & balance](./phase-5-0.4.x.md#d-characters-stats-and-equipment) | VC-031, VC-032, VC-033, VC-034, VC-036, VC-037, VC-038, VC-080, VC-160 | |
| [Engine optimisation](./phase-5-0.4.x.md#e-engine-optimisation) | VC-162, VC-163, VC-164 | |
| [Lore, fun and saving](./phase-5-0.4.x.md#f-lore-fun-and-saving) | VC-165, VC-166, VC-167 | |
| [Menu, Tworzenie and loot](./phase-5-0.4.x.md#g-menu-tworzenie-and-loot) | VC-168, VC-169, VC-178, VC-179, VC-180 | |
| [Developer tools & parity](./phase-5-0.4.x.md#h-developer-tools-and-review) | VC-140 … VC-145 | |
| [Repo, CI and site](./phase-5-0.4.x.md#i-repo-ci-and-site) | VC-181 … VC-186 | |
| [Gameplay feel & playtest polish](./phase-5-0.4.x.md#j-gameplay-feel-combat-narration--hud-from-vc-084-playtest) | VC-150 … VC-159, VC-190 … VC-194 | |
| [Parallax perf follow-ups](./phase-5-0.4.x.md#l-parallax-perf-follow-ups-from-vc-108-round-3) | VC-195, VC-196, VC-197 | |
| Gameplay gaps (card to be written) | pad layout with bumpers as selectors in gameplay | |
| [Quality gate](./phase-5-0.4.x.md#z-phase-gate) | VC-199 | |

## Later phases (outline)

- **Phase 6 (0.5.x): metroidvania depth.** Ability pickups that gate routes, a map screen and maps 2-8 of the first worlds. Also a Mario-feel tuning pass and painted `high` sheets for the enemies that only have SVG tiers.
- **Phase 7 (0.6.x): story and co-op.** The in-game visual novel and dialogue graph, Bastion narration that reacts to play style, two-player co-op polish and bosses.
- **Phase 8+ (towards 1.0): full campaign.** All 8 x 8 maps, the autumn palette review of every world, EN/PL parity in all content, and release hardening.

These outlines become task cards only when their phase is next.
