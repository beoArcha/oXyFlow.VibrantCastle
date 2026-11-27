# Game Scenario & Narrative Campaign: Vibrant Castle

## Introduction & World Concept

The world of *Vibrant Castle* merges the warm, melancholic aesthetic of late 19th-century gothic fantasy (inspired by *Castlevania: Aria of Sorrow*) with kinetic, *Mario*-like platforming and dynamic narration in the manner of *Bastion*.

The castle is suspended in an eternal, golden autumn. Once the illustrious seat of a guild of fencing scholars, astronomers, and horologists, the ancient Citadel of Aether fell into stasis following a catastrophic temporal fracture. Players embody the Awakened Duelists — Valen (*Solar Knight*) and Aurelia (*Scholar of Arcanum*) — who traverse the Citadel's interconnected worlds, restarting dormant clockwork mechanisms and pacifying corrupted guardians.

---

## Tone and Direction

* **Autumn of the Citadel**: The castle is caught in an unending golden autumn: warm ochre, amber, bronze, and crimson stone, drifting leaves and sparks, lit by lanterns against the dusk. Note: `aether_sanctuary` and `alchemist_library` currently use cooler cerulean/emerald themes; an autumn palette review is tracked in [`docs/tasks/VISION.md`](../tasks/VISION.md) and Phase 8+ of [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md).
* **Decay and Warmth**: Stone crumbles, leaves fall, and gears rust, yet the lamps remain lit.
* **Movement**: Springy, forgiving jumps with coyote time, jump buffering, and variable jump height.
* **Reactive Narrator**: Timed subtitles via `NarrationSystem` today; wiring `ReactiveNarratorManager` (`narrator_reactive.json`) and in-game VN scenes (`dialogues_vn.json`) is on the Phase 5 / Phase 7 backlog ([`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)). Disposition of historical narrative catalogs (`scenario_act1.json`, `triggers.json`) is tracked in [`VC-081`](../tasks/phase-4-0.3.x.md#vc-081--narrative-catalogs).
* **Loop, Not Line**: The current circuit spans 8 worlds (map 1 of each world), looping from the Eclipse Crown back to the Courtyard.

---

## Act I: The 8-World Citadel Circuit (Current Shipped Map 1 per World)

The full campaign plans **8 worlds × 8 maps** ([`VC-020`](../tasks/phase-4-0.3.x.md#vc-020--map-contract-for-the-8x8-campaign)). Today, map 1 of each world forms a connected 8-world circuit in `src/data/locations/*.json`:

```text
[1. courtyard] <==> [2. thorn_chasm] <==> [3. ashen_catacombs] <==> [4. clocktower]
       ^                                                                   ||
       |                                                                   vv
[8. eclipse_crown] <==> [7. grand_bastion] <==> [6. aether_sanctuary] <==> [5. alchemist_library]
```

1. **Courtyard of Awakening (`courtyard`)**: Awakening yard, training dummies, first sentinel patrols, golden gate lever (`lever_courtyard_gate`), and portals toward `thorn_chasm` and `clocktower`.
2. **Chasm of Thorns and Shadows (`thorn_chasm`)**: Precarious stone ledges, thorn creepers, diving gargoyles, and subterranean crawlers above the amber chasm. *(Restoring the chasm lever/gate pair is tracked in [`VC-022`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)).*
3. **Ashen Catacombs (`ashen_catacombs`)**: Soot-stained ossuary halls guarded by a `shadow_knight` and `chrono_hound`, sealed by `lever_ossuary_gate`. *(Map contract alignment: [`VC-026`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown)).*
4. **Clockwork Tower & Angled Range (`clocktower`)**: Vertical horologium shaft with brass automatons, owls, angled targets, and `lever_spire_gate`.
5. **Alchemist's Library (`alchemist_library`)**: Emergent arcane archive guarded by `aether_sentinel`, `aether_wisp`, and `shadow_knight`, sealed by `lever_archive_gate`. *(Map contract alignment: [`VC-027`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown)).*
6. **Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)**: Floating sky islets patrolled by `aether_wisp`, `aether_sentinel`, and the `aether_archon`. *(Restoring the sanctuary altar lever/gate is tracked in [`VC-024`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)).*
7. **Grand Bastion Training Grounds (`grand_bastion`)**: Royal gold proving gauntlet culminating at `bastion_sentinel_boss` behind `lever_bastion_keep`. *(Restoring the second ward gate lever is tracked in [`VC-025`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion)).*
8. **Eclipse Crown (`eclipse_crown`)**: Crimson-rose pinnacle combining elite guardians (`shadow_knight`, `aether_archon`, `bastion_sentinel_boss`) behind `lever_eclipse_seal`, with the Mastery Loop portal back to `courtyard`. *(Map contract alignment: [`VC-028`](../tasks/phase-5-0.4.x.md#vc-026--vc-028--fix-new-maps-ashen_catacombs-alchemist_library-eclipse_crown)).*

In solo play, Aurelia's meeting with Valen is drafted in `src/data/narrative/dialogues_vn.json` (not yet wired to the engine; Phase 7 backlog).

---

## Future Campaign Outline (Backlog: Phase 6–8+)

*Concept only: maps 2–8 of each world, ability-gated backtracking, and later story acts are unimplemented backlog items in [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md).*

* **Expanded 8 × 8 Worlds (Phase 6–8+)**: Expanding each of the 8 worlds from 1 stage to 8 interconnected stages, adding ability pickups that unlock locked portals (`isLocked` / `unlockTriggerId`).
* **Story & Bosses (Phase 7)**: In-game visual novel sequences, reactive *Bastion*-style narration wired to live combat/exploration events, and multi-phase boss encounters (such as the *Aether Archon*, *Bastion Sentinel Commander*, and *Grand Chronomancer*).
