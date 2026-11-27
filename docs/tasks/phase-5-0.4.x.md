# Phase 5: worlds and characters (0.4.x, next)

Updated: 2026-11-27. Part of the [task folder](./README.md). Phases, gates and the card format are described in the [README](./README.md) and the [roadmap](./ROADMAP.md).

## About this phase

Phase 5 opens when the [phase 4](./phase-4-0.3.x.md) gate (VC-090) passes and the version is bumped to `0.4.0`.

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

**Quality gate checklist** (the phase 5 gate card is written at the phase 4 gate; detail in [ROADMAP.md](./ROADMAP.md#quality-gate-end-of-every-phase-in-this-order)):
- [ ] 1. Docs quality and conformance check.
- [ ] 2. Docs update.
- [ ] 3. General review.
- [ ] 4. Release.
- [ ] 5. Version bump to `0.5.0`, approved by the owner.

**Cards still to be written** (at the phase 4 gate): enemy attacks and contact damage; pad layout with bumpers as selectors in gameplay; the reactive narrator wired to the engine; the phase 5 gate card. Unfinished phase 4 cards that move here at the gate are added below.

---

## B. Assets and rendering

### VC-011 · hi16bit build step: SVG to PNG atlas
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo (after VC-010)
- **Goal:** no runtime SVG rasterisation, crisp pixels, faster frames.
- **Description:** SVG stays the editable source. The build bakes PNG atlases at integer scale, and the runtime decodes them once to `ImageBitmap`.
- **How (AI):**
  1. Add a script in `scripts/atlas` (playwright or resvg) plus a Vite hook or a pre-build step.
  2. Make the loader prefer the baked PNG.
  3. Add a benchmark note and tests.

---

## B2. Bestiary and world props

### VC-130 · Bestiary plan
- **Phase:** 5 · **Type:** plan · **Class:** large · **Status:** todo
- **Goal:** a complete bestiary design covering 8 base monsters, each with a local variant in every one of the 8 worlds (8 x 8 = 64 variants), plus 2 unique monsters per world (16).
- **How (AI):** design 8 base monsters, each with a local variant in every one of the 8 worlds (8 x 8 = 64 variants), plus 2 monsters unique to each world (16); ensure each variant fits that world's lore coherently (e.g. the owl: castle owl, clockwork owl, blizzard owl...). Write `docs/design/bestiary.md` with names PL/EN, world, role, attacks and tiers.

### VC-131 · Bestiary art and data, one PR per world
- **Phase:** 5 · **Type:** art / feat · **Class:** medium · **Status:** blocked (VC-130)
- **Goal:** every world's bestiary entries have sprites (`hi8bit`, `hi16bit` SVG; `high` PNG), metas, `enemies.json` entries and i18n, shipped one PR per world.
- **How (AI):** implement one world per PR following `docs/design/bestiary.md`: sprites (`hi8bit` and `hi16bit` SVG, `high` PNG), meta files, `enemies.json` entries and PL/EN i18n.

### VC-132 · World lanterns
- **Phase:** 5 · **Type:** art · **Class:** small · **Status:** todo
- **Goal:** each world gets its own lantern type with 3 tiers (`hi8bit`, `hi16bit`, `high`).
- **How (AI):** create a distinct lantern asset per world across all 3 tiers and wire it into the world's prop/asset registry.

### VC-133 · World props
- **Phase:** 5 · **Type:** art · **Class:** medium · **Status:** todo
- **Goal:** each world gets its own set of decorative elements across 3 tiers (`hi8bit`, `hi16bit`, `high`).
- **How (AI):** create world-specific decorative prop sets in all 3 tiers (`hi8bit`, `hi16bit`, `high`) matching each world's lore and palette.

---

## C. World and maps (8 worlds x 8 maps; today map 1 of each world)

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

### VC-036 · Inventory visuals
- **Phase:** 5 · **Type:** art · **Class:** medium · **Status:** blocked (VC-035)
- **Goal:** autumn and Aria-of-Sorrow look for slots, frames and icons.
- **How (AI):** start from a mock-up and reuse the theme tokens. Visual changes only.

---

## H. Developer tools and review

### VC-080 · Balance review after c4758f3
- **Phase:** 5 · **Type:** review · **Class:** medium · **Status:** blocked (VC-030)
- **Goal:** check the rewritten enemy, skill, item and structure values.
- **How (AI):** produce a diff table against 8121dad, flag the outliers, and feed them into VC-032/VC-033.

### VC-140 · Data Studio bestiary gallery
- **Phase:** 5 · **Type:** feat · **Class:** small · **Status:** todo
- **Goal:** restore the visual bestiary card gallery and entry inspector in Data Studio (`enemies` tab).
- **How (AI):** restore `BestiaryGalleryView`, `BestiaryCardItem`, `BestiaryFilters`, and `BestiaryEntryInspector` from `8121dad` (`src/developer/subtabs/datastudio/components/bestiary/`) and wire a catalog/editor mode toggle into `DataStudioSubtab.tsx`.

### VC-141 · Data Studio VN stage preview
- **Phase:** 5 · **Type:** feat · **Class:** small · **Status:** todo
- **Goal:** restore the multi-character VN stage and dialogue bubble preview in Data Studio (`vn` tab).
- **How (AI):** restore `MultiCharacterStage`, `DialogueBubble`, and `SceneSelectorHeader` from `8121dad` (`src/developer/subtabs/datastudio/components/vn/` + `services/visualNovelService.ts`) and integrate them into `DataStudioSubtab.tsx`.

### VC-142 · Data Studio JSON export modal
- **Phase:** 5 · **Type:** feat · **Class:** tiny · **Status:** todo
- **Goal:** restore the inspectable JSON export modal across Data Studio editors.
- **How (AI):** restore `JsonExportModal` and `ExportToolbar` from `8121dad` (`src/developer/subtabs/datastudio/components/`) so devs can inspect formatted JSON, byte size, copy, and download from `DataStudioSubtab.tsx`.

### VC-143 · Debug live state dump card
- **Phase:** 5 · **Type:** feat · **Class:** tiny · **Status:** todo
- **Goal:** restore the on-screen live JSON state dump card in Engine Debug.
- **How (AI):** restore `DebugStateDumpCard` from `8121dad` (`src/developer/subtabs/debug/DebugStateDumpCard.tsx`) using `CopyableSnippet` and render it in `DebugSubtab.tsx`.

### VC-144 · Log item drawer with copyable context
- **Phase:** 5 · **Type:** feat · **Class:** tiny · **Status:** todo
- **Goal:** restore the structured log item drawer with copyable context and styled error stack traces in Log Stream.
- **How (AI):** restore `LogsItemDrawer` from `8121dad` (`src/developer/subtabs/logs/LogsItemDrawer.tsx`) using `CopyableSnippet` for both `context` and `error.stack`, replacing the plain `<pre>` expansion in `LogsSubtab.tsx`.

### VC-145 · Atlas hero pixel tier toggle
- **Phase:** 5 · **Type:** feat · **Class:** tiny · **Status:** todo
- **Goal:** restore the `hi8bit` / `hi16bit` / `high` tier switcher for hero sheets in the Atlas Slicer.
- **How (AI):** restore `AtlasTierToggle` and `heroPixelTiers.ts` from `8121dad` (`src/developer/subtabs/atlas/`) and wire it into `AtlasSlicerSubtab.tsx` / `AtlasPresetPicker.tsx`.
