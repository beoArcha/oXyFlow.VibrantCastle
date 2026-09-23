# Locations & Castle Sectors (World Atlas)

The world of *Vibrant Castle* is set within an ancient, suspended citadel suspended in an eternal, golden autumn. Constructed in the late 19th century by a guild of aristocratic duelists, scholars, and clockwork architects, the citadel harnesses primordial Aether — the crystalline substance that binds matter and the flow of time.

The fortress is organized into **five distinct, interconnected locations** registered in the world engine (`LOCATION_REGISTRY`). Each sector features multi-layered parallax backgrounds, dynamic ambient particle systems, unique platforming mechanics, and Castlevania-style transition portals.

---

```text

                       [ LOCATION NETWORK OVERVIEW ]

      +---------------------------------------------------------+
      |                                                         |
      v                                                         |
[ Courtyard of Awakening ] <=======> [ Chasm of Thorns ]        |
      |          ^                          |                   |
      |          |                          v                   |
      |          +----------------- [ Clockwork Tower ]         |
      |                                     |                   |
      v                                     v                   |
[ Grand Bastion Circuit ] <======== [ Aether Sky Sanctuary ] ---+
```

---

## 1. Courtyard of Awakening (`courtyard`)

* **Title**: Courtyard of Awakening (*Dziedziniec Przebudzenia*)
* **Dimensions**: 3600px width × 900px height
* **Spawn Point**: `(x: 140, y: 640)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Warm golden-ochre twilight gradient (`#2d140a` to `#120602`) with soft amber fog (`rgba(224, 108, 53, 0.08)`).
  * **Particles**: Gently descending oak autumn foliage (`leaf`).
  * **Music & Ambient**: Melancholic, tranquil acoustic strings (`intensity: 0.1`).
* **Visual Architecture (5-Tier Parallax)**:
  * **Far Horizon**: Distant needle spires and mountain silhouettes catching sunset glow (`scrollSpeed: 0.12`).
  * **Mid-Far Ramparts**: Majestic gothic battlements and flying buttresses (`scrollSpeed: 0.24`).
  * **Mid Castle Walls**: Weathered stone masonry and arched stained glass apertures (`scrollSpeed: 0.42`).
  * **Mid-Close Arcade**: Detailed stone balustrades and ancient oak branches (`scrollSpeed: 0.70`).
  * **Close Foreground**: Intricate iron lampposts, stone statues, and crumbling stone curbs (`scrollSpeed: 1.00`).
* **Interactive Elements & Hazards**:
  * **Polished Flagstone Pavements**: Flat, safe stretches designed for mastering basic runs, quick turns, and slide maneuvers.
  * **Courtyard Portcullis & Gate Lever**: Iron lattice gate blocking access to the outer parapet, raised by striking the golden lever.
  * **Training Grounds**: A secluded terrace equipped with straw training dummies for testing blade arcs and spell trajectory.
* **Portals**:
  * *Gate to the East*: Leads into the *Chasm of Thorns and Shadows*.
  * *High Rampart Portal*: Ascends toward the *Clockwork Tower*.
  * *Grand Bastion Archway*: Fast-travel gateway directly to the unified *Grand Bastion Proving Grounds*.
* **Inhabiting Forces**: Straw Training Dummies, Courtyard Sentinels, Gargoyle Scouts.

---

## 2. Chasm of Thorns and Shadows (`thorn_chasm`)

* **Title**: Chasm of Thorns and Shadows (*Rozpadlina Cierni i Cieni*)
* **Dimensions**: 3400px width × 1000px height
* **Spawn Point**: `(x: 140, y: 600)`
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep crimson-amber abyss (`#350d0d` to `#0d0202`) with thick fiery haze (`rgba(194, 65, 12, 0.14)`).
  * **Particles**: Luminous embers and drifting crystalline ash (`amber_dust`).
  * **Music & Ambient**: Tense, pulsating rhythm reflecting impending peril (`intensity: 0.45`).
* **Visual Architecture**:
  * Crumbling fortress foundations over a sheer vertical precipice. Jagged stone pillars jut outward at steep angles, surrounded by thorny brambles hardened by crystallized Aether.
* **Interactive Elements & Hazards**:
  * **Amber Hazard Spikes (`labelAmberThorns`)**: The gorge floor is blanketed with razor-sharp amber crystal spines. Contact inflicts instant damage or forces respawn.
  * **Floating Stepping Stones**: Narrow stone slabs suspended above the chasm at staggered elevations (`y: 460`, `y: 360`, `y: 280`), demanding precise coyote-time jumps and aerial dashes.
  * **Low Archway (`labelLowArchway`)**: A suffocatingly low stone clearance over jagged ground that requires crouch-sliding under speed to clear.
* **Portals**:
  * *West Portal*: Return passage to the *Courtyard of Awakening*.
  * *East Ascent*: Portal climbing into the high gears of the *Clockwork Tower*.
* **Inhabiting Forces**: Chasm Gargoyles (diving aerial predators), Chasm Crawlers (low-slung subterranean beasts clinging beneath slabs).

---

## 3. Clockwork Tower & Angled Range (`clocktower`)

* **Title**: Clockwork Tower & Angled Range (*Wieża Zegarowa & Poligon Kątowy*)
* **Dimensions**: 2400px width × 1600px height (Vertical Emphasis)
* **Spawn Point**: `(x: 180, y: 1350)`
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep bronze, brass, and sepia twilight (`#2a1b0e` to `#0a0604`) laced with warm metallic dust (`rgba(217, 119, 6, 0.10)`).
  * **Particles**: Whirling brass cogs, copper shavings, and escaping steam puffs (`spark`).
  * **Music & Ambient**: Rhythmic mechanical tick-tock percussions layered over mournful cello tones (`intensity: 0.55`).
* **Visual Architecture**:
  * The interior and exterior shafts of the citadel's Great Horologium. Towering brass gear trains, massive oscillating pendulums, counterweight pulleys, and exposed clock faces looking out over the clouded expanse.
* **Interactive Elements & Hazards**:
  * **Vertical Clockwork Lift (`labelVerticalLift`)**: A motorized brass freight platform constantly operating along heavy iron chains between the lower gear floor and high battlements.
  * **Angled Firing Range (`narrationShootingRange`)**: A multi-tiered tactical range featuring targets situated aloft and below. Teaches players to hold direction inputs while shooting to loose spells at 45° elevations or stand still for 90° vertical shots.
  * **Spire Gate & Gear Escapement**: A reinforced clockwork gate opened only by aligning mechanical escapements via projectile hits.
* **Portals**:
  * *Base Portal*: Descends back to the *Chasm of Thorns and Shadows*.
  * *Spire Apex Portal*: Bridges across the upper clouds into the *Aether Sky Sanctuary*.
* **Inhabiting Forces**: Clockwork Automata, Gargoyle Scouts, Training Dummies at elevated sniper posts.

---

## 4. Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Title**: Aether Sky Sanctuary & Aqueduct (*Sanktuarium Aetheru & Podniebny Akwedukt*)
* **Dimensions**: 3800px width × 1100px height
* **Spawn Point**: `(x: 160, y: 720)`
* **Atmosphere & Theme**:
  * **Sky & Mist**: Ethereal cerulean and indigo starlight (`#111827` to `#030712`) bathed in glowing cyan aura (`rgba(6, 182, 212, 0.12)`).
  * **Particles**: Glowing aetheric motes and celestial stardust (`aether_mote`).
  * **Music & Ambient**: Resonant choral harmonies and shimmering crystal resonance (`intensity: 0.60`).
* **Visual Architecture**:
  * Floating masonry islets and ruined gothic arcades suspended above the cloud canopy by antigravitational Aether crystals. A monumental ruined aqueduct spans the horizon, with streams of liquid light cascading into the endless void.
* **Interactive Elements & Hazards**:
  * **Aether Void Chasm (`labelAetherVoid`)**: Endless starry abysses between floating islands. Falling into the void triggers immediate aetheric recall.
  * **Celestial Energy Barrier (`labelCelestialBarrier`)**: A humming field of woven arcane light that dissolves only when the sanctuary’s guardian constructs are quelled.
  * **Moving Glider Islets**: Hovering platforms gliding horizontally on glowing ley lines.
  * **Mastery Portal (`portalMastery`)**: A massive ring of carved runestones encircling a swirling vortex of cerulean and gold flame, sealing the completion of Act I.
* **Portals**:
  * *Descent Portal*: Returns to the *Clockwork Tower*.
  * *Gateway of Mastery*: Unlocks transit to the *Grand Bastion Training Grounds* or loops into the deeper chambers of the citadel.
* **Inhabiting Forces**: Aether Sentinels, Aether Wisps, and the formidable elite Aether Archon.

---

## 5. Grand Bastion Training Grounds (`grand_bastion`)

* **Title**: Grand Bastion Training Grounds (*Słoneczny Bastion - Wielki Poligon*)
* **Dimensions**: 5200px width × 1200px height
* **Spawn Point**: `(x: 180, y: 880)` (Player 2 offset: `+50px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Rich royal gold and burnished terracotta (`#381a08` to `#160802`) with autumn mist (`rgba(245, 158, 11, 0.12)`).
  * **Particles**: Swirling amber sparks mixed with crisp oak leaves (`leaf` & `spark`).
  * **Music & Ambient**: Heroic, expansive orchestral composition celebrating mastery of sword and sorcery (`intensity: 0.80`).
* **Visual Architecture**:
  * The comprehensive, grand circuit of the castle. It incorporates architectural motifs from all four preceding zones: sprawling paved courtyards, treacherous thorn moats, vertical gear-driven watchtowers, and high open-air balustrades.
* **Interactive Elements & Hazards**:
  * **Unified Challenge Circuit**: Combines rapid sprint stretches, multi-height platforming over spikes, low crouch tunnels, and aerial platform rides into one seamless gauntlet.
  * **Main Sluice Lever (`labelMainSluiceLever`)**: A giant golden lever coupled to a massive pneumatic release mechanism.
  * **Grand Portcullis (`labelGrandPortcullis`)**: A monumental three-tiered iron portcullis barring passage to the victory dais until the Main Sluice Lever is struck.
  * **Apex Gateway**: The ultimate portal pedestal celebrating stage victory, displaying total score, skill point accrual, and completion time.
* **Portals**:
  * *Sanctuary Return*: Reconnects with the *Aether Sky Sanctuary*.
  * *Origin Portal*: Cycles back to the *Courtyard of Awakening* for continuous mastery runs.
* **Inhabiting Forces**: Training Dummies, Courtyard Sentinels, Clockwork Automata, Gargoyles, Aether Wisps, and elite Shadow Knights.
