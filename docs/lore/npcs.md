# Non-Playable Characters, Allies & Fauna (NPCs & Guides)

The world of *Vibrant Castle* is brought to life through legendary mentors, mysterious animal companions, and the resonant voice of the citadel's chronicler, who witnesses and commemorates every step of the heroes' ascension.

**Implementation status**: Today only the Narrator speaks in-game, as timed subtitles from `NarrationSystem` (`src/game/engine/narrationSystem.ts`) using keys in `src/i18n/modules/narrations.ts`. Corvus, Amber, and the Bastion Sage have greeting lines in `src/i18n/modules/dialogues.ts`, and `ReactiveNarratorManager` (`src/game/logic/narrative/reactiveNarratorManager.ts` + `src/data/narrative/narrator_reactive.json`) and `dialogues_vn.json` exist in data/logic, **but none of these NPCs or reactive/VN systems are wired into the live engine or maps yet** (Phase 5 & Phase 7 backlog in [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)). Master Oakhaven exists only in lore.

---

## 1. The Bastion Narrator (The Voice of the Past / The Chronicler)

* **Role**: Omniscient Storyteller & Reactive Guide (Inspired by *Bastion*)
* **Manifestation**:
  * Not physically bound to the arena floor; manifests as timed subtitles on the HUD. The goal is the *Bastion* style: short, warm lines that react to what the duelists do (hazards, levers, low health, secrets, boss kills, unison strikes) without explaining the map layout.
  * **Backlog**: Wiring `ReactiveNarratorManager` (`narrator_reactive.json`) into the simulation loop using simulation ticks instead of `Date.now()` is planned for Phase 5 ([`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)); voice-over is planned for later phases.
* **Personality & Philosophy**:
  * Calibrated, observant, quietly nostalgic. Regards the duelists with quiet admiration rather than hollow cheers, treating the castle as a living clockwork organism waiting to be wound once more.
* **Signature Commentary (`src/i18n/modules/narrations.ts`)**:
  * *On Awakening*:
    > *"The youth awoke upon the vast castle grounds. The crisp air carried scents of dry autumn leaves and fresh aether."*
  * *On Movement & Footwork*:
    > *"They took their first strides, discovering how low slides and agile backsteps grant total mastery of space."*
  * *On Blade Combat*:
    > *"He swung the blade. Tempered steel sliced through the autumn breeze with a sharp hiss."*
  * *On Striking Levers*:
    > *"The switch resisted, but a decisive slash or spell blast freed the frozen gears."*
  * *On Opening Castle Gates*:
    > *"Deep within the clocktower, massive iron cogs groaned, lifting the portcullis toward the clouds."*
  * *On Stepping into Portals*:
    > *"And so they stepped into a new dawn, fully armed and attuned to ancient Aether."*

---

## 2. Corvus – The Solar Raven (Planned NPC — Backlog Phase 7)

* **Role**: Celestial Scout & Aerial Sentinel
* **Appearance**:
  * An aristocratic raven with lustrous obsidian-and-gold plumage, iridescent violet highlights, and warm amber eyes, wearing a tiny engraved brass leg ring with the Grand Bastion seal.
* **Intended Function in the Castle**:
  * Perches on pivotal ledge corners and battlements, signaling safe landings and hidden levers.
* **Dialogue Line (`src/i18n/modules/dialogues.ts`)**:
  > **Corvus (Raven)**: *"Kraa! The summit clock is ticking in reverse. Beware the rogue clockwork automatons!"*

---

## 3. Pip / Amber – The Chrono-Cat (Planned NPC — Backlog Phase 7)

* **Role**: Save Crypt Guardian & Aetheric Resonator (*Bursztynek*)
* **Appearance**:
  * A plush russet-furred ginger cat wearing a dark leather collar with a miniature brass hourglass.
* **Intended Function in the Castle**:
  * Mascot of the **Save Crypt** (`src/game/logic/save/`), advising players near dangerous Aether hazards.
* **Dialogue Line (`src/i18n/modules/dialogues.ts`)**:
  > **Amber (Cat)**: *"Meow... The subterranean aether is surging. Use your prismatic shield to traverse the thorn bed safely."*

---

## 4. The Bastion Sage (Planned NPC — Backlog Phase 7)

* **Role**: Ancient Scholar & Keeper of the Celestial Portals (*Mędrzec Bastionu*)
* **Appearance**:
  * An elderly scholar in flowing indigo robes bordered with silver constellations, carrying an astrolabe staff.
* **Dialogue Line (`src/i18n/modules/dialogues.ts`)**:
  > **Bastion Sage**: *"Greetings, Guardians. The Sunlit Bastion requires both your blades and serene minds."*

---

## 5. Master Oakhaven (Historical Lore Character)

* **Role**: Legendary Fencing Master & Mechanical Architect
* **Lore & Legacy**:
  * The weaponmaster who built the proving grounds, straw training dummies, and counterweight lever locks centuries ago, and authored the *Treatise on the Kinetic Rapier*.
