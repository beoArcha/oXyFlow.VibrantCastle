# World 6: Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Polish Title:** *Sanktuarium Aetheru i Podniebny Akwedukt*
* **Slot & Scale:** `W6-1` · Shipped `4240 × 1400 px` (VC-024 target: `5600–7200 × 1300–1600 px`)
* **Atmosphere:** Cerulean starlight (`#0f172a` → `#1e3a8a`), cyan haze, glowing motes (`magic`), high choral tension. *(Palette note N12: currently cerulean/cyan; autumn palette review tracked in Phase 8+.)*

---

## What the Real Place Was in 2034

Above the research valley ran an **elevated concrete aqueduct, high-voltage power-relay viaduct, and atmospheric radar/telemetry array** supplying coolant and grid power toward the high-energy facility. When the rift's upper gravitational shear hit, the bridge piers snapped and hovered in mid-air.

## What the Demon Made of It

Suspended above swirling mist and torn power lines, the demon claimed the fractured viaduct as its **Celestial Sanctuary**:

* **Shattered Bridge Spans → `isle_1..3`, `isle_sanctum`, `mono_1..2`:** Concrete bridge decks became floating stone altars drifting on stabilized updrafts (`wind_raft_1`, `wind_raft_2`).
* **Power Relays & Coolant Pipes → Sky Aqueduct:** High-tension conduits glow with channeled rift energy, feeding crystalline sentinels.
* **Autonomous Defense Relay → `aether_archon`:** A top-tier atmospheric/defense array merged with otherworldly force into the floating **Aether Archon**—ambiguously either a self-appointed warden of the sky breach or the demon's celestial jailer.

## Threat

* **Shipped Forces (`7`):** `aether_wisp` (2), `aether_sentinel` (2), `clockwork_owl_gargoyle` (1), `lantern_warden` (1), `aether_archon` (1).
* **Boss Encounter:** `sanc_archon_boss` (`aether_archon`) patrols `archon_altar` inside `aether_archon_altar`.
* **Contract Gaps (`VC-024`):** Currently has `0` levers, `0` explicit hazard strips under the islets, and `0` narration triggers, and shares `openingNarrationKey: "narrationMagicUsed"` with `alchemist_library`. Restoring the altar lever-gate, void hazards, triggers, and density (`18+`) is tracked in `VC-024`.

## Secret

* **Sky Secret Isle (`sky_secret_isle`, `x: 1260, y: 528`):** Reached by climbing backward and upward from `isle_sanctum` over `sky_step_1` and `sky_step_2`, guarded by a lone `lantern_warden` hovering above the main aqueduct span.

## Link to Next World

* Beyond the Archon's Altar, `portal_to_bastion` leads across the sky bridge onto the fortified outer walls of **World 7: Sunlit Bastion (`grand_bastion`)**.
* `portal_back_library` descends back to `alchemist_library`.

## Narrator & Backlog Notes

* **N7 Alignment:** Older descriptions claimed the Sanctuary gate "leads to the castle's deepest sanctums." Under the world order, the Sanctuary is the aerial bridge *into* the fortified perimeter (**World 7**) and the final epicenter (**World 8**).
* Keep dry wonder here: concrete viaduct chunks suspended by broken gravity feel eerie rather than comical.
