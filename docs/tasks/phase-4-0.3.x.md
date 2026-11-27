# Phase 4: stabilise and set direction (0.3.x, current)

Updated: 2026-11-27. Part of the [task folder](./README.md). Phases, gates and the card format are described in the [README](./README.md) and the [roadmap](./ROADMAP.md).

## About this phase

**Goal:** recover from the post-0.3.0 cleanup (2784276), which deleted tilesets, props, the sprite pipeline, tests and docs. Rebuild the menu to the two-level design. Restore the docs, the tests and the CI gates. Write the design contracts that phase 5 builds on: maps and characters.

**Exit criteria:**
- all suites are green and the coverage gate is restored;
- assets render at every tier;
- the menu is one game dialog, and the dev dialog appears in dev builds only;
- the docs match the code;
- the map and character contracts are approved.

**Quality gate checklist** (card VC-090, run in this order; detail in [ROADMAP.md](./ROADMAP.md#quality-gate-end-of-every-phase-in-this-order)):
- [ ] 1. Docs quality and conformance check: docs match the code (paths, commands, test names, counts, behaviour).
- [ ] 2. Docs update: vision, roadmap, task files, `AGENTS.md`, `.agents/rules/`, README, lore and wiki at the phase's final state.
- [ ] 3. General review against `.agents/rules/`: regressions, dead code, open risks; full suite and a headless browser pass.
- [ ] 4. Release: promote `main` through the release workflow and publish the release artifacts.
- [ ] 5. Version bump to `0.4.0`, approved by the owner. Unfinished cards move to [phase 5](./phase-5-0.4.x.md).

## Phase 4 so far

**The regression (2026-11-26/27).** Right after the `0.3.0` release (8121dad), six direct commits on `main`, 2784276..c4758f3, rewrote the project:
- 2784276 "cleanup project dependencies and asset paths" touched 686 files and deleted about 78,000 lines: the platform tilesets, the decor props, the `scripts/sprites` and `scripts/atlas` pipelines, the hero pixel and packed sheets, the enemy hi8bit/hi16bit SVGs, about 775 tests, `bunfig.toml` (the test preload), lore and the manifesto specs.
- 1e331f1, 422aec1, 48ae45d and 7593c8c centralised parallax resolution and character stats, replaced the CI workflows and moved the HUD controls into the header.
- c4758f3 added freeform slicing data and rewrote the owl gargoyle meta.

The result: red tests and CI, levers that no longer opened gates, broken hero and owl slicing, floors drawn by the procedural fallback, HP above maximum, a jumpy vertical camera, a dev dialog mixed into the game menu, and docs that no longer matched the code.

**The audit.** The regression range was audited against 8121dad. Every finding became a card on the board (VC-001..VC-090). The owner added the direction decisions at the same time: phases tied to versions, a quality gate per phase, the two-level menu, the map contract and the character system ([VISION.md](./VISION.md), [ROADMAP.md](./ROADMAP.md)).

**Recovery PRs #62-#88 (all merged except #77 and #78):**
- Stabilisation: #62 test preload, lockfile and levers; #65 hero and owl slicing; #71 tilesets, props, art pipeline and enemy sprites; #85 platform tilesets back on the prefabs; #69 HP clamp; #70 vertical camera.
- Menu: #63 separate dev dialog and labels; #68 single game dialog shell; #74 game tab layout with Settings sub-tabs; #81 confirmations, HUD toggles, empty states; #80 dev dialog in dev builds only; #84 gamepad and keyboard tab navigation.
- Settings and UI: #66 saved language; #67 reserved-key rebind guard; #73 settings persistence tests; #75 scroll on narrow screens.
- Dev tools: #76 asset readiness audit reads real files; #82 real names instead of raw ids; #87 atlas studio split.
- CI and tests: #79 parallax files arch test; #83 per-suite coverage gate and integration tests on PRs; #86 character and error-boundary tests (VC-062 part 1).
- Docs: #64 task board and menu UX plan; #72 roadmap, phases and orchestration rules; #88 lore and system specifications restored. In review: #77 map contract, #78 character system spec.

**Learned so far:** direct pushes to `main` bypassed every gate, so all work now goes through one small PR per card with CI and review. Restoring from the last good commit (8121dad) and adapting is faster than rewriting. Arch tests (`locationLinks`, `atlasMetaConsistency`, `parallaxFiles`, `platformTilesets`) now catch the classes of breakage seen in the regression.

## Status

| Status | Cards |
| :--- | :--- |
| done | VC-001, VC-002, VC-003, VC-004, VC-005, VC-006, VC-007, VC-040, VC-041, VC-042, VC-043, VC-044, VC-046, VC-050, VC-052, VC-053, VC-054, VC-055, VC-057, VC-060, VC-063, VC-071, VC-072 |
| review | VC-020 (#77), VC-030 (#78) |
| in-progress | VC-051, VC-062 |
| ready | VC-010, VC-035, VC-045, VC-056 |
| todo | VC-012, VC-047, VC-061, VC-070, VC-073, VC-074 |
| blocked | VC-090 (the gate) |

---

## A. Stabilisation

### VC-001 · Critical fixes: test preload, lockfile, levers
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#62)
- **Goal:** green tests and CI; levers open their gates.
- **Description:** restored `bunfig.toml`, synced `bun.lock`, lever activation without `triggerId`, new arch test `locationLinks`.
- **How (AI):** done. Keep `locationLinks.test.ts` passing when editing maps.

### VC-002 · Slicing for Valen, Aurelia and the owl
- **Phase:** 4 · **Type:** fix · **Class:** medium · **Status:** done (#65)
- **Goal:** every animation frame shows one whole figure, feet on one line, at every tier.
- **Description:** 2784276 deleted the pixel and packed sheets, and `characterManifests.ts` hard-codes a 12x8 grid against a 14-column meta. The `clockwork_owl_gargoyle` meta was rewritten in c4758f3.
- **How (AI):**
  1. Restore correct sheets and metas from 8121dad, or fix the meta.
  2. Derive the grid and pivot from the meta.
  3. Add the arch test `atlasMetaConsistency` (meta against PNG/SVG size).
  4. Attach a frame contact sheet per sheet and tier.

### VC-003 · Restore tilesets, props, art pipeline and enemy sprites
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** done (#71)
- **Goal:** floors and props render from art again, and generated assets can be rebuilt.
- **Description:** branch `fix/restore-tiles-props-pipeline`. Restores 24 tile files, 33 prop files, `scripts/sprites`, `scripts/atlas`, repack and seams with 20 tests, and the enemy hi8/hi16 SVGs and metas from 8121dad. Removes `public/assets/aistudio`.
- **How (AI):** rebase after VC-002 merges. All hero-grid tests must pass with the restored packed metas.

### VC-004 · Asset readiness audit reads real files
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#76)
- **Goal:** the Poziomy 8x8 tab shows the true asset status.
- **Description:** `assetReadinessAudit.ts` hard-codes the tileset row as missing (0/4).
- **How (AI):** feed it from `discoverTilesetFiles` / `propDiscovery`, and add a unit test with a fake file map.

### VC-005 · HP above maximum in the inventory (165/135)
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#69)
- **Goal:** current HP never exceeds maximum HP.
- **Description:** seen in an inventory screenshot after the profile and stat changes in 422aec1.
- **How (AI):**
  1. Find where max HP is recomputed (profile, equipment).
  2. Clamp current HP on recompute and equip/unequip.
  3. Add a unit test.

### VC-006 · Vertical camera easing
- **Phase:** 4 · **Type:** fix · **Class:** tiny · **Status:** done (#70)
- **Goal:** the camera follows smoothly in tall levels.
- **Description:** 2784276 changed the vertical lerp to a fixed 0.14 when the distance exceeds 90 px.
- **How (AI):** use the shared `lerpFactor` or a configurable curve in `cameraManager.ts`, and add a unit test.

### VC-007 · Platform tilesets on floor and platform prefabs
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#85)
- **Goal:** floors and platforms render with tileset art again, not the procedural fallback.
- **Description:** follow-up to VC-003. The restored tilesets were not referenced by the floor and platform prefabs, so maps still drew the fallback.
- **How (AI):** done. Keep `platformTilesets.test.ts` passing when editing prefabs.

---

## B. Assets and rendering

### VC-010 · Three-tier asset policy and completeness test
- **Phase:** 4 · **Type:** test · **Class:** small · **Status:** ready (VC-003 done)
- **Goal:** every entity (hero, enemy, structure, prop, tile) has `hi8bit` SVG + `hi16bit` + high PNG.
- **Description:** the policy is that hi8bit is a simple SVG placeholder for every element, PNG ones included.
- **How (AI):**
  1. Add an arch test listing missing tiers per entity (report only, with an allowlist).
  2. Document the rule in the content-pipeline doc (VC-050).

### VC-012 · Generate missing hi8bit placeholders
- **Phase:** 4 · **Type:** art · **Class:** small · **Status:** todo (after VC-010)
- **Goal:** close the gaps that VC-010 reports.
- **Description:** simple limited-palette SVGs using the `scripts/sprites` define/compile flow.
- **How (AI):**
  1. Take one entity per task from the VC-010 report.
  2. Write a sprite definition, compile it, and attach a preview PNG for review.

---

## C. World and maps (8 worlds x 8 maps; today map 1 of each world)

### VC-020 · Map contract for the 8x8 campaign
- **Phase:** 4 · **Type:** plan · **Class:** large · **Status:** review (#77, draft)
- **Goal:** one set of rules before the eight map tasks start.
- **Description:** covers world and map slots, scale (baseline maps were larger and more coherent), and lever and gate pairs. Also covers entries and portals, parallax tiers, enemy density, and the Mario-like stage flow with Aria of Sorrow exploration and Bastion narration beats.
- **How (AI):**
  1. Read the baseline maps (8121dad) and the HEAD maps.
  2. Write `docs/design/maps-contract.md` (at most 2 pages).
  3. Extend `validate-level.ts` checks to enforce it.

---

## D. Characters, stats and equipment

### VC-030 · Character system design doc
- **Phase:** 4 · **Type:** plan · **Class:** large · **Status:** review (#78, draft)
- **Goal:** one approved spec before code.
- **Description:** six D&D-like attributes stored as D20 x10, any integer allowed. The level-1 average is fixed at 151. Player start values are 110-180; 180 is the starting maximum, not a cap. The player picks priorities 1/2/3, growth is automatic, and the rest grow slower than P3. HP/MP/Stamina derive from attributes and level. Monsters use the same scale.
- **Approved level 1** (STR/DEX/CON/INT/WIS/CHA):
  - Valen: 151/166/156/136/146/151
  - Aurelia: 131/152/136/176/162/149
- **How (AI):** write `docs/design/character-system.md`. Cover formulas, per-level growth table (e.g. P1 +6, P2 +4, P3 +3, others +1-2), level 1-30 curves, and the monster template. The owner approves it.

### VC-035 · Inventory UX, rebuilt from the baseline
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** ready (menu PR-2 done)
- **Goal:** better UX than both versions, built on the 8121dad inventory (paper doll).
- **How (AI):**
  1. Restore `inventory/*` from 8121dad into the current modal views.
  2. Add a stat comparison before equipping, a discard confirmation, and keyboard/pad grid navigation.

---

## E. Menu (plan: docs/design/menu-ux-plan.md)

### VC-040 · Menu PR-1: separate dev dialog, labels, width, F1
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#63)
- **Goal:** at most 2 tab rows, no raw keys, stable width.
- **How (AI):** done.

### VC-041 · Menu PR-2: single game dialog shell
- **Phase:** 4 · **Type:** refactor · **Class:** medium · **Status:** done (#68)
- **Goal:** one dialog with a fixed size; Wznów in the header.
- **How (AI):** new `GameMenuDialog`, `SkillTreeView` extracted, `Tabs wrap={false}`, Esc reopens the last tab. Tests per the plan.

### VC-042 · Menu PR-3: new tab layout and leaner Help
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** done (#74)
- **Goal:** tabs Gra · Mapa · Postać · Ekwipunek · Magia · Ustawienia(Obraz/Dźwięk/Sterowanie/Interfejs) · Pomoc.
- **How (AI):** new registries, `InterfaceTab`, Help deep link to Sterowanie, coordinator `openModal(id, subTab)`.

### VC-043 · Menu PR-4: confirmations, HUD toggles, empty states
- **Phase:** 4 · **Type:** feat · **Class:** small · **Status:** done (#81)
- **Goal:** confirm destructive actions (Anuluj focused by default); toggles work.
- **How (AI):** use `ConfirmDialog` for stats reset, discard, reset, restart, load and import. Wire `showControlsHint` and `showRpgButtons`.

### VC-044 · Menu PR-5: gamepad and keyboard navigation
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** done (#84)
- **Goal:** full menu use with the restricted pad.
- **How (AI):**
  1. Add `useMenuGamepad`: LB/RB = L1, LT/RT = L2, A/B/X/Y; holding LB+RB for 0.5 s opens the menu on pads without Start.
  2. Mirror it with Q/E and [ ] on the keyboard.
  3. Add a legend footer and menu input capture.

### VC-045 · Menu PR-6: gamepad mapping screen
- **Phase:** 4 · **Type:** feat · **Class:** small · **Status:** ready (VC-044 done)
- **Goal:** rebind the pad within the 2-trigger / 4-face / bumper layout.
- **How (AI):** restore `GamepadMapper` and `useGamepad` from 8121dad into Ustawienia > Sterowanie, with their tests.

### VC-046 · "Tworzenie" only in dev builds
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** done (#80)
- **Goal:** release builds hide the dev dialog.
- **How (AI):** gate the header button and the C hotkey on `import.meta.env.DEV` (or an app flag), and add a test for both modes.

### VC-047 · Reserved "Wkrótce" cards in the menu
- **Phase:** 4 · **Type:** feat · **Class:** small · **Status:** todo
- **Goal:** tabs whose content is not built yet (for example Mapa) show a clear, translated "Wkrótce" / "Coming soon" card instead of an empty view.
- **How (AI):** add one shared reserved-card component with i18n keys (PL/EN), use it in every placeholder tab, and add a unit test per tab.

---

## F. Docs, settings and controls

### VC-050 · Docs restore and update to the new direction
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** done (#88)
- **Goal:** lore and the system specs (old manifesto, except MASTERMAP) are back and current.
- **Description:** the vision and gaps already live in `VISION.md` and `ROADMAP.md`. Do not restore MASTERMAP.
- **How (AI):**
  1. Restore `docs/lore` and the manifesto specs from 8121dad.
  2. Rewrite the parts the code no longer matches.
  3. Re-link them from `AGENTS.md` and the README.

### VC-051 · Wiki from Markdown with all articles
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** in-progress
- **Goal:** `build:pages` builds the wiki from `docs/wiki/*.md` (PL/EN), with architecture, bestiary, graphics and news back.
- **How (AI):** make `scripts/wiki/wikiContent.ts` read the Markdown files, and update the smoke test.

### VC-052 · Saved language is honoured
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#66)
- **Goal:** a player with "en" in saved settings keeps English after the upgrade.
- **How (AI):** fall back from `vibrant_castle_language` to the saved settings language in `LocaleContext.tsx`, and add a unit test.

### VC-053 · Rebind guard and dialog i18n
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#67)
- **Goal:** F1-F12, Tab, Meta and ContextMenu cannot be bound; the dialog text is translated.
- **How (AI):** restore the reserved-key list from 8121dad `ControlsContext`, use i18n keys in `KeyRebindDialog`, and add tests.

### VC-054 · Settings persistence tests
- **Phase:** 4 · **Type:** test · **Class:** small · **Status:** done (#73)
- **Goal:** cover legacy migration, corrupt JSON, quota failure, and import/export.
- **How (AI):** restore and adapt `settingsStorage.unit.test.ts` from 8121dad.

### VC-055 · Scroll on narrow screens
- **Phase:** 4 · **Type:** fix · **Class:** tiny · **Status:** done (#75)
- **Goal:** long menus scroll at 1024 px and phone width.
- **How (AI):** limit `overflow:hidden` in `index.css` to the game viewport, and check with a headless screenshot.

### VC-056 · HUD dead code cleanup
- **Phase:** 4 · **Type:** chore · **Class:** tiny · **Status:** ready (VC-043 done)
- **Goal:** no unused HUD components or props.
- **How (AI):** remove or wire `HUDTopControls`, `potionKeyRangeLabel` and the unused `onOpenCreation` prop.

### VC-057 · Roadmap, phases and orchestration rules
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** done (#72)
- **Goal:** phases tied to versions, a quality gate per phase, and written orchestration and merge rules.
- **How (AI):** done in `docs/roadmap-phases`. Covers `ROADMAP.md`, `VISION.md`, the restored `AGENTS.md` and `.agents/`, and the new `orchestration_and_phases.md`.

---

### VC-082 · Lore: organise and develop (discussion)
- **Phase:** 4 · **Type:** plan · **Class:** large · **Status:** todo
- **Goal:** one coherent, owner-approved lore canon for the 8 worlds, the two heroes, the narrator and the enemies.
- **Description:** owner request (2026-11-27): this is a discussion with the owner, not a one-shot write-up. Input: `docs/lore/*`, `docs/wiki/*`, `src/data/narrative/*`, `src/i18n/modules/lore.ts`.
- **How (AI):**
  1. The orchestrator prepares a short discussion brief: inconsistencies, gaps per world, open questions (5-10), proposals.
  2. Rounds of discussion with the owner; each round updates `docs/lore/` in a small PR.
  3. Ends with a canon summary in `docs/lore/README.md` that VC-083 and the map cards follow.

### VC-083 · Demo scene scenarios, map 1 of every world
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** todo
- **Goal:** a short playable demo scenario for map 1 of each of the 8 worlds: beats (entry, mid, goal), Bastion-style narrator lines (PL + EN), enemy and lever moments, and the hook to the next world.
- **Description:** owner request (2026-11-27). Text writing goes to the Gemini class at high effort; the orchestrator reviews against the lore canon (VC-082) and the map contract (`docs/design/maps-contract.md`).
- **How (AI):**
  1. One file per world in `docs/design/demo-scenes/<world>.md` with beats, narrator lines and i18n keys.
  2. Lines short (one subtitle each), reactive, autumn and melancholic in tone, no claims of unbuilt features.
  3. A follow-up card wires the lines into the map JSON and i18n (with the VC-075 text tool).

## G. CI and tests

### VC-060 · Coverage gate per suite, integration tests on PRs
- **Phase:** 4 · **Type:** workflow · **Class:** small · **Status:** done (#83)
- **Goal:** restore thresholds of unit 60 / integration 40 / combined 80.
- **How (AI):** set `COVERAGE_MIN_*` or per-suite config in `coverage-gate.ts`, add integration tests and the gate to `ci-pr.yml`, and restore the gate test.

### VC-061 · Release artifacts
- **Phase:** 4 · **Type:** workflow · **Class:** small · **Status:** todo
- **Goal:** each promotion creates a GitHub Release with a game zip and a semver bump.
- **How (AI):** port the release job from 8121dad `release.yml` into `release-promote.yml`.

### VC-062 · Restore the key deleted tests
- **Phase:** 4 · **Type:** test · **Class:** medium · **Status:** in-progress (part 1: character and error-boundary tests, #86)
- **Goal:** cover menu, controls, character stage, dev tools and the error boundary again.
- **Description:** about 775 tests were removed in 2784276.
- **How (AI):** one area per PR. Restore from 8121dad and adapt to the current API. Do not restore tests for code that no longer exists.

### VC-063 · Parallax files exist (arch test)
- **Phase:** 4 · **Type:** test · **Class:** tiny · **Status:** done (#79)
- **Goal:** a layer registered without its image fails CI.
- **How (AI):** in `locationBlueprints.test.ts`, resolve the registry entries to files on disk.

---

## H. Developer tools and review

### VC-070 · Dev tools parity check
- **Phase:** 4 · **Type:** review · **Class:** small · **Status:** todo
- **Goal:** confirm what was lost: Tester speed/step card, Data Studio bestiary gallery, VN preview, JSON export modal, log item drawer, Debug collisions and state dump.
- **How (AI):** take headless screenshots of every dev tool against 8121dad. List the gaps, then open one `feat` card per gap.

### VC-071 · Split the atlas studio
- **Phase:** 4 · **Type:** refactor · **Class:** medium · **Status:** done (#87)
- **Goal:** `AtlasSlicerSubtab.tsx` (1860 lines) becomes viewer, inspector, preview and export components, with tests.
- **How (AI):** a behaviour-preserving split, guided by the 8121dad component layout.

### VC-072 · Dev labels and placeholders
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** done (#82)
- **Goal:** no raw ids (`valen`, `aurelia`) or unfilled `world:<świat>:far` placeholders in Data Studio and Poziomy.
- **How (AI):** resolve display names through i18n or the registries, and add a unit test.

### VC-073 · Lazy import of the developer suite
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** todo
- **Goal:** release bundles do not ship the developer suite code.
- **Description:** VC-046 hides the dev dialog in release builds, but the suite is still imported statically.
- **How (AI):** load the dev dialog through `React.lazy` behind the dev-build flag, check the release bundle has no developer chunks, and add a test for both modes.

### VC-074 · Readiness audit: recommended ids match real folder names
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** the Poziomy 8x8 audit counts the recommended starter sets correctly.
- **Description:** follow-up to VC-004. `RECOMMENDED_TILESETS` / `RECOMMENDED_DECOR_PROPS` in `assetReadinessAudit.ts` use ids that do not match the tileset and prop folder names on disk.
- **How (AI):** derive or align the recommended ids with the discovered folder names, and add a unit test that fails when a recommended id has no folder.

### VC-075 · Tworzenie: easier map browsing and text placement
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** in the dev dialog, browse every map comfortably and place or edit texts (narration triggers, sign labels, portal captions) without hand-editing JSON.
- **Description:** today the Poziomy 8x8 tool previews parallax and teleports, but you cannot pan/zoom a whole map, see entities with their ids, or place a narration trigger. Owner request (2026-11-27).
- **How (AI):**
  1. Map browser in Poziomy: full-map minimap with pan/zoom, entity overlay (solids, levers/gates, portals, triggers, spawns) with ids, click to inspect.
  2. Text tool: pick a point/area, create or edit a trigger with an i18n key and PL/EN text; show the text where it appears in game; export as a JSON patch for `src/data/locations/<id>.json` plus the i18n entries.
  3. Tests for the patch builder; headless screenshot of the browser.

### VC-081 · Narrative catalogs
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** done
- **Goal:** decide where `scenario_act1.json` and `triggers.json` (deleted, unused at runtime) live.
- **Note:** restored both under `docs/lore/source/` as archived source material; they remain unused by the game.

---

## P. Parallax series (owner request, 2026-11-27)

Target layer model per world: **1 far background + 3 standard mid/close variations (up to 5) + zone layers** (boss, rest, other zones), where a zone swaps the last (closest) layer for a slightly different variant. Assets come in low / mid / high PNG plus a "no parallax / simplified placeholder" mode, and load progressively (far first, then mid, close, effects). Order of work: P1 review and taxonomy first, then refactor, loading, tiers, measurement and optimisation rounds, with new art last.

### VC-100 · Parallax engine review and asset taxonomy
- **Phase:** 4 · **Type:** review · **Class:** large · **Status:** in-progress
- **Goal:** a written review of the parallax engine (SOLID, DRY, single place, DI, registry) and the target naming / meta / registry taxonomy for the layer model above.
- **How (AI):** read `src/game/locations/parallaxLayerRegistry.ts`, `src/game/renderer/parallax*`, the location JSONs and the assets; write `docs/design/parallax.md` with findings, the taxonomy (file names, meta schema, registry keys, zone rules), a migration plan and the cut into PRs for VC-101..VC-109.

### VC-101 · Parallax asset naming, meta files and registry migration
- **Phase:** 4 · **Type:** refactor · **Class:** medium · **Status:** blocked (VC-100)
- **Goal:** every parallax asset follows the VC-100 taxonomy: 8 world far backgrounds, 3-5 mid/close variations per world, zone variants of the closest layer; meta files and registry keys renamed consistently; code and tests updated.
- **How (AI):** rename files and metas with a script (no manual drift), update `parallaxLayerRegistry.ts` and location JSON layer keys, keep `parallaxFiles` / `locationBlueprints` arch tests green, add a taxonomy arch test.

### VC-102 · Parallax engine refactor (SOLID, DRY, DI, single registry)
- **Phase:** 4 · **Type:** refactor · **Class:** medium · **Status:** blocked (VC-100)
- **Goal:** one parallax module with an injected registry and loader, no duplicated resolution logic, renderer free of asset lookups.
- **How (AI):** apply the VC-100 findings in small PRs; behaviour-preserving; unit tests per unit; headless screenshot comparison before/after.

### VC-103 · Zone-aware parallax (boss, rest and other zones)
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-101, VC-102)
- **Goal:** map zones (boss, rest, others) switch the closest parallax layer to its zone variant with a smooth transition.
- **How (AI):** zone definitions in location JSON per the map contract, a zone resolver in the registry, crossfade in the renderer, tests and a screenshot strip.

### VC-104 · Progressive loading of parallax layers and effects
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-102)
- **Goal:** parallax assets and effects load one after another (far, mid, close, effects) with a placeholder until ready; no blocking of the first frame.
- **How (AI):** a prioritised loader queue with `ImageBitmap` decoding, placeholder colours from the far layer meta, tests with fake loaders, measured time-to-first-frame.

### VC-105 · Parallax quality tiers: low / mid / high PNG and off / simplified
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-101)
- **Goal:** each layer has low / mid / high PNG; a setting chooses tier or "parallax off / simplified placeholder"; automatic fallback on weak devices.
- **How (AI):** tier resolution in the registry, a Display setting, default by device capability, tests.

### VC-106 · Parallax performance test harness
- **Phase:** 4 · **Type:** test · **Class:** medium · **Status:** todo
- **Goal:** repeatable measurements (frame time p50/p95, dropped frames, memory, load time) per map and tier, runnable locally and in CI with budgets.
- **How (AI):** headless Playwright runs with a scripted camera path; JSON report and a budget check; baseline numbers stored in the repo.

### VC-107 · Visual "wow" review tooling (MCP / headless screenshots)
- **Phase:** 4 · **Type:** test · **Class:** medium · **Status:** todo
- **Goal:** a repeatable visual review of parallax depth and atmosphere: screenshot and short-clip strips per map, tier and viewport (desktop, laptop, tablet), for the orchestrator's and owner's judgement.
- **How (AI):** a script producing a contact sheet / gallery page per run; optional MCP browser use for interactive checks.

### VC-108 · Parallax optimisation rounds (browsers, systems, devices)
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-106)
- **Goal:** meet the budgets on Chromium, Firefox and WebKit, on desktop, laptop and tablet profiles.
- **How (AI):** round 1 desktop Chromium; round 2 Firefox and WebKit; round 3 tablet / low-power (CPU throttling, DPR, reduced layers). Each round: measure with VC-106, change, re-measure, report.

### VC-109 · New parallax art: low / mid / high PNG per the taxonomy
- **Phase:** 4 · **Type:** art · **Class:** medium · **Status:** blocked (VC-100, VC-105)
- **Goal:** missing far / variation / zone layers generated for all 8 worlds in low, mid and high PNG, plus simplified placeholders; consistent with the lore world dossiers.
- **How (AI):** one world per task; generate, slice to the taxonomy sizes, run the seam checker, review contact sheets before merge.

## Q. Asset animation fixes

Owner request (2026-11-27), screenshot evidence: in clocktower `clockwork_owl_gargoyle` plays no animation and its hitbox/box flickers (shown in one frame, gone in the next).

### VC-120 · Asset animation review
- **Phase:** 4 · **Type:** review · **Class:** medium · **Status:** todo
- **Goal:** a complete audit of every used enemy, structure and prop across all tiers (`hi8bit`, `hi16bit`, `high`).
- **How (AI):** play every used enemy, structure and prop at each tier (`hi8bit`, `hi16bit`, `high`) in the dev Atlas tool and in game; list missing animations, flickering boxes and wrong rows; output a table in `docs/design/asset-animation-review.md`.

### VC-121 · Fix enemy animation playback and box flicker
- **Phase:** 4 · **Type:** fix · **Class:** medium · **Status:** todo
- **Goal:** `clockwork_owl_gargoyle` and all affected entities play their animations smoothly with no hitbox/box flicker; PNG-animated assets keep working.
- **How (AI):** trace why `clockwork_owl_gargoyle` has no animation and a flickering box in clocktower, fix the root cause for all affected entities, and verify both SVG and PNG-animated assets in game and tests.

### VC-122 · Missing hi16bit SVGs
- **Phase:** 4 · **Type:** art · **Class:** medium · **Status:** todo
- **Goal:** every used asset has a `hi16bit` SVG with at least 3 animations (`idle`, `move`, `attack`; more later).
- **Description:** Style reference: Sega Saturn-era 2D games (Octopath Traveler is a quality reference, but the owner prefers the Saturn look); the orchestrator's earlier script-generated enemy SVGs are the quality bar.
- **How (AI):** add missing `hi16bit` SVGs for every used asset with `idle`, `move` and `attack` animations, matching the Saturn-era 2D quality bar.

### VC-123 · Better hi8bit SVGs
- **Phase:** 4 · **Type:** art · **Class:** medium · **Status:** todo
- **Goal:** replace crude `hi8bit` placeholders with decent `hi8bit` art and 3 animations (`idle`, `move`, `attack`).
- **Description:** `hi8bit` means "looks 8-bit but clearly made later, a retro game on a PS2-era console".
- **How (AI):** replace crude `hi8bit` placeholder SVGs with clean PS2-era retro 8-bit art, each with `idle`, `move` and `attack` animations.

## Z. Phase gate

### VC-090 · Phase 4 quality gate and 0.4.0
- **Phase:** 4 · **Type:** review / workflow · **Class:** large · **Status:** blocked (all other phase 4 cards done or moved)
- **Goal:** close phase 4 and open phase 5 with version `0.4.0`.
- **How (AI):** run the gate from `ROADMAP.md` in order:
  1. Docs quality and conformance check (docs against code).
  2. Docs update.
  3. General review.
  4. Release.
  5. Version bump to `0.4.0`, approved by the owner.

  Move unfinished cards to phase 5 and write the phase 5 gate card.
