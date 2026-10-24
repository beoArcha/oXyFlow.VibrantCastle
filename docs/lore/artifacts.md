# Artifacts, Mechanisms & Armory (Items & Relics)

In *Vibrant Castle*, artifacts bridge the boundary between environmental narrative, interactive physics mechanisms, and a classical Baldur's Gate II-inspired RPG equipment system. Every relic possesses tangible lore, numerical attributes, and mechanical utility within the castle’s interconnected sectors.

---

## 1. Environmental Mechanisms & World Relics

### The Golden Chrono-Lever (`labelGateLever`)

* **Classification**: Kinetic Environmental Switch
* **Visual Form**: A polished brass column topped by an oscillating pendulum escapement and a glowing emerald Aether sphere.
* **Mechanism & Function**:
  * In its default locked state, the lever arm is tilted to the left, glowing warning amber/red while maintaining tension on heavy counterweights.
  * Striking the lever with a rapier thrust or spell projectile overcomes mechanical friction with a crisp metallic chime and steam hiss.
  * The switch flips right, illuminating an emerald signal lamp and permanently raising the associated iron portcullis (`gate_1`) into the ceiling vault.

### The Main Sluice Lever & Grand Portcullis (`labelMainSluiceLever`, `labelGrandPortcullis`)

* **Classification**: Master Sector Lock & Pneumatic Gate
* **Visual Form**: A massive gilded lever situated atop the battlements of the Grand Bastion, connected to thick iron chains leading into the clocktower substructure.
* **Mechanism & Function**:
  * Unlocks the three-tiered, impenetrable iron portcullis barring access to the victory dais.
  * Requires a decisive physical or magical strike to trip the pneumatic safety release, releasing grinding gear chimes across the entire sector.

### Motorized Brass Lifts & Moving Platforms (`labelMovingPlatform`, `labelVerticalLift`)

* **Classification**: Automated Clockwork Transports
* **Visual Form**: Ribbed brass platforms suspended by heavy braided steel cables and meshed with oversized wall gears.
* **Mechanism & Function**:
  * Traverse smooth horizontal and vertical harmonic courses across deep abysses.
  * Imparts inherited platform velocity (`platformVelocityX`, `platformVelocityY`) to players standing on their surface, rewarding well-timed leaps.

### Amber Hazard Spikes (`labelAmberThorns`)

* **Classification**: Crystalline Terrestrial Hazard
* **Visual Form**: Dense clusters of needle-sharp orange-amber crystals protruding from deep chasms and pit bottoms.
* **Mechanism & Function**:
  * Formed from concentrated, unrefined terrestrial Aether. Contact instantly depletes HP or triggers hazard respawn unless shielded by the `Prismatic Barrier` or `Aether Barrier`.

### Aether Portal Gateways (`portalMastery`, `labelSanctuaryGateway`)

* **Classification**: Dimensional Conduit / Victory Sanctuary
* **Visual Form**: An ancient circular megalith ring inscribed with celestial runes, framing a swirling event horizon of cerulean, violet, and gold flames.
* **Mechanism & Function**:
  * Continuously emits stellar particles and gravity-defying motes.
  * Stepping into the gateway registers sector mastery, tallies total performance score, and transitions the party seamlessly to the next location or loops the circuit.

### The Chrono-Codex JSON (`save.ts`)

* **Classification**: Meta-Chronicle Artifact
* **Visual Form**: A leather-bound grimoire secured with brass clasp chronometers and guarded by Pip the Chrono-Cat.
* **Mechanism & Function**:
  * Serializes the complete game state (player coordinates, current HP/Mana/Stamina pools, inventory slots, unlocked skill nodes, portcullis positions, score, and control bindings) into a structured `.json` data file.
  * Allows instantaneous loading and cryptographic structural schema validation, preserving journey progression across sessions.

---

## 2. Citadel Armory & Equipment (Baldur's Gate II System)

The equipment interface (`inventory.ts`) equips items across classical silhouette slots: **Main Hand, Off-Hand, Head, Armor, Neck, Ring, and Quick Belt (3 Potion Slots)**.

### Weapons (Main Hand)

| Item ID | Item Name | Rarity | Stats & Enchantments | Lore & Visual Description |
| :--- | :--- | :---: | :--- | :--- |
| `solar_rapier` | **Aristocrat's Solar Rapier** | Uncommon | +15 Attack, +10 Max Stamina | Forged in Bastion foundries. The blade leaves a radiant trail of warm golden light with every thrust. |
| `frost_rapier` | **Northern Frost Rapier** | Rare | +22 Attack, +20 Max Mana | A crystalline rapier honed from glacial ice and polar Aether. Emanates a pale azure mist and chills air on impact. |
| `aether_staff` | **Aether Scholar's Staff** | Rare | +10 Attack, +40 Max Mana, +15% Mana Regen | Polished mahogany staff crowned with a humming amber crystal core that harmonizes with celestial incantations. |

### Off-Hand, Shields & Grimoires

| Item ID | Item Name | Rarity | Stats & Enchantments | Lore & Visual Description |
| :--- | :--- | :---: | :--- | :--- |
| `brass_buckler` | **Crested Brass Buckler** | Common | +12 Defense, +25 Max HP | Sturdy 19th-century polished brass shield bearing the sunburst crest of the castle dueling guild. |
| `spell_grimoire` | **Ancient Spell Grimoire** | Rare | +5 Defense, +35 Max Mana, +20% Mana Regen | A heavy leather-bound tome filled with handwritten geometric diagrams and stellar incantations. |

### Headwear & Helmets

| Item ID | Item Name | Rarity | Stats & Enchantments | Lore & Visual Description |
| :--- | :--- | :---: | :--- | :--- |
| `velvet_hat` | **Traveler's Feathered Velvet Hat** | Common | +4 Defense, +15 Max Mana | A fashionable wide-brimmed hat tailored from midnight velvet, trimmed with an autumn hawk feather. |
| `knight_helm` | **Tower Sentinel's Iron Helm** | Uncommon | +10 Defense, +20 Max HP | A heavy, solid iron visor offering dependable cranial deflection against diving gargoyles and falling debris. |

### Armor & Greatcoats

| Item ID | Item Name | Rarity | Stats & Enchantments | Lore & Visual Description |
| :--- | :--- | :---: | :--- | :--- |
| `crimson_coat` | **High-Collared Crimson Greatcoat** | Rare | +18 Defense, +40 Max HP, +10% Stamina Regen | Tailored aristocratic longcoat interwoven with fine gold thread and enchanted leather lining. |
| `scholar_robe` | **Academy Scholar's Robe** | Uncommon | +8 Defense, +50 Max Mana, +25% Mana Regen | Flowing scholarly vestments imbued with astral resonance, facilitating rapid incantation cycling. |

### Jewelry, Amulets & Chrono-Rings

| Item ID | Item Name | Rarity | Stats & Enchantments | Lore & Visual Description |
| :--- | :--- | :---: | :--- | :--- |
| `amber_amulet` | **Sunlit Amber Amulet** | Uncommon | +5 Attack, +5 Defense, +15 Max HP | An organic amber drop containing a fossilized starlight ember, radiating comforting warmth. |
| `aether_pendant` | **Aetheric Starlight Pendant** | Rare | +40 Max Mana, +20% Mana Regen | A faceted star-gem suspended on a platinum chain, vibrating in tune with floating sanctuary ley lines. |
| `garnet_ring` | **Garnet Battle Ring** | Common | +8 Attack | A heavy signet ring carved with dueling motifs and mounted with an unyielding deep-crimson gemstone. |
| `swift_ring` | **Zephyr Swiftness Ring** | Uncommon | +0.5 Move Speed, +20 Max Stamina | An aerodynamic silver band enchanted by mountain breezes, reducing physical sprint fatigue. |

### Alchemy Draughts & Quick Belt Consumables

| Item ID | Item Name | Rarity | Immediate Effect | Description & Formulation |
| :--- | :--- | :---: | :--- | :--- |
| `potion_health` | **Crimson Vitality Draught** | Common | Restores +45 HP | Thick, ruby-red herbal distillation that knits flesh and mends armor integrity. |
| `potion_mana` | **Cerulean Mana Draught** | Common | Restores +40 Mana | Luminescent sapphire liquid sparkling with suspended micro-crystals of pure Aether. |
| `potion_elixir` | **Supreme Elixir** | Rare | Restores +50 HP, +50 Mana, +50 Stamina | The royal panacea of the Bastion grandmasters, instantly invigorating mind, body, and spirit. |

---

## 3. The Constellation Grimoire (Magic Relic System)

Inscribed within the citadel's celestial observatory, the **Constellation Grimoire** (`skills.ts`) categorizes arcane knowledge into three tiers across **Offensive, Defensive, and Passive** disciplines:

1. **Action Spells (Cast on Command)**:
   * *Equippable Slots*: Primary Magic (`[U]` on 1P / `[Numpad 4]` on 2P) and Secondary Magic (`[I]` on 1P / `[Numpad 5]` on 2P).
   * Projectiles (`Solar Flare`, `Aether Bolt`, `Solar Fireball`, `Celestial Comet`) adjust trajectory dynamically according to character aim angles (horizontal, 45° elevated, or 90° vertical).
2. **Defensive Wards (Instant Aegis)**:
   * Spells like `Prismatic Barrier`, `Solar Shield Bash`, and `Aether Barrier` create temporary aura shields absorbing 100% of damage from physical strikes and environmental spike pits.
3. **Autonomous Wisps & Familiars (Automatic Trigger)**:
   * Spells such as `Sentinel Spark` and `Solar Sentinel` manifest autonomous spirit entities that periodically acquire and strike hostile targets without player input.
4. **Passive Auras**:
   * Nodes such as `Blade Infusion`, `Boundless Vigor`, and `Mana Wellspring` permanently enhance physical attack, stamina regeneration, and maximum mana capacity.
