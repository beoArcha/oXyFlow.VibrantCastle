# World 2: Chasm of Thorns and Shadows (`thorn_chasm`)

* **PL / EN:** *Rozpadlina Cierni i Cieni* / Chasm of Thorns and Shadows · **Slot:** `W2-1`
* **Scale:** Current `4560 × 1120 px` · Contract target (`VC-022`): `5600–7200 × 1400–1600 px`

## Premise

Just outside the château walls, a 2034 limestone quarry, utility trench, and botanical conservatory tore along a rift fault into a deep ravine. Severed cables grew crystallized amber thorns (`amber_thorns`, `thorn_creeper`), stone carvings became winged `chasm_gargoyle` hunters, and an unpowered quarry gondola (`chasm_ferry`) still glides above the void. Valen and Aurelia must cross the sheared ledges together before descending into the buried utility tunnels.

## Stage Beats

| Beat | What happens | Where (entity IDs) | What the player learns |
| :--- | :--- | :--- | :--- |
| Entry | Arrive on the fractured western cliff above `thorns_gorge_1`, snapped lines glowing amber. | `cliff_west`, `portal_back_courtyard`, `from_courtyard` | Spacing jumps over wide thorn beds and reading chasm depth. |
| First enemy | Clear shale critters and aerial stone predators stalking the narrow gorge pillars. | `crawler_west`, `gorge_step_1..3`, `gargoyle_gorge_1` | Timing attacks around aerial swoops while holding small ledges. |
| Lever-gate | Climb past the eastern gorge sentry to pull the quarry switch unlocking the cliff gate. | `cliff_east`, `warden_east`, `chasm_portcullis` (`VC-022` lever-gate) | Navigating vertical risk to unlock a forward cliff barrier. |
| Mid checkpoint | Land on the central limestone plateau guarded by rooted briars and shale predators. | `mesa_mid`, `checkpoint_mid` (`VC-022`), `creeper_mesa`, `crawler_mesa`, `thorn_warden_lair` | Controlling mid-map footing before choosing the low ferry or high canopy. |
| Optional secret | Scale the upper spurs above `mesa_mid` to outflank `chasm_ferry` along the sky islands. | `canopy_step_1..2`, `canopy_bridge`, `canopy_island_1..3`, `scout_canopy` | Riskier high-altitude routing bypasses lower hazards and rewards exploration. |
| Goal portal | Pass the east cliff balcony and descend into the underground heating vaults below. | `cliff_east`, `warden_balcony`, `portal_forward_catacombs` | Descending from open quarry light into subterranean ruins. |

## Narrator Lines (PL / EN)

| Key | Beat / Trigger | Polish (<= 110 chars) | English (<= 110 chars) |
| :--- | :--- | :--- | :--- |
| `narr_thorn_chasm_entry_1` | Entry (`W2-1`) | Dawny kamieniołom i oranżeria pękły na pół. Przewody zasilania zamieniły się w bursztynowe pnącza. | Quarry terraces and glasshouse cut cleanly in half. High-voltage lines now bloom as amber briars. |
| `narr_thorn_chasm_enemy_1` | First enemy | Miejscowa fauna wykopu wyszła spod skał z dodatkowym zestawem odnóży. Ogród botaniczny stracił urok. | Trench critters crawled out of the limestone with extra limbs. The conservatory has lost its charm. |
| `narr_thorn_chasm_lever_1` | Lever-gate (`VC-022`) | Stara wajcha kolejki kopalnianej zaskakuje zgrzytem. Krata wąwozu ustępuje przed dalszą drogą. | An old quarry switch catches with a metallic groan. The gorge portcullis yields the east ledge. |
| `narr_thorn_chasm_mid_1` | Mid checkpoint (`W2-1`) | Półka skalna dzieli przepaść na dwa oddechy. Poniżej sunie wagonik, który zapomniał, że nie ma prądu. | A limestone shelf splits the abyss in two. Below, an unpowered trolley keeps its shift anyway. |
| `narr_thorn_chasm_secret_1` | Reactive: finds secret | Wysoka grań ponad wagonikiem omija ciernie z góry. Kto szuka przejść w powietrzu, rzadko wraca z pustką. | A high ridge above the ferry bypasses the brambles. Those who look skyward seldom return empty-handed. |
| `narr_thorn_chasm_goal_1` | Goal (`W2-1`) | Wschodni klif zapada się w głąb dawnych szybów ciepłowniczych. Czas zejść pod powierzchnię. | The east cliff drops into buried utility shafts. Time to descend beneath the estate. |
| `narr_thorn_chasm_fall_1` | Reactive: falls (`thorns_gorge`) | Skrystalizowane róże z oranżerii nie amortyzują upadków. Kolejny skok wymaga chłodniejszej głowy. | Crystallized conservatory roses make dreadful cushions. The next leap calls for steadier footing. |
| `narr_thorn_chasm_linger_1` | Reactive: takes long | Wagonik wykonał już trzeci kurs przez rozpadlinę. Gargulce zaczynają się niecierpliwić. | The quarry trolley has completed its third round trip. Even the gargoyles look impatient. |
| `narr_thorn_chasm_hero_valen_1` | Hero variant (Valen) | Valen odmierza rozkład jazdy wagonika co do kroku, jak gdyby wciąż chodziło o zwykły rozkład. | Valen times the quarry ferry to the half-beat, as if ordinary schedules still applied. |
| `narr_thorn_chasm_hero_aurelia_1` | Hero variant (Aurelia) | Aurelia krzywi się na widok splątanych żył magii w skale — ładne, lecz zupełnie nieprzewidywalne. | Aurelia scowls at rift veins choking the shale—radiant enough, yet hopelessly untidy. |
| `narr_thorn_chasm_hit_1` | Reactive: enemy hit (`phase 5`) | Kamienne skrzydła i ciernie tną głębiej niż przypuszczano. Półśrodki w wąwozie nie działają. | Stone wings and thorns bite deeper than expected. Half-measures fail fast in this gorge. |

## Dialogue: Valen & Aurelia (Not Narrator)

> **Context (`dlg_thorn_chasm_banter_1` / `_2`):** On `mesa_mid` looking down at `chasm_ferry` above `thorns_gorge_2`.
> * **PL:** **Aurelia:** „Róże z oranżerii wyhodowały kolce grubości prętów zbrojeniowych. Ktoś tu przesadził z nawozem.” / **Valen:** „Patrz na dobrą stronę: wagonik techniczny dalej jeździ bez opóźnień.”
> * **EN:** **Aurelia:** "The conservatory roses grew thorns thick as rebar. Someone overdid the fertilizer." / **Valen:** "Look on the bright side: the utility trolley is still running on schedule."

## Map Task Notes (`VC-022`)

* Expand height from `1120` to `1400–1600 px` and width to `5600–7200 px` so thorn gorges read as a true chasm (`maps-contract.md` §7).
* Restore the missing `chasm_portcullis` + lever pair (`REQUIRED_GATES`), keeping `from_catacombs` unblocked on return; push `crawler_west` outside the 400 px start zone (`START_SAFE`).
* Add `checkpoint_mid` on `mesa_mid`, place `chasm_warden_gargoyle` inside `thorn_warden_lair`, add a `secret_*` trigger on `canopy_bridge`, and wire W2-1 `Entry` / `Mid` / `Goal` beats (replacing `narrationMovement`).
