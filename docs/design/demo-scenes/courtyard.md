# World 1: Courtyard of Awakening (`courtyard`)

* **PL / EN:** *Dziedziniec Przebudzenia* / Courtyard of Awakening · **Slot:** `W1-1`
* **Scale:** Current `4800 × 1040 px` · Contract target (`VC-021`): `6400–7200 × 1100–1600 px`

## Premise

A historic 2034 French château and heritage fencing estate sits warped at the Zone's edge, drenched in autumn leaves and amber lantern light. Its display armor (`court_sentinel`), maintenance micro-bots (`gear_mite`), and Master Oakhaven's fencing mannequins act as an outer proving yard for the summoned demon. Valen and Aurelia step through the stone arcades together to test blade, focus, and movement before unsealing the eastern gate.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Safe flat arrival on autumn flagstones; low arcades teach dashes and slides. | `ground_west`, `spawnPoints.default`, `trig_movement`, `practice_step_1` | Responsive run, jump, slide, and backstep cadence. |
| First enemy | Strike straw heritage dummies, then face active bots and museum sentries. | `trig_combat`, `dummy_1`, `dummy_terrace`, `sentinel_arcade` | Melee thrusts, angled shots, and enemy patrol spacing. |
| Lever-gate | Climb the east parapet above the gate sentry and hit the counterweight lever. | `battlement_step`, `battlement_ledge`, `lever_courtyard_gate`, `courtyard_portcullis` | Ranged or melee lever activation lifts solid portcullises. |
| Mid checkpoint | Secure stone plaza ahead of the trial square and moving moat drawbridge. | `ground_mid`, `checkpoint_mid` (`VC-021`), `courtyard_trial_square`, `moat_drawbridge` | Reading moving transports above `moat_thorns` and stage checkpointing. |
| Optional secret | Drop beneath the arcades into the cellar, or climb the tower to the Clocktower shortcut. | `crypt_floor` (`mite_crypt`), `tower_step_1..4`, `tower_summit` (`grand_dummy_tower`, `portal_vault_tower`) | Vertical exploration reveals hidden foes and a two-way World-4 vault shortcut. |
| Goal portal | Cross the raised portcullis past the final sentry into the glowing threshold. | `ground_east`, `sentinel_final`, `portal_exit_chasm` | Stepping from the intact château grounds out into the shattered quarry ravine. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_courtyard_entry_1` | Entry (`W1-1`) | Jesienne liście na francuskim kamieniu i zbroje z muzeum na warcie. Dziwne wtorki w 2034 to już norma. | Autumn leaves on French stone, and museum plate standing watch. Odd Tuesdays in 2034 hardly surprise now. |
| `narr_courtyard_enemy_1` | First enemy | Słomiane manekiny z sali szermierczej nabrały animuszu. Ktoś tu bardzo dosłownie potraktował regulamin. | The fencing hall's straw dummies have found their footing. Someone took the house rules quite literally. |
| `narr_courtyard_lever_1` | Lever-gate | Przeciwwaga z mosiądzu ustępuje pod jednym uderzeniem. Krata wschodu unosi się bez zbędnych ceregieli. | A brass counterweight yields to a single strike. The eastern portcullis rises without further ceremony. |
| `narr_courtyard_mid_1` | Mid checkpoint (`W1-1`) | Plac prób i fosa pełna bursztynowych cierni. Stąd zaczyna się właściwy spacer po ogrodach zamku. | The trial square and a moat of amber thorns. From here on, the château grounds stop being polite. |
| `narr_courtyard_secret_1` | Reactive: finds secret | Za cichą arkadą kryje się przejście w głąb wież. Ciekawość po raz kolejny wyprzedza ostrożność. | Behind quiet masonry waits an upper shortcut. Curiosity, as ever, outpaces sound judgment. |
| `narr_courtyard_goal_1` | Goal (`W1-1`) | Kamienne mury urywają się nad urwiskiem. Dalej zaczyna się rozdarty kamieniołom poza granicą parku. | The château wall breaks off above a sheer gorge. Beyond lies the torn quarry outside the grounds. |
| `narr_courtyard_fall_1` | Reactive: falls (`moat_thorns`) | Grawitacja nie uległa mutacji, a ciernie w fosie nie wybaczają pośpiechu. Warto otrzepać płaszcz. | Gravity remains stubbornly conventional, and moat thorns dislike haste. Best brush off the dust. |
| `narr_courtyard_linger_1` | Reactive: takes long | Szesnastowieczne mury nigdzie się nie wybierają, w przeciwieństwie do reszty dnia. Czas ruszać dalej. | Sixteenth-century masonry has nowhere else to be, unlike the rest of the day. Time to move on. |
| `narr_courtyard_hero_valen_1` | Hero variant (Valen) | Valen ocenia pancerz z muzeum tak samo jak zepsuty zamek: spokojnie, śruba po śrubie. | Valen sizes up the museum plate like a jammed bolt: calmly, one lock at a time. |
| `narr_courtyard_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia mierzy iskrą w zbroję z wystawy, poirytowana, że dawne żelazo stawia taki opór. | Aurelia tests a bolt against display armor, faintly annoyed that old iron talks back. |
| `narr_courtyard_hit_1` | Reactive: enemy hit (`phase 5`) | Muzealny strażnik bije zaskakująco współcześnie. Ktoś podłączył to żelastwo na nowo. | The museum sentry hits with unnerving modern force. Something rewired that iron. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_courtyard_banter_1` / `_2`):** Beneath `arcade_bridge_1` after the first `court_sentinel` patrol enters sight.
> * **PL:** **Aurelia:** „Szesnastowieczny dziedziniec, a na straży stoją drony w pancerzu. Demon ma fatalne wyczucie epoki.” / **Valen:** „Przynajmniej manekiny nadal nie oddają. Zacznijmy od tego, co stoi spokojnie.”
> * **EN:** **Aurelia:** "Sixteenth-century flagstones, guarded by armored drones. The demon has dreadful taste in eras." / **Valen:** "At least the straw dummies still hold position. Let's start with what stands still."

## Map Task Notes (`VC-021`)

* Expand width from `4800 × 1040` to `6400–7200 × 1100–1600 px`, preserving the `from_eclipse` loop spawn and `portal_vault_tower` two-way shortcut to `clocktower`.
* Restore the second parapet gate with its own lever (`maps-contract.md` §7) and add `checkpoint_mid` on safe flat ground before `courtyard_trial_square`.
* Populate `courtyard_captain_1` in `courtyard_trial_square`, add `secret_*` triggers in `crypt_floor` and `tower_summit`, and replace `narrationOpening` / shared triggers with `narrationW1M1Entry`, `...Mid`, and `...Goal`.
