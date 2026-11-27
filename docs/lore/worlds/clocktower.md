# World 4: Clockwork Tower & Angled Range (`clocktower`)

* **Polish Title:** *Wieża Zegarowa i Poligon Kątowy*
* **Slot & Scale:** `W4-1` · Shipped `2440 × 1740 px` (VC-023 vertical target: `2800–3600 × 2600–3200 px`)
* **Atmosphere:** Indigo dusk to warm brass (`#1e1b4b` → `#78350f`), amber mist, copper sparks (`spark`), rhythmic mechanical clatter.

---

## What the Real Place Was Before 2028

Rising beside the estate was an **automated high-bay robotics and precision assembly factory** paired with an **optical sensor calibration tower**—complete with vertical freight elevators, overhead gantry rails, robotic welding arms, flying inspection drones, and laser/ballistic calibration targets set at 45° and 90° elevation angles.

## What the Demon Made of It

The demon and its hosts had no framework for CNC servos, microcontrollers, or factory automation. Seeing vertical shafts, rhythmic pistons, and whirling gears, they rebuilt the entire plant as a **monumental brass Horologium**:

* **Assembly Robots → `clockwork_automaton`:** Heavy servo-loaders morphed into towering brass soldiers swinging crushing hammers.
* **Inspection Drones & Micro-Welders → `clockwork_owl_gargoyle`, `gear_mite`:** Aerial plant drones became winged brass owls; floor bots turned into skittering cog-mites.
* **Freight Lifts & Gantries → `vertical_lift`, `pendulum_mover`:** Industrial elevators became counterweight clockwork lifts and swinging escapement platforms.
* **Optical Calibration Bay → `horologist_nook` & Angled Range:** The factory's multi-angle sensor range remained intact as a combat proving gallery for 45° and vertical 90° spell shots (`training_target`).
* **Broken Time:** Rift resonance hit the tower's master synchronizer, causing the summit clock to **tick backward** (matching Corvus's warning).

## Threat

* **Shipped Forces (`8`):** `gear_mite` (1), `chrono_hound` (1), `clockwork_automaton` (2), `clockwork_owl_gargoyle` (2), `training_target` (1), `gargoyle_scout` (1).
* **Gate & Verticality:** Climbing via `lift_west`, `pendulum_mover`, and `lift_east` leads to `lever_belfry` (`lever_spire_gate`), which raises `spire_portcullis` across the summit bridge.
* **Boss Zone:** `clocktower_summit_chamber` (`scope: stage`, `bossEnemyId: tower_summit_automaton` — data slot for VC-023).

## Secret

* **The Horologist's Nook (`horologist_nook`, `x: 100, y: 740`):** Off to the west side of the middle shaft sits a secluded shelf with an old `training_target`—rewarding angled magic shots and careful platforming from `nook_step`.
* **Château Vault Entry (`from_courtyard`):** The base floor (`x: 1180`) connects to the secret vertical vault portal from World 1 (`courtyard`), though the physical return portal back to `courtyard` still needs restoration in `VC-023`.

## Link to Next World

* Crossing the unlocked summit bridge leads to `portal_to_library`, stepping directly from the manufacturing plant into **World 5: Alchemist's Library (`alchemist_library`)**.
* `portal_back_catacombs` returns down to `ashen_catacombs`.

## Narrator & Backlog Notes

* **N7 Resolution (VN Scene `scene_clocktower_meeting`):** In canon, Valen and Aurelia are already close friends separated by spatial distortion in the lower Zone; meeting again near the summit is a reunion and tactical re-sync (*zouk* handoff), and the opened passage leads onward to **Alchemist's Library** (not Sanctuary). Existing `dialogues_vn.json` / `dialogues.ts` strings await update in Phase 7.
* `VC-023` restores full vertical scale (`2800–3600 × 2600–3200`), adds the return portal to `courtyard`, and adds entry/mid/goal narration beats.
