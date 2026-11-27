# Locations & Zone Sectors (Technical World Atlas — Map 1)

This atlas indexes the **8 currently shipped Map-1 sectors** in `src/data/locations/*.json` and aligns them with the **2034 canon** ([`world.md`](./world.md)). Narrative lore, 2034 real-world origins, and demon reinterpretations live in [`worlds/`](./worlds/courtyard.md).

**Campaign Plan vs Current State:** The full campaign is planned as **8 worlds × 8 maps** (64 stages; [`docs/design/maps-contract.md`](../design/maps-contract.md)). Today **Map 1 of each world** is shipped and registered in `LOCATION_REGISTRY` (`src/game/locations/registry.ts`). Contract expansions (`VC-021`..`VC-025`) and alignment fixes (`VC-026`..`VC-028`) are tracked on the Phase 5 backlog ([`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)).

Iron portcullises visibly lift over `1.2 s` when their linked lever is struck, shrinking collision from the bottom. All 8 blueprints pass `bun scripts/validate-level.ts --all`, `locationBlueprints.test.ts`, and `locationLinks.test.ts`.

---

```text
                       [ CURRENT 8-WORLD LOOP (MAP 1 PER WORLD) ]

  [1. Courtyard] <==> [2. Thorn Chasm] <==> [3. Ashen Catacombs] <==> [4. Clockwork Tower]
         ^                                                                      ||
         |                                                                      vv
  [8. Eclipse Crown] <==> [7. Sunlit Bastion] <==> [6. Aether Sanctuary] <==> [5. Alchemist's Library]
```

* **Canonical Order:** `courtyard` → `thorn_chasm` → `ashen_catacombs` → `clocktower` → `alchemist_library` → `aether_sanctuary` → `grand_bastion` → `eclipse_crown` → `courtyard`.

---

## 1. Courtyard of Awakening (`courtyard`) — [Lore Dossier](./worlds/courtyard.md)

* **PL / EN:** *Dziedziniec Przebudzenia* / Courtyard of Awakening
* **2028 Origin:** Historic French château & restoration estate.
* **Dimensions & Spawn:** `4800 × 1040 px` · default `(140, 780)` (P2 `+46 px`), entries `from_chasm`, `from_eclipse`.
* **Atmosphere & Assets:** `#2c1e33` → `#d97706`, falling `leaf`, `musicIntensity: 0.25`; 6 parallax layers (`world:courtyard:far` opaque); tilesets `courtyard_stone`, `courtyard_wood`; 6 `hanging_lantern` props.
* **Interactive & Portals:** 21 solids, 1 lever (`lever_courtyard_gate` → `courtyard_portcullis`), 1 hazard (`moat_thorns`), 3 triggers, portals to `thorn_chasm` and `clocktower`, `bossZones`: `courtyard_trial_square`.
* **Inhabiting Forces (9):** `training_dummy` (1), `training_target` (1), `gear_mite` (2), `court_sentinel` (2), `clockwork_owl_gargoyle` (1), `grand_dummy` (1), `aether_sentinel` (1).

## 2. Chasm of Thorns and Shadows (`thorn_chasm`) — [Lore Dossier](./worlds/thorn_chasm.md)

* **PL / EN:** *Rozpadlina Cierni i Cieni* / Chasm of Thorns and Shadows
* **2028 Origin:** Terraced limestone quarry, sunken utility cut & botanical conservatory ravine.
* **Dimensions & Spawn:** `4560 × 1120 px` · default `(240, 740)`, entries `from_courtyard`, `from_catacombs`.
* **Atmosphere & Assets:** `#1b1429` → `#7c2d12`, `dust`, `musicIntensity: 0.48`; 6 parallax layers (`world:thorn_chasm:far` opaque); tileset `chasm_rock`; 3 `hanging_lantern` props.
* **Interactive & Portals:** 16 solids, 0 levers today (restoration in `VC-022`), 2 thorn hazards, portals to `courtyard` and `ashen_catacombs`, `bossZones`: `thorn_warden_lair`.
* **Inhabiting Forces (8):** `chasm_crawler` (2), `chasm_gargoyle` (2), `thorn_creeper` (1), `gargoyle_scout` (1), `gear_mite` (1), `aether_sentinel` (1).

## 3. Ashen Catacombs (`ashen_catacombs`) — [Lore Dossier](./worlds/ashen_catacombs.md)

* **PL / EN:** *Katakumby Popiołu* / Ashen Catacombs
* **2028 Origin:** Château burial crypts merged with municipal heating boilers & underground service tunnels.
* **Dimensions & Spawn:** `2640 × 1560 px` · default `(240, 180)`, entries `from_chasm`, `from_clocktower`.
* **Atmosphere & Assets:** `#171112` → `#7c2d12`, `dust`, `musicIntensity: 0.58`; 6 parallax layers (`world:ashen_catacombs:far` opaque); tileset `bastion_stone`; 6 `hanging_lantern` props.
* **Interactive & Portals:** 19 solids, 1 lever (`lever_ossuary_gate` → `ossuary_portcullis`), 1 ember hazard, 1 trigger, portals to `thorn_chasm` and `clocktower`, `bossZones`: `catacombs_ember_chapel` (`VC-026`).
* **Inhabiting Forces (7):** `chasm_crawler` (1), `lantern_warden` (1), `gear_mite` (1), `chrono_hound` (1), `aether_wisp` (1), `aether_sentinel` (1), `shadow_knight` (1).

## 4. Clockwork Tower & Angled Range (`clocktower`) — [Lore Dossier](./worlds/clocktower.md)

* **PL / EN:** *Wieża Zegarowa i Poligon Kątowy* / Clockwork Tower & Angled Range
* **2028 Origin:** Automated high-bay robotics factory & optical calibration tower.
* **Dimensions & Spawn:** `2440 × 1740 px` · default `(240, 1500)`, entries `from_catacombs`, `from_courtyard`, `from_library`.
* **Atmosphere & Assets:** `#1e1b4b` → `#78350f`, `spark`, `musicIntensity: 0.65`; 6 parallax layers (`world:clocktower:far` opaque); tileset `clocktower_brick`; 6 `hanging_lantern` props.
* **Interactive & Portals:** 23 solids, 1 lever (`lever_spire_gate` → `spire_portcullis`), 1 trigger, portals to `ashen_catacombs` and `alchemist_library`, `linkedSceneId: scene_clocktower_meeting`, `bossZones`: `clocktower_summit_chamber` (`VC-023`).
* **Inhabiting Forces (8):** `gear_mite` (1), `chrono_hound` (1), `clockwork_automaton` (2), `clockwork_owl_gargoyle` (2), `training_target` (1), `gargoyle_scout` (1).

## 5. Alchemist's Library (`alchemist_library`) — [Lore Dossier](./worlds/alchemist_library.md)

* **PL / EN:** *Biblioteka Alchemika* / Alchemist's Library
* **2028 Origin:** Synthesis laboratory, cleanroom biovats, server/data archive & containment dome.
* **Dimensions & Spawn:** `3840 × 1380 px` · default `(240, 1140)`, entries `from_clocktower`, `from_sanctuary`.
* **Atmosphere & Assets:** `#06201b` → `#115e59` (N12 palette review backlog), `magic`, `musicIntensity: 0.68`; 6 parallax layers (`world:alchemist_library:far` opaque); tileset `clocktower_brick`; 6 `hanging_lantern` props.
* **Interactive & Portals:** 21 solids, 1 lever (`lever_archive_gate` → `library_portcullis`), 1 void hazard, 1 trigger, portals to `clocktower` and `aether_sanctuary`, `bossZones`: `library_astrolabe_rotunda` (`VC-027`).
* **Inhabiting Forces (7):** `aether_sentinel` (2), `aether_wisp` (2), `lantern_warden` (1), `clockwork_automaton` (1), `shadow_knight` (1).

## 6. Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`) — [Lore Dossier](./worlds/aether_sanctuary.md)

* **PL / EN:** *Sanktuarium Aetheru i Podniebny Akwedukt* / Aether Sky Sanctuary & Aqueduct
* **2028 Origin:** Elevated coolant aqueduct, power-relay viaduct & atmospheric radar array.
* **Dimensions & Spawn:** `4240 × 1400 px` · default `(240, 1100)`, entries `from_library`, `from_bastion`.
* **Atmosphere & Assets:** `#0f172a` → `#1e3a8a` (N12 autumn palette review backlog), `magic`, `musicIntensity: 0.75`; 6 parallax layers (`world:aether_sanctuary:far` opaque); tileset `sanctuary_crystal`; 4 `hanging_lantern` props.
* **Interactive & Portals:** 14 solids, 0 levers today (`VC-024`), portals to `alchemist_library` and `grand_bastion`, `bossZones`: `aether_archon_altar`.
* **Inhabiting Forces (7):** `aether_wisp` (2), `aether_sentinel` (2), `clockwork_owl_gargoyle` (1), `lantern_warden` (1), `aether_archon` (1).

## 7. Sunlit Bastion (`grand_bastion`) — [Lore Dossier](./worlds/grand_bastion.md)

* **PL / EN:** *Słoneczny Bastion* / Sunlit Bastion *(UI `locations.ts` currently says `"Grand Bastion Training Grounds"` / `"Słoneczny Bastion (Wielki Poligon)"` — tracked under N6/N8/N11)*
* **2028 Origin:** Fortified military-industrial command perimeter, bunker complex & proving garrison.
* **Dimensions & Spawn:** `4840 × 1140 px` · default `(240, 880)`, entries `from_sanctuary`, `from_eclipse`.
* **Atmosphere & Assets:** `#1e1b4b` → `#b45309`, `spark`, `musicIntensity: 0.92`; 6 parallax layers (`world:grand_bastion:far` opaque); tileset `bastion_stone`; 4 `hanging_lantern` props.
* **Interactive & Portals:** 13 solids, 1 lever (`lever_bastion_keep` → `bastion_portcullis`; second ward gate in `VC-025`), 2 thorn hazards, portals to `aether_sanctuary` and `eclipse_crown`, `bossZones`: `bastion_commander_arena`.
* **Inhabiting Forces (7):** `court_sentinel` (1), `bastion_gargoyle` (2), `clockwork_automaton` (1), `chrono_hound` (1), `shadow_knight` (1), `bastion_sentinel_boss` (1).

## 8. Eclipse Crown (`eclipse_crown`) — [Lore Dossier](./worlds/eclipse_crown.md)

* **PL / EN:** *Korona Zaćmienia* / Eclipse Crown
* **2028 Origin:** High-energy physics accelerator spire entangled across space with the distant ritual site.
* **Dimensions & Spawn:** `4640 × 1460 px` · default `(240, 1180)`, entry `from_bastion`.
* **Atmosphere & Assets:** `#160711` → `#9f1239`, `spark`, `musicIntensity: 1.0`; 7 parallax layers (`world:eclipse_crown:far` opaque + `boss_stage` + `boss_world`); tilesets `bastion_stone`, `sanctuary_crystal`; 4 `hanging_lantern` props.
* **Interactive & Portals:** 15 solids, 1 lever (`lever_eclipse_seal` → `eclipse_portcullis`), 1 thorn hazard, portals to `grand_bastion` and `courtyard` (`mastery_loop_courtyard`), `bossZones`: `eclipse_vanguard_sanctum` and `eclipse_monarch_throne` (`VC-028`).
* **Inhabiting Forces (7):** `chrono_hound` (1), `aether_sentinel` (1), `lantern_warden` (1), `bastion_gargoyle` (1), `shadow_knight` (1), `aether_archon` (1), `bastion_sentinel_boss` (1).
