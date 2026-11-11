# Enemies, Automata & Bestiary (Monsters)

The adversaries populating *Vibrant Castle* range from centuries-old mechanical training apparatuses and patrol automata to crystalline horrors reanimated by wild, destabilized Aether.

All enemies are governed by modular hitboxes, damage flash feedback, distinct patrol/attack behaviors, and yield score and Skill Points (SP) upon destruction.

**Implementation status**: In the current build enemies patrol, hover, or stay in place. Attacks and damage against the player are planned; the attack behaviours described below are design targets, not yet live. Stats and locations match `src/data/enemies/enemies.json` and `src/data/locations/*.json`. All 19 templates are listed: 14 have their own entry, and the other five share the art and role of an entry (noted there).

---

## Complete Castle Bestiary

### 1. Straw Training Dummy (`monsterTrainingDummy`)

* **Category**: Proving Target / Passive Automaton
* **Base HP**: 60
* **Score Reward**: 150 pts
* **Associated Locations**: Courtyard of Awakening, Clockwork Tower (`training_dummy`); Grand Bastion (`grand_dummy`, `training_target`)
* **Appearance**:
  * Cross-shaped solid oak timber core wrapped in dense bundles of woven straw and reinforced leather belts.
  * Crowned with an antique knight’s iron sallet helmet adorned with a frayed scarlet feather crest.
* **Combat Role & Behavior**:
  * Anchored firmly to the ground; does not attack.
  * Serves as an interactive combat tutorial for verifying weapon range, multi-directional spell hits, and timing.
  * **Reaction**: Flashes vivid red upon receiving damage, releasing showers of dry straw shavings, splintered oak chips, and golden sparks.
  * **Destruction**: Collapses with a crisp wooden splintering sound, dispersing crystalline combat insight (SP).
  * **Variants**: `grand_dummy` (60 HP, 120 pts) and `training_target` (70 HP, 150 pts) share this art and role and stand in the Grand Bastion.

---

### 2. Courtyard Sentinel (`monsterCourtSentinel`)

* **Category**: Ground Patrol Automaton
* **Base HP**: 80
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
  * **Variant**: `bastion_sentinel_boss` (Grand Bastion, one placed; 100 HP, 800 pts, elite) shares this art and role as the boss of the Ward & Arena.

---

### 3. Gargoyle Scout (`monsterGargoyleScout`)

* **Category**: Light Aerial Reconnaissance / Flying Automaton
* **Base HP**: 50
* **Score Reward**: 400 pts
* **Associated Locations**: Courtyard of Awakening, Clockwork Tower (`gargoyle_scout`)
* **Appearance**:
  * Agile, lightweight avian frame composed of hammered brass plates with open-faced escapement gears.
  * Twin cyan optical lenses continually sweep the floor below.
* **Combat Role & Behavior**:
  * Hovers along high horizontal patrol corridors at steady cruising velocity.
  * Flaps mechanical wings in a rhythmic, harmonic frequency.
  * Does not dive aggressively, but inflicts contact damage and disrupts jump trajectories across platform gaps.
  * **Tactics**: Requires vertical 90° upward shots or angled 45° spell casts while advancing.
  * **Variant**: `clockwork_owl_gargoyle` (45 HP, 200 pts, the lighter owl-form of the same role) shares this art and role. No map places it yet.

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
  * **Variant**: `bastion_gargoyle` (Grand Bastion, two placed; 50 HP, 450 pts) shares this art and role.

---

### 5. Chasm Crawler (`monsterChasmCrawler`)

* **Category**: Subterranean Ambush Beast / Low-Slung Construct
* **Base HP**: 80
* **Score Reward**: 500 pts
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
* **Base HP**: 120
* **Score Reward**: 350 pts
* **Associated Locations**: Clockwork Tower, Grand Bastion
* **Appearance**:
  * Imposing 8-foot tall brass behemoth with multiple interlocking internal gear trains and external steam pipes.
  * Armed with dual counter-rotating gear blades that emit showers of sparks when spun up.
* **Combat Role & Behavior**:
  * Slow, deliberate advance. Upon spotting an intruder, charges forward in a high-speed mechanical overdrive.
  * Immune to frontal stagger while winding up attacks.
  * **Tactics**: Keep distance using `Solar Fireball` or `Aether Bolt`, or phase through with `Chrono Dash` / `Phase Dash` to attack during its recovery cooldown.

---

### 7. Aether Sentinel (`monsterAetherSentinel`)

* **Category**: Crystalline Sky Guardian
* **Base HP**: 110
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
* **Base HP**: 60
* **Score Reward**: 500 pts
* **Associated Locations**: Aether Sky Sanctuary (three placed; none in the Grand Bastion)
* **Appearance**:
  * A pulsating orb of pure condensed starlight, surrounded by orbiting crystal shards and trailing spectral comet tails.
* **Combat Role & Behavior**:
  * Erratic, floating movement pattern ignoring platform boundaries.
  * Fires tracking needle sparks at regular intervals, and violently discharges an aetheric burst upon death.
  * **Tactics**: Eliminate from extreme range before they close distance.

---

### 9. Aether Archon (`monsterAetherArchon`)

* **Category**: Elite Sanctuary Commander / Miniboss Construct
* **Base HP**: 220
* **Score Reward**: 750 pts
* **Associated Locations**: Aether Sky Sanctuary, at the gateway end (`aether_archon_boss`)
* **Appearance**:
  * Towering celestial warrior enveloped in a double-ringed gyroscope of carved runestones and blinding cerulean radiance.
  * Wields a colossal spectral greatsword manifest from starlight.
* **Combat Role & Behavior**:
  * Two-phase combat sequence:
    1. *Starlight Slashes*: Delivers sweeping cross-arena energy crescents requiring precise crouches and high double-jumps.
    2. *Starfall Cascade*: Summons vertical beams of pure Aether crashing across the arena floor, demanding rapid positioning between impact safe zones.
  * Defeating the Archon is meant to unseal the Sanctuary Gateway and reward substantial SP. Planned: in the current data the gateway is opened by the altar lever (`aether_altar_lever`), and no Archon-defeat hook was found in `src/game`.

---

### 10. Shadow Knight (`monsterShadowKnight`)

* **Category**: Phantom Duelist / Bastion Specter
* **Base HP**: 260
* **Score Reward**: 1,000 pts
* **Associated Locations**: None yet. The `shadow_knight` template exists, but no map places it, so the Grand Bastion currently holds no Shadow Knight. Its placement is planned.
* **Appearance**:
  * Ethereal apparition of an ancient Bastion swordmaster, clad in tattered crimson velvet and smoking dark-matter armor.
  * Wields a spectral dueling rapier that leaves black-and-gold chromatic trails.
* **Combat Role & Behavior**:
  * Mirrors the player’s combat toolkit: performs swift backsteps, feint thrusts, and rapid lunges.
  * Can parry naive frontal attacks, forcing players to master combat tempo and bait out attacks.
  * **Tactics**: Counter their lunge with an invincible `Dash`, followed by an immediate turning counter-slash or close-range spell burst.

---

### 11. Gear Mite (`monsterGearMite`)

* **Category**: Tiny Clockwork Skitterer / Ground Patrol
* **Base HP**: 20
* **Score Reward**: 80 pts
* **Associated Locations**: Courtyard of Awakening, Chasm of Thorns and Shadows, Clockwork Tower, Grand Bastion
* **Appearance**:
  * Brass cog-beetle no larger than a loaf of bread, its carapace built from interlocking toothed discs.
  * A tiny escapement ticks audibly beneath its shell.
* **Combat Role & Behavior**:
  * Currently patrols floors at high speed and reverses at patrol bounds. Damage and attacks are planned and not yet implemented.
  * Its snapping mandibles are intended to deal light contact damage once combat is enabled.
  * **Tactics**: A single quick slash or low spell destroys it; time your strike as it turns at the end of its route.

---

### 12. Thorn Creeper (`monsterThornCreeper`)

* **Category**: Rooted Hazard / Stationary Flora
* **Base HP**: 50
* **Score Reward**: 150 pts
* **Associated Locations**: Chasm of Thorns and Shadows
* **Appearance**:
  * Swollen bulb of amber thorns anchored to the chasm floor by woven roots.
  * Faint resin glows between the barbs.
* **Combat Role & Behavior**:
  * Stationary; never patrols. Damage and attacks are planned (thorn volleys) and not yet implemented.
  * Acts as a fixed obstacle that restricts footing along ledges.
  * **Tactics**: Attack from range or leap past its reach; fire-aligned spells are especially effective.

---

### 13. Lantern Warden (`monsterLanternWarden`)

* **Category**: Slow Aerial Sentry / Floating Automaton
* **Base HP**: 35
* **Score Reward**: 180 pts
* **Associated Locations**: Courtyard of Awakening, Clockwork Tower, Aether Sky Sanctuary, Grand Bastion
* **Appearance**:
  * Floating brass lantern with a glowing amber ember for an eye, suspended without visible support.
  * Soot-black cage bars and trailing chain links sway beneath it.
* **Combat Role & Behavior**:
  * Currently drifts slowly along corridor patrol routes. Damage and attacks are planned (a lantern beam) and not yet implemented.
  * Cruises at a gentle pace and ignores platform boundaries.
  * **Tactics**: Snipe it from range with vertical or angled shots before it reaches your platform.

---

### 14. Chrono Hound (`monsterChronoHound`)

* **Category**: Fast Ground Patrol / Clockwork Beast
* **Base HP**: 60
* **Score Reward**: 260 pts
* **Associated Locations**: Grand Bastion, Aether Sky Sanctuary
* **Appearance**:
  * Lean hound of burnished brass ribs and exposed mainspring muscle.
  * Ember-orange eyes trail faint afterimages as it runs.
* **Combat Role & Behavior**:
  * Currently sprints along its patrol and reverses at the bounds. Damage and attacks are planned (a lunging slash) and not yet implemented.
  * Fastest patroller in the castle.
  * **Tactics**: Wait for it to turn at the patrol edge, then strike or dash behind it; a ranged opener is safer.

---

## Bestiary Summary Table

| Monster / Construct | Role / Tier | Base HP | Reward | Key Vulnerability / Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **Straw Training Dummy** | Static Target | 60 | 150 pts | Any weapon or spell combo |
| **Gargoyle Scout** | Aerial Light | 50 | 400 pts | 90° vertical / 45° angled shots |
| **Chasm Crawler** | Low Ambush | 80 | 500 pts | Crouch attacks & ground radial spells |
| **Chasm Gargoyle** | Aerial Dive | 65 | 300 pts | Crouch-slide evasion & counter-thrust |
| **Courtyard Sentinel** | Ground Patrol | 80 | 250 pts | Flanking behind back vent |
| **Aether Wisp** | Flying Anomaly | 60 | 500 pts | Long-range projectile sniping |
| **Clockwork Automaton** | Heavy Brawler | 120 | 350 pts | Phase evasion & kiting |
| **Aether Sentinel** | Shielded Floater | 110 | 400 pts | Celestial magic shieldbreak |
| **Shadow Knight** | Mirror Duelist | 260 | 1,000 pts | Baiting parries & timed dashes |
| **Aether Archon** | Elite Miniboss | 220 | 750 pts | Pattern recognition across starfall phases |
| **Gear Mite** | Ground Skitterer | 20 | 80 pts | Single slash at patrol turn |
| **Thorn Creeper** | Rooted Hazard | 50 | 150 pts | Ranged or fire spells |
| **Lantern Warden** | Slow Aerial Sentry | 35 | 180 pts | Ranged sniping |
| **Chrono Hound** | Fast Ground Patrol | 60 | 260 pts | Strike at patrol turn, dash behind |
| **Clockwork Owl Gargoyle** (unplaced) | Aerial Light | 45 | 200 pts | As Gargoyle Scout |
| **Bastion Gargoyle** | Aerial Dive | 50 | 450 pts | As Chasm Gargoyle |
| **Bastion Sentinel** (boss) | Elite Ground | 100 | 800 pts | As Courtyard Sentinel |
