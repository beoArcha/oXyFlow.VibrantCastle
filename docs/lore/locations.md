# Locations & Castle Sectors (World Atlas)

The world of *Vibrant Castle* is set within an ancient citadel suspended in an eternal, golden autumn. Constructed in the late 19th century by a guild of aristocratic duelists, scholars, and clockwork architects, the citadel harnesses primordial Aether — the crystalline substance that binds matter and the flow of time.

The fortress is organized into **five distinct, interconnected locations** registered in the world engine (`LOCATION_REGISTRY`). Each sector features five-tier parallax backgrounds, ambient particles, platform tilesets, decor props that cast light (lanterns, braziers, torches, crystals), unique platforming mechanics, and Castlevania-style transition portals. Every sector keeps the autumn mood: warm light, falling leaves and ash, lamps still lit in a tired old stone world. Gates are iron portcullises that visibly lift when their lever is struck (1.2 s, and the collision shrinks with them).

---

```text

                       [ LOCATION NETWORK OVERVIEW ]

 [ Courtyard of Awakening ] <====> [ Chasm of Thorns ] <====> [ Clockwork Tower ] <====> [ Aether Sky Sanctuary ] <====> [ Grand Bastion Circuit ]
            ^                                                                                                                     |
            |                                                                                                                     |
            +------------------------------------------- Mastery loop (Grand Bastion -> Courtyard) -----------------------------------+

 <====> : portals in both directions        ----> : one-way portal
```

Portal edges, taken from `dictionaries.portals[*].targetLocationId` in each location file (`src/data/locations/<id>.json`): courtyard -> thorn_chasm; thorn_chasm -> courtyard, clocktower; clocktower -> thorn_chasm, aether_sanctuary; aether_sanctuary -> clocktower, grand_bastion; grand_bastion -> aether_sanctuary, courtyard (the victory loop).

---

## 1. Courtyard of Awakening (`courtyard`)

* **Title**: Courtyard of Awakening (*Dziedziniec Przebudzenia*)
* **Dimensions**: 7200px width × 1350px height
* **Spawn Point**: `(x: 140, y: 1120)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Warm golden-ochre twilight gradient (`#2d140a` to `#120602`) with soft amber fog (`rgba(224, 108, 53, 0.08)`).
  * **Particles**: Gently descending oak autumn foliage (`leaf`).
  * **Music & Ambient**: Melancholic, tranquil acoustic strings (`intensity: 0.1`).
* **Visual Architecture (5-Tier Parallax)**:
  * **Far Horizon** (opaque, static): Distant needle spires and mountain silhouettes catching sunset glow (`scrollSpeedX: 0`).
  * **Mid-Far Ramparts**: Majestic gothic battlements and flying buttresses (`scrollSpeedX: 0.24`).
  * **Mid Castle Walls**: Weathered stone masonry and arched stained glass apertures (`scrollSpeedX: 0.42`).
  * **Mid-Close Arcade**: Stone balustrades and arches (`scrollSpeedX: 0.65`).
  * **Close Foreground**: Flora and fore-elements (`scrollSpeedX: 0.85`).
* **Tilesets & Decor**: tilesets `courtyard_stone`, `courtyard_wood`, `courtyard_marble`; four garden lamp posts, five hanging lanterns, two wall torches, two tattered banners and three leaf piles.
* **Zones** (`layout.solids`, from the west spawn to the east gate):
  * **Awakening Yard**: The flagstone yard and first steps, a safe stretch for basic runs, quick turns and slides.
  * **Arcade Terraces**: Stepped terraces, balconies and walkways, with a secret loft above the arcade.
  * **Fountain Basin**: A sunken basin of pillars, plinths and gantries, with a secret ledge.
  * **Gatehouse**: The iron portcullis and golden gate lever on the parapet, plus the vault behind the gate.
  * **Chasm Road**: The road to the east gate with ledges and lofts, leading to the Chasm of Thorns portal.
* **Interactive Elements & Hazards**:
  * **Courtyard Portcullis & Gate Lever**: Iron lattice gate (`court_gate_main`) blocking access to the outer parapet, raised on screen by striking the golden lever (`court_gate_lever`).
* **Portals**:
  * *Gate to the East*: Leads into the *Chasm of Thorns and Shadows*.
* **Entry points**: the default spawn, plus arrivals from the Chasm (`from_chasm`, east end), the Tower (`from_tower`) and the Bastion loop (`from_bastion`).
* **Inhabiting Forces**: Straw Training Dummy (2), Courtyard Sentinel (7), Gear Mite (3), Gargoyle Scout (3), Lantern Warden (1).

---

## 2. Chasm of Thorns and Shadows (`thorn_chasm`)

* **Title**: Chasm of Thorns and Shadows (*Rozpadlina Cierni i Cieni*)
* **Dimensions**: 6000px width × 1500px height
* **Spawn Point**: `(x: 130, y: 312)` (Player 2 offset: `+40px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep crimson-amber abyss (`#230e07` to `#0d0301`) with thick fiery haze (`rgba(224, 70, 30, 0.12)`).
  * **Particles**: Drifting embers and ash dust (`dust`).
  * **Music & Ambient**: Tense, pulsating rhythm reflecting impending peril (`intensity: 0.3`).
* **Visual Architecture**:
  * Crumbling fortress foundations over a sheer vertical precipice. Jagged stone pillars jut outward at steep angles, surrounded by thorny brambles hardened by crystallized Aether. Tilesets: `chasm_rock`, `chasm_ledge`. Decor: four iron chains, four thorn brambles, four wall torches and four ember skull lanterns, whose glow lights the gorge.
* **Zones** (`layout.solids`, from the entry floor to the exit):
  * **Entry Floor & Descent**: The entry floor from the courtyard side, then six descent steps down into the gorge.
  * **Upper & Low Ledges**: Four upper ledges and three low ledges, with a low clearance that must be crouch-slid under.
  * **Isles & Bridges**: Three isles, four bridge slabs and two stone slabs suspended above the spikes.
  * **Lever & Portcullis**: A lever step and ledge (`chasm_portcullis_lever`) that lift the portcullis (`chasm_portcullis`).
  * **Climb, Moving Platform & Exit**: Five climb steps, a moving platform, and the exit floor to the Clockwork Tower portal.
  * **Secrets & Dash Routes**: A secret step and alcove, plus three dash-only routes.
* **Interactive Elements & Hazards**:
  * **Amber Hazard Spikes (`labelAmberThorns`)**: The gorge floor is blanketed with razor-sharp amber crystal spines. Contact inflicts instant damage or forces respawn.
  * **Low Archway (`labelLowArchway`)**: A suffocatingly low stone clearance over jagged ground that requires crouch-sliding under speed to clear.
* **Portals**:
  * *West Portal*: Return passage to the *Courtyard of Awakening*.
  * *East Ascent*: Portal to the base of the *Clockwork Tower* (Foundry floor spawn), not to its high gears.
* **Inhabiting Forces**: Thorn Creeper (3), Chasm Gargoyle (5; diving aerial predators), Chasm Crawler (7; low-slung beasts clinging beneath slabs), Gear Mite (2).

---

## 3. Clockwork Tower & Angled Range (`clocktower`)

* **Title**: Clockwork Tower & Angled Range (*Wieża Zegarowa & Poligon Kątowy*)
* **Dimensions**: 3600px width × 3000px height (Vertical Emphasis)
* **Spawn Point**: `(x: 150, y: 2850)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep bronze, brass, and sepia twilight (`#1c1008` to `#0b0402`) laced with warm metallic dust (`rgba(245, 158, 11, 0.09)`).
  * **Particles**: Copper sparks (`spark`).
  * **Music & Ambient**: Rhythmic mechanical tick-tock percussions layered over mournful cello tones (`intensity: 0.5`).
* **Visual Architecture**:
  * The interior and exterior shafts of the citadel's Great Horologium. Towering brass gear trains, massive oscillating pendulums, counterweight pulleys, and exposed clock faces looking out over the clouded expanse. Tileset: `clocktower_brick`. Decor: five hanging lanterns, twenty-one iron chains and four wall gears.
* **Zones** (five storeys, from the base spawn to the belfry):
  * **Foundry floor**: The ground storey at the spawn, with plinths and ledges and the stairs up.
  * **Gear gallery**: The second storey of gear plinths and ledges, reached by the gallery stairs.
  * **Pendulum shaft**: The open shaft with the pendulum lift and its perch, plus a secret chain.
  * **Escapement hall**: The storey of the spire gate, reached by the escapement stairs.
  * **Belfry**: The top storey with the clockface alcove and the apex portal to the Sanctuary.
* **Interactive Elements & Hazards**:
  * **Vertical Clockwork Lift (`labelVerticalLift`)**: A motorized brass freight platform constantly operating along heavy iron chains between the lower gear floor and high battlements.
  * **Angled Firing Range (`narrationShootingRange`)**: A multi-tiered tactical range featuring targets situated aloft and below. Teaches players to hold direction inputs while shooting to loose spells at 45° elevations or stand still for 90° vertical shots.
  * **Spire Gate & Gear Escapement**: A reinforced clockwork gate (`tower_spire_gate`) opened by the Clockwork Gear lever (`tower_gear_lever`), struck with a blade or projectile.
* **Portals**:
  * *Base Portal*: Descends back to the *Chasm of Thorns and Shadows*.
  * *Spire Apex Portal*: Bridges across the upper clouds into the *Aether Sky Sanctuary*.
* **Inhabiting Forces**: Straw Training Dummy (1), Gear Mite (7), Clockwork Automaton (4), Lantern Warden (3), Gargoyle Scout (2).

---

## 4. Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Title**: Aether Sky Sanctuary & Aqueduct (*Sanktuarium Aetheru & Podniebny Akwedukt*)
* **Dimensions**: 6400px width × 1600px height
* **Spawn Point**: `(x: 170, y: 1152)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Ethereal cerulean and indigo starlight (`#172554` to `#090d16`) bathed in a cyan haze (`rgba(56, 189, 248, 0.12)`). This is the one blue sector; a pass to bring it closer to the autumn palette is still on the backlog.
  * **Particles**: Glowing aetheric motes (`magic`).
  * **Music & Ambient**: Resonant choral harmonies and shimmering crystal resonance (`intensity: 0.6`).
* **Visual Architecture**:
  * Floating masonry islets and ruined gothic arcades suspended above the cloud canopy by antigravitational Aether crystals. A monumental ruined aqueduct spans the horizon, with streams of liquid light cascading into the endless void. Tileset: `sanctuary_crystal`. Decor: five aether crystal clusters (they glow) and seven candelabra.
* **Zones** (`layout.solids`, from the Clockwork Tower arrival to the Bastion gate):
  * **Arrival Terrace**: The terrace and stairs from the Clockwork Tower portal, with a rest court and a lift up.
  * **Shard Field**: Low and crystal bridges and floating shards between the islets.
  * **Cloister & Altar**: The cloister floor and roof, the altar isle and its gate, and the reliquary isle.
  * **Upper Steps & Parapet**: Four upper steps and a long parapet of eight ledges.
  * **Secrets & Dash Isle**: Three secret ledges and a dash-only isle.
* **Interactive Elements & Hazards**:
  * **Aether Void Chasm (`labelAetherVoid`)**: Endless starry abysses between floating islands. Falling into the void triggers immediate aetheric recall.
  * **Celestial Energy Barrier (`labelCelestialBarrier`)**: The altar gate (`aether_altar_gate`), a humming field of woven arcane light that lifts when the altar lever is struck.
  * **Moving Glider Islets**: Hovering platforms gliding horizontally on glowing ley lines.
  * **Sanctuary Gateway (`labelSanctuaryGateway`)**: A massive ring of carved runestones encircling a swirling vortex of cerulean and gold flame. The altar lever (`aether_altar_lever`) opens the barrier before it; the portal beyond leads on to the Grand Bastion.
* **Portals**:
  * *Descent Portal*: Returns to the *Clockwork Tower*.
  * *Gateway of Mastery*: Transit to the *Grand Bastion Training Grounds*.
* **Inhabiting Forces**: Aether Sentinel (4), Aether Wisp (3), Chrono Hound (3), Lantern Warden (2), and the elite Aether Archon (1, `aether_archon_boss`).

---

## 5. Grand Bastion Training Grounds (`grand_bastion`)

* **Title**: Grand Bastion Training Grounds (*Słoneczny Bastion - Wielki Poligon*)
* **Dimensions**: 8000px width × 1500px height
* **Spawn Point**: `(x: 150, y: 1300)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Rich royal gold and burnished terracotta (`#33160a` to `#120602`) with autumn mist (`rgba(245, 158, 11, 0.08)`).
  * **Particles**: Crisp oak leaves (`leaf`).
  * **Music & Ambient**: Heroic, expansive orchestral composition celebrating mastery of sword and sorcery (`intensity: 0.4`).
* **Visual Architecture**:
  * The comprehensive, grand circuit of the castle. It incorporates architectural motifs from all four preceding zones: sprawling paved courtyards, treacherous thorn moats, vertical gear-driven watchtowers, and high open-air balustrades. Tileset: `bastion_stone`. Decor: four war braziers, four wall torches, three tattered banners, two iron chains and a hanging lantern, so the circuit burns warm against the dusk.
* **Zones** (`layout.solids`, from the Sanctuary return to the victory loop):
  * **Barbican**: Barbican blocks and ledges, plus the drill steps climbing from the start.
  * **Rampart**: The rampart and merlons along the upper walk.
  * **Case & Cross Ledges**: Case ledges, cross platforms, dash rails and stones, with a secret step.
  * **Keep & Treasury**: Descent steps, the gantry, keep stones and lift, the treasury, and the gate to the keep.
  * **Ward & Arena**: Ward steps, perch and blocks, the ward gate, and four arena plates.
* **Interactive Elements & Hazards**:
  * **Main Sluice Lever (`labelMainSluiceLever`)**: A giant golden lever coupled to a massive pneumatic release mechanism.
  * **Grand Portcullis (`labelGrandPortcullis`)**: A monumental three-tiered iron portcullis barring passage to the victory dais until the Main Sluice Levers are struck. The two levers (`grand_lever_keep`, `grand_lever_ward`) lift the keep gate (`grand_gate_keep`) and the ward gate (`grand_gate_ward`).
  * **Apex Gateway**: The ultimate portal pedestal celebrating stage victory, displaying total score, skill point accrual, and completion time.
* **Portals**:
  * *Sanctuary Return*: Reconnects with the *Aether Sky Sanctuary*.
  * *Mastery Portal* (`portal_mastery_loop`): Loops back to the *Courtyard of Awakening* for continuous mastery runs.
* **Inhabiting Forces**: Straw Training Dummy (`grand_dummy` 4, `training_target` 2), Courtyard Sentinel (2; boss variant `bastion_sentinel_boss`, 1), Clockwork Automaton (2), Chasm Gargoyle (1) and `bastion_gargoyle` (2), Chrono Hound (3), Gear Mite (3), Lantern Warden (2).
