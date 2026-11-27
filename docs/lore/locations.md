# Locations & Castle Sectors (World Atlas)

The world of *Vibrant Castle* is set within an ancient citadel suspended in an eternal, golden autumn. Constructed in the late 19th century by a guild of aristocratic duelists, scholars, and clockwork architects, the citadel harnesses primordial Aether — the crystalline substance that binds matter and the flow of time.

**Campaign Plan vs Current State**: The long-term campaign structure is **8 worlds × 8 maps** (64 stages, closer to 2D *Mario* stage flow with *Castlevania: Aria of Sorrow* exploration; [`docs/tasks/VISION.md`](../tasks/VISION.md)). Today **map 1 of each of the 8 worlds** is shipped in `src/data/locations/*.json` and registered in `LOCATION_REGISTRY` (`src/game/locations/registry.ts`). Maps 2–8 per world, the map design contract ([`VC-020`](../tasks/phase-4-0.3.x.md#vc-020--map-contract-for-the-8x8-campaign)), hybrid baseline expansions ([`VC-021`…`VC-025`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)), and alignment fixes for the newer maps ([`VC-026`…`VC-028`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown)) are on the backlog in [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md).

Gates are iron portcullises that visibly lift when their lever is struck (`1.2 s`, and collision shrinks from the bottom with them). Every shipped map passes the automated level-logic validator (`bun scripts/validate-level.ts --all`) and `src/tests/arch/locationBlueprints.test.ts` / `locationLinks.test.ts`.

---

```text
                       [ CURRENT 8-WORLD LOOP (MAP 1 PER WORLD) ]

  [1. Courtyard] <==> [2. Thorn Chasm] <==> [3. Ashen Catacombs] <==> [4. Clockwork Tower]
         ^                                                                      ||
         |                                                                      vv
  [8. Eclipse Crown] <==> [7. Grand Bastion] <==> [6. Aether Sanctuary] <==> [5. Alchemist's Library]
```

* Canonical progression (`LocationParser`): `courtyard` → `thorn_chasm` → `ashen_catacombs` → `clocktower` → `alchemist_library` → `aether_sanctuary` → `grand_bastion` → `eclipse_crown` → `courtyard`.
* Every world after `courtyard` also connects back to the preceding world (`courtyard` has outbound portals to `thorn_chasm` and `clocktower`; `eclipse_crown` loops back to `courtyard` via `mastery_loop_courtyard`).

---

## 1. Courtyard of Awakening (`courtyard`)

* **Title**: Courtyard of Awakening (*Dziedziniec Przebudzenia*)
* **Dimensions**: 4800px × 1040px
* **Spawn Point**: `(x: 140, y: 780)` (P2 offset: `+46px`); entries `from_chasm`, `from_eclipse`
* **Atmosphere & Theme**: Dusk plum-to-amber sky (`#2c1e33` → `#d97706`), soft golden fog (`rgba(251, 191, 36, 0.08)`), descending autumn leaves (`leaf`), tranquil ambient (`musicIntensity: 0.25`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_far` opaque + `bg_mid_far`, `bg_mid`, `bg_mid_close`, `bg_courtyard_boss_stage`, `bg_close`); tilesets `courtyard_stone`, `courtyard_wood`; 6 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 21 solids, 1 lever (`lever_courtyard_gate` → `courtyard_portcullis`), 3 narration triggers, portals to `thorn_chasm` and `clocktower`.
* **Inhabiting Forces (9)**: `training_dummy` (1), `training_target` (1), `gear_mite` (2), `court_sentinel` (2), `clockwork_owl_gargoyle` (1), `grand_dummy` (1), `aether_sentinel` (1).

## 2. Chasm of Thorns and Shadows (`thorn_chasm`)

* **Title**: Chasm of Thorns and Shadows (*Rozpadlina Cierni i Cieni*)
* **Dimensions**: 4560px × 1120px
* **Spawn Point**: `(x: 240, y: 740)` (P2 offset: `+46px`); entries `from_courtyard`, `from_catacombs`
* **Atmosphere & Theme**: Deep violet-to-ember abyss (`#1b1429` → `#7c2d12`), amber-rust haze (`rgba(180, 83, 9, 0.12)`), drifting dust (`dust`), rising tension (`musicIntensity: 0.48`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_chasm_far` opaque + 5 foreground/stage tiers); tileset `chasm_rock`; 3 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 16 solids, 0 levers today (restoring the lost chasm lever is tracked in [`VC-022`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)), portals to `courtyard` and `ashen_catacombs`.
* **Inhabiting Forces (8)**: `chasm_crawler` (2), `chasm_gargoyle` (2), `thorn_creeper` (1), `gargoyle_scout` (1), `gear_mite` (1), `aether_sentinel` (1).

## 3. Ashen Catacombs (`ashen_catacombs`)

* **Title**: Ashen Catacombs (*Katakumby Popiołu*)
* **Dimensions**: 2640px × 1560px
* **Spawn Point**: `(x: 240, y: 180)` (P2 offset: `+46px`); entries `from_chasm`, `from_clocktower`
* **Atmosphere & Theme**: Soot-charcoal to smoldering ember (`#171112` → `#7c2d12`), burnt-orange fog (`rgba(234, 88, 12, 0.14)`), drifting ash dust (`dust`), tense subterranean mood (`musicIntensity: 0.58`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_catacombs_far` opaque, `bg_catacombs_mid` mirrored); tileset `bastion_stone`; 6 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 19 solids, 1 lever (`lever_ossuary_gate` → `ossuary_portcullis`), 1 narration trigger, portals to `thorn_chasm` and `clocktower`. Contract alignment tracked in [`VC-026`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown).
* **Inhabiting Forces (7)**: `chasm_crawler` (1), `lantern_warden` (1), `gear_mite` (1), `chrono_hound` (1), `aether_wisp` (1), `aether_sentinel` (1), `shadow_knight` (1).

## 4. Clockwork Tower & Angled Range (`clocktower`)

* **Title**: Clockwork Tower & Angled Range (*Wieża Zegarowa & Poligon Kątowy*)
* **Dimensions**: 2440px × 1740px (vertical emphasis)
* **Spawn Point**: `(x: 240, y: 1500)` (P2 offset: `+46px`); entries `from_catacombs`, `from_courtyard`, `from_library`
* **Atmosphere & Theme**: Indigo dusk to warm brass (`#1e1b4b` → `#78350f`), amber mist (`rgba(217, 119, 6, 0.1)`), copper sparks (`spark`), rhythmic mechanical intensity (`musicIntensity: 0.65`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_clocktower_far` opaque + 5 layers); tileset `clocktower_brick`; 6 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 23 solids, 1 lever (`lever_spire_gate` → `spire_portcullis`), 1 narration trigger, portals to `ashen_catacombs` and `alchemist_library`.
* **Inhabiting Forces (8)**: `gear_mite` (1), `chrono_hound` (1), `clockwork_automaton` (2), `clockwork_owl_gargoyle` (2), `training_target` (1), `gargoyle_scout` (1).

## 5. Alchemist's Library (`alchemist_library`)

* **Title**: Alchemist's Library (*Biblioteka Alchemika*)
* **Dimensions**: 3840px × 1380px
* **Spawn Point**: `(x: 240, y: 1140)` (P2 offset: `+46px`); entries `from_clocktower`, `from_sanctuary`
* **Atmosphere & Theme**: Deep emerald-teal archive (`#06201b` → `#115e59`), glowing verdant mist (`rgba(16, 185, 129, 0.13)`), floating aetheric motes (`magic`), scholarly tension (`musicIntensity: 0.68`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_library_far` opaque, `bg_library_mid` mirrored); tileset `clocktower_brick`; 6 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 21 solids, 1 lever (`lever_archive_gate` → `library_portcullis`), 1 narration trigger, portals to `clocktower` and `aether_sanctuary`. Contract alignment tracked in [`VC-027`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown).
* **Inhabiting Forces (7)**: `aether_sentinel` (2), `aether_wisp` (2), `lantern_warden` (1), `clockwork_automaton` (1), `shadow_knight` (1).

## 6. Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Title**: Aether Sky Sanctuary & Aqueduct (*Sanktuarium Aetheru & Podniebny Akwedukt*)
* **Dimensions**: 4240px × 1400px
* **Spawn Point**: `(x: 240, y: 1100)` (P2 offset: `+46px`); entries `from_library`, `from_bastion`
* **Atmosphere & Theme**: Cerulean starlight (`#0f172a` → `#1e3a8a`), cyan haze (`rgba(56, 189, 248, 0.12)`), glowing motes (`magic`), heightened choral resonance (`musicIntensity: 0.75`). **Backlog**: bringing this blue sector closer to the autumn palette is tracked in [`docs/tasks/VISION.md`](../tasks/VISION.md) and Phase 8+ of [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md).
* **Parallax & Tilesets**: 6 parallax layers (`bg_aether_far` opaque + 5 layers); tileset `sanctuary_crystal`; 4 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 14 solids, 0 levers today (restoring the sanctuary lever is tracked in [`VC-024`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)), portals to `alchemist_library` and `grand_bastion`.
* **Inhabiting Forces (7)**: `aether_wisp` (2), `aether_sentinel` (2), `clockwork_owl_gargoyle` (1), `lantern_warden` (1), `aether_archon` (1).

## 7. Grand Bastion Training Grounds (`grand_bastion`)

* **Title**: Grand Bastion Training Grounds (*Słoneczny Bastion (Wielki Poligon)*)
* **Dimensions**: 4840px × 1140px
* **Spawn Point**: `(x: 240, y: 880)` (P2 offset: `+46px`); entries `from_sanctuary`, `from_eclipse`
* **Atmosphere & Theme**: Twilight indigo to burnished gold (`#1e1b4b` → `#b45309`), amber mist (`rgba(245, 158, 11, 0.1)`), drifting sparks (`spark`), climactic martial intensity (`musicIntensity: 0.92`).
* **Parallax & Tilesets**: 6 parallax layers (`bg_bastion_far` opaque + 5 layers); tileset `bastion_stone`; 4 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 13 solids, 1 lever (`lever_bastion_keep` → `bastion_portcullis`; restoring the second ward gate lever is tracked in [`VC-025`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)), portals to `aether_sanctuary` and `eclipse_crown`.
* **Inhabiting Forces (7)**: `court_sentinel` (1), `bastion_gargoyle` (2), `clockwork_automaton` (1), `chrono_hound` (1), `shadow_knight` (1), `bastion_sentinel_boss` (1).

## 8. Eclipse Crown (`eclipse_crown`)

* **Title**: Eclipse Crown (*Korona Zaćmienia*)
* **Dimensions**: 4640px × 1460px
* **Spawn Point**: `(x: 240, y: 1180)` (P2 offset: `+46px`); entry `from_bastion`
* **Atmosphere & Theme**: Obsidian eclipse sky to crimson-rose (`#160711` → `#9f1239`), crimson haze (`rgba(225, 29, 72, 0.16)`), intense sparks (`spark`), maximum boss intensity (`musicIntensity: 1.0`).
* **Parallax & Tilesets**: 7 parallax layers (`bg_eclipse_far` opaque, `bg_eclipse_mid` mirrored, plus `bg_eclipse_boss_world` and `bg_eclipse_boss_stage`); tilesets `bastion_stone`, `sanctuary_crystal`; 4 `hanging_lantern` decor props.
* **Interactive Elements & Portals**: 15 solids, 1 lever (`lever_eclipse_seal` → `eclipse_portcullis`), portals back to `grand_bastion` and `courtyard` (`mastery_loop_courtyard`). Contract alignment tracked in [`VC-028`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown).
* **Inhabiting Forces (7)**: `chrono_hound` (1), `aether_sentinel` (1), `lantern_warden` (1), `bastion_gargoyle` (1), `shadow_knight` (1), `aether_archon` (1), `bastion_sentinel_boss` (1).
