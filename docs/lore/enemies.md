# Enemies, Factions & Bestiary Origins

In *Vibrant Castle*, adversaries inside the 2034 Zone span **demons, devils, constructs, and *Ghost in the Shell*-style cyborgs**, alongside rift-mutated life and echoes. Every defeated threat yields a crystallized **Soul** (*Aria of Sorrow* pillar) that can be studied and channeled through emerging magical science.

**Implementation status:** `src/data/enemies/enemies.json` defines **19 templates** (3 stationary targets + 16 combat templates; **60 total placed instances** across Map 1 of the 8 worlds). Today enemies patrol, hover, or hold position and can be defeated; active enemy attacks, player contact damage, and soul drops are Phase 5 backlog (`docs/tasks/ROADMAP.md`). Scaling onto the D20×10 attribute system is tracked in `VC-032`.

---

## 1. Zone Factions & 2034 Origins

1. **The Summoned Demon & Its Hosts (Demons & Devils):**
   * Entities pulled through the 2028 rift or animated directly by infernal possession. They treat the Zone as a feudal castle domain, occupying gargoyle stonework (*Chasm Gargoyle*, *Gargoyle Scout*, *Bastion Gargoyle*), forging spectral duelists (*Shadow Knight*), and rallying under the Zone's sovereign force at the Eclipse Crown.
   * **Confirmed Final Boss:** **The Possessed** (*Opętany*)—the unprepared 2028 ritual leader bound to the demon at the Throne of the Eclipse (`W8-8`).
2. **Demon-Reinterpreted Constructs (Modern Machinery & Château Hardware):**
   * Industrial robotics, autonomous factory loaders, inspection drones, maintenance bots, tunnel hounds, and château fencing dummies caught in the cataclysm. Because the demon did not grasp silicon or hydraulics, it reshaped servos and optical sensors into brass clockwork, pendulums, and animated timber (*Clockwork Automaton*, *Clockwork Owl Gargoyle*, *Gear Mite*, *Lantern Warden*, *Chrono Hound*, *Training Dummy* variants).
3. **Cyborgs & Armored Sentinels (*Ghost in the Shell*-Style Units):**
   * Augmented tactical guards, security exoskeletons, and neural-interface chassis stationed around the 2028 facilities (or drawn into the containment perimeter) and repurposed inside the Zone. To the demon's eyes they read as bronze knights and iron commanders (*Courtyard Sentinel*, *Aether Sentinel*, *Bastion Sentinel Commander*, and the cyber-arcane *Aether Archon*). Future phases expand cyborg/tactical variety directly.
4. **Rift Fauna & Energy Echoes:**
   * Local cavern creatures, conservatory plants, and stray laboratory energy warped into hostile flora/fauna (*Chasm Crawler*, *Thorn Creeper*) and drifting wisps (*Aether Wisp*).
5. **External Interested Parties (World Context — Zone Entry [OPEN]):**
   * Beyond the state-defended buffer zone (stretching from Utah to Switzerland), **states, religions, terrorist and criminal organizations, new mages, and otherworldly beings** watch the rift, while outsiders arrive seeking the **philosopher's stone, wealth, a panacea, or adventure**. Whether outside human factions cross into the Zone as active enemies or NPCs during gameplay remains **[OPEN]**.

---

## 2. Shipped Enemy Roster (`src/data/enemies/enemies.json` — 19 Templates)

*(Note on **N10**: Canonical PL names below come from `docs/lore/README.md` and resolve discrepancies between `src/i18n/modules/locations.ts` and `docs/wiki/pl/bestiary.md`.)*

### Training Targets (`isDummy: true`, Stationary)

* **`training_dummy` (Training Dummy / *Słomiany Manekin*):** HP `60`, DEF `2`, Score `50`, XP `15` · `courtyard` (1). Heritage château fencing dummy; `soul_training_dummy` (`enchant`, rate `0.25`).
* **`training_target` (Training Target / *Cel Treningowy*):** HP `45`, DEF `1`, Score `40`, XP `12` · `courtyard` (1), `clocktower` (1). Optical range & yard calibration target; `soul_training_target` (`enchant`, rate `0.20`).
* **`grand_dummy` (Grand Training Dummy / *Wielki Manekin*):** HP `120`, DEF `5`, Score `100`, XP `30` · `courtyard` (1). Reinforced master-at-arms dummy atop the château tower vault; `soul_grand_dummy` (`enchant`, rate `0.30`).

### Reinterpreted Constructs & Robotics

* **`gear_mite` (Gear Mite / *Trybik*):** `clockwork` · HP `35`, DEF `2`, ATK `10`, Speed `3.1`, Score `75`, XP `20` · `courtyard` (2), `thorn_chasm` (1), `ashen_catacombs` (1), `clocktower` (1). Micro-repair drone turned brass cog-beetle; `soul_gear_mite` (`bullet`, `0.20`).
* **`lantern_warden` (Lantern Warden / *Latarniowy Stróż*):** `clockwork` (`isAerial`) · HP `70`, DEF `4`, ATK `17`, Speed `1.4`, Score `135`, XP `40` · `ashen_catacombs` (1), `alchemist_library` (1), `aether_sanctuary` (1), `eclipse_crown` (1). Autonomous patrol lamp turned floating brass beacon; `soul_lantern_warden` (`guardian`, `0.18`).
* **`clockwork_owl_gargoyle` (Clockwork Owl Gargoyle / *Zegarowa Sowa-Gargulec*):** `clockwork` (`isAerial`) · HP `75`, DEF `4`, ATK `16`, Speed `2.4`, Score `150`, XP `45` · `courtyard` (1), `clocktower` (2), `aether_sanctuary` (1). Plant surveillance drone reimagined as a nocturnal brass owl; `soul_clockwork_owl` (`bullet`, `0.18`).
* **`chrono_hound` (Chrono Hound / *Chrono-Ogar*):** `clockwork` · HP `85`, DEF `5`, ATK `22`, Speed `3.4`, Score `180`, XP `55` · `ashen_catacombs` (1), `clocktower` (1), `grand_bastion` (1), `eclipse_crown` (1). High-speed quadruped security robot caught in local time acceleration; `soul_chrono_hound` (`bullet`, `0.16`).
* **`clockwork_automaton` (Clockwork Automaton / *Zegarowy Automat*):** `clockwork` · HP `130`, DEF `12`, ATK `28`, Speed `1.2`, Score `240`, XP `75` · `clocktower` (2), `alchemist_library` (1), `grand_bastion` (1). Heavy robotic factory loader recast as a steam-and-gear colossus; `soul_clockwork_automaton` (`enchant`, `0.14`).

### Cyborgs, Sentinels & Tactical Shells

* **`court_sentinel` (Courtyard Sentinel / *Strażnik Dziedzińca*):** `sentinel` · HP `80`, DEF `8`, ATK `20`, Speed `1.6`, Score `160`, XP `50` · `courtyard` (2), `grand_bastion` (1). Augmented security chassis/armor fused with château plate; `soul_court_sentinel` (`guardian`, `0.15`).
* **`aether_sentinel` (Aether Sentinel / *Strażnik Aetheru*):** `sentinel` · HP `110`, DEF `9`, ATK `24`, Speed `1.8`, Score `220`, XP `68` · `courtyard` (1), `thorn_chasm` (1), `ashen_catacombs` (1), `alchemist_library` (2), `aether_sanctuary` (2), `eclipse_crown` (1). High-tier cybernetic containment unit channeling raw rift beams; `soul_aether_sentinel` (`guardian`, `0.14`).
* **`bastion_sentinel_boss` (Bastion Sentinel Commander / *Komendant Straży Bastionu*):** `boss` · HP `280`, DEF `15`, ATK `38`, Speed `1.5`, Score `650`, XP `200` · `grand_bastion` (1), `eclipse_crown` (1). Heavy cyborg/exoskeleton commander enforcing the Sunlit Bastion perimeter and Crown approach; `soul_bastion_sentinel_boss` (`guardian`, `0.40`).
* **`aether_archon` (Aether Archon / *Archont Aetheru*):** `boss` (`isAerial`) · HP `220`, DEF `12`, ATK `36`, Speed `2.0`, Score `500`, XP `150` · `aether_sanctuary` (1), `eclipse_crown` (1). Elevated telemetry/neural command frame bound with celestial rift power; `soul_aether_archon` (`bullet`, `0.35`).

### Demons, Devils, Rift Fauna & Echoes

* **`chasm_crawler` (Chasm Crawler / *Pełzacz Rozpadliny*):** `beast` · HP `55`, DEF `3`, ATK `15`, Speed `2.5`, Score `110`, XP `32` · `thorn_chasm` (2), `ashen_catacombs` (1). Mutated trench arthropod lurking under rock ledges; `soul_chasm_crawler` (`bullet`, `0.16`).
* **`thorn_creeper` (Thorn Creeper / *Cierniowy Pędnik*):** `flora` (stationary) · HP `65`, DEF `4`, ATK `16`, Score `115`, XP `34` · `thorn_chasm` (1). Rift-warped conservatory briar firing amber spines; `soul_thorn_creeper` (`bullet`, `0.18`).
* **`aether_wisp` (Aether Wisp / *Iskra Aetheru*):** `spirit` (`isAerial`) · HP `30`, DEF `1`, ATK `12`, Speed `2.8`, Score `90`, XP `25` · `ashen_catacombs` (1), `alchemist_library` (2), `aether_sanctuary` (2). Condensed ambient mana and lingering rift echo; `soul_aether_wisp` (`enchant`, `0.22`).
* **`gargoyle_scout` (Gargoyle Scout / *Zwiadowca Gargulców*):** `gargoyle` (`isAerial`) · HP `55`, DEF `3`, ATK `14`, Speed `2.9`, Score `120`, XP `36` · `thorn_chasm` (1), `clocktower` (1). Fast winged sentinel scanning high approaches; `soul_gargoyle_scout` (`enchant`, `0.18`).
* **`chasm_gargoyle` (Chasm Gargoyle / *Gargulec z Rozpadliny*):** `gargoyle` (`isAerial`) · HP `70`, DEF `5`, ATK `18`, Speed `2.6`, Score `140`, XP `42` · `thorn_chasm` (2). Stone sculpture animated by lesser infernal hosts; `soul_chasm_gargoyle` (`bullet`, `0.15`).
* **`bastion_gargoyle` (Bastion Gargoyle / *Gargulec Bastionu*):** `gargoyle` (`isAerial`) · HP `105`, DEF `8`, ATK `22`, Speed `2.2`, Score `200`, XP `60` · `grand_bastion` (2), `eclipse_crown` (1). Iron-reinforced gargoyle host guarding upper ramparts; `soul_bastion_gargoyle` (`guardian`, `0.15`).
* **`shadow_knight` (Shadow Knight / *Rycerz Cienia*):** `elite` · HP `160`, DEF `10`, ATK `32`, Speed `2.2`, Score `320`, XP `110` · `ashen_catacombs` (1), `alchemist_library` (1), `grand_bastion` (1), `eclipse_crown` (1). Elite infernal duelist / void-armored echo mirroring fast blade dashes; `soul_shadow_knight` (`enchant`, `0.20`).

---

## 3. Elemental Damage Multipliers (`elementalResistances`)

Values **above `1.0`** mark vulnerabilities (extra damage taken); values **below `1.0`** mark resistances.

| Enemy ID | Vulnerable To (`> 1.0`) | Resists (`< 1.0`) |
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
