# World 3: Ashen Catacombs (`ashen_catacombs`)

* **Polish Title:** *Katakumby Popiołu*
* **Slot & Scale:** `W3-1` · Shipped `2640 × 1560 px` (VC-026 target: `5600+ × 1100–1600 px`)
* **Atmosphere:** Soot-charcoal to smouldering ember (`#171112` → `#7c2d12`), burnt-orange fog, drifting ash (`dust`), oppressive subterranean heat.

---

## What the Real Place Was in 2034

Beneath the château and quarry ran a **two-layer underground**: genuine historic stone burial crypts connected to **modern 2034 geothermal/district-heating boiler shafts, backup incinerators, and utility service tunnels**. During the cataclysm, superheated boiler vents ruptured into the stone vaults, charring everything in ash and lingering embers.

## What the Demon Made of It

Unable to distinguish municipal thermal engineering from underworld torment, the demon fused crypts and boiler shafts into the **Ashen Catacombs and Chapel of Embers**:

* **Boiler Lamps & Pipe Sensors → `lantern_warden`:** Floating inspection lamps became silent brass wardens drifting down soot-blackened corridors.
* **Stray Arc Discharges → `aether_wisp`:** Residual current leaking from ruptured conduits condensed into drifting orbs of volatile magic.
* **Tunnel Rail Patrol Units → `chrono_hound`:** Fast quadruped inspection bots trapped in a stuttered time loop began sprinting through the `chain_hall`.
* **Fallen Guardians / Infernal Duelists → `shadow_knight`:** In the deepest vault (`chapel_floor`), either an infernal duelist host or a trapped warrior's echo stands watch beside the embers.

## Threat

* **Shipped Forces (`7`):** `chasm_crawler` (1), `lantern_warden` (1), `gear_mite` (1), `chrono_hound` (1), `aether_wisp` (1), `aether_sentinel` (1), `shadow_knight` (1).
* **Hazards & Gate:** `ember_pit_west` lines the western chapel floor; `lever_ossuary_gate` sits above `chapel_vault_roof` guarded by an `aether_sentinel` and unlocks `ossuary_portcullis`.
* **Boss Zone:** `catacombs_ember_chapel` (`scope: stage`, `bossEnemyId: catacombs_warden_elite` — data slot for VC-026).

## Secret

* **The Upper Relic Alcove (`relic_alcove`):** Above `shaft_3` on the top descent (`x: 2180, y: 428`), a side shelf guarded by a `gear_mite` overlooks the chasm drop—a natural home for salvaged 2034 maintenance logs or an early soul/relic cache (`VC-026` / `VC-083`).

## Link to Next World

* After unlocking `ossuary_portcullis` and crossing the `shadow_knight`'s chapel, `portal_forward_clocktower` rises through a vertical service shaft into **World 4: Clockwork Tower & Angled Range (`clocktower`)**.
* `portal_back_chasm` ascends back to `thorn_chasm`.

## Narrator & Backlog Notes

* Key dramatic threshold: ash and heat strip away the pastoral autumn feel of the surface. Here the Narrator shifts slightly more solemn when mentioning what burned below the foundations—zero comedy around the ossuary itself, keeping dry irony strictly for the malfunctioning furnace movers and hound loops.
* `VC-026` expands width (`2640` → `5600+`), adds `checkpoint_mid`, three narration triggers, and middle-tier enemy density (`13+`).
