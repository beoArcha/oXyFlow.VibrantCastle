# World 7: Sunlit Bastion (`grand_bastion`)

* **PL / EN:** *Słoneczny Bastion* / Sunlit Bastion · **Slot:** `W7-1`
* **Scale:** Current `4840 × 1140 px` · Contract target (`VC-025`): `7200–8000 × 1200–1600 px`

## Premise

Guarding the inner approach to Ground Zero, a 2034 military-industrial command perimeter and concrete bunker line stands forged by the demon into royal-gold siege battlements—strictly a fortress location, never a knightly order or training range (**N6**, **N8**). Armored tactical cyborgs (`court_sentinel`), winged `bastion_gargoyle` hosts, and the towering `bastion_sentinel_boss` defend twin portcullises above thorn ditches. Valen and Aurelia break the siege line together to open the final path to the Crown.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Step onto the western siege approach facing armored sentries and gilded blast walls. | `bastion_west`, `portal_back_sanctuary`, `from_sanctuary`, `bas_sentinel_1` | High-pressure siege pacing—zero warm-up range illusions. |
| First enemy | Fight tactical cyborgs below and armored gargoyles sweeping the upper rampart walk. | `bas_sentinel_1`, `rampart_step_1..2`, `rampart_walk_1`, `bas_gargoyle_1` | Splitting threats between fortified ground lanes and elevated walkways. |
| Lever-gate | Push across the high battlements to throw `lever_bastion_keep` (plus the restored ward lever in `VC-025`). | `rampart_walk_2`, `rampart_parapet`, `lever_bastion_keep`, `bastion_portcullis` | Navigating fortified upper defenses to unbar consecutive siege gates. |
| Mid checkpoint | Cross `bastion_mover_1` over `bastion_thorns_1` into the inner bailey ahead of the Shadow Knight. | `bastion_mover_1`, `bastion_mid`, `checkpoint_mid` (`VC-025`), `bas_hound_1`, `bas_knight_keep` | Managing fast hounds and elite duelists before the keep breach. |
| Optional secret | Take high flanking perches over the thorn trench and overlooking the Commander's arena. | `rampart_parapet`, `arena_step_west`, `arena_balcony` (`secret_*` in `VC-025`) | High flanking positions grant breathing room above dense ground hazards. |
| Goal portal | Breach `bastion_portcullis`, defeat `bas_commander_boss`, and step toward the crimson eclipse. | `bastion_mover_2`, `commander_arena`, `bas_commander_boss`, `portal_to_eclipse` | Breaking the fortress commander unlocks the road into Ground Zero. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_grand_bastion_entry_1` | Entry (`W7-1`) | Wojskowy pierścień obronny przywdział królewskie złoto. To ostatni wał przed samym epicentrum. | The military perimeter wears royal gold now. One fortified wall stands between you and Ground Zero. |
| `narr_grand_bastion_enemy_1` | First enemy | Bram nie pilnują już kukły, lecz opancerzone powłoki taktyczne i kamienne straże blanków. | No straw dummies guard these gates—only tactical cyborg frames and armored rampart gargoyles. |
| `narr_grand_bastion_lever_1` | Lever-gate | Mechanizm blanków zwalnia żelazną bronę. Twierdza otwiera kolejną linię ognia, nie zaproszenie. | The rampart crank lifts the iron portcullis. The fortress yields a firing lane, not a welcome. |
| `narr_grand_bastion_mid_1` | Mid checkpoint (`W7-1`) | Dziedziniec wewnętrzny dzieli się na dwie strefy ostrzału. Za bramą czeka już Komendant Straży. | The inner bailey splits into two crossfire zones. Beyond the keep gate waits the Commander. |
| `narr_grand_bastion_secret_1` | Reactive: finds secret | Górny chodnik ponad fosą daje czysty kąt natarcia. Kto zna profil muru, omija główne uderzenie. | The upper parapet above the thorns offers clean flank cover. Knowing the wall spares steel. |
| `narr_grand_bastion_goal_1` | Goal (`W7-1`, dramatic) | Ciężki pancerz Komendanta runął na bruk. Przed wami płonie już czerwone światło Korony. | The Commander's heavy armor strikes the flagstones. Ahead burns the crimson glare of the Crown. |
| `narr_grand_bastion_fall_1` | Reactive: falls (`bastion_thorns`) | Fosa pod murem nie jest miejscem na zawahanie. Zanim ruszycie, wyczujcie rytm kładki. | The thorn trench beneath the wall punishes hesitation. Read the platform cadence before leaping. |
| `narr_grand_bastion_linger_1` | Reactive: takes long | Garnizon Bastionu stracił łączność w 2034 roku, lecz jego rygory nie zmalały ani trochę. | This garrison lost radio contact in 2034, yet its perimeter discipline never slipped an inch. |
| `narr_grand_bastion_hero_valen_1` | Hero variant (Valen) | Valen trzyma gardę nisko i skraca dystans — tak rozbija się linię obrony krok po kroku. | Valen keeps his guard compact and closes distance—breaking a siege line one lock at a time. |
| `narr_grand_bastion_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia ścina zaklęciem gruby pancerz bez cienia cierpliwości dla wojskowej biurokracji z mosiądzu. | Aurelia shears through gilded armor, sparing zero patience for military hardware in brass. |
| `narr_grand_bastion_hit_1` | Reactive: enemy hit (`phase 5`) | Młot Komendanta potrafi zgiąć balistyczną stal. Unik i odskok są tu warte więcej niż upór. | The Commander's hammer bends ballistic alloy. A clean backstep outlasts stubborn armor. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_grand_bastion_banter_1` / `_2`):** Below `rampart_step_1` sizing up the gilded bunker masonry.
> * **PL:** **Aurelia:** „Ktoś naprawdę obił zbrojony beton złotym blaskiem, jakby bunkier miał wyglądać na katedrę.” / **Valen:** „Ściana jest gruba, czy złota, czy szara. Zajmijmy się najpierw pierwszą bramą.”
> * **EN:** **Aurelia:** "Someone genuinely gilded reinforced blast concrete as if a bunker could pass for a cathedral." / **Valen:** "Thick walls block either way, gold or gray. Let's take the first portcullis."

## Map Task Notes (`VC-025`)

* Widen from `4840` to `7200–8000 × 1200–1600 px`, restore siege density (`22+` enemies), and replace `openingNarrationKey: "trainingIntro"` (**N8** defect) with W7-1 `Entry`, `Mid`, and `Goal` triggers.
* Restore the second **ward gate + lever pair** (`REQUIRED_GATES`, 2 pairs minimum for siege maps) before `portal_to_eclipse` while ensuring `from_eclipse` cannot softlock.
* Move `bastion_commander_arena` bossZone (`x: 1820..2600`) to cover `commander_arena` (`x: 3560+`) and `bas_commander_boss`, add `checkpoint_mid` on `bastion_mid`, and add `secret_*` triggers on `rampart_parapet` / `arena_balcony`.
