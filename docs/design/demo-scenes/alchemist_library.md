# World 5: Alchemist's Library (`alchemist_library`)

* **PL / EN:** *Biblioteka Alchemika* / Alchemist's Library · **Slot:** `W5-1`
* **Scale:** Current `3840 × 1380 px` · Contract target (`VC-027`): `5600+ × 1100–1600 px`

## Premise

Inside a 2034 chemical-synthesis laboratory and data-archive dome, cleanroom bioreactors glow as emerald alchemy vats while server racks sit bound in calfskin along towering shelves. As Valen and Aurelia climb past containment sentinels (`aether_sentinel`) toward the upper archive, salvaged 2034 records reveal the campaign's turning point: an experiment overlapped to the instant with an unprepared ritual, and the Zone's castles are a demon's misreading of modern tech.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Enter the western reading hall among leather-bound server stacks and glowing flasks. | `reading_hall_west`, `portal_back_clocktower`, `from_clocktower` | Multi-tier gallery traversal and reading cleanroom-turned-library landmarks. |
| First enemy | Dispatch containment sentinels and stray laboratory wisps guarding the lower shelves. | `lib_sentinel_ground`, `shelf_step_1..3`, `manuscript_west`, `lib_wisp_west` | Fighting ranged beam units and drifting wisps on elevated galleries. |
| Lever-gate | Ride `distillery_lift`, scale `forbidden_stacks`, and unlock the rotunda portcullis from above. | `stacks_step_1..3`, `forbidden_stacks`, `archive_secret`, `lever_archive_gate`, `library_portcullis` | Deep upper detours unlock lower rotunda progression across the void. |
| Mid checkpoint | Reach the central manuscript span overlooking the distillery shaft and `library_void_1`. | `manuscript_span`, `trig_library_magic`, `checkpoint_mid` (`VC-027`), `distillery_lift` | Timing vertical lift boarding above an unyielding containment void. |
| Optional secret | Read salvaged 2034 incident data in the high archive revealing how the Zone actually formed. | `archive_secret`, `lib_warden_stacks`, `lib_auto_stacks` (`secret_*` in `VC-027`) | The butterfly-effect truth: physics experiment + unprepared ritual overlapped in one instant. |
| Goal portal | Cross the Astrolabe Rotunda past the `shadow_knight` and exit upward to the sky viaduct. | `rotunda_floor`, `lib_knight_rotunda`, `library_astrolabe_rotunda`, `portal_to_sanctuary` | Stepping from indoor research archives onto the shattered open-air aqueduct. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_alchemist_library_entry_1` | Entry (`W5-1`) | Laboratorium syntezy zakwitło szmaragdem, a szafy serwerowe oprawiono w skórę jak księgi. | Cleanroom vats glow emerald, while server racks wear leather bindings like rare folios. |
| `narr_alchemist_library_enemy_1` | First enemy | Automatyczni strażnicy laboratorium nie rozpoznają dawnych przepustek. Reagują tylko na ruch. | Containment sentinels no longer honor old keycards. Only movement still registers on their sensors. |
| `narr_alchemist_library_lever_1` | Lever-gate | Zamek wysokiego archiwum puszcza w górze galerii. Bariera rotundy zsuwa się w posadzkę. | The high archive lock gives way above the stacks. Below, the rotunda barrier withdraws. |
| `narr_alchemist_library_mid_1` | Mid checkpoint (`W5-1`) | Winda destylarni wisi nad szmaragdową pustką. Tutaj rękopis spotyka się z aparaturą ciśnieniową. | The distillery lift hangs above an emerald void. Here illuminated pages meet pressure vessels. |
| `narr_alchemist_library_secret_1` | Secret revelation (dramatic) | Zapisy z 2034 są jasne: test fizyczny zbiegł się co do sekundy z nieprzygotowanym rytuałem. | The 2034 logs leave no doubt: a physics test collided to the second with an unprepared ritual. |
| `narr_alchemist_library_goal_1` | Goal (`W5-1`) | Pod wielkim mosiężnym astrolabium droga wiedzie w górę ku zerwanemu akweduktowi chłodziwa. | Beneath the great brass astrolabe, the gate rises toward the fractured coolant aqueduct. |
| `narr_alchemist_library_fall_1` | Reactive: falls (`library_void_1`) | Szklane kadzie nie stanowią miękkiego lądowania. Winda wraca zawsze, warto jednak w nią trafić. | Broken cleanroom vats offer poor footing. The lift always returns; aim to meet it halfway. |
| `narr_alchemist_library_linger_1` | Reactive: takes long | Demon skatalogował instrukcje serwerów w dziale nekromancji. Nawet archiwista potrzebuje granicy. | The demon shelved server manuals under necromancy. Even an archivist must draw a line. |
| `narr_alchemist_library_hero_valen_1` | Hero variant (Valen) | Valen odkłada spalony raport bez słowa. Przypadek i pośpiech kosztowały cały ten kwartał. | Valen sets the scorched report down without a word. Accident and haste remade all of this. |
| `narr_alchemist_library_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia milknie nad wykresem Szczeliny — pierwszy raz nie złości się na błąd, tylko na skalę. | Aurelia falls quiet over the rift trace—for once not angry at a flaw, only stunned by its scale. |
| `narr_alchemist_library_hit_1` | Reactive: enemy hit (`phase 5`) | Promień strażnika niesie energię laboratoryjną, a nie bajkową magię. Pancerz czuje różnicę. | That sentinel's beam carries lab-grade voltage, not folklore. Your coat knows the difference. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_alchemist_library_banter_1` / `_2`):** Early in `reading_hall_west` before the `archive_secret` incident-log discovery.
> * **PL:** **Aurelia:** „Ktoś oprawił dokumentację serwerowni w cielęcą skórę i schował ją obok alchemii. Nie mogę na to patrzeć.” / **Valen:** „Spójrz na plusy: przynajmniej ktoś wreszcie zrobił porządek w katalogu.”
> * **EN:** **Aurelia:** "Someone bound the server farm backups in calfskin and shelved them under alchemy. I can't bear it." / **Valen:** "Think of it kindly: at least someone finally alphabetized the catalog."

## Map Task Notes (`VC-027`)

* Widen from `3840` to `5600+ px`, assign a unique `openingNarrationKey` (breaking the shared `narrationMagicUsed` collision with `aether_sanctuary`), and raise density to `13+` enemies.
* Add `checkpoint_mid` near `manuscript_span`, place `library_archon_warden` in `library_astrolabe_rotunda`, and add a dedicated `secret_*` alcove off `forbidden_stacks` or `rotunda_upper_ring` since `archive_secret` holds mandatory `lever_archive_gate`.
* Verify `from_sanctuary` (`3480, 780`) is never softlocked behind `library_portcullis` (`3176`), and replace `trainingMagicPrompt` with W5-1 `Entry`, `Mid`, and `Goal` beats.
