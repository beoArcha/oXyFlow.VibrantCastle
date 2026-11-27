# World 2: Chasm of Thorns and Shadows (`thorn_chasm`)

* **Polish Title:** *Rozpadlina Cierni i Cieni*
* **Slot & Scale:** `W2-1` · Shipped `4560 × 1120 px` (VC-022 target: `5600–7200 × 1400–1600 px`)
* **Atmosphere:** Violet-to-ember abyss (`#1b1429` → `#7c2d12`), amber-rust haze, drifting dust (`dust`), rising tension.

---

## What the Real Place Was in 2034

Just outside the château estate lay a **terraced limestone quarry, sunken utility cut, and botanical conservatory ravine**—a landscaped drop carrying drainage channels, high-voltage trench lines, and rail/gondola inspection tracks alongside old stonework. When the 2034 rift tore through the bedrock, the terrace sheared open into a jagged fault line.

## What the Demon Made of It

The demon treated the ruptured quarry and conservatory as an outer **Hunting Gorge and Bramble Moat**:

* **Conservatory Flora & Snapped Conduits → `amber_thorns`, `thorn_creeper`:** Greenhouse vines soaked in raw rift energy crystallized into sprawling amber briar beds and rooted `thorn_creeper` ambush bulbs.
* **Roof Gargoyles & Perimeter Sensor Rigs → `chasm_gargoyle`, `gargoyle_scout`:** Ornamental stonework and perched sensor housings became winged stone predators circling the gorge.
* **Subterranean Trench Fauna → `chasm_crawler`:** Cave arthropods and maintenance critters warped into multi-legged shale predators stalking the cliff bases.
* **Gondola Track → `chasm_ferry`:** A surviving utility trolley still glides mechanically across the chasm gap.

## Threat

* **Shipped Forces (`8`):** `chasm_crawler` (2), `chasm_gargoyle` (2), `thorn_creeper` (1), `gargoyle_scout` (1), `gear_mite` (1), `aether_sentinel` (1).
* **Hazards:** Two wide amber-thorn chasm floors (`thorns_gorge_1`, `thorns_gorge_2`) punish mistimed jumps across narrow rock steps (`gorge_step_1..3`) and the moving `chasm_ferry`.
* **Boss Zone:** `thorn_warden_lair` (`scope: stage`, `bossEnemyId: chasm_warden_gargoyle` — data slot for VC-022).
* **Contract Gap:** Currently has `0` levers and `0` triggers; restoring `chasm_portcullis` + lever and entry/mid/goal narration triggers is tracked in `VC-022`.

## Secret

* **High Canopy Bridge & Sky Islands (`canopy_bridge`, `canopy_island_1..3`):** Climbing from `mesa_mid` onto the upper rock spurs lets players bypass the low `chasm_ferry` entirely along an exposed aerial ridge patrolled by a `gargoyle_scout`—an ideal site for a hidden relic or secret trigger (`VC-022` / `VC-083`).

## Link to Next World

* Beyond `cliff_east` and `warden_balcony`, `portal_forward_catacombs` descends underground into **World 3: Ashen Catacombs (`ashen_catacombs`)**, where the quarry fault meets the château's subterranean vaults and heating tunnels.
* `portal_back_courtyard` returns to `courtyard`.

## Narrator & Backlog Notes

* Key beat: pointing out how modern trench cables and glasshouse roses grew teeth and amber bark overnight—without losing dry composure.
* `VC-022` restores chasm depth (`1400+ px` height), `chasm_portcullis`, mid checkpoint, and three narration triggers.
