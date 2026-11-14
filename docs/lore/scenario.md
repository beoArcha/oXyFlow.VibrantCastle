# Game Scenario & Narrative Campaign: Vibrant Castle

## Introduction & World Concept

The world of *Vibrant Castle* merges the warm, melancholic aesthetic of late 19th-century gothic fantasy (in the style and feeling of *Castlevania: Aria of Sorrow*) with kinetic, Mario-like movement and dynamic acoustic narration in the manner of *Bastion*.

The castle is suspended in an eternal, golden autumn. Once the illustrious seat of a guild of fencing scholars, astronomers, and horologists, the ancient Citadel of Aether fell into stasis following a catastrophic temporal fracture. Players embody the Awakened Duelists who, under the watchful chronicle of an omniscient Narrator, traverse the citadel's interconnected sectors, restarting dormant clockwork apparatuses and pacifying guardians corrupted by wild Aetherial radiation.

---

## Tone and Direction

* **Autumn of the Citadel**: The castle is caught in one unending golden autumn. Ochre and amber light warm the courtyards, crimson haze hangs over the chasm, bronze and sepia fill the tower, cerulean starlight floats over the sanctuary (the one blue sector, still due an autumn palette pass), and royal gold closes the Bastion. Lanterns, braziers and torches keep light in every sector.
* **Decay and Warmth**: Stone crumbles, leaves fall and gears rust, yet the lamps are still lit. Every sector should feel old and tired but still cared for.
* **Mood**: The melancholy and gothic atmosphere of *Castlevania: Aria of Sorrow*, with simplified, readable combat.
* **Movement**: Platforming should feel like a Mario game: springy, forgiving jumps, clear landings and quick turns.
* **Reactive Narrator**: The Bastion Narrator answers what the duelists do in short lines, and never explains the layout.
* **Loop, Not Line**: The route runs forward through five sectors, but portals run both ways between the first four and the Mastery Portal returns players to the Courtyard, so each sector can be revisited (ability gates that force real backtracking are planned, not built yet).

---

## Act I: The Awakening of the Bastion (The 5-Sector Citadel Circuit)

### Campaign Progression & Sector Network

```text

[Courtyard of Awakening] <===> [Chasm of Thorns] <===> [Clockwork Tower] <===> [Aether Sky Sanctuary] <===> [Grand Bastion Training Grounds]
         ^                                                                                                          |
         +------------------------------------- Mastery Portal loop (one-way, back to the Courtyard) ------------------------------+
```

---

The route runs forward through the five sectors. Portals run both ways between the first four, so players can return to earlier sectors, and the one-way Mastery Portal in the Grand Bastion closes the loop back to the Courtyard.

---

### Phase 1: Awakening in the Courtyard (`courtyard`)

* **Setting & Tone**: Warm golden-ochre twilight, descending dry oak foliage, tranquil flagstone terraces.
* **Opening Chronicle**:
  > *"The youth awoke upon the vast castle grounds. The crisp air carried scents of dry autumn leaves and fresh aether..."*
* **Player Objective**: Re-attune to fundamental footwork, rapid sprints, directional slides, and initial rapier thrusts against Master Oakhaven's training automata.
* **Cooperative Dynamic**: In two-player mode, Aurelia awakens beside Valen; the Narrator observes the resurgence of their historic covenant of steel and celestial craft. In the solo story the two meet later, in the Clockwork Tower summit scene (`dialogues_vn.json`, a visual novel scene that is written but not yet wired into the game).
* **Route Zones**: Awakening Yard, Arcade Terraces, Fountain Basin, Gatehouse (the golden gate lever on the parapet), then Chasm Road to the east gate.

---

### Phase 2: Trial of Agility – The Chasm of Thorns and Shadows (`thorn_chasm`)

* **Setting & Tone**: Fractured foundations over a sheer gorge, carpeted with glowing amber spikes (`labelAmberThorns`).
* **Platforming Gauntlet**:
  * Precision leaps across isolated stone slabs and bridges suspended above the amber spikes.
  * Low archway clearances requiring sliding under full momentum while dodging crawling subterranean beasts.
* **Narrative Reaction**:
  > *"One false step and it was over. But this kid knew how to bend gravity to his will."*
* **Kinetic Mastery**: Introduction of `Chrono Dash` and `Phase Dash`, allowing players to glide across broad gaps and slip through hazardous hitboxes.
* **Route Zones**: Entry Floor & Descent, Upper & Low Ledges, Isles & Bridges, Lever & Portcullis (the lever opens the portcullis), then Climb, Moving Platform & Exit to the Clockwork Tower portal. Thorn Creepers, Chasm Gargoyles, Chasm Crawlers and a Gear Mite patrol the gorge.

---

### Phase 3: The Ascent – Clockwork Tower & Angled Range (`clocktower`)

* **Setting & Tone**: The towering vertical Horologium. Massive brass gear trains, swinging pendulums, and open-air battlements looking out across misty clouds.
* **Combat & Trickshot Challenge**:
  * Mobilizing the motorized vertical lift to ascend between grinding gear chambers.
  * Angled Target Practice: Targets positioned aloft and sunken below necessitate mastering 45° elevation shots while running or true 90° vertical shots while stationary.
* **Route Zones**: Foundry floor, Gear gallery, Pendulum shaft, Escapement hall (the spire gate), then the Belfry and the apex portal to the Sanctuary.
* **Mechanical Obstacle**:
  * Striking the golden escapement lever with blade or projectile releases pneumatic locks, and the portcullis spire gate visibly lifts. The Clockwork Gear lever (`tower_gear_lever`) opens the spire gate (`tower_spire_gate`).
* **Narrator Commentary**:
  > *"Deep within the clocktower, massive iron cogs groaned, lifting the portcullis toward the clouds."*

---

### Phase 4: Celestial Threshold – Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Setting & Tone**: Floating marble islands suspended above the cloud canopy by giant Aether crystals. A ruined aqueduct cascades liquid light into the starry abyss.
* **Route Zones**: Arrival Terrace, Shard Field, Cloister & Altar, Upper Steps & Parapet, Secrets & Dash Isle. The Aether void lies between the islets.
* **Climactic Encounter**:
  * Confronting the **Aether Archon** amidst swirling stardust and starlight cascades.
  * Navigating floating glider platforms while neutralizing aerial wisps.
* **Zwieńczenie Poziomu (Sector Culmination)**:
  * The altar lever in the Cloister & Altar opens the **Sanctuary Gateway**, which leads on to the Grand Bastion.
  * **Narrative Milestone**:
    > *"And so they stepped into a new dawn, fully armed and attuned to ancient Aether. The first trial was conquered, yet the deeper heart of the castle still slept..."*

---

### Phase 5: The Grand Circuit – Grand Bastion Training Grounds (`grand_bastion`)

* **Setting & Tone**: The master unified circuit spanning 8000 pixels, seamlessly weaving courtyards, thorn chasms, clockwork lifts, and high battlements into one continuous gauntlet.
* **Route Zones**: Barbican, Rampart, Case & Cross Ledges, Keep & Treasury, Ward & Arena. The Mastery Portal then returns players to the Courtyard of Awakening.
* **Mastery Trial**:
  * Facing the **Bastion Sentinel**, the boss variant of the Courtyard Sentinel, in the Ward & Arena.
  * Striking the two **Main Sluice Levers** to open the keep and ward gates; the **Grand Portcullis** bars the victory dais.
  * Celebrating ultimate stage mastery with high score calculations and skill tree progression.

---

## Future Campaign Outline (Subsequent Acts)

*Concept only: nothing in Acts II and III exists in the game yet.*

### Act II: The Sunken Clockwork Gardens (Clockwork Aqueducts)

The champions descend into subterranean greenhouse conservatories powered by colossal waterwheels and geothermal steam vents.

* **Environment**: Overgrown Victorian ironwork, water wheels, cascading fountains, and mechanical mantises.
* **Primary Objective**: Locate the three Resonance Crystals to restart the Grand Aqueduct and restore life to the desiccated arboretum.
* **Boss**: *The Amber Fortress Golem* – an ancient terracotta behemoth bound by molten amber veins.

---

### Act III: The Heart of the Citadel (The Chronomancer's Spire)

The highest reaches of the central clocktower, where time, gravity, and spatial coordinates warp violently.

* **Environment**: Shattered floating staircases, inverted rooms, and temporal rifts that loop fallen players back in time.
* **Primary Objective**: Stabilize the Central Chrono-Core and seal the spatial anomaly threatening to erase the citadel from memory.
* **Final Boss**: *The Grand Chronomancer* – the fallen guildmaster who sought immortality through frozen time.
