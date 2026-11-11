# Locations & Castle Sectors (World Atlas)

The world of *Vibrant Castle* is set within an ancient citadel suspended in an eternal, golden autumn. Constructed in the late 19th century by a guild of aristocratic duelists, scholars, and clockwork architects, the citadel harnesses primordial Aether — the crystalline substance that binds matter and the flow of time.

The fortress is organized into **five distinct, interconnected locations** registered in the world engine (`LOCATION_REGISTRY`). Each sector features multi-layered parallax backgrounds, dynamic ambient particle systems, unique platforming mechanics, and Castlevania-style transition portals.

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
  * **Far Horizon**: Distant needle spires and mountain silhouettes catching sunset glow (`scrollSpeed: 0.12`).
  * **Mid-Far Ramparts**: Majestic gothic battlements and flying buttresses (`scrollSpeed: 0.24`).
  * **Mid Castle Walls**: Weathered stone masonry and arched stained glass apertures (`scrollSpeed: 0.42`).
  * **Mid-Close Arcade**: Detailed stone balustrades and ancient oak branches (`scrollSpeed: 0.70`).
  * **Close Foreground**: Intricate iron lampposts, stone statues, and crumbling stone curbs (`scrollSpeed: 1.00`).
* **Zones** (`layout.solids`, from the west spawn to the east gate):
  * **Awakening Yard**: The flagstone yard and first steps, a safe stretch for basic runs, quick turns and slides.
  * **Arcade Terraces**: Stepped terraces, balconies and walkways, with a secret loft above the arcade.
  * **Fountain Basin**: A sunken basin of pillars, plinths and gantries, with a secret ledge.
  * **Gatehouse**: The iron portcullis and golden gate lever on the parapet, plus the vault behind the gate.
  * **Chasm Road**: The road to the east gate with ledges and lofts, leading to the Chasm of Thorns portal.
* **Interactive Elements & Hazards**:
  * **Courtyard Portcullis & Gate Lever**: Iron lattice gate blocking access to the outer parapet, raised by striking the golden lever.
* **Portals**:
  * *Gate to the East*: Leads into the *Chasm of Thorns and Shadows*.
* **Inhabiting Forces**: Straw Training Dummy, Courtyard Sentinel, Gear Mite, Gargoyle Scout, Lantern Warden.

---

## 2. Chasm of Thorns and Shadows (`thorn_chasm`)

* **Title**: Chasm of Thorns and Shadows (*Rozpadlina Cierni i Cieni*)
* **Dimensions**: 6000px width × 1500px height
* **Spawn Point**: `(x: 130, y: 312)` (Player 2 offset: `+40px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep crimson-amber abyss (`#350d0d` to `#0d0202`) with thick fiery haze (`rgba(194, 65, 12, 0.14)`).
  * **Particles**: Luminous embers and drifting crystalline ash (`amber_dust`).
  * **Music & Ambient**: Tense, pulsating rhythm reflecting impending peril (`intensity: 0.45`).
* **Visual Architecture**:
  * Crumbling fortress foundations over a sheer vertical precipice. Jagged stone pillars jut outward at steep angles, surrounded by thorny brambles hardened by crystallized Aether.
* **Zones** (`layout.solids`, from the entry floor to the exit):
  * **Entry Floor & Descent**: The entry floor from the courtyard side, then six descent steps down into the gorge.
  * **Upper & Low Ledges**: Four upper ledges and three low ledges, with a low clearance that must be crouch-slid under.
  * **Isles & Bridges**: Three isles, four bridge slabs and two stone slabs suspended above the spikes.
  * **Lever & Portcullis**: A lever step and ledge that open the portcullis.
  * **Climb, Moving Platform & Exit**: Five climb steps, a moving platform, and the exit floor to the Clockwork Tower portal.
  * **Secrets & Dash Routes**: A secret step and alcove, plus three dash-only routes.
* **Interactive Elements & Hazards**:
  * **Amber Hazard Spikes (`labelAmberThorns`)**: The gorge floor is blanketed with razor-sharp amber crystal spines. Contact inflicts instant damage or forces respawn.
  * **Low Archway (`labelLowArchway`)**: A suffocatingly low stone clearance over jagged ground that requires crouch-sliding under speed to clear.
* **Portals**:
  * *West Portal*: Return passage to the *Courtyard of Awakening*.
  * *East Ascent*: Portal to the base of the *Clockwork Tower* (Foundry floor spawn), not to its high gears.
* **Inhabiting Forces**: Thorn Creeper, Chasm Gargoyle (diving aerial predators), Chasm Crawler (low-slung subterranean beasts clinging beneath slabs), Gear Mite.

---

## 3. Clockwork Tower & Angled Range (`clocktower`)

* **Title**: Clockwork Tower & Angled Range (*Wieża Zegarowa & Poligon Kątowy*)
* **Dimensions**: 3600px width × 3000px height (Vertical Emphasis)
* **Spawn Point**: `(x: 150, y: 2850)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Deep bronze, brass, and sepia twilight (`#2a1b0e` to `#0a0604`) laced with warm metallic dust (`rgba(217, 119, 6, 0.10)`).
  * **Particles**: Whirling brass cogs, copper shavings, and escaping steam puffs (`spark`).
  * **Music & Ambient**: Rhythmic mechanical tick-tock percussions layered over mournful cello tones (`intensity: 0.55`).
* **Visual Architecture**:
  * The interior and exterior shafts of the citadel's Great Horologium. Towering brass gear trains, massive oscillating pendulums, counterweight pulleys, and exposed clock faces looking out over the clouded expanse.
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
* **Inhabiting Forces**: Straw Training Dummy, Gear Mite, Clockwork Automaton, Lantern Warden, Gargoyle Scout.

---

## 4. Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)

* **Title**: Aether Sky Sanctuary & Aqueduct (*Sanktuarium Aetheru & Podniebny Akwedukt*)
* **Dimensions**: 6400px width × 1600px height
* **Spawn Point**: `(x: 170, y: 1152)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Ethereal cerulean and indigo starlight (`#111827` to `#030712`) bathed in glowing cyan aura (`rgba(6, 182, 212, 0.12)`).
  * **Particles**: Glowing aetheric motes and celestial stardust (`aether_mote`).
  * **Music & Ambient**: Resonant choral harmonies and shimmering crystal resonance (`intensity: 0.60`).
* **Visual Architecture**:
  * Floating masonry islets and ruined gothic arcades suspended above the cloud canopy by antigravitational Aether crystals. A monumental ruined aqueduct spans the horizon, with streams of liquid light cascading into the endless void.
* **Zones** (`layout.solids`, from the Clockwork Tower arrival to the Bastion gate):
  * **Arrival Terrace**: The terrace and stairs from the Clockwork Tower portal, with a rest court and a lift up.
  * **Shard Field**: Low and crystal bridges and floating shards between the islets.
  * **Cloister & Altar**: The cloister floor and roof, the altar isle and its gate, and the reliquary isle.
  * **Upper Steps & Parapet**: Four upper steps and a long parapet of eight ledges.
  * **Secrets & Dash Isle**: Three secret ledges and a dash-only isle.
* **Interactive Elements & Hazards**:
  * **Aether Void Chasm (`labelAetherVoid`)**: Endless starry abysses between floating islands. Falling into the void triggers immediate aetheric recall.
  * **Celestial Energy Barrier (`labelCelestialBarrier`)**: A humming field of woven arcane light that dissolves only when the sanctuary’s guardian constructs are quelled.
  * **Moving Glider Islets**: Hovering platforms gliding horizontally on glowing ley lines.
  * **Sanctuary Gateway (`labelSanctuaryGateway`)**: A massive ring of carved runestones encircling a swirling vortex of cerulean and gold flame, opened by the altar lever (`aether_altar_lever`) and leading on to the Grand Bastion.
* **Portals**:
  * *Descent Portal*: Returns to the *Clockwork Tower*.
  * *Gateway of Mastery*: Transit to the *Grand Bastion Training Grounds*.
* **Inhabiting Forces**: Aether Sentinel, Aether Wisp, Chrono Hound, Lantern Warden, and the formidable elite Aether Archon.

---

## 5. Grand Bastion Training Grounds (`grand_bastion`)

* **Title**: Grand Bastion Training Grounds (*Słoneczny Bastion - Wielki Poligon*)
* **Dimensions**: 8000px width × 1500px height
* **Spawn Point**: `(x: 150, y: 1300)` (Player 2 offset: `+45px`)
* **Atmosphere & Theme**:
  * **Sky & Mist**: Rich royal gold and burnished terracotta (`#381a08` to `#160802`) with autumn mist (`rgba(245, 158, 11, 0.12)`).
  * **Particles**: Swirling amber sparks mixed with crisp oak leaves (`leaf` & `spark`).
  * **Music & Ambient**: Heroic, expansive orchestral composition celebrating mastery of sword and sorcery (`intensity: 0.80`).
* **Visual Architecture**:
  * The comprehensive, grand circuit of the castle. It incorporates architectural motifs from all four preceding zones: sprawling paved courtyards, treacherous thorn moats, vertical gear-driven watchtowers, and high open-air balustrades.
* **Zones** (`layout.solids`, from the Sanctuary return to the victory loop):
  * **Barbican**: Barbican blocks and ledges, plus the drill steps climbing from the start.
  * **Rampart**: The rampart and merlons along the upper walk.
  * **Case & Cross Ledges**: Case ledges, cross platforms, dash rails and stones, with a secret step.
  * **Keep & Treasury**: Descent steps, the gantry, keep stones and lift, the treasury, and the gate to the keep.
  * **Ward & Arena**: Ward steps, perch and blocks, the ward gate, and four arena plates.
* **Interactive Elements & Hazards**:
  * **Main Sluice Lever (`labelMainSluiceLever`)**: A giant golden lever coupled to a massive pneumatic release mechanism.
  * **Grand Portcullis (`labelGrandPortcullis`)**: A monumental three-tiered iron portcullis barring passage to the victory dais until the Main Sluice Levers are struck. The two levers (`grand_lever_keep`, `grand_lever_ward`) open the keep gate (`grand_gate_keep`) and the ward gate (`grand_gate_ward`).
  * **Apex Gateway**: The ultimate portal pedestal celebrating stage victory, displaying total score, skill point accrual, and completion time.
* **Portals**:
  * *Sanctuary Return*: Reconnects with the *Aether Sky Sanctuary*.
  * *Mastery Portal* (`portal_mastery_loop`): Loops back to the *Courtyard of Awakening* for continuous mastery runs.
* **Inhabiting Forces**: Straw Training Dummy (`grand_dummy`, `training_target`), Courtyard Sentinel (`court_sentinel`; boss variant `bastion_sentinel_boss`), Clockwork Automaton, Chasm Gargoyle (`chasm_gargoyle`; variant `bastion_gargoyle`), Chrono Hound, Gear Mite, Lantern Warden.
