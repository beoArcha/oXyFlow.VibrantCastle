# Vibrant Castle — Lore Canon (Round 2)

This directory is the canonical narrative reference for *Vibrant Castle* (`VC-082`, Round 1 & Round 2). It replaces the earlier "timeless 19th-century Citadel of Aether" lore while preserving existing world IDs, character kits, souls, and enemy data in `src/data/` and `docs/design/`.

**Authority note:** Owner decisions (Round 1 & Round 2) bind the world frame below. Items marked **[OPEN]** must not be finalized without owner confirmation.

---

## 1. One-Page Canon Summary

* **Year & World:** Present day is **2034**, in our own world, six years after the **2028 techno-magical cataclysm**. Civilisation did not collapse: nations, cities, and daily life continue in a patchwork of censored, quarantined, and open regions. Across the wider 2034 world, states, researchers, religious orders, criminals, and emerging mages race to measure, classify, and weaponize magic as a new branch of science.
* **Why It Happened:** Nobody knows the exact mechanism ("it just is"). The prevailing hypothesis is a **butterfly-effect overlap** in **2028**: an unprepared magic ritual conducted in a world without magic coincided to the instant with a new high-energy physics experiment. A **rift** tore open, binding the distant ritual site and the physics laboratory through a strange non-local link.
* **Magic (Aether):** Magic—called **Aether** (simply "ether", spelled with the Old Norse *ae*)—is a few years old (born in 2028) and works worldwide, though it **weakens with distance**. It is strongest in the Zone (at the laboratory and the cult site) and is also stronger at known mystical, natural, and shamanic places worldwide.
* **The Buffer Zone & The Game's Zone:** The affected belt stretches from **Utah to Switzerland**—directly altered over a dozen or so km, with emanations over tens of km, and twice as wide in places. **States defend the buffer zone.** Flying over at altitude is possible, while driving through or flying low is risky; **France and the USA** are building underground tunnels to reconnect. At sea, water dispersed most of the effect into thread-like emanations where creatures appear, though it remains our world. People come seeking the philosopher's stone, wealth, a panacea, or adventure. Inside the Zone, raw rift magic and a **summoned demon and its hosts** reshaped real 2028 locations (which the demon reinterpreted in feudal-occult terms—anchored around a historic **French château** at `courtyard`).
* **Mood & Aesthetics:** Golden autumn decay meets warped modern hardware (*Castlevania: Aria of Sorrow* atmosphere, warm amber lanterns, falling leaves, oxidized brass, and stone), paired with *Mario*-like responsive stage flow and dry *Bastion*-style reactive narration.
* **Heroes (No Main Hero):** **Valen** (38, engineer; *Sun Knight* / *Słoneczny Rycerz*) and **Aurelia** (31, brilliant police officer on track to become a detective; *Arcane Scholar* / *Uczona Arkanów*) were ordinary people and longtime friends. Both felt a **"call"** near the 2028 cataclysm: Valen had designed the access bridge to the new laboratory, and Aurelia was investigating a new cult. She is talented and hardworking, yet frustrated when things fail; he has less raw talent, yet is diligent, organized, and solves problems one by one. Their teamwork follows **Brazilian zouk**: neither rules; the leader proposes, the follower decides whether and how and can take over.
* **The Narrator:** A person of **unknown gender**, like an AI that once watched through cameras and now has an ephemeral life; it takes notes and speaks in a **deadpan, classy** voice. "Bastion" names only the reactive commentary style (and World 7 as a place), never an order or guild.
* **Enemies & Interested Parties:** Adversaries span **demons, devils, constructs, and *Ghost in the Shell*-style cyborgs**, yielding absorbable **souls** on defeat. Around the Zone orbit states, religions, terrorist and criminal networks, new mages, fortune-seekers, and otherworldly beings.
* **Campaign & Confirmed Climax:** Eight interconnected worlds (`8 × 8` planned; Map 1 of each shipped), ending in a temporal loop from `eclipse_crown` back to `courtyard`. The confirmed W8-8 final boss is **the Possessed** (*Opętany*)—the unprepared ritual leader who ran the 2028 ceremony without believing in magic, at the exact moment of the experiment.

---

## 2. World Order & Pre-Cataclysm (2028) Reinterpretation

| # | `locationId` | Canonical EN / PL | Real-World Origin (2028) | Demon's Reinterpretation |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `courtyard` | Courtyard of Awakening / *Dziedziniec Przebudzenia* | Historic French château & heritage estate (medieval/Renaissance stone, moat, museum wing) | Outer proving courtyard, knightly sentinels, straw fencing dummies, bramble moat |
| 2 | `thorn_chasm` | Chasm of Thorns and Shadows / *Rozpadlina Cierni i Cieni* | Terraced limestone quarry, sunken utility cut & botanical conservatory ravine | Rift-split abyss overgrown with crystallized amber thorns and gargoyle perches |
| 3 | `ashen_catacombs` | Ashen Catacombs / *Katakumby Popiołu* | Château crypts merged with municipal heating boilers & underground service tunnels | Smouldering ossuaries, furnace pits, and ember chapels patrolled by echoes |
| 4 | `clocktower` | Clockwork Tower & Angled Range / *Wieża Zegarowa i Poligon Kątowy* | Automated high-bay robotics factory & vertical calibration tower | Brass horologium spire whose backward-ticking clockwork governs the upper levels |
| 5 | `alchemist_library` | Alchemist's Library / *Biblioteka Alchemika* | Synthesis laboratory, cleanroom vats, data-archive stacks & containment dome | Arcane scriptorium of emerald flasks, forbidden tomes, and a brass astrolabe |
| 6 | `aether_sanctuary` | Aether Sky Sanctuary & Aqueduct / *Sanktuarium Aetheru i Podniebny Akwedukt* | Elevated coolant aqueduct, power-relay viaduct & atmospheric radar array | Gravity-sheared floating islets and starlit stone arcades above the mist |
| 7 | `grand_bastion` | Sunlit Bastion / *Słoneczny Bastion* | Fortified military-industrial perimeter, command bunker & proving garrison | Royal-gold siege fortress, heavy battlements, and mechanized wardens |
| 8 | `eclipse_crown` | Eclipse Crown / *Korona Zaćmienia* | High-energy physics experiment spire overlapped across space with the ritual site | Obsidian pinnacles beneath a suspended crimson eclipse and the Throne of the Eclipse |

---

## 3. PL / EN Glossary

### Heroes & Key Roles

| Concept | Canonical EN | Canonical PL | Notes & Retired Terms |
| :--- | :--- | :--- | :--- |
| Hero 1 | **Valen, the Sun Knight** | **Valen, Słoneczny Rycerz** | `Solar Knight` in UI keys (`valenLoreTitle`) is an accepted synonym. Retires *Crimson Duelist* / *Chrono Duelist* / *Szkarłatny Szermierz*. |
| Hero 2 | **Aurelia, the Arcane Scholar** | **Aurelia, Uczona Arkanów** | `Scholar of Arcanum` in UI keys (`aureliaLoreTitle`) is an accepted synonym. Retires *Cyan Sentinel* / *Aetherblade Warden* / *Cyjanowa Strażniczka*. |
| Partnership | The Zouk Dynamic (Equal Partners) | Dynamika zouka (równorzędni partnerzy) | Neither is the sole protagonist. PL refers to the pair as *dwoje partnerów / przyjaciół*, never masculine *dwaj*. |
| Narrator | The Narrator | Narrator | Person of unknown gender; like an AI that watched through cameras and now has an ephemeral life, taking notes. Retires *Bastion Narrator* as a faction/title. |
| Final Boss | **The Possessed** | **Opętany** | Unprepared 2028 ritual leader; confirmed W8-8 world boss. |

### Key Setting Terms

| Canonical EN | Canonical PL | Meaning in 2034 Canon | Status |
| :--- | :--- | :--- | :--- |
| The Cataclysm (2028) | Kataklizm (2028) | Butterfly-effect rift event that introduced magic and fractured linear time; present day is 2034. | Binding |
| The Rift | Szczelina | Non-local breach linking the distant physics lab and the ritual site. | Binding |
| The Zone | Strefa | Region warped into "something new" by rift magic and the demon (strongest at the lab and cult site). | Binding |
| Buffer Zone | Strefa buforowa | State-defended belt from Utah to Switzerland (dozen+ km direct, tens of km emanations, twice as wide in places). | Binding |
| The Summoned Demon | Przyzwany Demon | Otherworldly entity drawn through the rift; misreads 21st-century tech as castle/alchemy lore. | Binding |
| Aether | Aether | Confirmed name for magic—simply "ether", spelled with the Old Norse *ae*. | Binding |
| Citadel of Aether | Cytadela Aetheru | The demon's mythic title for the reshaped Zone (not the real 2034 map name). | Binding |
| Sunlit Bastion | Słoneczny Bastion | World 7 (`grand_bastion`) as a place only; not a knightly order. | Binding |
| Soul / Soul Imprint | Dusza / Ślad Duszy | Absorbed tactical/arcane residue dropped by defeated foes (*Aria of Sorrow* pillar). | Binding |

### Enemy Factions & Interested Parties

| EN Term | PL Term | Canon Role |
| :--- | :--- | :--- |
| Demons & Devils | Demony i diabły | The summoned demon and its infernal hosts reshaping the Zone. |
| Reinterpreted Constructs | Przeobrażone konstrukty | 2034 factory robotics, drones, lamps, and heritage dummies turned brass/stone/clockwork. |
| Cyborgs & Armored Shells | Cyborgi i pancerne powłoki | *Ghost in the Shell*-style tactical/cybernetic units trapped or repurposed as sentinels. |
| Rift Fauna & Echoes | Fauna Szczeliny i echa | Mutated cavern/château life, spectral duelists, and ambient energy wisps. |
| Outside Interested Parties | Zainteresowane strony z zewnątrz | States, religions, terrorist and criminal organizations, new mages, otherworldly beings. |

### Canonical Enemy Names (19 Templates in `src/data/enemies/enemies.json`)

> Note on **N10**: Some existing strings in `src/i18n/modules/locations.ts` and `docs/wiki/pl/bestiary.md` diverge (notably the typo *Chroniony chart* and *Mech zębaty* / *Wisp Aetheru*). The table below is the canonical lore glossary for sync cards.

| `enemyId` | Canonical EN | Canonical PL | Origin Class |
| :--- | :--- | :--- | :--- |
| `training_dummy` | Training Dummy | Słomiany Manekin | Château / Construct |
| `training_target` | Training Target | Cel Treningowy | Calibration Target / Construct |
| `grand_dummy` | Grand Training Dummy | Wielki Manekin | Château / Construct |
| `gear_mite` | Gear Mite | Trybik | Micro-Drone / Construct |
| `aether_wisp` | Aether Wisp | Iskra Aetheru | Rift Energy Echo |
| `chasm_crawler` | Chasm Crawler | Pełzacz Rozpadliny | Rift-Mutated Fauna |
| `thorn_creeper` | Thorn Creeper | Cierniowy Pędnik | Rift-Mutated Flora |
| `gargoyle_scout` | Gargoyle Scout | Zwiadowca Gargulców | Drone / Gargoyle Host |
| `lantern_warden` | Lantern Warden | Latarniowy Stróż | Beacon Drone / Construct |
| `chasm_gargoyle` | Chasm Gargoyle | Gargulec z Rozpadliny | Infernal / Stone Host |
| `clockwork_owl_gargoyle` | Clockwork Owl Gargoyle | Zegarowa Sowa-Gargulec | Surveillance Drone / Construct |
| `court_sentinel` | Courtyard Sentinel | Strażnik Dziedzińca | Cyborg / Armored Chassis |
| `chrono_hound` | Chrono Hound | Chrono-Ogar | Recon Quadruped / Construct |
| `bastion_gargoyle` | Bastion Gargoyle | Gargulec Bastionu | Armored Gargoyle Host |
| `aether_sentinel` | Aether Sentinel | Strażnik Aetheru | Cyborg / Containment Construct |
| `clockwork_automaton` | Clockwork Automaton | Zegarowy Automat | Robotics Loader / Construct |
| `shadow_knight` | Shadow Knight | Rycerz Cienia | Infernal Duelist / Echo |
| `aether_archon` | Aether Archon | Archont Aetheru | High-Tier Rift / Cyber Entity |
| `bastion_sentinel_boss` | Bastion Sentinel Commander | Komendant Straży Bastionu | Heavy Cyborg / Armored Boss |

---

## 4. Open Questions & Round 2 Resolutions

1. **Buffer Zone Defenders — [RESOLVED, Round 2]:** **States** defend the buffer zone—a belt stretching from Utah to Switzerland (directly affected over a dozen or so km, with emanations over tens of km, twice as wide in places). France and the USA are building underground tunnels to reconnect.
2. **Valen & Aurelia Before 2028 & Why Them — [RESOLVED, Round 2]:** Both were ordinary people: **Valen** (38) is an engineer who designed the access bridge to the new laboratory; **Aurelia** (31) was a brilliant police officer on track to become a detective, investigating a new cult. Both felt a **"call"** near the 2028 cataclysm.
3. **The Narrator's Identity — [RESOLVED, Round 2]:** A person of **unknown gender**, like an AI that once watched through cameras and now has an ephemeral life, taking notes in a deadpan, classy voice.
4. **Outsiders Inside the Zone — [PARTIALLY RESOLVED, Round 2]:** People come to the buffer zone and Zone seeking the **philosopher's stone, wealth, a panacea, or adventure**. Whether specific outside human factions (soldiers, smugglers, cultists, rival mages) appear as active gameplay enemies or NPCs remains **[OPEN]** for Phase 7 design.
5. **Naming of Magic & the Demon's Enclave — [RESOLVED, Round 2]:** **Aether** (*Aether*) is confirmed—simply "ether", spelled with the Old Norse *ae*. **Citadel of Aether** (*Cytadela Aetheru*) remains the demon's mythic name for its conquered enclave.
6. **Final Boss Confirmation — [RESOLVED, Round 2]:** **The Possessed** (*Opętany*) is confirmed as the W8-8 world boss (merging/anchoring the `eclipse_monarch_boss` encounter).
7. **Code & Palette Backlog Alignment (N1–N12):**
   * **N1–N3, N6–N11:** Legacy strings in `src/i18n/modules/lore.ts`, `locations.ts`, `narrations.ts`, `dialogues.ts`, `docs/wiki/*/bestiary.md`, and `src/data/narrative/dialogues_vn.json` (which currently treats Valen and Aurelia as strangers, points Clocktower directly to Sanctuary, uses masculine narration, and places `trainingIntro` on W7/W8) await follow-up sync PRs (`VC-083`, `VC-021`..`VC-028`).
   * **N12 (Palette):** `alchemist_library` (emerald) and `aether_sanctuary` (cerulean) plus Aurelia's `cyan` cast particles remain flagged for the Phase 8+ autumn palette review (`docs/tasks/VISION.md`).

---

## 5. Document Index

* [world.md](./world.md) — 2034 Earth, the cataclysm, Zones, magic as science, and the demon's reinterpretation per world.
* [scenario.md](./scenario.md) — 8-world campaign arc, partnership progression, temporal loop, and confirmed climax.
* [characters.md](./characters.md) — Valen & Aurelia, Brazilian zouk dynamic, voice notes, VC-030 L1 attributes, and kits.
* [narrator.md](./narrator.md) — In-world deadpan-classy narrator rules, humour boundaries, and 10 bilingual example lines.
* [`worlds/`](./worlds/courtyard.md) — Individual dossiers for all 8 worlds (`courtyard`, `thorn_chasm`, `ashen_catacombs`, `clocktower`, `alchemist_library`, `aether_sanctuary`, `grand_bastion`, `eclipse_crown`).
* [locations.md](./locations.md) — Technical Map-1 atlas synced to `src/data/locations/*.json`.
* [enemies.md](./enemies.md) — Factions, origins, souls, and the 19 `enemies.json` templates.
* [npcs.md](./npcs.md) — Narrator, Corvus, Pip/Amber, the Zone Sage, and Master Oakhaven's château legacy.
* [artifacts.md](./artifacts.md) — Environmental mechanisms, 18 armory items, and Constellation Grimoire spells.
