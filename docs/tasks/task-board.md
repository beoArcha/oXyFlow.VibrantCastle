# Vibrant Castle: task board

Updated: 2026-11-27. Source: the regression audit of 2784276..c4758f3 against 8121dad, plus the owner's roadmap decisions.

**Roadmap:** [ROADMAP.md](./ROADMAP.md) lists the phases, their quality gates and the planned / done cards per phase. [VISION.md](./VISION.md) says what we are building.

**Phase:** the roadmap phase the card belongs to. Phase 4 = `0.3.x` (current), phase 5 = `0.4.x`. An unfinished card moves to the next phase only at the gate.

**Model class** (the class only, not a model name):
- `tiny`: small local or open models.
- `small`: cheap, well-specified edits.
- `medium`: engine and cross-cutting code, larger features.
- `large`: design, plans, hard refactors.
- `huge`: whole-system work.

**Status:** `todo` · `ready` (dependencies met) · `in-progress` · `review` · `done` · `blocked`

**Type:** `feat` · `fix` · `refactor` · `test` · `plan` · `review` · `doc` · `chore` · `workflow` · `art`

**Rules for every task:**
- One small PR per card.
- The orchestrator reviews and merges.
- No console brand or trademark names anywhere in the repo (enforced by the trademark-free arch test).
- Tiers are `hi8bit` / `hi16bit` / high.
- Commit trailer as in the repo convention.
- Only the 6 E2E dist smoke tests may fail locally (they need `build:pages`).

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
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** todo (after VC-003)
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

---

## B. Assets and rendering

### VC-010 · Three-tier asset policy and completeness test
- **Phase:** 4 · **Type:** test · **Class:** small · **Status:** todo (after VC-003)
- **Goal:** every entity (hero, enemy, structure, prop, tile) has `hi8bit` SVG + `hi16bit` + high PNG.
- **Description:** the policy is that hi8bit is a simple SVG placeholder for every element, PNG ones included.
- **How (AI):**
  1. Add an arch test listing missing tiers per entity (report only, with an allowlist).
  2. Document the rule in the content-pipeline doc (VC-050).

### VC-011 · hi16bit build step: SVG to PNG atlas
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo (after VC-010)
- **Goal:** no runtime SVG rasterisation, crisp pixels, faster frames.
- **Description:** SVG stays the editable source. The build bakes PNG atlases at integer scale, and the runtime decodes them once to `ImageBitmap`.
- **How (AI):**
  1. Add a script in `scripts/atlas` (playwright or resvg) plus a Vite hook or a pre-build step.
  2. Make the loader prefer the baked PNG.
  3. Add a benchmark note and tests.

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
- **Phase:** 4 · **Type:** plan · **Class:** large · **Status:** todo
- **Goal:** one set of rules before the eight map tasks start.
- **Description:** covers world and map slots, scale (baseline maps were larger and more coherent), and lever and gate pairs. Also covers entries and portals, parallax tiers, enemy density, and the Mario-like stage flow with Aria of Sorrow exploration and Bastion narration beats.
- **How (AI):**
  1. Read the baseline maps (8121dad) and the HEAD maps.
  2. Write `docs/design/maps-contract.md` (at most 2 pages).
  3. Extend `validate-level.ts` checks to enforce it.

### VC-021 … VC-025 · Hybrid maps: courtyard, thorn_chasm, clocktower, aether_sanctuary, grand_bastion
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo (after VC-020). One card per map.
- **Goal:** combine the baseline map's size and coherence with the newer map's interesting sections.
- **Description:** 8121dad has the bigger maps. HEAD has the smaller, more varied ones. Restore the lost levers (thorn_chasm, aether_sanctuary, the grand_bastion ward gate).
- **How (AI):**
  1. Diff both versions.
  2. Merge the layouts per the contract.
  3. Keep `locationLinks` and `validate-level` green.
  4. Attach a headless screenshot strip of the walk-through.

### VC-026 … VC-028 · Fix new maps: ashen_catacombs, alchemist_library, eclipse_crown
- **Phase:** 5 · **Type:** fix · **Class:** medium · **Status:** todo (after VC-020). One card per map.
- **Goal:** bring the three new maps up to the contract (scale, flow, lever and gate, entries).
- **How (AI):** same as VC-021, against the contract only.

---

## D. Characters, stats and equipment

### VC-030 · Character system design doc
- **Phase:** 4 · **Type:** plan · **Class:** large · **Status:** todo
- **Goal:** one approved spec before code.
- **Description:** six D&D-like attributes stored as D20 x10, any integer allowed. The level-1 average is fixed at 151. Player start values are 110-180; 180 is the starting maximum, not a cap. The player picks priorities 1/2/3, growth is automatic, and the rest grow slower than P3. HP/MP/Stamina derive from attributes and level. Monsters use the same scale.
- **Approved level 1** (STR/DEX/CON/INT/WIS/CHA):
  - Valen: 151/166/156/136/146/151
  - Aurelia: 131/152/136/176/162/149
- **How (AI):** write `docs/design/character-system.md`. Cover formulas, per-level growth table (e.g. P1 +6, P2 +4, P3 +3, others +1-2), level 1-30 curves, and the monster template. The owner approves it.

### VC-031 · Attributes and automatic growth (engine)
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-030)
- **Goal:** the attribute model drives HP/MP/Stamina and combat.
- **How (AI):**
  1. Extend `characterProfiles.ts` and `inventoryStats.ts`.
  2. Add a pure growth function with unit tests (curves from VC-030).
  3. Migrate saves.

### VC-032 · Monsters on the attribute scale
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-030)
- **Goal:** enemies use the same 30-180 attribute scale.
- **How (AI):** convert `enemies.json` with a script and keep the time-to-kill per enemy within ±15%. Add a balance table to the PR.

### VC-033 · Valen and Aurelia progression trees
- **Phase:** 5 · **Type:** plan · **Class:** large · **Status:** blocked (VC-030)
- **Goal:** distinct, lore-true growth paths with smaller stat gaps.
- **How (AI):** map skills and spells to tiers and attribute priorities, then update `skill_trees.json` in a follow-up `feat` card.

### VC-034 · Rational equipment model
- **Phase:** 5 · **Type:** plan · **Class:** large · **Status:** blocked (VC-030)
- **Goal:** clear slots and item rules.
- **Description:** slots, attribute bonuses, rarity, set rules, and a comparison stat.
- **How (AI):** write `docs/design/equipment.md` with the item schema and a migration of `items.json`.

### VC-035 · Inventory UX, rebuilt from the baseline
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** todo (after menu PR-2)
- **Goal:** better UX than both versions, built on the 8121dad inventory (paper doll).
- **How (AI):**
  1. Restore `inventory/*` from 8121dad into the current modal views.
  2. Add a stat comparison before equipping, a discard confirmation, and keyboard/pad grid navigation.

### VC-036 · Inventory visuals
- **Phase:** 5 · **Type:** art · **Class:** medium · **Status:** blocked (VC-035)
- **Goal:** autumn and Aria-of-Sorrow look for slots, frames and icons.
- **How (AI):** start from a mock-up and reuse the theme tokens. Visual changes only.

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
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** in-progress
- **Goal:** tabs Gra · Mapa · Postać · Ekwipunek · Magia · Ustawienia(Obraz/Dźwięk/Sterowanie/Interfejs) · Pomoc.
- **How (AI):** new registries, `InterfaceTab`, Help deep link to Sterowanie, coordinator `openModal(id, subTab)`.

### VC-043 · Menu PR-4: confirmations, HUD toggles, empty states
- **Phase:** 4 · **Type:** feat · **Class:** small · **Status:** blocked (VC-042)
- **Goal:** confirm destructive actions (Anuluj focused by default); toggles work.
- **How (AI):** use `ConfirmDialog` for stats reset, discard, reset, restart, load and import. Wire `showControlsHint` and `showRpgButtons`.

### VC-044 · Menu PR-5: gamepad and keyboard navigation
- **Phase:** 4 · **Type:** feat · **Class:** medium · **Status:** blocked (VC-043)
- **Goal:** full menu use with the restricted pad.
- **How (AI):**
  1. Add `useMenuGamepad`: LB/RB = L1, LT/RT = L2, A/B/X/Y; holding LB+RB for 0.5 s opens the menu on pads without Start.
  2. Mirror it with Q/E and [ ] on the keyboard.
  3. Add a legend footer and menu input capture.

### VC-045 · Menu PR-6: gamepad mapping screen
- **Phase:** 4 · **Type:** feat · **Class:** small · **Status:** blocked (VC-044)
- **Goal:** rebind the pad within the 2-trigger / 4-face / bumper layout.
- **How (AI):** restore `GamepadMapper` and `useGamepad` from 8121dad into Ustawienia > Sterowanie, with their tests.

### VC-046 · "Tworzenie" only in dev builds
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** ready
- **Goal:** release builds hide the dev dialog.
- **How (AI):** gate the header button and the C hotkey on `import.meta.env.DEV` (or an app flag), and add a test for both modes.

---

## F. Docs, settings and controls

### VC-050 · Docs restore and update to the new direction
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** review (`AGENTS.md`, rules and README links done in VC-057)
- **Goal:** lore and the system specs (old manifesto, except MASTERMAP) are back and current.
- **Description:** the vision and gaps already live in `VISION.md` and `ROADMAP.md`. Do not restore MASTERMAP.
- **How (AI):**
  1. Restore `docs/lore` and the manifesto specs from 8121dad.
  2. Rewrite the parts the code no longer matches.
  3. Re-link them from `AGENTS.md` and the README.

### VC-057 · Roadmap, phases and orchestration rules
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** review
- **Goal:** phases tied to versions, a quality gate per phase, and written orchestration and merge rules.
- **How (AI):** done in `docs/roadmap-phases`. Covers `ROADMAP.md`, `VISION.md`, the restored `AGENTS.md` and `.agents/`, and the new `orchestration_and_phases.md`.

### VC-051 · Wiki from Markdown with all articles
- **Phase:** 4 · **Type:** doc · **Class:** medium · **Status:** todo (after VC-050)
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
- **Phase:** 4 · **Type:** test · **Class:** small · **Status:** todo
- **Goal:** cover legacy migration, corrupt JSON, quota failure, and import/export.
- **How (AI):** restore and adapt `settingsStorage.unit.test.ts` from 8121dad.

### VC-055 · Scroll on narrow screens
- **Phase:** 4 · **Type:** fix · **Class:** tiny · **Status:** todo
- **Goal:** long menus scroll at 1024 px and phone width.
- **How (AI):** limit `overflow:hidden` in `index.css` to the game viewport, and check with a headless screenshot.

### VC-056 · HUD dead code cleanup
- **Phase:** 4 · **Type:** chore · **Class:** tiny · **Status:** todo (after VC-043)
- **Goal:** no unused HUD components or props.
- **How (AI):** remove or wire `HUDTopControls`, `potionKeyRangeLabel` and the unused `onOpenCreation` prop.

---

## G. CI and tests

### VC-060 · Coverage gate per suite, integration tests on PRs
- **Phase:** 4 · **Type:** workflow · **Class:** small · **Status:** todo
- **Goal:** restore thresholds of unit 60 / integration 40 / combined 80.
- **How (AI):** set `COVERAGE_MIN_*` or per-suite config in `coverage-gate.ts`, add integration tests and the gate to `ci-pr.yml`, and restore the gate test.

### VC-061 · Release artifacts
- **Phase:** 4 · **Type:** workflow · **Class:** small · **Status:** todo
- **Goal:** each promotion creates a GitHub Release with a game zip and a semver bump.
- **How (AI):** port the release job from 8121dad `release.yml` into `release-promote.yml`.

### VC-062 · Restore the key deleted tests
- **Phase:** 4 · **Type:** test · **Class:** medium · **Status:** todo
- **Goal:** cover menu, controls, character stage, dev tools and the error boundary again.
- **Description:** about 775 tests were removed in 2784276.
- **How (AI):** one area per PR. Restore from 8121dad and adapt to the current API. Do not restore tests for code that no longer exists.

### VC-063 · Parallax files exist (arch test)
- **Phase:** 4 · **Type:** test · **Class:** tiny · **Status:** todo
- **Goal:** a layer registered without its image fails CI.
- **How (AI):** in `locationBlueprints.test.ts`, resolve the registry entries to files on disk.

---

## H. Developer tools and review

### VC-070 · Dev tools parity check
- **Phase:** 4 · **Type:** review · **Class:** small · **Status:** todo
- **Goal:** confirm what was lost: Tester speed/step card, Data Studio bestiary gallery, VN preview, JSON export modal, log item drawer, Debug collisions and state dump.
- **How (AI):** take headless screenshots of every dev tool against 8121dad. List the gaps, then open one `feat` card per gap.

### VC-071 · Split the atlas studio
- **Phase:** 4 · **Type:** refactor · **Class:** medium · **Status:** todo (after VC-002)
- **Goal:** `AtlasSlicerSubtab.tsx` (1860 lines) becomes viewer, inspector, preview and export components, with tests.
- **How (AI):** a behaviour-preserving split, guided by the 8121dad component layout.

### VC-072 · Dev labels and placeholders
- **Phase:** 4 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** no raw ids (`valen`, `aurelia`) or unfilled `world:<świat>:far` placeholders in Data Studio and Poziomy.
- **How (AI):** resolve display names through i18n or the registries, and add a unit test.

### VC-080 · Balance review after c4758f3
- **Phase:** 5 · **Type:** review · **Class:** medium · **Status:** blocked (VC-030)
- **Goal:** check the rewritten enemy, skill, item and structure values.
- **How (AI):** produce a diff table against 8121dad, flag the outliers, and feed them into VC-032/VC-033.

### VC-081 · Narrative catalogs
- **Phase:** 4 · **Type:** chore · **Class:** small · **Status:** todo
- **Goal:** decide where `scenario_act1.json` and `triggers.json` (deleted, unused at runtime) live.
- **How (AI):** restore them under `docs/lore` as source material, or wire them into narration if VC-050 needs it.

---

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
