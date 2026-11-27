# Phase 5: worlds and characters (0.4.x, next)

Updated: 2026-11-28. Part of the [task folder](./README.md). Phases, gates and the card format are described in the [README](./README.md) and the [roadmap](./ROADMAP.md).

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
- **rest zone;**
- **repo, CI and site:** GitHub workflow optimisation and analysis, Dependabot, fixes to the github.io site, Google indexing, a security review, and GitHub repo quality.

The cards are in sections B2 to I below.

**Exit criteria:**
- 8 worlds each have a contract-compliant map 1;
- attributes drive HP/MP/Stamina and combat;
- enemies deal damage;
- the phase 5 quality gate passes.

**Quality gate checklist** (card `VC-199`, detail in [ROADMAP.md](./ROADMAP.md#quality-gate-end-of-every-phase-in-this-order)):
- [ ] 1. Docs quality and conformance check.
- [ ] 2. Docs update.
- [ ] 3. General review.
- [ ] 4. Release.
- [ ] 5. Version bump to `0.5.0`, approved by the owner.

**Cards still to be written:** pad layout with bumpers as selectors in gameplay; the reactive narrator wired to the engine (`VC-155` covers engine wiring). Moved from phase 4 at the gate: `VC-109b` and `VC-195`..`VC-197`.

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

### VC-109b · Repaint the 3 JPG parallax worlds as 3-tier PNGs
- **Phase:** 5 · **Type:** art · **Class:** medium · **Status:** todo (moved from Phase 4; after VC-109a #138)
- **Goal:** replace the 3 legacy JPG fars (`ashen_catacombs`, `alchemist_library`, `eclipse_crown`), their 3 JPG `var_b` mids, the 9 borrowed variation slots, and the remaining JPG fx files with original PNGs in `hi8bit`, `hi16bit`, and `high`, clearing `LEGACY_PARALLAX_JPG_ALLOWLIST`.
- **Description:** `VC-109a` (#138) derived `hi16bit` / `hi8bit` tiers for the 5 PNG worlds and generated `var_d_zone_boss` / `var_d_zone_rest` across all 8 worlds. The 8 files in `LEGACY_PARALLAX_JPG_ALLOWLIST` (`src/tests/arch/parallaxTaxonomy.test.ts`) and 9 borrowed `source` slots remain.
- **How (AI):**
  1. One world per PR: paint/generate the `far` (`2048x1152`, alpha-free PNG), own `var_a..d` (`1024 px` tall, true alpha, removing `screen` blend and `source` borrows), and derive `hi16bit` / `hi8bit` tiers.
  2. Replace `_shared/fx_sigil_high.jpg` and `eclipse_crown_fx_throne_high.jpg` with 3-tier PNGs (`_shared` / `eclipse_crown`).
  3. Re-run `bun scripts/parallax/buildMeta.ts` and `bun scripts/check-parallax-seams.ts`, shrink and empty `LEGACY_PARALLAX_JPG_ALLOWLIST`, and review contact sheets (`bun run review:parallax`) before merge.

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

---

## I. Repo, CI and site

### VC-181 · GitHub workflow analysis and optimisation
- **Phase:** 5 · **Type:** ci · **Class:** medium · **Status:** todo
- **Goal:** faster and cheaper CI with the same safety: find the changes the workflows need and apply them.
- **How (AI):**
  1. Write `docs/design/ci-review.md`: the job graph, the duration per job from recent runs (`gh run list` / `gh run view --json`), duplicate work across ci-pr, ci-main, deploy-pages and release-promote, cache hit rates, concurrency groups, path filters, and the required checks against branch protection.
  2. Apply the safe wins one small PR at a time: dependency and build caching, shared build artifacts, `concurrency` with cancel-in-progress on PRs, path filters for docs-only changes (keeping the required checks satisfied), and pinned action versions by SHA.
  3. Report the before/after durations.

### VC-182 · Dependabot
- **Phase:** 5 · **Type:** ci · **Class:** small · **Status:** todo
- **Goal:** automated, grouped dependency and GitHub Actions updates.
- **How (AI):**
  1. Add `.github/dependabot.yml` for `bun` (or the npm ecosystem reading `package.json` / `bun.lock`, whichever Dependabot supports for Bun) and `github-actions`. Run weekly, group minor and patch updates, limit open PRs, and add labels.
  2. Document how update PRs go through the normal review and auto-merge rules.

### VC-183 · github.io site fixes
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** the Pages site (the wiki plus the "Graj" game frame) works and looks right on desktop and mobile.
- **How (AI):**
  1. Run a headless pass over every wiki page PL/EN and the game page, using `bun run preview:pages`, then the live site.
  2. Fix broken links, assets, layout, language switching and the game frame sizing.
  3. Add a link-check script to `test:scripts`.

### VC-184 · Google indexing for the site
- **Phase:** 5 · **Type:** feat · **Class:** small · **Status:** todo (Search Console verification needs the owner)
- **Goal:** the site is indexable and shows well in search results.
- **How (AI):**
  1. Generate a `sitemap.xml` and `robots.txt` in `build:pages`.
  2. Add per-page `<title>`, meta description, canonical, `hreflang` PL/EN, Open Graph tags and a basic JSON-LD (`VideoGame` / `WebSite`).
  3. Add a verification meta tag or file placeholder.
  4. The owner adds the property in Google Search Console and submits the sitemap.
  5. Add a script test that checks the sitemap and tags exist.

### VC-185 · Security review of the repo
- **Phase:** 5 · **Type:** review · **Class:** medium · **Status:** todo
- **Goal:** a written security review with the fixes applied.
- **How (AI):**
  1. Enable or confirm CodeQL code scanning, secret scanning and push protection, and Dependabot alerts.
  2. Audit the workflows: least-privilege `permissions`, no `pull_request_target` misuse, pinned actions, and safe use of `GITHUB_TOKEN` in release-promote.
  3. Review branch protection, the dependency audit (`bun audit` or an equivalent) and the site headers.
  4. Write `docs/design/security-review.md` with findings and severity, then fix them in small PRs.

### VC-186 · GitHub repo quality
- **Phase:** 5 · **Type:** chore · **Class:** small · **Status:** todo
- **Goal:** the repo page is clear and well kept.
- **How (AI):**
  1. Write a README with a description, screenshots, the play link and build steps (Bun).
  2. Add a license check, `CONTRIBUTING.md`, `SECURITY.md`, issue and PR templates, a `CODEOWNERS`, topics and description, and labels.
  3. Make the release notes template match VC-061.
  4. Clean up stale branches and worktrees, and keep only gate releases.

---

## J. Gameplay feel, combat, narration & HUD (from VC-084 playtest)

### VC-150 · Fix lever activation from sword reach and spell projectiles
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** slashing a lever within `40 px` sword reach or hitting it with a spell projectile flips the lever reliably without requiring player body overlap.
- **Description:** `CombatSystem.processMeleeAttacks` and `CombatSystem.updateProjectiles` delegate lever hits to `CollisionEngine.resolve`, which re-checks the player's body AABB instead of the sword `attackBox` or projectile (`src/game/physics/collisions.ts:242`).
- **How (AI):** extract a direct lever activation helper on `LeverCollisionStrategy` (or call `onLeverActivated` directly from `CombatSystem` when `isHit` is true), preserve `isActivated` idempotency + SFX/narration, and add AAA unit + integration tests for ranged sword and spell lever hits.

### VC-151 · Add player post-hit invulnerability frames (i-frames)
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** players gain `~60 ticks` (`1.0 s`) of invulnerability after taking hazard or enemy damage instead of losing `60+ HP` in `3 ticks` (`50 ms`).
- **How (AI):** add `invulnTimer` on `Player`, guard `HazardCollisionStrategy` and incoming enemy damage while `invulnTimer > 0`, decrement in `PlayerController`, blink/tint the player sprite during i-frames, and add unit tests.

### VC-152 · Implement enemy contact damage, knockback, and telegraphed attacks
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo
- **Goal:** active enemies deal contact damage with knockback and execute 1–2 readable, telegraphed 8-bit castle-action attacks per archetype.
- **Description:** today `EnemyAISystem` only patrols `patrolMinX..patrolMaxX`; enemies and bosses deal `0` damage even on full body overlap.
- **How (AI):** resolve player-enemy contact damage in the simulation step (respecting `invulnTimer` and `shieldActiveTime`), add simple wind-up -> active -> recovery attack states in `EnemyAISystem` (melee lunge, aerial dive, or single orb shot), and add unit + integration tests.

### VC-153 · Fix coyote/buffer 1-tick pre-decrement and tune windows to 117–133 ms
- **Phase:** 5 · **Type:** tune · **Class:** tiny · **Status:** todo
- **Goal:** increase effective coyote time and jump buffer from `5 ticks` (`83.3 ms`) to `7–8 ticks` (`117–133 ms`), matching classic 2D platformer forgiveness.
- **Description:** `PlayerKinematics.update` decrements `coyoteTimer` and `jumpBufferTimer` before `processJumpTrigger` checks them, losing 1 tick of the configured `6`-tick window.
- **How (AI):** check `processJumpTrigger` before decrementing timers (or bump `maxCoyoteFrames` to `7` and `maxJumpBufferFrames` to `8`) in `src/game/physics/playerKinematics.ts`, update `playerKinematics.unit.test.ts`, and verify across 30/60/90/120 Hz.

### VC-154 · Add enemy hitstun/knockback and subtle melee hitstop
- **Phase:** 5 · **Type:** feat · **Class:** small · **Status:** todo
- **Goal:** sword hits feel weighty with brief hitstop (`2–3 ticks`), enemy patrol pause during hitstun, and directional knockback on non-boss enemies.
- **How (AI):** pause enemy patrol movement while `enemy.damageTimer > 8`, nudge non-boss enemies away from the attacker while clamping to `patrolMinX..patrolMaxX`, add optional micro-hitstop in `CombatSystem`, and cover with unit tests.

### VC-155 · Wire `ReactiveNarratorManager` to `GameEngine` and replace legacy narration keys
- **Phase:** 5 · **Type:** feat · **Class:** medium · **Status:** todo (after VC-083)
- **Goal:** live *Bastion*-style reactive commentary fires from `GameEventBus` events (`HAZARD_DAMAGE`, `LOW_HEALTH`, `LEVER_ACTIVATED`, `SECRET_FOUND`, `ENEMY_DEFEATED`) and legacy pronoun/training lines are replaced.
- **Description:** `ReactiveNarratorManager` and `narrator_reactive.json` are currently unwired; Aurelia triggers `"between his fingers"`, Worlds 7–8 open with `trainingIntro`, and every defeat says `"training automaton"`.
- **How (AI):** wire `ReactiveNarratorManager` into `GameEngine` via `GameEventBus`, replace `"VOICE FROM THE BEYOND"`, `narrationMagicUsed`, `trainingIntro`, and defeat copy per `docs/lore/narrator.md` and `docs/design/demo-scenes/*.md`, and add integration tests.

### VC-156 · Reposition HUD narrator banner, expand control hints, and fix brand title
- **Phase:** 5 · **Type:** tune · **Class:** small · **Status:** todo
- **Goal:** narrator subtitles no longer occlude ground-level enemies/portals, on-screen control hints include Jump and Spells, and the header displays `"Vibrant Castle"`.
- **How (AI):** move `HUDNarratorBanner` to an unobtrusive upper band below the header, add Jump (`Space`) and Magic (`U`/`O`) to `HUDControlsHint`, update the app brand i18n key to `"Vibrant Castle"`, and verify with headless screenshots.

### VC-157 · Honor portal `activation: "interact"` and implement `checkpoint_mid` respawn
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** portals require explicit interact input (preventing accidental back-portal exits) and players respawn at `checkpoint_mid` instead of restarting the whole map on a single pit fall.
- **How (AI):** require `up` / interact input when `portal.activation === "interact"` (with a clear on-screen prompt badge), add runtime activation + respawn for `checkpoint_mid` entries (`VC-020`), and add integration tests.

### VC-158 · Harmonize `aether_sanctuary` / `sanctuary_crystal` autumn palette and upgrade boss placeholders
- **Phase:** 5 · **Type:** tune · **Class:** small · **Status:** todo (coordinates with VC-122 / VC-131)
- **Goal:** replace neon cerulean/cyan in `aether_sanctuary` and `sanctuary_crystal` with twilight-autumn hues and prioritize `bastion_sentinel_boss` / `aether_sentinel` sprite upgrades.
- **How (AI):** tune `aether_sanctuary.json` theme gradient/fog and `sanctuary_crystal` tileset accents toward twilight indigo and warm amber/gold, and flag `bastion_sentinel_boss`, `shadow_knight`, and `aether_sentinel` in the `VC-122` / `VC-131` art queue.

### VC-159 · Smooth variable jump hold curve and add directional camera lookahead
- **Phase:** 5 · **Type:** tune · **Class:** small · **Status:** todo
- **Goal:** smoother mid-height hop modulation (`jumpHoldAcceleration`) and subtle camera lookahead so gaps and drops (`thorn_chasm`, `aether_sanctuary`) are visible before jumping.
- **How (AI):** refine `jumpHoldAcceleration` / `maxJumpHoldDuration` in `PlayerKinematics` for linear short-to-medium hop control, add velocity/facing lookahead + subtle downward peek in `CameraManager`, and verify with unit tests and `validate-level.ts`.

---

## K. Playtest polish & UI/devtools fixes (from VC-089)

### VC-190 · Sync initial player max HP/MP/Stamina with equipped starter gear
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** HUD vitals and Inventory derived stats show identical max HP, Mana, and Stamina right from initial spawn.
- **Description:** observed in VC-089 playtest: on fresh load in `courtyard`, the HUD shows `115 / 115` HP, `90 / 90` Mana, `115 / 115` Stamina while `InventoryStats` (`calculatePlayerDerivedStats`) displays `115 / 190`, `90 / 125`, `115 / 135`.
- **How (AI):** call the derived-stats recomputation/sync on initial player creation or level reset in `src/game/` (keeping HP/MP/Stamina clamped to max) and add a unit test asserting HUD snapshot and `calculatePlayerDerivedStats` match on spawn.

### VC-191 · Keep Inventory item inspector visible above the fold at 1280×800
- **Phase:** 5 · **Type:** fix · **Class:** small · **Status:** todo
- **Goal:** selecting an item in the Inventory keeps the inspector card, stat comparison deltas, and action buttons visible without manual scrolling at `1280×800`.
- **Description:** observed in VC-089 (`13_inventory_compare.png`): inside `GameMenuDialog` (`h-[min(85vh,760px)]`), `InventoryItemDetails` sits partially below the fold at `1280×800`.
- **How (AI):** tighten vertical spacing in `InventoryPanel` / `InventoryPaperdoll` / `InventoryQuickBelt` (or auto-scroll the inspector into view on selection) and verify with a `1280×800` headless screenshot.

### VC-192 · Clean up raw hero id, duplicate vitals labels, and legacy P1 status title
- **Phase:** 5 · **Type:** fix · **Class:** tiny · **Status:** todo
- **Goal:** replace `P1 · valen` and duplicate progress-bar numbers in `DebugSubtab.tsx`, and replace `"Gracz 1 (Valen - Szkarłat)"` in `src/i18n/modules/hud.ts`.
- **Description:** observed in VC-089 (`19_dev_debug.png` and `06_dialog_tab_character.png`): `DebugSubtab.tsx` prints the raw `player.characterId` and repeats HP/MP/SP text above and inside `ProgressBar`, while `p1Status` still says `"Valen - Szkarłat"`.
- **How (AI):** resolve localized hero names in `DebugSubtab.tsx`, render each vitals readout once, update `p1Status` in `src/i18n/modules/hud.ts`, and update affected unit tests.

### VC-193 · Throttle or downgrade `Quick potion slot 1 is empty` warning
- **Phase:** 5 · **Type:** fix · **Class:** tiny · **Status:** todo
- **Goal:** empty quick-potion slot lookups no longer flood the `Logi` ring buffer with repeated `WARN` entries.
- **Description:** observed in VC-089 (`20_dev_logs.png`): `game:inventory` emits repeated `WARN Quick potion slot 1 is empty` records during gameplay/input checks.
- **How (AI):** downgrade empty-slot attempts to `DEBUG` (or rate-limit per slot) in the inventory potion handler and add a unit test.

### VC-194 · Deduplicate floating `Włącz Dźwięk` HUD pill against header audio toggle
- **Phase:** 5 · **Type:** fix · **Class:** tiny · **Status:** todo
- **Goal:** show only one audio-enable prompt in the header when audio is uninitialized, instead of both a header icon and a floating canvas pill.
- **Description:** observed in VC-089 (`02_wiki_graj_frame.png`): both the top header audio icon (`#top-audio-btn`) and the floating `Włącz Dźwięk` button on the right HUD edge render simultaneously.
- **How (AI):** remove the redundant floating canvas audio pill (or hide it when `#top-audio-btn` is present) and verify with a headless screenshot.

---

## L. Parallax perf follow-ups (from VC-108 round 3)

### VC-195 · Measure Firefox parallax performance (`VC-108` follow-up)
- **Phase:** 5 · **Type:** test · **Class:** small · **Status:** todo
- **Goal:** run `bun run perf:parallax -- --browser firefox` against a matching Playwright Firefox build and verify desktop/low-power budgets.
- **Description:** in `VC-108` round 2/3 (`docs/perf/round-2.md`), the local Playwright cache held `firefox-1555` while `playwright-core@1.65.1` expects `firefox-1572`, failing `newContext` with a Juggler protocol mismatch (`Browser.setDownloadOptions`: unknown `legacyInterceptor`).
- **How (AI):** install the matching Playwright Firefox build (`firefox-1572`), run `bun run perf:parallax -- --browser firefox`, fix any Firefox-specific decode/composite bottlenecks if over budget, and append results to `docs/perf/`.

### VC-196 · Eliminate WebKit `grand_bastion` DPR 2 tail spike (`VC-108` follow-up)
- **Phase:** 5 · **Type:** perf · **Class:** small · **Status:** todo
- **Goal:** bring WebKit `grand_bastion` DPR 2 `p99` (`52.60 ms`) and `max` (`64.00 ms`) within `<= 2 × p95` and `< 33 ms`.
- **Description:** observed in `VC-108` round 3 (`docs/perf/round-3.md`): `grand_bastion` DPR 2 passes `p95` (`7.00 ms <= 8.3 ms`) on WebKit 27.2, but hits a single-frame `64.00 ms` tail spike while all other 15 WebKit runs stay at `max <= 20.00 ms`.
- **How (AI):** profile `grand_bastion` DPR 2 under WebKit (`bun run perf:parallax -- --browser webkit --location grand_bastion`), isolate whether the spike comes from `<canvas>` fallback surface transfer or first-draw image decode, smooth/defer the work, and re-measure.

### VC-197 · Fix parallax `off` mode slower than `low` on `clocktower` (`VC-108` follow-up)
- **Phase:** 5 · **Type:** perf · **Class:** small · **Status:** todo
- **Goal:** `parallaxQuality = "off"` renders faster than or equal to `"low"` across every map, eliminating the `clocktower` regression (`10.24 ms` vs `3.92 ms` tablet; `13.22 ms` vs `5.28 ms` laptop).
- **Description:** observed in `VC-108` round 3 (`docs/perf/round-3.md`): when `off` renders only the placeholder gradient, `GameRenderer` cannot skip the full-canvas clear and per-frame placeholder gradient fill on `clocktower` (`2440×1740`), making `off` ~2.5× slower than `low` (`hi8bit` opaque `far` bitmap).
- **How (AI):** cache the world's `off` placeholder backdrop onto a pre-rendered `ImageBitmap` / `<canvas>` surface (same opaque fast path as `far`), skip redundant canvas clears when opaque, and re-run `bun run perf:parallax -- --profile tablet --quality off` and `low-power-laptop`.

---

## Z. Phase gate

### VC-199 · Phase 5 quality gate and 0.5.0
- **Phase:** 5 · **Type:** review / workflow · **Class:** large · **Status:** blocked (all other phase 5 cards done or moved)
- **Goal:** close phase 5 and open phase 6 with version `0.5.0`.
- **How (AI):** run the gate from `ROADMAP.md` in order:
  1. Docs quality and conformance check (docs against code).
  2. Docs update.
  3. General review.
  4. Release.
  5. Version bump to `0.5.0`, approved by the owner.

  Move unfinished cards to phase 6 and write the phase 6 gate card.
