# Artifacts, Mechanisms & Armory (Items & Relics)

In *Vibrant Castle*, artifacts bridge environmental narrative, interactive physics mechanisms, and an RPG equipment system. Relics carry lore, numerical modifiers, and mechanical utility across the Citadel's interconnected sectors.

---

## 1. Environmental Mechanisms & World Relics

### The Golden Chrono-Lever (`labelGateLever`)

* **Classification**: Kinetic Environmental Switch
* **Visual Form**: A polished brass column topped by an oscillating pendulum escapement and a glowing emerald Aether sphere (`chrono_lever`).
* **Mechanism & Function**:
  * Striking the lever with a melee attack or spell projectile flips the switch and raises the solid gate named by `targetGateId` (`1.2 s` animation on the structure clock, shrinking collision from the bottom).
  * Active lever/gate pairs in `src/data/locations/*.json`: `lever_courtyard_gate` → `courtyard_portcullis`, `lever_ossuary_gate` → `ossuary_portcullis`, `lever_spire_gate` → `spire_portcullis`, `lever_archive_gate` → `library_portcullis`, `lever_bastion_keep` → `bastion_portcullis`, `lever_eclipse_seal` → `eclipse_portcullis`. Restoring lost levers in `thorn_chasm` and `aether_sanctuary` (and the second ward gate in `grand_bastion`) is tracked in [`VC-021`…`VC-025`](../tasks/phase-5-0.4.x.md#vc-021--vc-025--hybrid-maps-courtyard-thorn_chasm-clocktower-aether_sanctuary-grand_bastion).

### Motorized Brass Lifts & Moving Platforms (`labelMovingPlatform`, `labelVerticalLift`)

* **Classification**: Automated Clockwork Transports
* **Mechanism & Function**: Traverse harmonic horizontal or vertical paths and impart platform displacement to standing players (`GamePhysicsEngine.updateEntities`).

### Amber Hazard Spikes (`labelAmberThorns`)

* **Classification**: Crystalline Terrestrial Hazard (`hazard_thorns`)
* **Mechanism & Function**: Deals `20` damage with knockback (`vx = ±6, vy = -5`) unless shielded by `Prismatic Barrier` (`prismatic_shield`) or `Aether Barrier` (`aether_barrier`).

### Lanterns & Light-Casting Decor (`layout.decor`)

* **Classification**: Purely visual light-casting scenery (`hanging_lantern`, `wall_torch`, `war_brazier`, `candelabra`, `aether_crystal_cluster`, etc.). Never collides or blocks movement.

### Aether Portal Gateways

* **Classification**: Dimensional Conduit
* **Mechanism & Function**: Stepping into a portal transitions the party to the target location and entry point defined in `dictionaries.portals`. Portal ability-gating (`isLocked` / `unlockTriggerId`) is planned on the backlog ([`docs/tasks/VISION.md`](../tasks/VISION.md), Phase 6 of [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)).

### The Chrono-Codex JSON (`src/game/logic/save/`)

* **Classification**: Meta-Chronicle Artifact
* **Mechanism & Function**: Serializes game state (coordinates, vitals, inventory, skills, stats, control bindings) to JSON for local storage or file export/import.

---

## 2. Citadel Armory & Equipment (`src/data/items/items.json`)

The equipment screen (`src/game-menu/modal/views/InventoryModalView.tsx`) equips items across **Weapon, Shield, Helmet, Armor, Amulet, Ring, and Quick Belt Potions**. **Backlog**: rebuilding the classical paper-doll inventory UX with stat comparisons and discard confirmations is tracked in [`VC-035`](../tasks/phase-4-0.3.x.md#vc-035--inventory-ux-rebuilt-from-the-baseline) / [`VC-036`](../tasks/phase-5-0.4.x.md#vc-036--inventory-visuals), and a rationalized equipment schema is tracked in [`VC-034`](../tasks/phase-5-0.4.x.md#vc-034--rational-equipment-model).

### Weapons (`weapon`)

| Item ID | NameKey | Rarity | Stats & Effects (`items.json`) | Lore Description |
| :--- | :--- | :---: | :--- | :--- |
| `solar_rapier` | `itemSolarRapierName` | Uncommon | +15 Attack, +10 Max Stamina, Fire DoT (`5` dmg/1s for 3s) | Forged in Bastion foundries; leaves a golden solar trail. |
| `frost_rapier` | `itemFrostRapierName` | Rare | +22 Attack, +20 Max Mana, Frost DoT (`4` dmg/1s for 3s) | Honed from glacial ice and polar Aether. |
| `aether_staff` | `itemAetherStaffName` | Rare | +10 Attack, +40 Max Mana, +0.15 Mana Regen, Aether DoT (`4` dmg/1s for 3s) | Mahogany staff crowned with a humming crystal core. |

### Off-Hand Shields & Grimoires (`shield`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | Lore Description |
| :--- | :--- | :---: | :--- | :--- |
| `brass_buckler` | `itemBrassBucklerName` | Common | +12 Defense, +25 Max HP | Polished brass buckler bearing the dueling guild sunburst. |
| `spell_grimoire` | `itemSpellGrimoireName` | Rare | +5 Defense, +35 Max Mana, +0.20 Mana Regen | Leather-bound tome of geometric diagrams and incantations. |

### Headwear (`helmet`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | Lore Description |
| :--- | :--- | :---: | :--- | :--- |
| `velvet_hat` | `itemVelvetHatName` | Common | +4 Defense, +15 Max Mana | Wide-brimmed midnight velvet hat trimmed with an autumn feather. |
| `knight_helm` | `itemKnightHelmName` | Uncommon | +10 Defense, +20 Max HP | Heavy iron visor offering dependable cranial deflection. |

### Armor & Robes (`armor`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | Lore Description |
| :--- | :--- | :---: | :--- | :--- |
| `crimson_coat` | `itemCrimsonCoatName` | Uncommon | +14 Defense, +30 Max HP, +10 Max Stamina | Tailored aristocratic coat interwoven with gold thread. |
| `scholar_robe` | `itemScholarRobeName` | Rare | +8 Defense, +50 Max Mana, +0.25 Mana Regen | Flowing scholarly vestments imbued with astral resonance. |
| `aether_robe` | `itemAetherRobeName` | Legendary | +8 Defense, +50 Max Mana, +0.25 Mana Regen | Arch-scholar ceremonial vestments woven with pure Aether filaments. |

### Amulets & Rings (`amulet`, `ring`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | Lore Description |
| :--- | :--- | :---: | :--- | :--- |
| `amber_amulet` | `itemAmberAmuletName` | Uncommon | +20 Max HP, +20 Max Mana | Fossilized starlight amber radiating comforting warmth. |
| `aether_pendant` | `itemAetherPendantName` | Legendary | +40 Max Mana, +0.20 Mana Regen | Faceted star-gem vibrating in tune with sanctuary ley lines. |
| `garnet_ring` | `itemGarnetRingName` | Uncommon | +8 Attack | Heavy signet ring mounted with a deep-crimson garnet. |
| `swift_ring` | `itemSwiftRingName` | Rare | +0.5 Move Speed, +20 Max Stamina | Silver band enchanted by mountain breezes. |
| `chrono_ring` | `itemChronoRingName` | Legendary | +0.20 Stamina Regen, +0.10 Mana Regen | Intricate clockwork signet harmonizing recovery rhythms. |

### Alchemy Draughts (`potion`)

| Item ID | NameKey | Rarity | Effect (`items.json`) |
| :--- | :--- | :---: | :--- |
| `potion_health` | `itemPotionHealthName` | Common | Restores +45 HP + HoT (`5`/1s for 5s) |
| `potion_mana` | `itemPotionManaName` | Common | Restores +40 Mana + HoT (`4`/1s for 5s) |
| `potion_elixir` | `itemPotionElixirName` | Legendary | Restores +50 HP, +50 Mana, +50 Stamina + HoT (`8`/1s for 5s) |

---

## 3. The Constellation Grimoire (`src/data/skills/spells.json` & `src/data/progression/skill_trees.json`)

1. **Action Spells**: Equipped into Primary Magic (`magic1`) and Secondary Magic (`magic2`). Projectiles (`solar_flare`, `aether_bolt`, `solar_fireball`, `celestial_comet`, `emerald_barrage`) support horizontal, 45° diagonal, and 90° vertical aim.
2. **Defensive Wards**: `prismatic_shield`, `shield_bash`, `aether_barrier`, `chrono_rewind` protect against hazards and shock.
3. **Autonomous Wisps**: `sun_sentinel` and `sentinel_spark` orbit and strike nearby threats.
4. **Passive Auras**: `blade_infusion`, `stamina_surge`, `vitality_surge`, `mana_font`, `scholarly_focus`, `astral_attunement` (and `unison_supernova_nova` co-op skill).
