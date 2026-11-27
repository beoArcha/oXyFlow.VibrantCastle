# Enemies, Automata & Bestiary (Monsters)

The adversaries populating *Vibrant Castle* range from centuries-old mechanical training apparatuses and patrol automata to crystalline horrors reanimated by wild, destabilized Aether.

**Implementation status**: Today enemies patrol between `patrolMinX` and `patrolMaxX`, hover, or remain stationary (`training_dummy`, `training_target`, `grand_dummy`, `thorn_creeper`). Enemy attacks, contact damage against players, ability execution, and active soul drops are **backlog** (Phase 5 in [`docs/tasks/ROADMAP.md`](../tasks/ROADMAP.md)). Converting enemy stats onto the D20x10 attribute scale is tracked in [`VC-032`](../tasks/task-board.md#vc-032--monsters-on-the-attribute-scale) and balance review in [`VC-080`](../tasks/task-board.md#vc-080--balance-review-after-c4758f3). All stats, soul metadata, and placements below match `src/data/enemies/enemies.json` and `src/data/locations/*.json` (17 templates total).

---

## Complete Castle Bestiary (`src/data/enemies/enemies.json`)

### 1. Straw Training Dummy (`training_dummy`, `training_target`, `grand_dummy`)

* **Category**: `construct` (`isDummy: true`, stationary)
* **Base Stats**:
  * `training_dummy`: HP `60`, Defense `2`, Score `50`, XP `15` (Courtyard)
  * `training_target`: HP `45`, Defense `1`, Score `40`, XP `12` (Courtyard, Clockwork Tower)
  * `grand_dummy`: HP `120`, Defense `5`, Score `100`, XP `30` (Courtyard)
* **Appearance & Role**: Cross-shaped solid oak timber wrapped in woven straw and crowned with a knight's sallet helmet. Interactive combat proving target that flashes on impact and drops no offensive threats.
* **Soul Drop Metadata (Backlog)**: `soul_training_dummy` / `soul_training_target` / `soul_grand_dummy` (`enchant`, rates `0.25` / `0.20` / `0.30`).

### 2. Courtyard Sentinel (`court_sentinel`)

* **Category**: `sentinel` (ground patrol, `speed: 1.6`)
* **Stats**: HP `80`, Defense `8`, Attack Power `20` (data only), Score `160`, XP `50`
* **Locations**: `courtyard` (2), `grand_bastion` (1)
* **Appearance & Planned Behavior**: Humanoid construct of burnished bronze and riveted wrought iron powered by an amber boiler. Designed to patrol flagstone avenues and project `sentinel_aether_beam` (planned).
* **Soul Drop Metadata (Backlog)**: `soul_court_sentinel` (`guardian`, rate `0.15`, `sentinel_aether_beam`).

### 3. Gargoyle Scout (`gargoyle_scout`) & Clockwork Owl Gargoyle (`clockwork_owl_gargoyle`)

* **Category**: `gargoyle` / `clockwork` (`isAerial: true`; share atlas preset `clockwork_owl_gargoyle`)
* **Stats**:
  * `gargoyle_scout`: HP `55`, Defense `3`, Speed `2.9`, Attack Power `14` (data only), Score `120`, XP `36`
  * `clockwork_owl_gargoyle`: HP `75`, Defense `4`, Speed `2.4`, Attack Power `16` (data only), Score `150`, XP `45`
* **Locations**: `gargoyle_scout` in `thorn_chasm` (1), `clocktower` (1); `clockwork_owl_gargoyle` in `courtyard` (1), `clocktower` (2), `aether_sanctuary` (1).
* **Planned Behavior**: Hovering aerial scouts intended to execute `gargoyle_dive` and `owl_wind_gust`.

### 4. Chasm Gargoyle (`chasm_gargoyle`) & Bastion Gargoyle (`bastion_gargoyle`)

* **Category**: `gargoyle` (`isAerial: true`; both use atlas preset `clockwork_owl_gargoyle` in `enemies.json` today)
* **Stats**:
  * `chasm_gargoyle`: HP `70`, Defense `5`, Speed `2.6`, Attack Power `18` (data only), Score `140`, XP `42`
  * `bastion_gargoyle`: HP `105`, Defense `8`, Speed `2.2`, Attack Power `22` (data only), Score `200`, XP `60`
* **Locations**: `chasm_gargoyle` in `thorn_chasm` (2); `bastion_gargoyle` in `grand_bastion` (2), `eclipse_crown` (1).
* **Planned Behavior**: Aggressive aerial predators intended to swoop diagonally (`gargoyle_dive`, `owl_wind_gust`).

### 5. Chasm Crawler (`chasm_crawler`)

* **Category**: `beast` (ground patrol, `speed: 2.5`, dimensions `52 × 38`)
* **Stats**: HP `55`, Defense `3`, Attack Power `15` (data only), Score `110`, XP `32`
* **Locations**: `thorn_chasm` (2), `ashen_catacombs` (1)
* **Appearance & Planned Behavior**: Low-slung multi-legged carapace forged from shale and amber thorns. Intended to ambush along low cavern floors (`chasm_crawler_bite`).

### 6. Clockwork Automaton (`clockwork_automaton`)

* **Category**: `clockwork` (ground patrol, `speed: 1.2`, dimensions `68 × 94`)
* **Stats**: HP `130`, Defense `12`, Attack Power `28` (data only), Score `240`, XP `75`
* **Locations**: `clocktower` (2), `alchemist_library` (1), `grand_bastion` (1)
* **Appearance & Planned Behavior**: Heavy brass behemoth with interlocking gear trains and steam pipes. Intended to perform heavy slams (`automaton_hammer_slam`).

### 7. Aether Sentinel (`aether_sentinel`)

* **Category**: `sentinel` (ground patrol, `speed: 1.8`)
* **Stats**: HP `110`, Defense `9`, Attack Power `24` (data only), Score `220`, XP `68`
* **Locations**: `courtyard` (1), `thorn_chasm` (1), `ashen_catacombs` (1), `alchemist_library` (2), `aether_sanctuary` (2), `eclipse_crown` (1)
* **Appearance & Planned Behavior**: Pale marble torso and armored gauntlets suspended by glowing cyan Aether ribbons. Strongly resists Aether (`0.4` multiplier); intended to project `sentinel_aether_beam`.

### 8. Aether Wisp (`aether_wisp`)

* **Category**: `spirit` (`isAerial: true`, `speed: 2.8`, dimensions `34 × 34`)
* **Stats**: HP `30`, Defense `1`, Attack Power `12` (data only), Score `90`, XP `25`
* **Locations**: `ashen_catacombs` (1), `alchemist_library` (2), `aether_sanctuary` (2)
* **Appearance & Planned Behavior**: Compact orb of condensed starlight surrounded by orbiting crystal shards.

### 9. Aether Archon (`aether_archon`)

* **Category**: `boss` (`isAerial: true`, `speed: 2.0`, dimensions `74 × 102`)
* **Stats**: HP `220`, Defense `12`, Attack Power `36` (data only), Score `500`, XP `150`
* **Locations**: `aether_sanctuary` (1), `eclipse_crown` (1)
* **Appearance & Planned Behavior**: Towering celestial commander encircled by carved runestones. Intended boss encounter (`aether_archon_wrath`, `sentinel_aether_beam`); boss defeat gating is planned.

### 10. Shadow Knight (`shadow_knight`)

* **Category**: `elite` (ground patrol, `speed: 2.2`, dimensions `62 × 90`)
* **Stats**: HP `160`, Defense `10`, Attack Power `32` (data only), Score `320`, XP `110`
* **Locations**: `ashen_catacombs` (1), `alchemist_library` (1), `grand_bastion` (1), `eclipse_crown` (1)
* **Appearance & Planned Behavior**: Ethereal phantom duelist clad in crimson-and-dark-matter armor. Intended to mirror duelist dashes and slashes (`shadow_knight_slash`).

### 11. Bastion Sentinel Commander (`bastion_sentinel_boss`)

* **Category**: `boss` (ground patrol, `speed: 1.5`, dimensions `84 × 112`)
* **Stats**: HP `280`, Defense `15`, Attack Power `38` (data only), Score `650`, XP `200`
* **Locations**: `grand_bastion` (1), `eclipse_crown` (1)
* **Planned Behavior**: Heavy elite boss variant (`automaton_hammer_slam`, `sentinel_aether_beam`).

### 12. Gear Mite (`gear_mite`)

* **Category**: `clockwork` (ground patrol, `speed: 3.1`, dimensions `36 × 28`)
* **Stats**: HP `35`, Defense `2`, Attack Power `10` (data only), Score `75`, XP `20`
* **Locations**: `courtyard` (2), `thorn_chasm` (1), `ashen_catacombs` (1), `clocktower` (1)

### 13. Thorn Creeper (`thorn_creeper`)

* **Category**: `flora` (stationary, `speed: 0`, dimensions `48 × 56`)
* **Stats**: HP `65`, Defense `4`, Attack Power `16` (data only), Score `115`, XP `34`
* **Locations**: `thorn_chasm` (1)

### 14. Lantern Warden (`lantern_warden`)

* **Category**: `clockwork` (`isAerial: true`, `speed: 1.4`, dimensions `44 × 58`)
* **Stats**: HP `70`, Defense `4`, Attack Power `17` (data only), Score `135`, XP `40`
* **Locations**: `ashen_catacombs` (1), `alchemist_library` (1), `aether_sanctuary` (1), `eclipse_crown` (1)

### 15. Chrono Hound (`chrono_hound`)

* **Category**: `clockwork` (ground patrol, `speed: 3.4`, dimensions `58 × 42`)
* **Stats**: HP `85`, Defense `5`, Attack Power `22` (data only), Score `180`, XP `55`
* **Locations**: `ashen_catacombs` (1), `clocktower` (1), `grand_bastion` (1), `eclipse_crown` (1)

---

## Elemental Damage Multipliers (`elementalResistances`)

In `src/data/enemies/enemies.json`, `elementalResistances` are stored as **damage multipliers**: values **above `1.0`** indicate vulnerability (extra damage taken), while values **below `1.0`** indicate resistance.

| Enemy | Vulnerable To (`> 1.0`) | Resists (`< 1.0`) |
| :--- | :--- | :--- |
| `training_dummy` / `training_target` / `grand_dummy` | Fire (`1.25` / `1.20` / `1.15`) | `grand_dummy`: Physical (`0.90`) |
| `clockwork_owl_gargoyle` | Lightning (`1.40`), Frost (`1.10`) | Physical (`0.90`) |
| `court_sentinel` | Fire (`1.20`) | Aether (`0.70`), Physical (`0.85`) |
| `chasm_gargoyle` | Holy (`1.35`) | Shadow (`0.60`), Physical (`0.90`) |
| `clockwork_automaton` | Lightning (`1.50`) | Physical (`0.75`), Fire (`0.90`) |
| `aether_sentinel` | Fire (`1.35`) | Aether (`0.40`) |
| `aether_archon` | Shadow (`1.35`), Fire (`1.15`) | Aether (`0.30`), Astral (`0.50`) |
| `shadow_knight` | Holy (`1.50`), Fire (`1.20`) | Shadow (`0.30`) |
| `aether_wisp` | Physical (`1.25`) | Aether (`0.50`) |
| `chasm_crawler` | Fire (`1.40`), Frost (`1.20`) | Shadow (`0.80`) |
| `gargoyle_scout` | Holy (`1.30`) | — |
| `bastion_gargoyle` | Holy (`1.30`), Lightning (`1.20`) | Physical (`0.80`) |
| `bastion_sentinel_boss` | Lightning (`1.40`), Fire (`1.15`) | Physical (`0.75`) |
| `gear_mite` | Lightning (`1.50`) | — |
| `thorn_creeper` | Fire (`1.60`), Frost (`1.20`) | Physical (`0.90`) |
| `lantern_warden` | Frost (`1.40`), Shadow (`1.20`) | Fire (`0.50`) |
| `chrono_hound` | Lightning (`1.35`) | Chrono (`0.50`) |

---

## Bestiary Summary Table

| ID | Default Name | Role | HP | Def | Speed | Score | XP |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `training_dummy` | Training Dummy | Static Target | 60 | 2 | 0 | 50 | 15 |
| `training_target` | Training Target | Static Target | 45 | 1 | 0 | 40 | 12 |
| `grand_dummy` | Grand Training Dummy | Static Target | 120 | 5 | 0 | 100 | 30 |
| `gear_mite` | Gear Mite | Ground Patrol | 35 | 2 | 3.1 | 75 | 20 |
| `aether_wisp` | Aether Wisp | Aerial Spirit | 30 | 1 | 2.8 | 90 | 25 |
| `chasm_crawler` | Chasm Crawler | Ground Beast | 55 | 3 | 2.5 | 110 | 32 |
| `thorn_creeper` | Thorn Creeper | Static Flora | 65 | 4 | 0 | 115 | 34 |
| `gargoyle_scout` | Gargoyle Scout | Aerial Light | 55 | 3 | 2.9 | 120 | 36 |
| `lantern_warden` | Lantern Warden | Aerial Sentry | 70 | 4 | 1.4 | 135 | 40 |
| `chasm_gargoyle` | Chasm Gargoyle | Aerial Predator | 70 | 5 | 2.6 | 140 | 42 |
| `clockwork_owl_gargoyle` | Clockwork Owl Gargoyle | Aerial Clockwork | 75 | 4 | 2.4 | 150 | 45 |
| `court_sentinel` | Courtyard Sentinel | Ground Sentinel | 80 | 8 | 1.6 | 160 | 50 |
| `chrono_hound` | Chrono Hound | Fast Ground | 85 | 5 | 3.4 | 180 | 55 |
| `bastion_gargoyle` | Bastion Gargoyle | Aerial Heavy | 105 | 8 | 2.2 | 200 | 60 |
| `aether_sentinel` | Aether Sentinel | Ground Sentinel | 110 | 9 | 1.8 | 220 | 68 |
| `clockwork_automaton` | Clockwork Automaton | Heavy Clockwork | 130 | 12 | 1.2 | 240 | 75 |
| `shadow_knight` | Shadow Knight | Elite Duelist | 160 | 10 | 2.2 | 320 | 110 |
| `aether_archon` | Aether Archon | Aerial Boss | 220 | 12 | 2.0 | 500 | 150 |
| `bastion_sentinel_boss` | Bastion Sentinel Commander | Ground Boss | 280 | 15 | 1.5 | 650 | 200 |
