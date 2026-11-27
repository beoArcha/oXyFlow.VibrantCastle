# World 6: Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **PL / EN:** *Sanktuarium Aetheru i Podniebny Akwedukt* / Aether Sky Sanctuary & Aqueduct · **Slot:** `W6-1`
* **Scale:** Current `4240 × 1400 px` · Contract target (`VC-024`): `5600–7200 × 1300–1600 px`

## Premise

Above the research valley, a 2034 elevated coolant aqueduct, power-relay viaduct, and atmospheric radar array snapped under upper-rift gravity shear into drifting stone islets. Broken concrete spans now float on steady updrafts (`wind_raft_1`, `wind_raft_2`) while crystalline defense frames orbit the high conduits under the `aether_archon`. Valen and Aurelia cross the sky bridge together toward the fortified inner perimeter.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Step onto the severed aqueduct pier suspended above mist with no ground below. | `aqueduct_start`, `portal_back_library`, `from_library` | Committing to open-air platforming across wide sky gaps. |
| First enemy | Clear stray energy wisps and containment sentinels holding the lower floating slabs. | `isle_1..3`, `sanc_wisp_1`, `sanc_sentinel_1`, `sanc_owl_1` | Fighting ranged and aerial foes without solid floor safety nets. |
| Lever-gate | Unlock the altar barrier restored in `VC-024` before entering the high portal bridge. | `archon_altar`, `celestial_barrier` (`VC-024` lever-gate) | Clearing late-stage switch locks under aerial pressure. |
| Mid checkpoint | Cross `wind_raft_1` onto the wide sanctuary isle holding steady above the cloud deck. | `wind_raft_1`, `isle_sanctum`, `sanc_sentinel_2`, `checkpoint_mid` (`VC-024`) | Boarding horizontal wind rafts and preparing for upper ascent. |
| Optional secret | Climb backward and upward from `isle_sanctum` to a lone sky pillar held by a beacon lamp. | `sky_step_1..2`, `sky_secret_isle`, `sanc_warden_secret` | Reversing direction upward reveals tucked-away vantage relics. |
| Goal portal | Ascend `wind_raft_2` to `archon_altar`, defeat `sanc_archon_boss`, and cross into the fortress. | `mono_1..2`, `wind_raft_2`, `archon_altar`, `sanc_archon_boss`, `portal_to_bastion` | Overcoming an elevated telemetry boss to breach the inner siege walls. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_aether_sanctuary_entry_1` | Entry (`W6-1`) | Przęsła akweduktu chłodziwa i linie wysokiego napięcia wiszą w mgle, jakby grawitacja straciła pamięć. | Coolant aqueduct piers and relay pylons float in mid-air, as if gravity briefly lost its notes. |
| `narr_aether_sanctuary_enemy_1` | First enemy | Przepięcia sieci krążą wokół zerwanych przęseł jak wartownicy bez rozkazów. | Stray grid surges orbit the snapped concrete spans like sentries awaiting orders. |
| `narr_aether_sanctuary_lever_1` | Lever-gate (`VC-024`) | Przekaźnik na wysepce zamyka obwód. Niebieska bariera przy ołtarzu gaśnie bez szmeru. | The islet relay completes its circuit. Ahead, the celestial barrier dims without a sound. |
| `narr_aether_sanctuary_mid_1` | Mid checkpoint (`W6-1`) | Środkowa wyspa akweduktu trzyma poziom wbrew prawom statyki. Za mgłą widać już sylwetkę Archonta. | The central aqueduct isle holds level against all statics. Beyond the mist waits the Archon. |
| `narr_aether_sanctuary_secret_1` | Reactive: finds secret | Kroki wstecz nad przepaścią prowadzą na samotny filar. Kto patrzy za siebie, widzi to, co umyka w biegu. | Stepping back and upward finds a solitary pillar. Looking behind you catches what sprints miss. |
| `narr_aether_sanctuary_goal_1` | Goal (`W6-1`, dramatic) | Archont ucichł, a prądy podniebne opadły. Most w chmurach prowadzi na złote wały obronne. | The Archon falls silent and the sky currents settle. Ahead lie the gilded outer ramparts. |
| `narr_aether_sanctuary_fall_1` | Reactive: falls (`aether_void`) | Między wyspami nie ma już betonu, została tylko biała mgła i cierpliwy wiatr. | No concrete waits between these piers—only white mist and an indifferent updraft. |
| `narr_aether_sanctuary_linger_1` | Reactive: takes long | Dryfujące tratwy poruszają się jak stare wahadła. Widok jest piękny, lecz most nigdzie nie ucieka. | The wind rafts drift like slow pendulums. The view is striking, though the bastion won't wait. |
| `narr_aether_sanctuary_hero_valen_1` | Hero variant (Valen) | Valen stawia stopę na lewitującym betonie ostrożnie, jakby sprawdzał lód w środku jesieni. | Valen tests each floating slab carefully, as though checking thin ice in mid-autumn. |
| `narr_aether_sanctuary_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia wyczuwa ścinanie grawitacji u końca palców — wreszcie zjawisko, które daje się policzyć. | Aurelia reads the gravity shear at her fingertips—at last, an anomaly that obeys math. |
| `narr_aether_sanctuary_hit_1` | Reactive: enemy hit (`phase 5`) | Uderzenie Archonta łączy przekaźnik radarowy z gniewem Szczeliny. Na tej wysokości każdy cios waży. | The Archon strikes with radar pulse and rift fury alike. Every hit weighs twice at this altitude. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_aether_sanctuary_banter_1` / `_2`):** Catching breath on `isle_sanctum` beside the glowing aqueduct span.
> * **PL:** **Aurelia:** „Przecięty rurociąg nadal pompuje wodę w poprzek chmur. Fizyka ewidentnie wzięła urlop.” / **Valen:** „Dopóki kamień pod stopami nie bierze urlopu razem z nią, możemy iść dalej.”
> * **EN:** **Aurelia:** "A sheared coolant pipe is still pumping water straight across the clouds. Physics took the day off." / **Valen:** "So long as the stone beneath our boots stays on duty, we keep moving."

## Map Task Notes (`VC-024`)

* Widen from `4240 × 1400` to `5600–7200 × 1300–1600 px`, restore explicit `aether_void` hazard strips under all floating islets, and raise enemy density to the late-world band (`18+`).
* Restore the missing `celestial_barrier` portcullis + lever pair (`REQUIRED_GATES`), keeping `from_bastion` unblocked on return; add `checkpoint_mid` on `isle_sanctum`.
* Align `aether_archon_altar` bossZone coordinates (`x: 2000..2740`) to cover `archon_altar` and `sanc_archon_boss` (`x: 3560`), add a `secret_*` trigger on `sky_secret_isle`, and assign a unique `openingNarrationKey` + `Entry`/`Mid`/`Goal` beats.
