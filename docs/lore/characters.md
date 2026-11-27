# Playable Heroes & Champions (Characters)

In *Vibrant Castle*, players command two distinct duelists forged in the melancholic, warm aesthetic of 19th-century gothic fantasy. Each character possesses unique base stats, bespoke animation tracks, distinct spell constellations, and divergent philosophies regarding combat and the flow of Aether.

**Implementation status**: Both champions are playable in solo and two-player co-op modes (`src/game/characters/characterProfiles.ts`). Today they use fixed `baseStats` (HP, Mana, Stamina, Attack, Defense, regen, and cooldowns) while preserving identical running/jumping physics. The D20x10 six-attribute system (`STR/DEX/CON/INT/WIS/CHA`) and player-chosen priority growth are approved in the vision ([`docs/tasks/VISION.md`](../tasks/VISION.md)) and tracked in the backlog ([`VC-030`](../tasks/phase-4-0.3.x.md#vc-030--character-system-design-doc) design doc, [`VC-031`](../tasks/phase-5-0.4.x.md#vc-031--attributes-and-automatic-growth-engine) engine implementation, [`VC-033`](../tasks/phase-5-0.4.x.md#vc-033--valen-and-aurelia-progression-trees) progression trees).

---

## Attribute Scale & Approved Level-1 Profiles (Backlog: `VC-030`, `VC-031`)

All characters and monsters are planned to share a six-attribute D&D-like model (`STR / DEX / CON / INT / WIS / CHA`) stored on a **D20 x10 scale**:

* Level-1 average across attributes is fixed at **151**.
* Player starting range is **110–180** (180 is a starting maximum, not a level cap).
* Players choose priorities **1 / 2 / 3** and attribute growth is automatic on level-up; HP, Mana, and Stamina derive from attributes and level ([`VC-030`](../tasks/phase-4-0.3.x.md#vc-030--character-system-design-doc), [`VC-031`](../tasks/phase-5-0.4.x.md#vc-031--attributes-and-automatic-growth-engine)).

| Champion | STR | DEX | CON | INT | WIS | CHA | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Valen** | 151 | 166 | 156 | 136 | 146 | 151 | Approved baseline ([`VC-030`](../tasks/phase-4-0.3.x.md#vc-030--character-system-design-doc)) |
| **Aurelia** | 131 | 152 | 136 | 176 | 162 | 149 | Approved baseline ([`VC-030`](../tasks/phase-4-0.3.x.md#vc-030--character-system-design-doc)) |

---

## 1. Valen – Sun Knight (*Słoneczny Rycerz*)

* **In-Game Title**: Solar Knight (*Słoneczny Rycerz*, `valenLoreTitle`)
* **Primary Role**: Main Protagonist (Solo Mode / Player 1)
* **Archetype**: Scholar · Explorer · Precision Duelist
* **Combat Philosophy**: Control · Economy of Motion · Analytical Execution
* **Current Base Stats (`src/game/characters/characterProfiles.ts`)**: Max HP `115`, Max Mana `90`, Max Stamina `115`, Base Attack `23`, Base Defense `7`, Mana Regen `0.07`, Stamina Regen `0.30`, Spell Power `1.0x`, Mana Cost `1.0x`, Attack Cooldown `18` ticks, Dash Stamina Cost `18`, Slide Cooldown `38` ticks, Backstep Cooldown `32` ticks.

### Identity & Background

Valen is not a theatrical warrior seeking glory — he is a scholar and survivor shaped by ancient ruins and temporal anomalies. Having awakened in the Courtyard of Awakening, Valen approaches the castle not with reckless zeal, but with surgical calculation.

Every movement has purpose. Every action is the product of deliberate calculation rather than instinct. It is not raw muscle that defines Valen, but absolute spatial mastery and emotional composure.

### Silhouette, Appearance & Attire

* **Greatcoat**: Long graphite/charcoal travel coat tailored with subtle gilded embroidery and reinforced hems suited for navigating crumbling masonry.
* **Layers**: Practical scholar’s waistcoat, fitted trousers, and rugged leather boots engineered for swift pivots and balanced footwork.
* **Hair**: Short, slightly unruly chestnut hair ruffled by autumn breezes.
* **Eyewear**: Signature rectangular-rimmed spectacles — a defining element reflecting his analytical perception of reality.
* **Expression**: Calm, watchful, stoic; subtle and reserved facial demeanor.

**Color Palette**:

* Graphite / Deep Slate Charcoal (`#1e293b`, `#334155`)
* Muted Leather Brown / Ochre (`#78350f`, `#92400e`)
* Warm Radiant Gold / Amber Accents (`#f59e0b`, `#fbbf24`), matching his solar cast particles and `crimson` UI theme tokens.

### Movement Mechanics & Kinetic Style

* **Minimalist & Efficient**: Zero wasted flourishes or unnecessary theatrical windups.
* **Low Center of Gravity**: Balanced stance prioritizing instant recovery after attacks, slides, and backsteps.
* **Natural Cloth Dynamics**: Realistic settling of coat-tails during sprints, vertical jumps, and sudden stops.

### Armament: Precision Steel Rapier

* A slender, balanced dueling rapier forged from tempered Bastion steel.
* Optimized for lightning-fast thrusts, crisp horizontal slashes, and defensive deflections.

### Signature Abilities & Magic Discipline: Solar Arts

Valen channels the radiant, ordered energy of the Sun and Bastion architecture (`src/data/skills/spells.json`):

* **Solar Flare** (`solar_flare`, Tier 1): Instantaneous beam of concentrated solar brilliance piercing castle gloom (`35` dmg, `12` mana, `24` tick cooldown).
* **Solar Shield Bash** (`shield_bash`, Tier 1): Defensive barrier deflection repelling close-quarters hostiles (`18` dmg, `10` mana, `50` tick cooldown).
* **Solar Fireball** (`solar_fireball`, Tier 2): Explosive sphere of radiant flame (`52` dmg, `24` mana, `48` tick cooldown).
* **Prismatic Barrier** (`prismatic_shield`, Tier 2): Shimmering golden aegis granting invulnerability to spikes and strikes (`22` mana, `180` tick cooldown).
* **Radiant Slash** (`radiant_strike`, Tier 3): Master threefold shockwave of condensed sunbeams (`78` dmg, `35` mana, `75` tick cooldown).
* **Solar Sentinel** (`sun_sentinel`, Tier 3): Automatic flame familiar orbiting Valen (`24` dmg, `8` mana, `120` tick cooldown).
* **Passives**: **Blade Infusion** (`blade_infusion`, Tier 1), **Boundless Vigor** (`stamina_surge`, Tier 2), **Champion's Fortitude** (`vitality_surge`, Tier 3).

### Design Principles (Sprite & Animation Asset Standards)

* **Clear Silhouette**: Distinct readability on every quality tier (`hi8bit`, `hi16bit`, and painted `high`). The `hi8bit` and `hi16bit` hero sheets are quantized from the painted frames, so the greatcoat, glasses, and rapier read the same on each tier.
* **Rooted Footwork**: Strict foot-level anchor point (`pivot (0.5, 1.0)`) across animation tracks (`idle`, `run`, `jump`, `fall`, `attack`, `dash`, `cast`, `crouch`).
* **Controlled FX**: Effects remain bounded within character sprite cells, emphasizing crisp geometric clarity.

---

## 2. Aurelia – Arcane Scholar (*Uczona Arkanów*)

* **In-Game Title**: Scholar of Arcanum (*Uczona Arkanów*, `aureliaLoreTitle`)
* **Primary Role**: Companion Champion (Co-op Mode / Player 2)
* **Archetype**: Scholar · Protector · Astral Sorceress
* **Combat Philosophy**: Flow · Instinctive Reaction · Astral Control
* **Current Base Stats (`src/game/characters/characterProfiles.ts`)**: Max HP `90`, Max Mana `125`, Max Stamina `95`, Base Attack `18`, Base Defense `4`, Mana Regen `0.14`, Stamina Regen `0.24`, Spell Power `1.15x`, Mana Cost `0.9x`, Attack Cooldown `22` ticks, Dash Stamina Cost `15`, Slide Cooldown `30` ticks, Backstep Cooldown `26` ticks.

### Background & Identity

Where Valen analyzes, Aurelia perceives. Where he plans, she acts.

Aurelia is a living conduit to the Aetherial currents pulsing through the castle foundations. Her power stems from deep arcane study combined with fluid, intuitive control. While Valen stands as a calculated observer in the ruins, Aurelia reads the astrolabe currents of the Citadel as if native to its shifting halls.

### Silhouette, Attire & Appearance

* **Dress**: A flowing purple dress in rich shades of imperial violet and twilight purple, adorned with ritualistic gold filigree.
* **Hair & Movement**: Long chestnut hair that reacts dynamically to movement, acceleration, and ambient Aether currents.
* **Aetherial Aura**: Radiant astral glow from her conduits when mana surges.
* **Jewelry & Talismans**: Gilded hoops and resonant crystal pendants that sway in harmony with her acrobatic strides.
* **Expression**: Confident, alert, intuitive, slightly mysterious.

**Color Palette**:

* Deep Imperial Violet / Twilight Purple (`#4c1d95`, `#581c87`, `#7e22ce`)
* Violet & Astral Glow (`#a855f7`, `#c084fc`) in painted sheets and secondary cast particles (`#a855f7`), alongside blue-cyan (`#38bdf8`) primary cast particles and `cyan` UI theme tokens in `src/game/characters/characterProfiles.ts` and `src/styles/theme.ts`. **Backlog**: an autumn palette review of Aurelia's cyan identity and spell colors is tracked in [`docs/tasks/VISION.md`](../tasks/VISION.md) and Phase 8+ of [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md).
* Ornate Ancient Gold (`#f59e0b`, `#d97706`)

### Kinetic Style & Movement Mechanics

* **Fluid & Agile**: Faster slide and backstep recovery (`30` / `26` ticks) and lower dash stamina cost (`15`), balanced against lower physical attack and defense.
* **Continuous Flow**: Chains cast volleys with evasive repositioning.

### Armaments & Magic Discipline: Astral, Frost & Temporal Arts

Aurelia commands the primordial fabric of Aether, frost, and temporal dilation (`src/data/skills/spells.json`), with `+15%` spell power and `-10%` mana cost from her character profile:

* **Aether Bolt** (`aether_bolt`, Tier 1): Multi-directional beam of celestial force (`26` dmg, `10` mana, `20` tick cooldown).
* **Aether Barrier** (`aether_barrier`, Tier 1): Protective celestial shroud absorbing kinetic shock and hazard spikes (`18` mana, `140` tick cooldown).
* **Chrono Frost Nova** (`frost_nova`, Tier 2): Radial burst of freezing shards (`50` dmg, `26` mana, `55` tick cooldown).
* **Emerald Barrage** (`emerald_barrage`, Tier 2): Multi-bolt arcane volley (`38` dmg, `20` mana, `42` tick cooldown).
* **Temporal Phase / Chrono Rewind** (`chrono_rewind`, Tier 2): Bends temporal flow around Aurelia (`28` mana, `210` tick cooldown).
* **Celestial Comet** (`celestial_comet`, Tier 3): Cosmic comet of raw Aether (`85` dmg, `38` mana, `80` tick cooldown).
* **Sentinel Spark** (`sentinel_spark`, Tier 3): Autonomous celestial wisp firing bolts (`22` dmg, `6` mana, `150` tick cooldown).
* **Passives**: **Mana Wellspring** (`mana_font`, Tier 1), **Scholar's Focus** (`scholarly_focus`, Tier 2), **Astral Harmony** (`astral_attunement`, Tier 3).

---

## Comparative Champion Matrix

| Attribute | Valen (Player 1) | Aurelia (Player 2) |
| :--- | :--- | :--- |
| **Title (PL / EN)** | *Słoneczny Rycerz* / Solar Knight | *Uczona Arkanów* / Scholar of Arcanum |
| **Emblem & Theme** | Sun emblem / `crimson` | Astrolabe emblem / `cyan` |
| **Level-1 Attributes (Backlog `VC-030`)** | 151 / 166 / 156 / 136 / 146 / 151 | 131 / 152 / 136 / 176 / 162 / 149 |
| **Current Base Vitals (HP / Mana / Stamina)** | 115 / 90 / 115 | 90 / 125 / 95 |
| **Current Offense / Defense** | Attack 23 / Defense 7 / 1.0x Spell | Attack 18 / Defense 4 / 1.15x Spell |
| **Magic Domain** | Solar light, geometric glyphs, fortitude (`solar`) | Astral, frost, and chrono arts (`astral`, `frost`, `chrono`) |
| **Visual Tone** | Graphite greatcoat, glasses, golden solar magic | Long chestnut hair, purple dress, astral magic, gilded jewelry |

---

## Asset & Animation Specifications

1. **Quality Tiers**: `hi8bit` (`<hero>_hi8bit.png`) and `hi16bit` (`<hero>_hi16bit.png`) pixel sheets quantized from painted frames by `scripts/sprites/compile.ts`, plus the painted `high` packed sheets (`<hero>_level_1_high_packed.png`). Older `low` / `mid` / `high` files remain in `src/assets/characters/<hero>/` alongside `<hero>_pixel_meta.json` and `<hero>_packed_meta.json`.
2. **Animation Tracks**: 8-track layout (`idle`, `run`, `jump`, `fall`, `attack`, `dash`, `cast`, `crouch`) with wide frame spans supported.
3. **Portraits Matrix**: `<hero>_portraits.png` with `<hero>_portraits_meta.json` (5x5 grid, 25 emotional expressions) used in HUD status cards, dialogue prompts, and Character Studio.
