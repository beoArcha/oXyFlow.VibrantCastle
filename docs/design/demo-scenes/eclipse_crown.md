# World 8: Eclipse Crown (`eclipse_crown`)

* **PL / EN:** *Korona Zaćmienia* / Eclipse Crown · **Slot:** `W8-1`
* **Scale:** Current `4640 × 1460 px` · Contract target (`VC-028`): `5600+ × 1200–1600 px`

## Premise

Ground Zero of the 2034 cataclysm: here the high-energy physics experiment spire fused across non-local space with the distant ritual site beneath a frozen black-and-crimson eclipse. Jagged obsidian walkways (`spire_1..7`) lead past elite Zone echoes toward the Throne of the Eclipse, where Map 1 previews vanguard and throne wardens (`aether_archon`, `bastion_sentinel_boss`) while the deeper `W8-8` confrontation awaits ahead. Valen and Aurelia ascend steadily to the loop threshold that returns them, stronger, to the château.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Arrive at `obsidian_base` beneath the eclipsed accelerator ring and amber rift thorns. | `obsidian_base`, `portal_back_bastion`, `from_bastion`, `obsidian_thorns_base` | Composed late-game focus under heavy vertical scale and time distortion. |
| First enemy | Overcome time-warped hounds and containment sentinels holding the climbing obsidian spires. | `ec_hound_base`, `spire_1..5`, `ec_sentinel_spire`, `eclipse_vanguard_sanctum` | Sustaining clean movement up staggered obsidian tiers under crossfire. |
| Lever-gate | Climb to `crimson_pinnacle` past the beacon warden and break the seal over `throne_arena`. | `spire_6..7`, `crimson_pinnacle`, `ec_warden_pinnacle`, `lever_eclipse_seal`, `eclipse_portcullis` | Reaching the summit seal unbars the final approach to the Throne bridge. |
| Mid checkpoint | Ride `corona_mover_1` onto `corona_mid_pier` and duel the elite `shadow_knight` across the void. | `corona_mover_1`, `corona_mid_pier`, `ec_knight_pier`, `checkpoint_mid` (`VC-028`) | Holding narrow void piers against fast elite duelists. |
| Optional secret | Inspect high perches overlooking the eclipsed ring (`crimson_pinnacle`, `throne_balcony`). | `crimson_pinnacle`, `throne_balcony` (`secret_*` in `VC-028`) | High balcony vantage reveals the full scale of the fused 2034 accelerator spire. |
| Goal portal | Cross `corona_mover_2`, defeat the Throne preview wardens, and enter the one-way time loop. | `throne_arena`, `ec_archon_throne`, `ec_monarch_boss`, `eclipse_monarch_throne`, `portal_mastery_courtyard` | Surviving the Crown previews the Throne and loops back to `courtyard` (`from_eclipse`). |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_eclipse_crown_entry_1` | Entry (`W8-1`, dramatic) | Punkt zero. Pierścień akceleratora i odległy ołtarz zrosły się pod nieruchomym czarnym słońcem. | Ground Zero. The accelerator ring and a distant altar fused beneath a motionless black sun. |
| `narr_eclipse_crown_enemy_1` | First enemy | U szczytu Strefy czas i pancerz zacierają granice. Nawet zwiadowcy biegną przez pęknięte sekundy. | At the Zone's summit, time and armor fray together. Even hounds sprint across cracked seconds. |
| `narr_eclipse_crown_lever_1` | Lever-gate | Pieczęć na szkarłatnej iglicy ustępuje. Ostatnia krata przed mostem do Tronu podnosi się wolno. | The seal atop the crimson pinnacle gives way. The last gate before the Throne bridge rises slowly. |
| `narr_eclipse_crown_mid_1` | Mid checkpoint (`W8-1`) | Wąskie przęsło nad otchłanią i Rycerz Cienia na straży. Za nim czuć już ciężar samego Zaćmienia. | A narrow span above the void, held by a Shadow Knight. Beyond him rests the weight of the Eclipse. |
| `narr_eclipse_crown_secret_1` | Reactive: finds secret | Z górnego balkonu widać cały krąg eksperymentu. Dwóch miejsc w 2034 nic nie powinno było połączyć. | From the high balcony the whole ring lies bare. Two places in 2034 were never meant to touch. |
| `narr_eclipse_crown_goal_1` | Goal (`W8-1`, dramatic) | Próg za Tronem zawija czas z powrotem na francuski dziedziniec — każdy cykl zostawia głębszy ślad. | The threshold past the Throne folds time back onto French stone—stronger for the loop's weight. |
| `narr_eclipse_crown_fall_1` | Reactive: falls (`obsidian_thorns`) | Obsydian i ciernie pod Koroną nie dają drugiej szansy w locie. Skupienie musi utrzymać krok. | Obsidian and thorns beneath the Crown forgive no slip. Hold your focus steady on the next span. |
| `narr_eclipse_crown_linger_1` | Reactive: takes long | Zaćmienie nie drgnęło ani o milimetr. Ten próg nie zamknie się sam, dopóki tu stoicie. | The eclipse has not shifted by a hair. This breach will not close itself while you stand here. |
| `narr_eclipse_crown_hero_valen_1` | Hero variant (Valen) | Valen staje u początku mostu z tą samą spokojną gardą, jakby długość drogi nie miała znaczenia. | Valen takes his stance at the bridgehead with the same calm guard, untouched by the height. |
| `narr_eclipse_crown_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia podnosi wzrok ku czarnemu słońcu — żadna z jej ksiąg nie opisała tej ciszy, a jednak idzie. | Aurelia looks up at the black sun—no formula names this silence, yet she steps forward anyway. |
| `narr_eclipse_crown_hit_1` | Reactive: enemy hit (`phase 5`) | Straż Korony uderza pełną mocą Szczeliny. Tu o wyniku decyduje każdy oddech i krok. | The Crown's wardens strike with raw rift force. Here, every breath and stride decides the bridge. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_eclipse_crown_banter_1` / `_2`):** Early at the foot of `spire_1` before the Throne climb (quiet warmth between friends, zero climax comedy).
> * **PL:** **Aurelia:** „Mój zegarek stanął trzy półki temu. Jeśli znowu spytasz, która godzina, odpowiem szczerze, że nie wiem.” / **Valen:** „Nie spytam. Wystarczy, że wiesz, na którą stronę mostu idziemy razem.”
> * **EN:** **Aurelia:** "My watch stopped three ledges ago. If you ask the time again, I'll only admit I have no idea." / **Valen:** "I won't ask. Knowing which side of the bridge we cross together is enough."

## Map Task Notes (`VC-028`)

* Widen from `4640` to `5600+ px`, replace `openingNarrationKey: "trainingIntro"` (**N8**), and move `ec_hound_base` past 400 px from spawn (`START_SAFE`).
* Add `checkpoint_mid` on `corona_mid_pier`, add `secret_*` triggers on `throne_balcony` (or an optional spire spur), and align `eclipse_monarch_throne` bossZone (`x: 2420..3440`) with `throne_arena` (`x: 3440+`).
* Keep Map 1's encounter as a vanguard/throne preview (`maps-contract.md` §9.2) while reserving the full `W8-8` clash for Phase 6+, and preserve `portal_mastery_courtyard` as the sole sanctioned one-way loop portal to `courtyard` (`from_eclipse`).
