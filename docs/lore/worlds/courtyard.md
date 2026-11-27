# World 1: Courtyard of Awakening (`courtyard`)

* **Polish Title:** *Dziedziniec Przebudzenia*
* **Slot & Scale:** `W1-1` · Shipped `4800 × 1040 px` (VC-021 target: `6400–7200 × 1100–1600 px`)
* **Atmosphere:** Plum-to-amber autumn dusk (`#2c1e33` → `#d97706`), golden haze, falling leaves (`leaf`), warm hanging lanterns.

---

## What the Real Place Was in 2034

Before the cataclysm, this perimeter site was a **historic French château**—medieval and Renaissance limestone galleries, a dry moat, display armor halls, and a heritage fencing exhibition (preserving relics tied to the historic fencing treatise of Master Oakhaven). By 2034 it operated as a preserved cultural monument and restoration estate, fitted with timber scaffolding, automated security owls/drones, and maintenance micro-bots.

## What the Demon Made of It

Because a French château already looked like a castle to the summoned demon and its hosts, they barely had to invent its silhouette—only amplify it into an outer **Proving Yard**:

* **Museum Plate & Perimeter Bots → `court_sentinel`:** Security patrols and ceremonial suits of armor fused into bronze-and-iron sentries with glowing internal cores.
* **Restoration Scaffolding & Fencing Dummies → `training_dummy`, `training_target`, `grand_dummy`:** Heritage straw targets and timber frames became an active proving line.
* **Maintenance Bots & Surveillance Owls → `gear_mite`, `clockwork_owl_gargoyle`:** Micro-drones became brass cog-beetles scuttling over flagstones, while security cameras took wing as silent clockwork owls.
* **Dry Moat → `moat_thorns`:** Rift residue erupted into jagged **Amber Thorns** beneath a mechanized drawbridge (`moat_drawbridge`).

## Threat

* **Shipped Forces (`9`):** `training_dummy` (1), `training_target` (1), `grand_dummy` (1), `gear_mite` (2), `court_sentinel` (2), `clockwork_owl_gargoyle` (1), `aether_sentinel` (1).
* **Hazards & Gate:** Amber thorns span the moat (`x: 2920–3340`); `lever_courtyard_gate` on the battlement ledge raises `courtyard_portcullis`.
* **Boss Zone:** `courtyard_trial_square` (`scope: stage`, `bossEnemyId: courtyard_captain_1` — data slot for VC-021).
* **Tactical Rhythm:** A safe opening run teaches dashes, low slides under high arcades, rapier thrusts, and ranged lever activation before confronting true armored units near the eastern gate.

## Secret

* **Sunken Crypt Under the Arcades (`crypt_floor`):** Dropping below `arcade_bridge_1` and `arcade_bridge_2` leads into a shadowed cellar niche patrolled by a `gear_mite`.
* **High Tower Vault (`tower_summit`):** Climbing the four staggered platforms (`tower_step_1`..`tower_step_4`) above the central square reveals `grand_dummy_tower` and a secret **vertical shortcut portal** (`portal_vault_tower`) directly into the `clocktower`.

## Link to Next World

* **Primary Route:** Beyond `courtyard_portcullis`, `portal_exit_chasm` opens onto the sheared outer boundary of **World 2: Chasm of Thorns and Shadows (`thorn_chasm`)**, where the château grounds break away into a rift-torn ravine.
* **Shortcut Route:** `portal_vault_tower` connects to the **Clockwork Tower (`clocktower`)** (two-way return link tracked in `VC-020` / `VC-023`).
* **Cycle Hook:** Returning through the Zone's temporal loop (`eclipse_crown` → `courtyard`) deposits explorers at `from_eclipse`.

## Narrator & Backlog Notes

* Entry mood sets the dry, classy 2034 contrast: autumn leaves on French limestone, museum armor walking on its own, and the first realization that ordinary physics no longer holds.
* Keep `VC-021` aligned with `docs/design/maps-contract.md` (restore parapet gate lever, widen to `6400–7200`, add mid checkpoint before the trial square).
