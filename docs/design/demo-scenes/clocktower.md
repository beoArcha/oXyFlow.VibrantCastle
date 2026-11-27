# World 4: Clockwork Tower & Angled Range (`clocktower`)

* **PL / EN:** *Wieża Zegarowa i Poligon Kątowy* / Clockwork Tower & Angled Range · **Slot:** `W4-1`
* **Scale:** Current `2440 × 1740 px` · Contract target (`VC-023` vertical): `2800–3600 × 2600–3200 px`

## Premise

Beside the château stood a 2034 automated high-bay robotics factory and optical sensor calibration tower—rebuilt by the demon into a brass horologium whose summit hands tick backward. Hydraulic freight lifts (`lift_west`, `lift_east`) and robotic loaders (`clockwork_automaton`) guard vertical galleries alongside 45° and 90° calibration lanes. Having drifted apart through lower Zone spatial warping, Valen and Aurelia reunite here as longtime friends to synchronize their route into the research wing.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Enter the base assembly floor from the catacombs shaft (or from the `courtyard` vault entry). | `tower_base`, `portal_back_catacombs`, `from_catacombs`, `from_courtyard` | Vertical sightlines, `lift_west` timing, and backward clockwork rhythm. |
| First enemy | Clear skittering repair bots and heavy brass factory loaders guarding the lower galleries. | `tower_mite_base`, `tower_hound_base`, `cog_gallery_east`, `tower_auto_1` | Spacing slow heavy hammer slams while watching fast base patrollers. |
| Lever-gate | Ride `lift_east` and ascend the upper spiral to throw the belfry lever over the summit bridge. | `lift_east`, `spiral_1..3`, `lever_belfry`, `lever_spire_gate`, `spire_portcullis` | Climbing past vertical hazards to unseal the top 20% goal bridge. |
| Mid checkpoint | Cross `pendulum_mover` onto the optical calibration range and hit the mid reunion beat. | `pendulum_mover`, `mainspring_gallery`, `trig_range`, `checkpoint_mid` (`VC-023`) | Aiming 45° diagonal and 90° vertical shots; friends re-sync after spatial drift. |
| Optional secret | Detour west from `horologist_gallery` onto a quiet shelf holding a high calibration target. | `horologist_gallery`, `nook_step`, `horologist_nook`, `tower_target_nook` | Rewarding angled shooting mastery in a secluded side gallery. |
| Goal portal | Cross `summit_bridge` through the raised belfry gate into the adjoining research complex. | `spiral_4..5`, `summit_bridge`, `clocktower_summit_chamber`, `portal_to_library` | Reaching the summit opens the way directly into `alchemist_library` (not Sanctuary). |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_clocktower_entry_1` | Entry (`W4-1`) | W 2034 roku ta fabryka składała siłowniki. Teraz demon przerobił ją na mosiądz i bieg wsteczny. | In 2034 this high-bay plant assembled servos. Now brass gears grind, and the summit ticks backward. |
| `narr_clocktower_enemy_1` | First enemy | Roboty załadowcze ubrały się w zbroje z brązu. Siła nacisku została przemysłowa. | Factory loaders dressed themselves in cast brass. Their hydraulic crush stayed strictly industrial. |
| `narr_clocktower_lever_1` | Lever-gate | Wajcha w dzwonnicy uwalnia górną śluzę. Wielka przekładnia zatrzymuje się na ułamek sekundy. | The belfry switch releases the summit sluice. For half a beat, the master gears hold still. |
| `narr_clocktower_mid_1` | Mid checkpoint (`W4-1`) | Stary poligon optyczny wciąż czeka na strzały pod kątem czterdziestu pięciu i dziewięćdziesięciu stopni. | The old sensor calibration range still awaits crisp forty-five and vertical ninety-degree shots. |
| `narr_clocktower_secret_1` | Reactive: finds secret | Zaciszna wnęka zegarmistrza kryje zapomniany cel testowy. Precyzyjny strzał w kąt wciąż się opłaca. | The horologist's nook hides a forgotten calibration target. Angled shots still earn their keep. |
| `narr_clocktower_goal_1` | Goal (`W4-1`) | Most szczytowy otwiera przejście wprost do laboratoriów badawczych. Tryby zostają za plecami. | The summit bridge opens straight into the research archive wing. The grinding cogs fall behind. |
| `narr_clocktower_fall_1` | Reactive: falls down shaft | Winda nie czeka na nikogo. Długa droga w dół daje czas, by przemyśleć następną trajektorię. | Clockwork lifts never wait for late passengers. The long drop gives ample time to rethink angles. |
| `narr_clocktower_linger_1` | Reactive: takes long | Wskazówki na szczycie cofają się, ale nikt tu naprawdę nie odzyskuje straconych minut. | The summit hands tick backward, yet nobody here actually gets those minutes refunded. |
| `narr_clocktower_hero_valen_1` | Hero variant (Valen) | Valen patrzy na wahadło bez zdziwienia — nawet zepsuta maszyna ma swój rytm, jeśli jej słuchać. | Valen studies the pendulum without flinching—even a broken rig keeps a beat if you listen. |
| `narr_clocktower_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia liczy sekundy wspak i prycha pod nosem: fizyka wieży wymagałaby solidnej poprawki. | Aurelia counts seconds in reverse and mutters—this tower's physics badly needs a red pen. |
| `narr_clocktower_hit_1` | Reactive: enemy hit (`phase 5`) | Młot automatu ma masę prasy hydraulicznej. Lepiej schodzić mu z linii niż sprawdzać pancerz. | That automaton's hammer swings with hydraulic tonnage. Better step aside than test your coat. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_clocktower_banter_1` / `_2`):** Reunion beat near `mainspring_gallery` (`scene_clocktower_meeting` canon alignment: longtime friends separated by spatial distortion, never strangers).
> * **PL:** **Aurelia:** „Przeniosło cię przez trzy piętra i nawet nie zgubiłeś okularów. Jak?” / **Valen:** „Trzymałem się poręczy. Ale zegar naprawdę chodzi w złą stronę — sprawdzałem dwa razy.”
> * **EN:** **Aurelia:** "Space folded us three floors apart and you didn't even lose your glasses. How?" / **Valen:** "Kept a hand on the railing. Though the summit clock truly runs backward—I checked twice."

## Map Task Notes (`VC-023`)

* Restore the vertical band (`2800–3600 × 2600–3200 px`), keeping `summit_bridge` and `portal_to_library` inside the top 20%.
* Add the missing return portal to `courtyard` near `from_courtyard` (`x: 1180, y: 1500`) to satisfy the two-way shortcut rule (`maps-contract.md` §7).
* Add `checkpoint_mid` on `mainspring_gallery`, place `tower_summit_automaton` in `clocktower_summit_chamber`, add a `secret_*` trigger in `horologist_nook`, and add W4-1 `Entry`, `Mid`, and `Goal` beats; ensure Phase 7 `scene_clocktower_meeting` points to `alchemist_library` (**N7**).
