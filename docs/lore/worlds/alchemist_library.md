# World 5: Alchemist's Library (`alchemist_library`)

* **Polish Title:** *Biblioteka Alchemika*
* **Slot & Scale:** `W5-1` · Shipped `3840 × 1380 px` (VC-027 target: `5600+ × 1100–1600 px`)
* **Atmosphere:** Deep emerald-teal archive (`#06201b` → `#115e59`), glowing verdant mist, floating arcane motes (`magic`). *(Palette note N12: currently emerald in code; autumn review tracked in Phase 8+.)*

---

## What the Real Place Was in 2034

Adjacent to the robotics tower stood a **2034 research laboratory and secure data-archive complex**: cleanroom chemical-synthesis bays, glass bioreactors, tiered server-and-microfiche stacks, and a central magnetic-telemetry rotunda used for pre-cataclysm experiments and emergency magical-science logging right after the rift opened.

## What the Demon Made of It

To the summoned demon, chemistry was alchemy and server farms were spellbooks. It rebuilt the facility into a monumental **Alchemist's Library**:

* **Bioreactors & Chemical Vats → Emerald Flasks & `distillery_lift`:** Synthesis tanks became alchemical alembics glowing green above a vertical void (`library_void_1`).
* **Server Racks & Lab Archives → `library_gallery`, `forbidden_stacks`:** Technical manuals, drive bays, and early 2034 post-rift field notes transmuted into towering bookshelves and leather-bound grimoires.
* **Telemetry / Containment Ring → Astrolabe Rotunda:** The spinning laboratory sensor dome became a colossal brass astrolabe suspended over `rotunda_floor`.
* **Optical/Laser Security Grids → `alchemical_barrier`:** Automated containment doors turned into emerald-sealed portcullises unlocked from the high archive (`lever_archive_gate`).

## Threat

* **Shipped Forces (`7`):** `aether_sentinel` (2), `aether_wisp` (2), `lantern_warden` (1), `clockwork_automaton` (1), `shadow_knight` (1).
* **Hazards & Gate:** Falling into `library_void_1` beneath `distillery_lift` punishes missed elevator jumps; `lever_archive_gate` lies all the way in the upper-left `archive_secret` beyond the `forbidden_stacks` (`clockwork_automaton` + `lantern_warden`), opening `library_portcullis` across the rotunda.
* **Boss Zone:** `library_astrolabe_rotunda` (`scope: stage`, `bossEnemyId: library_archon_warden` — data slot for VC-027).

## Secret

* **The Forbidden Stacks & High Archive (`forbidden_stacks` → `archive_secret`):** Climbing high above `manuscript_span` leads to the secluded upper tier where the archive lever rests—and where surviving 2034 laboratory data reveals the **butterfly-effect truth**: the Zone was born from an overlapping physics test and an unprepared occult ritual.

## Link to Next World

* Passing through the Astrolabe Rotunda and `library_portcullis` reaches `portal_to_sanctuary`, rising from the laboratory dome toward **World 6: Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)**.
* `portal_back_clocktower` returns to `clocktower`.

## Narrator & Backlog Notes

* **Campaign Turning Point:** This is the middle-campaign revelation—neither dry magic nor pure tech explains the Zone alone; both collided. Here humour steps back whenever Valen and Aurelia read the true records of the cataclysm, returning only in wry asides about server racks dressed as spellbooks.
* **Contract Fixes (`VC-027`):** `alchemist_library` currently shares `openingNarrationKey: "narrationMagicUsed"` with `aether_sanctuary` and needs width expansion (`3840` → `5600+`), `checkpoint_mid`, and three distinct narration beats.
