# Phase 5: worlds and characters (0.4.x, next)

Updated: 2026-11-27. Part of the [task folder](./README.md). Phases, gates and the card format are described in the [README](./README.md) and the [roadmap](./ROADMAP.md).

## About this phase

Phase 5 opens when the [phase 4](./phase-4-0.3.x.md) gate (VC-090) passes and the version is bumped to `0.4.0`.

**Goal:**
- build on the contracts from phase 4: hybrid and fixed maps to the map contract;
- the attribute model in the engine, monsters on the same scale, progression trees and equipment;
- the `hi16bit` build-time bake;
- first gameplay gaps from the vision: enemy attacks, pad selector semantics, narrator wiring.

**Owner scope (2026-11-27).** Phase 5 must cover:
- **combat:** enemy damage (melee, firearm, magic, explosion, poison) and six-element Aether magic with a natural cycle: time, spirit, water, fire, earth, air;
- **maps:** a level-2 map for each of the 8 worlds;
- **monsters:** 1 universal monster in 8 world variants, plus 1 special monster per world;
- **engine:** zero allocations in the engine, a working FPS cap, 60 Hz physics as the base, algorithmic optimisation, SOLID;
- **lore and fun:** lore fixes and expansion, fun tuning, saving the game;
- **Tworzenie:** a bigger dev dialog;
- **menu:** fixes;
- **RPG:** a better character RPG system;
- **loot:** random lantern drops (details later), money, monster drops;
- **rest zone.**

The cards are in sections B2 to H below.

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

**Cards still to be written** (at the phase 4 gate): pad layout with bumpers as selectors in gameplay; the reactive narrator wired to the engine; the phase 5 gate card. Unfinished phase 4 cards that move here at the gate are added below.

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
- **Goal:** the phase 5 bestiary: **1 universal monster in 8 world variants**, plus **1 special monster per world** (8 + 8 = 16 entries). The long-term target of 8 base monsters x 8 worlds plus 2 unique per world stays the vision for later phases.
- **Owner update (2026-11-27):** the phase 5 scope is reduced to 1 universal (x8 variants) + 1 special per world.
- **How (AI):** design the universal monster, with each world variant fitting that world's lore (e.g. the owl: castle owl, clockwork owl, blizzard owl...), plus one special monster per world. Each entry uses damage sources from VC-037 and an element from VC-038. Write `docs/design/bestiary.md` with names PL/EN, world, role, attacks, element and tiers.

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

### VC-161 · Level-2 maps: one new map per world (8 PRs)
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo (after VC-020). One PR per world.
- **Goal:** each of the 8 worlds gets map 2, linked from map 1, following the map contract.
- **How (AI):**
  1. Design per the contract and the world dossier in `docs/lore/worlds/`.
  2. Add a lever-and-gate, a rest zone (VC-179) and narration beats (Tworzenie text tool, VC-075).
  3. Use enemies from the phase 5 bestiary.
  4. Keep `locationLinks` and `validate-level` green.
  5. Attach a headless walk-through strip.

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

### VC-037 · Enemies deal damage: contact, melee, ranged, magic, explosion, poison
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** every enemy can hurt the heroes through one or more damage sources, declared in data.
- **Description:** owner request (2026-11-27). The first set of sources:
  - **contact:** touching the enemy body;
  - **melee:** a cold weapon swing with a short hitbox in front of the enemy;
  - **ranged:** a firearm or thrown projectile;
  - **magic:** a spell projectile or area, carrying an Aether element (VC-038);
  - **explosion:** an area burst with falloff and knockback (bombs, exploding enemies);
  - **poison:** damage over time with a visible status icon and a duration; a cure item or a rest zone (VC-179) clears it.
  Each source has its own damage, knockback and telegraph (wind-up frames). Each uses the existing hero i-frames and the attribute scale (VC-032). Combat complexity stays at the level of the early castle games: readable patterns, few attacks per enemy.
- **How (AI):**
  1. Add a `damageSources` list per enemy in `enemies.json`: `{ kind: contact | melee | ranged | magic | explosion | poison, damage, knockback, windupMs, cooldownMs, range, element?, dot? }`. Give it a parser and a schema test.
  2. Resolve all kinds in `combatSystem.ts` through one hit pipeline.
  3. Ranged and magic reuse the projectile system.
  4. Write integration tests per kind (hit, knockback, i-frames, no double hit).
  5. Add at least one enemy per kind in the existing maps, with a screenshot strip.

### VC-038 · Aether elements: six schools with a natural cycle
- **Phase:** 5 · **Type:** plan + feat · **Class:** large · **Status:** todo
- **Goal:** Aether magic has six elements: **time, spirit, water, fire, earth, air**. They form a natural cycle of strengths and weaknesses, inspired by classic elemental-bending stories.
- **Description:** owner request (2026-11-27). Heroes' spells, enemy magic attacks (VC-037) and monster resistances (VC-130) all use the same element set. The cycle has to be readable: few rules, and each element has a clear counter. Time and spirit are the rare "higher" pair, tied to Aurelia's time-weaving and the Zone's spirit lore.
- **How (AI):**
  1. Write `docs/design/aether-elements.md`: the cycle diagram, the multipliers (e.g. x1.5 strong, x0.5 weak), the lore justification per element (link `docs/lore/`) and the status effects per element.
  2. Add a pure `elementMatrix` module with unit tests.
  3. Tag spells, enemy attacks and resistances in the data.
  4. Make the damage pipeline apply the multipliers.
  5. Add HUD and bestiary icons.

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

### VC-160 · Better character RPG system (umbrella)
- **Phase:** 5 · **Type:** plan · **Class:** large · **Status:** blocked (VC-030)
- **Goal:** one coherent RPG system for Valen and Aurelia: attributes, growth, trees, equipment and elements, all working together.
- **How (AI):** tie VC-030, VC-031, VC-033, VC-034 and VC-038 into one design pass. Define the level curve, the attribute priorities 1/2/3 per hero, the element affinities and the gear slots. Split the result into small `feat` cards.

---

## E. Engine optimisation

### VC-162 · Zero allocations in the engine
- **Phase:** 5 · **Type:** refactor · **Class:** medium · **Status:** todo
- **Goal:** the simulation and render loops in `src/game/` allocate nothing per frame.
- **How (AI):**
  1. Write an allocation audit with the heap profiler over 1,000 frames per map.
  2. Fix every hot path with pools, preallocated buffers and no closures, template strings or array literals in loops.
  3. Add a CI guard: an allocation-spy integration test per subsystem.
  4. Extend the arch rule from `render()` to `update()`.

### VC-163 · FPS cap and 60 Hz physics base
- **Phase:** 5 · **Type:** fix / refactor · **Class:** medium · **Status:** todo
- **Goal:** the configured FPS cap really holds (30 / 60 / 90 / 120). Physics always runs at a 60 Hz fixed step, independent of the render rate. Rendering interpolates between physics states.
- **How (AI):**
  1. Make the loop accumulator 60 Hz only, while the render pacing follows the cap.
  2. Add interpolation in the renderer.
  3. Write tests: at every cap, the physics results are identical and the frame pacing stays within +/-1 ms.
  4. Add a perf harness run per cap.

### VC-164 · Algorithmic optimisation and SOLID pass
- **Phase:** 5 · **Type:** refactor · **Class:** large · **Status:** todo
- **Goal:** fewer O(n^2) passes and clean module boundaries.
- **How (AI):**
  1. Add a spatial hash or grid broadphase for collisions and hits, and view culling for entities and props.
  2. Use cached lookups instead of linear scans.
  3. Write a SOLID review of `src/game/loop`, `engine` and `renderer`, with a cut into small PRs.
  4. Track the gain with the VC-106 harness before and after each PR.

---

## F. Lore, fun and saving

### VC-165 · Lore fixes and expansion
- **Phase:** 5 · **Type:** docs · **Class:** medium · **Status:** todo
- **Goal:** the lore stays coherent with the round 1-2 canon and grows: world dossiers for map 2, NPC goals and relationships, narrator notes per map, and the Aether elements (VC-038).
- **How (AI):** run discussion rounds with the owner (VC-082 style), then update `docs/lore/` and the wiki PL/EN.

### VC-166 · Fun tuning from the play-tests
- **Phase:** 5 · **Type:** tune · **Class:** medium · **Status:** todo (after VC-084, VC-085)
- **Goal:** the game feels like the vision: platformer-style jump, early castle-game combat, Bastion-like narration, Aria-of-Sorrow mood.
- **How (AI):** apply the ranked improvements from the VC-084 play-test (cards VC-150+) and the VC-085 feel metrics. Re-run both after each round.

### VC-167 · Save game
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** the player can save and load progress: location, hero stats and gear, inventory, money, opened gates and levers, defeated bosses, and settings.
- **How (AI):**
  1. Define a versioned save schema with migrations.
  2. Save at rest zones (VC-179) plus an autosave on map change.
  3. Add 3 slots in the menu.
  4. Write unit tests for serialisation and migration, and an integration test for save, reload, same state.

---

## G. Menu, Tworzenie and loot

### VC-168 · Menu fixes
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** fix the menu issues found in the phase 4 play-tests (VC-084, VC-089), and add save/load entries (VC-167).
- **How (AI):** collect the issues from the play-test docs and fix them one small PR at a time, with headless screenshots.

### VC-169 · Tworzenie expansion
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** a bigger dev dialog. Restore the parity gaps (VC-140 to VC-145). Add authoring for map 2 (VC-161): place entities, zones and rest zones on the map browser. Add a loot-table editor (VC-178, VC-180).
- **How (AI):** one card per tool, building on the VC-075 map browser.

### VC-178 · Lantern drops (random)
- **Phase:** 5 · **Type:** feat · **Class:** small · **Status:** todo (details from the owner later)
- **Goal:** breaking a lantern can drop random loot: money, potions, small items.
- **How (AI):** a seeded deterministic loot roll from a per-world loot table in data, a drop pickup entity and tests. Wait for the owner's details before tuning the tables.

### VC-179 · Rest zone
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** rest zones heal and cure (including poison from VC-037), save the game (VC-167) and switch the parallax to its `rest` variant (VC-103, VC-109a).
- **How (AI):** a zone kind `rest` in the map contract plus an interaction prompt, with a short narrator line on first visit. Add at least one rest zone per world.

### VC-180 · Money and monster drops
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** monsters drop money and items; money shows in the HUD and the inventory and is kept in saves.
- **How (AI):**
  1. Add a `drops` table per enemy in `enemies.json` (chance, item or money range) with a seeded roll.
  2. Add a pickup magnet and HUD counter.
  3. Write balance tests and a schema test.
  4. Share the loot roll with VC-178.

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
