# World 3: Ashen Catacombs (`ashen_catacombs`)

* **PL / EN:** *Katakumby Popiołu* / Ashen Catacombs · **Slot:** `W3-1`
* **Scale:** Current `2640 × 1560 px` · Contract target (`VC-026`): `5600+ × 1100–1600 px`

## Premise

Beneath the château and quarry, historic stone burial crypts collided in 2034 with municipal district-heating boilers and underground service corridors. Ruptured thermal vents turned the vaults into smouldering ossuaries patrolled by floating inspection lamps (`lantern_warden`), time-looped tunnel hounds (`chrono_hound`), and an unyielding `shadow_knight`. Descending into the soot, Valen and Aurelia find the Zone's lighter surface mood burned away.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Descend from the top-left crypt shelf into drifting ash and ruptured heating shafts. | `crypt_entry`, `portal_back_chasm`, `from_chasm`, `shaft_1..3` | Controlled multi-tier descents without losing sight of landings. |
| First enemy | Encounter roving cave crawlers and floating brass boiler lamps along the upper drops. | `cat_crawler_1`, `cat_warden_1`, `chain_step_1..2` | Aerial beacon threats force careful timing on narrow steps. |
| Lever-gate | Cross the chapel vault roof past an `aether_sentinel` to lift the locked ossuary grate. | `chapel_vault_roof`, `cat_sentinel_lever`, `lever_ossuary_gate`, `ossuary_portcullis` | Splitting high roof routes to unlock the sealed lower chapel floor. |
| Mid checkpoint | Cross the time-stuttered service hall and ride the furnace shuttle over the well shaft. | `chain_hall`, `cat_hound_hall`, `furnace_mover`, `well_ledge_2`, `checkpoint_mid` (`VC-026`) | Reading fast looping enemies (`chrono_hound`) and shuttle timing. |
| Optional secret | Climb to the high eastern alcove above `shaft_3` guarded by a repair mite for 2034 boiler logs. | `shaft_3`, `relic_alcove`, `cat_mite_alcove` | High side ledges hold salvaged 2034 maintenance context behind optional jumps. |
| Goal portal | Drop to `chapel_floor`, clear the `shadow_knight`, and pass `ossuary_portcullis` to climb upward. | `chapel_floor`, `cat_knight_chapel`, `catacombs_ember_chapel`, `portal_forward_clocktower` | First confrontation with an infernal duelist before rising into the factory tower. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_ashen_catacombs_entry_1` | Entry (`W3-1`) | Pod kamieniem dawnych krypt płoną kotłownie z 2034 roku. Popiół przykrył tu nawet daty na płytach. | Beneath historic crypts burn the 2034 heating boilers. Ash settles over dates carved centuries apart. |
| `narr_ashen_catacombs_enemy_1` | First enemy | Lampy inspekcyjne z tuneli serwisowych pełnią tu straż bez załogi. Światło nie znaczy tu ratunku. | Service-tunnel inspection lamps still walk their beat uncrewed. Light down here offers no rescue. |
| `narr_ashen_catacombs_lever_1` | Lever-gate | Stary zawór kotłowni ustępuje nad sklepieniem kaplicy. Krata ossuarium otwiera się ze zgrzytem. | An old boiler valve gives above the chapel roof. The ossuary grate lifts with a dry rasp. |
| `narr_ashen_catacombs_mid_1` | Mid checkpoint (`W3-1`) | Korytarz techniczny zacina się w pętli czasu. Stalowy ogar biegnie te same trzy sekundy od nowa. | Time stutters in the service hall. A patrol hound sprints the same three seconds on repeat. |
| `narr_ashen_catacombs_secret_1` | Reactive: finds secret | Na bocznej półce ocalały dzienniki konserwacji sieci. Ktoś do końca próbował wygasić przegrzane kotły. | Salvaged utility logs rest on a side ledge. Someone fought to vent these boilers until the end. |
| `narr_ashen_catacombs_goal_1` | Goal (`W3-1`, dramatic) | Rycerz Cienia strzegł popiołów jak przysięgi. Szyb wentylacyjny prowadzi w górę ku wieży. | The Shadow Knight kept watch over ash like an oath. A service shaft ascends toward the tower. |
| `narr_ashen_catacombs_fall_1` | Reactive: falls (`ember_pit_west`) | Rozżarzona szczelina kotłowni nie pozostawia marginesu na błąd. Kolejny skok musi być czysty. | The ruptured boiler pit leaves no margin for a missed step. Make the next landing clean. |
| `narr_ashen_catacombs_linger_1` | Reactive: takes long | Ogar przebiegł swój odcinek już dwunasty raz. Nawet zepsuty zegar ma więcej wyczucia taktu. | That hound just ran its twelfth lap of the same corridor. Even broken clocks keep better manners. |
| `narr_ashen_catacombs_hero_valen_1` | Hero variant (Valen) | Valen mija spopielone nisze w milczeniu i szuka bezpiecznego oparcia dla kolejnego zejścia. | Valen passes the charred niches in silence, checking each stone ledge before stepping down. |
| `narr_ashen_catacombs_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia tłumi złość, kiedy żar z rur zagłusza jej odczyty — w tym pyle czas nie słucha nikogo. | Aurelia checks her frustration as furnace glare blinds her readings—time obeys no one in this soot. |
| `narr_ashen_catacombs_hit_1` | Reactive: enemy hit (`phase 5`) | Żar i ostrze z cienia tną przez płaszcz. Pod zamkiem cena błędu rośnie z każdym piętrem. | Ember and shadow steel cut cleanly through cloth. Below the château, mistakes carry weight. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_ashen_catacombs_banter_1` / `_2`):** Inside the mechanical `chain_hall` watching `cat_hound_hall` loop before `furnace_mover` (never inside the ossuary chapel).
> * **PL:** **Aurelia:** „Czwarty raz widzę tego samego mechanicznego psa na tych samych trzech metrach. Zacinam się od patrzenia.” / **Valen:** „Przynajmniej łatwo przewidzieć zakręt. Chodź, zanim kładka odjedzie.”
> * **EN:** **Aurelia:** "That is the fourth time I have watched the same mechanical hound run the exact same three meters." / **Valen:** "At least its turn radius is predictable. Step up before the furnace shuttle pulls away."

## Map Task Notes (`VC-026`)

* Expand width from `2640` to `5600+ px`, add `checkpoint_mid` near `chain_hall` / `well_ledge_2`, and raise non-dummy enemies from 7 to `13+` (middle-tier band).
* Move `cat_crawler_1` past 400 px from `spawnPoints.default` (`START_SAFE`), add a `secret_*` trigger on `relic_alcove`, and relocate `catacombs_ember_chapel` bossZone bounds to cover `chapel_floor` (`y: 1410`) with `catacombs_warden_elite`.
* Replace `narrationMovement` / `trainingCombatPrompt` with W3-1 `Entry`, `Mid`, and `Goal` triggers (`maps-contract.md` §4).
