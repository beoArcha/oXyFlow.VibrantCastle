# Enemies, Automata & Bestiary (Monsters)

The adversaries populating *Vibrant Castle* range from centuries-old mechanical training apparatuses and patrol automata to crystalline horrors reanimated by wild, destabilized Aether.

All enemies are governed by modular hitboxes, damage flash feedback, distinct patrol/attack behaviors, and yield score and Skill Points (SP) upon destruction.

---

## Complete Castle Bestiary

### 1. Straw Training Dummy (`monsterTrainingDummy`)

* **Category**: Proving Target / Passive Automaton
* **Base HP**: 50
* **Score Reward**: 150 pts
* **Associated Locations**: Courtyard of Awakening, Grand Bastion, Clockwork Tower
* **Appearance**:
  * Cross-shaped solid oak timber core wrapped in dense bundles of woven straw and reinforced leather belts.
  * Crowned with an antique knight’s iron sallet helmet adorned with a frayed scarlet feather crest.
* **Combat Role & Behavior**:
  * Anchored firmly to the ground; does not attack.
  * Serves as an interactive combat tutorial for verifying weapon range, multi-directional spell hits, and timing.
  * **Reaction**: Flashes vivid red upon receiving damage, releasing showers of dry straw shavings, splintered oak chips, and golden sparks.
  * **Destruction**: Collapses with a crisp wooden splintering sound, dispersing crystalline combat insight (SP).

---

### 2. Courtyard Sentinel (`monsterCourtSentinel`)

* **Category**: Ground Patrol Automaton
* **Base HP**: 70
* **Score Reward**: 250 pts
* **Associated Locations**: Courtyard of Awakening, Grand Bastion
* **Appearance**:
  * Sturdy humanoid construct fabricated from burnished dark bronze and riveted wrought iron.
  * Houses a humming internal boiler fueled by condensed amber oil, with glowing orange furnace slits in the chest.
* **Combat Role & Behavior**:
  * Patrols flagstone avenues with steady, measured strides.
  * Reverses direction upon striking walls or ledge boundaries.
  * Delivers a sweeping halberd strike or heavy shield bash upon closing within player melee range.
  * **Tactics**: Jump over their shield guards or execute a quick `Dash` behind them to strike their exposed copper exhaust vents.

---

### 3. Gargoyle Scout (`monsterGargoyleScout`)

* **Category**: Light Aerial Reconnaissance / Flying Automaton
* **Base HP**: 45
* **Score Reward**: 200 pts
* **Associated Locations**: Courtyard of Awakening, Clockwork Tower
* **Appearance**:
  * Agile, lightweight avian frame composed of hammered brass plates with open-faced escapement gears.
  * Twin cyan optical lenses continually sweep the floor below.
* **Combat Role & Behavior**:
  * Hovers along high horizontal patrol corridors at steady cruising velocity.
  * Flaps mechanical wings in a rhythmic, harmonic frequency.
  * Does not dive aggressively, but inflicts contact damage and disrupts jump trajectories across platform gaps.
  * **Tactics**: Requires vertical 90° upward shots or angled 45° spell casts while advancing.

---

### 4. Chasm Gargoyle (`monsterChasmGargoyle`)

* **Category**: Aggressive Aerial Predator
* **Base HP**: 65
* **Score Reward**: 300 pts
* **Associated Locations**: Chasm of Thorns and Shadows, Grand Bastion
* **Appearance**:
  * Dark weathered iron chassis with serrated talon appendages and a menacing predatory silhouette.
  * Powered by crimson Aether crystals visible through a rib-like chest grille.
* **Combat Role & Behavior**:
  * Loiters high above hazardous chasms until a player steps onto an isolated platform.
  * Executes a swift, swooping diagonal dive attack aimed directly at the player's position.
  * **Tactics**: Time a defensive parry (`Solar Shield Bash` or `Aether Barrier`) right as it descends, or duck into a crouch-slide underneath its dive and strike its back.

---

### 5. Chasm Crawler (`monsterChasmCrawler`)

* **Category**: Subterranean Ambush Beast / Low-Slung Construct
* **Base HP**: 55
* **Score Reward**: 220 pts
* **Associated Locations**: Chasm of Thorns and Shadows
* **Appearance**:
  * Multi-legged scorpion-like carapace forged from jagged shale and crystalline amber thorns.
  * Skitters silently along low cavern floors and under low stone arches.
* **Combat Role & Behavior**:
  * Crawls at high speed along ground surfaces, fitting into low crawlways where players must crouch.
  * Cannot be struck by high standing rapier thrusts unless the player crouches (`Crouch Attack`) or casts low angled spells (`45° Downwards`).
  * **Tactics**: Crouch and attack with low rapiers or deploy radial spells like `Chrono Frost Nova` before entering cramped tunnels.

---

### 6. Clockwork Automaton (`monsterClockworkAutomaton`)

* **Category**: Heavy Mechanical Soldier
* **Base HP**: 110
* **Score Reward**: 450 pts
* **Associated Locations**: Clockwork Tower, Grand Bastion
* **Appearance**:
  * Imposing 8-foot tall brass behemoth with multiple interlocking internal gear trains and external steam pipes.
  * Armed with dual counter-rotating gear blades that emit showers of sparks when spun up.
* **Combat Role & Behavior**:
  * Slow, deliberate advance. Upon spotting an intruder, charges forward in a high-speed mechanical overdrive.
  * Immune to frontal stagger while winding up attacks.
  * **Tactics**: Keep distance using `Solar Fireball` or `Arcane Missiles`, or phase through with `Chrono Dash` / `Phase Dash` to attack during its recovery cooldown.

---

### 7. Aether Sentinel (`monsterAetherSentinel`)

* **Category**: Crystalline Sky Guardian
* **Base HP**: 95
* **Score Reward**: 400 pts
* **Associated Locations**: Aether Sky Sanctuary
* **Appearance**:
  * Levitating torso and armored gauntlets crafted from pale marble, held together solely by swirling ribbons of glowing cyan Aether.
  * No legs; floats silently through the mist with ethereal grace.
* **Combat Role & Behavior**:
  * Projects kinetic pulse waves that knock players backward toward ledge drop-offs.
  * Periodically activates a shimmering reflective ward that deflects frontal physical thrusts.
  * **Tactics**: Dispel its ward with pure celestial spells (`Aether Bolt`, `Solar Flare`) before engaging with rapier combos.

---

### 8. Aether Wisp (`monsterAetherWisp`)

* **Category**: Arcane Anomaly / Volatile Elemental
* **Base HP**: 35
* **Score Reward**: 180 pts
* **Associated Locations**: Aether Sky Sanctuary, Grand Bastion
* **Appearance**:
  * A pulsating orb of pure condensed starlight, surrounded by orbiting crystal shards and trailing spectral comet tails.
* **Combat Role & Behavior**:
  * Erratic, floating movement pattern ignoring platform boundaries.
  * Fires tracking needle sparks at regular intervals, and violently discharges an aetheric burst upon death.
  * **Tactics**: Eliminate from extreme range before they close distance.

---

### 9. Aether Archon (`monsterAetherArchon`)

* **Category**: Elite Sanctuary Commander / Miniboss Construct
* **Base HP**: 300
* **Score Reward**: 1,000 pts
* **Associated Locations**: Apex of Aether Sky Sanctuary
* **Appearance**:
  * Towering celestial warrior enveloped in a double-ringed gyroscope of carved runestones and blinding cerulean radiance.
  * Wields a colossal spectral greatsword manifest from starlight.
* **Combat Role & Behavior**:
  * Two-phase combat sequence:
    1. *Starlight Slashes*: Delivers sweeping cross-arena energy crescents requiring precise crouches and high double-jumps.
    2. *Starfall Cascade*: Summons vertical beams of pure Aether crashing across the arena floor, demanding rapid positioning between impact safe zones.
  * Defeating the Archon permanently unseals the Sanctuary Gateway and rewards substantial SP.

---

### 10. Shadow Knight (`monsterShadowKnight`)

* **Category**: Phantom Duelist / Bastion Specter
* **Base HP**: 140
* **Score Reward**: 600 pts
* **Associated Locations**: Grand Bastion Proving Grounds
* **Appearance**:
  * Ethereal apparition of an ancient Bastion swordmaster, clad in tattered crimson velvet and smoking dark-matter armor.
  * Wields a spectral dueling rapier that leaves black-and-gold chromatic trails.
* **Combat Role & Behavior**:
  * Mirrors the player’s combat toolkit: performs swift backsteps, feint thrusts, and rapid lunges.
  * Can parry naive frontal attacks, forcing players to master combat tempo and bait out attacks.
  * **Tactics**: Counter their lunge with an invincible `Dash`, followed by an immediate turning counter-slash or close-range spell burst.

---

## Bestiary Summary Table

| Monster / Construct | Role / Tier | Base HP | Reward | Key Vulnerability / Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **Straw Training Dummy** | Static Target | 50 | 150 pts | Any weapon or spell combo |
| **Gargoyle Scout** | Aerial Light | 45 | 200 pts | 90° vertical / 45° angled shots |
| **Chasm Crawler** | Low Ambush | 55 | 220 pts | Crouch attacks & ground radial spells |
| **Chasm Gargoyle** | Aerial Dive | 65 | 300 pts | Crouch-slide evasion & counter-thrust |
| **Courtyard Sentinel** | Ground Patrol | 70 | 250 pts | Flanking behind back vent |
| **Aether Wisp** | Flying Anomaly | 35 | 180 pts | Long-range projectile sniping |
| **Clockwork Automaton** | Heavy Brawler | 110 | 450 pts | Phase evasion & kiting |
| **Aether Sentinel** | Shielded Floater | 95 | 400 pts | Celestial magic shieldbreak |
| **Shadow Knight** | Mirror Duelist | 140 | 600 pts | Baiting parries & timed dashes |
| **Aether Archon** | Elite Miniboss | 300 | 1,000 pts | Pattern recognition across starfall phases |
