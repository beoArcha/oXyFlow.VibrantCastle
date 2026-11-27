# Non-Playable Characters, Animals & Figures (NPCs)

Within the 2034 Zone, Valen and Aurelia encounter an observant Narrator, resilient animal companions drawn to temporal pockets, a surviving scholar of emerging magical science, and the historical fencing legacy of the French château.

**Implementation status:** Today only the Narrator speaks in-game via timed subtitles (`NarrationSystem`, `src/i18n/modules/narrations.ts`). Greeting lines for Corvus, Pip/Amber, and the Sage exist in `src/i18n/modules/dialogues.ts`, while `ReactiveNarratorManager` (`narrator_reactive.json`) and `dialogues_vn.json` exist in data/logic, **not yet wired into live maps or the simulation loop** (Phases 5 and 7 backlog in [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)).

---

## 1. The Narrator — In-World Observer (`narrator.md`)

* **Role:** An **in-world 2034 character** (identity **[OPEN]**, revealed later in the campaign) offering dry, classy reactive commentary in the style of *Bastion*.
* **Canon Alignment (N3, N6):** "Bastion" names only the narrative style and World 7 (`grand_bastion`), never the Narrator's title or an ancient knightly order. All shared commentary must be hero-neutral across Valen solo, Aurelia solo, and 2P co-op. See [`narrator.md`](./narrator.md) for voice rules and 10 bilingual example lines.

---

## 2. Corvus — The Zone Raven (Planned NPC — Phase 7)

* **Role:** High-perch scout with an uncanny sense for temporal reversal and airborne threats.
* **2034 Framing:** A remarkably sharp-eyed raven nesting among the château and robotics-tower girders. Around one leg sits a stamped brass-and-steel band—originally an ornithological or estate research ring, though local Zone folklore whispers otherwise. Corvus perches near hazards and broken machinery, squawking warnings that reflect genuine Zone phenomena.
* **Existing Dialogue Line (`src/i18n/modules/dialogues.ts`):**
  > **Corvus (Raven):** *"Kraa! The summit clock is ticking in reverse. Beware the rogue clockwork automatons!"*
  *(Matches the 2034 Clocktower anomaly where rift distortion runs the repurposed factory clock backward.)*

---

## 3. Pip / Amber (*Bursztynek*) — The Save-Crypt Cat (Planned NPC — Phase 7)

* **Role:** Safe-room companion and mascot of the **Save Crypt** (`src/game/logic/save/`).
* **2034 Framing:** A russet ginger cat wandering the Zone's stable cellar vaults and safe thresholds—unbothered by broken time and drawn to warm pockets of energy. A worn leather collar carries a small brass hourglass charm that ticks at odd intervals when rift pressure spikes nearby.
* **Existing Dialogue Line (`src/i18n/modules/dialogues.ts`):**
  > **Amber (Cat):** *"Meow... The subterranean aether is surging. Use your prismatic shield to traverse the thorn bed safely."*

---

## 4. The Zone Sage (*Mędrzec*) (Planned NPC — Phase 7)

* **Role:** Elder researcher of magical science and portal telemetry inside the upper Zone.
* **2034 Framing (Resolves N6):** A veteran scholar—likely one of the first scientists or researchers caught in (or sent to study) the anomalous overlap—wearing layered expedition robes marked with astronomical/spatial calibration patterns and carrying an astrolabe conduit.
* **Existing Dialogue Note (N6):** Current `src/i18n/modules/dialogues.ts` (`sageBastionGreeting`) phrases him as speaking for *"The Sunlit Bastion"* as if it were an organization (*"The Sunlit Bastion requires both your blades and serene minds"*). Under the new canon, **"Bastion" is only World 7 as a place**; this greeting should be updated in the Phase 7 dialogue pass to refer to holding the Zone/World 7 perimeter or surviving the breach rather than serving a Bastion order.

---

## 5. Master Oakhaven — Historic Fencing Legacy (Château Archive)

* **Role:** Historical fencing master associated with the **French château** (World 1, `courtyard`), *not* an immortal builder of a timeless fantasy citadel (**resolves N5**).
* **2034 Framing:** Before the 2034 cataclysm, the historic château housed a 19th-century fencing society wing and museum collection featuring Master Oakhaven's *Treatise on the Kinetic Rapier*, counterweight exhibition doors, and straw practice dummies. When the demon reshaped the château into its outer courtyard, Oakhaven's wooden dummies and fencing exhibits came alive as `training_dummy`, `training_target`, and `grand_dummy`.

---

## 6. Open Questions Regarding NPCs & Outsiders

* **Narrator Identity:** Which 2034 character is narrating Valen and Aurelia's ascent (**[OPEN]**).
* **Outsiders in the Zone:** Whether external human actors—buffer-zone soldiers, artifact hunters, criminal smugglers, cultists, or rival new mages—appear as NPCs inside the Zone (**[OPEN]**).
