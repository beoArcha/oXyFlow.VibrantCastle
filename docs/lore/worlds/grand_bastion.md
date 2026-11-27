# World 7: Sunlit Bastion (`grand_bastion`)

* **Canonical PL / EN:** *Słoneczny Bastion* / Sunlit Bastion *(current `locations.ts` EN reads `"Grand Bastion Training Grounds"`, PL `"Słoneczny Bastion (Wielki Poligon)"` — tracked under N6/N8/N11)*
* **Slot & Scale:** `W7-1` · Shipped `4840 × 1140 px` (VC-025 target: `6400–8000 × 1200–1600 px`)
* **Atmosphere:** Twilight indigo to burnished royal gold (`#1e1b4b` → `#b45309`), amber mist, drifting sparks (`spark`), martial siege intensity (`musicIntensity: 0.92`).

---

## What the Real Place Was Before 2028

Guarding the inner approach to the physics experiment stood a **fortified military-industrial security perimeter**: reinforced concrete bunkers, automated turret/mech testing ranges, blast walls, and a garrison command compound built over an older regional bastion wall.

## What the Demon Made of It

Recognizing the genuine martial purpose of bunkers, armor, and barricades, the demon cast the perimeter as a towering **Golden Siege Fortress**—a place (**never** a knightly faction, resolving **N6**):

* **Bunkers & Blast Walls → `rampart_walk_1..2`, `grand_portcullis`:** Reinforced security walls rose into gilded castle battlements sealed by heavy iron portcullises.
* **Tactical Cyborgs & Heavy Security Exoskeletons → `court_sentinel`, `bastion_gargoyle`, `bastion_sentinel_boss`:** Perimeter cyborg guards and heavy riot/security frames were armored in burnished brass and iron, led by the towering **Bastion Sentinel Commander** in the keep arena.
* **Ordnance Proving Yard → Siege Gauntlet:** What used to be an automated live-fire test track (`bastion_thorns_1..2`, moving platforms, patrolling `chrono_hound`) became the penultimate gauntlet before the Crown.

## Threat

* **Shipped Forces (`7`):** `court_sentinel` (1), `bastion_gargoyle` (2), `clockwork_automaton` (1), `chrono_hound` (1), `shadow_knight` (1), `bastion_sentinel_boss` (1).
* **Gate & Siege Flow:** Crossing `bastion_mover_1` and climbing the rampart steps leads to `lever_bastion_keep`, unlocking `bastion_portcullis` before facing the `shadow_knight` and `bastion_sentinel_boss` inside `commander_arena`.
* **Contract Gaps (`VC-025`):** Must restore the second ward gate + lever pair, widen to `7200–8000 px`, raise siege enemy density, and replace the legacy `trainingIntro` trigger (**N8**).

## Secret

* **High Rampart Parapet & Commander Balcony (`rampart_parapet`, `arena_balcony`):** High platforms running above the thorn ditches and overlooking the Commander's arena provide flanking angles and natural slots for hidden cache triggers (`VC-025` / `VC-083`).

## Link to Next World

* After bringing down the Bastion Sentinel Commander, `portal_to_eclipse` opens at the eastern keep wall, leading directly into **World 8: Eclipse Crown (`eclipse_crown`)**.
* `portal_back_sanctuary` returns to `aether_sanctuary`.

## Narrator & Backlog Notes

* **N6 & N8 Resolution:** World 7 is **not** a tutorial range and **not** the headquarters of a "Bastion Order." It is a high-stakes fortified threshold standing between the protagonists and Ground Zero. Narrator lines here must reflect siege urgency with crisp, deadpan poise.
