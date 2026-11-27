# Artifacts, Zone Mechanisms & Armory

In *Vibrant Castle*, interactive mechanisms, field equipment, and spells bridge the **2034 techno-magical Zone** with RPG progression. Many relics blend practical 2034 hardware, historic French château museum pieces, and rift-charged anomalies reshaped by the demon's medieval lens.

*(Note: "Aether" in item/spell names and descriptions below reflects the **[PROVISIONAL]** working term used in current `src/data/` until final naming confirmation.)*

---

## 1. Zone Mechanisms & World Elements

### Lever Switches (`chrono_lever`, `labelGateLever`)

* **Classification:** Kinetic Lock Override
* **2034 → Demon Form:** Industrial gate relays and château counterweight mechanisms warped by the demon into polished brass columns topped with oscillating pendulums and glowing emerald cores.
* **Function:** Striking the lever with melee or magic activates it and raises the linked portcullis (`targetGateId`) over `1.2 s`, shrinking collision from the bottom:
  * Active pairs in `src/data/locations/*.json`: `lever_courtyard_gate` → `courtyard_portcullis`, `lever_ossuary_gate` → `ossuary_portcullis`, `lever_spire_gate` → `spire_portcullis`, `lever_archive_gate` → `library_portcullis`, `lever_bastion_keep` → `bastion_portcullis`, `lever_eclipse_seal` → `eclipse_portcullis`.
  * Missing pairs in `thorn_chasm`, `aether_sanctuary`, and the second ward gate in `grand_bastion` are tracked in `VC-022`, `VC-024`, and `VC-025`.

### Lifts & Moving Platforms (`moving_platform`, `vertical_lift`)

* **Classification:** Automated Transports
* **2034 → Demon Form:** Factory gantry trolleys, quarry ferries, and hydraulic freight lifts (`clocktower`, `alchemist_library`) operating along harmonic paths even after power grids severed.

### Amber Thorns & Rift Hazards (`hazard_thorns`)

* **Classification:** Crystalline / Thermal Hazard
* **Function:** Inflicts hazard damage with knockback unless bypassed via `Prismatic Barrier` (`prismatic_shield`) or `Aether Barrier` (`aether_barrier`). Variants appear as rift-crystallized briars (`amber_thorns`), boiler fissures (`ember_pit`), and containment gaps (`aether_void`).

### Decor Props (`layout.decor`)

* **Classification:** Purely visual light-casting scenery (`hanging_lantern`, `wall_torch`, `war_brazier`, `candelabra`, `aether_crystal_cluster`, etc.). Never collides or blocks movement.

### Spatial Threshold Portals

* **Classification:** Rift Conduits
* **Function:** Non-local spatial folds connecting the Zone's 8 worlds in a linked circuit (and looping `eclipse_crown` back to `courtyard`). Ability-gated portals (`isLocked` / `unlockTriggerId`) are Phase 6 backlog (`docs/tasks/ROADMAP.md`).

### Save File Codex (`src/game/logic/save/`)

* **Classification:** Chronometric State Snapshot
* **Function:** Serializes position, vitals, inventory, skills, stats, and bindings to browser `LocalStorage` or downloadable `.JSON`.

---

## 2. Zone Armory (`src/data/items/items.json` — 18 Items)

Equipment occupies **Weapon, Shield, Helmet, Armor, Amulet, Ring, and Quick Belt Potions**. Paper-doll UX (`VC-035`) and the rationalized attribute-linked equipment model (`VC-034`) are tracked on the roadmap.

### Weapons (`weapon`)

| Item ID | NameKey | Rarity | Stats & Effects (`items.json`) | 2034 Zone Framing |
| :--- | :--- | :---: | :--- | :--- |
| `solar_rapier` | `itemSolarRapierName` | Uncommon | +15 ATK, +10 Max Stamina, Fire DoT (`5` dmg/1s for 3s) | Precision steel fencing rapier modified with a thermal-photonic emitter edge. |
| `frost_rapier` | `itemFrostRapierName` | Rare | +22 ATK, +20 Max Mana, Frost DoT (`4` dmg/1s for 3s) | Cryo-resonance fencing blade bleeding sharp azure chill from rift exposure. |
| `aether_staff` | `itemAetherStaffName` | Rare | +10 ATK, +40 Max Mana, +0.15 Mana Regen, Aether DoT (`4` dmg/1s for 3s) | Carved mahogany conduit fitted with an oscillating amber focus core (Aurelia's signature casting focus, **N2**). |

### Off-Hand Shields & Grimoires (`shield`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | 2034 Zone Framing |
| :--- | :--- | :---: | :--- | :--- |
| `brass_buckler` | `itemBrassBucklerName` | Common | +12 DEF, +25 Max HP | Restored 19th-century brass exhibition buckler from the French château armory. |
| `spell_grimoire` | `itemSpellGrimoireName` | Rare | +5 DEF, +35 Max Mana, +0.20 Mana Regen | Field binder of geometric equations and somatic notations compiled in 2034 magical science. |

### Headwear (`helmet`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | 2034 Zone Framing |
| :--- | :--- | :---: | :--- | :--- |
| `velvet_hat` | `itemVelvetHatName` | Common | +4 DEF, +15 Max Mana | Wide-brimmed velvet field hat preserved from the château's period wardrobe. |
| `knight_helm` | `itemKnightHelmName` | Uncommon | +10 DEF, +20 Max HP | Heavy tempered visor pulled from museum racks—or dropped by an armored sentinel. |

### Armor & Coats (`armor`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | 2034 Zone Framing |
| :--- | :--- | :---: | :--- | :--- |
| `crimson_coat` | `itemCrimsonCoatName` | Uncommon | +14 DEF, +30 Max HP, +10 Max Stamina | Tailored high-collared travel coat reinforced for field exploration. |
| `scholar_robe` | `itemScholarRobeName` | Rare | +8 DEF, +50 Max Mana, +0.25 Mana Regen | Layered researcher's vestments lined with conductive arcane thread. |
| `aether_robe` | `itemAetherRobeName` | Legendary | +8 DEF, +50 Max Mana, +0.25 Mana Regen | Ceremonial lab-weave silk imbued with stabilized rift filaments. |

### Amulets & Rings (`amulet`, `ring`)

| Item ID | NameKey | Rarity | Stats (`items.json`) | 2034 Zone Framing |
| :--- | :--- | :---: | :--- | :--- |
| `amber_amulet` | `itemAmberAmuletName` | Uncommon | +20 Max HP, +20 Max Mana | Fossilized resin pendant warmed by stable autumn-rift energy. |
| `aether_pendant` | `itemAetherPendantName` | Legendary | +40 Max Mana, +0.20 Mana Regen | Faceted resonance crystal tuned to the Zone's spatial ley lines. |
| `garnet_ring` | `itemGarnetRingName` | Uncommon | +8 ATK | Heavy heirloom signet set with deep-crimson garnet. |
| `swift_ring` | `itemSwiftRingName` | Rare | +0.5 Move Speed, +20 Max Stamina | Lightweight silver band altering local inertia slightly during dashes. |
| `chrono_ring` | `itemChronoRingName` | Legendary | +0.20 Stamina Regen, +0.10 Mana Regen | Micro-escapement signet synchronizing personal stamina and recovery against time drift. |

### Field Tonics (`potion`)

| Item ID | NameKey | Rarity | Effect (`items.json`) |
| :--- | :--- | :---: | :--- |
| `potion_health` | `itemPotionHealthName` | Common | Restores +45 HP + HoT (`5`/1s for 5s) |
| `potion_mana` | `itemPotionManaName` | Common | Restores +40 Mana + HoT (`4`/1s for 5s) |
| `potion_elixir` | `itemPotionElixirName` | Legendary | Restores +50 HP, +50 Mana, +50 Stamina + HoT (`8`/1s for 5s) |

---

## 3. Constellation Grimoire (`src/data/skills/spells.json` & `skill_trees.json`)

Within 2034 magical science, repeatable spells are mapped as geometric "constellation" trees across two pairs of disciplines (Valen: *Solar Duelist*, *Sun Warden*; Aurelia: *Astral Sorcery*, *Time Weaver*):

1. **Action Spells (`magic1` / `magic2`):** `solar_flare`, `solar_fireball`, `radiant_strike`, `aether_bolt`, `frost_nova`, `emerald_barrage`, `celestial_comet` (supporting horizontal, 45° diagonal, and 90° vertical aim).
2. **Defensive Wards:** `shield_bash`, `prismatic_shield`, `aether_barrier`, `chrono_rewind`.
3. **Autonomous Orbiters:** `sun_sentinel`, `sentinel_spark`.
4. **Passive Resonances & Co-Op Unison:** `blade_infusion`, `stamina_surge`, `vitality_surge`, `mana_font`, `scholarly_focus`, `astral_attunement`, and `unison_supernova_nova`.
