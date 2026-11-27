# Vibrant Castle — Lore Canon (Round 1)

This directory is the canonical narrative reference for *Vibrant Castle* (`VC-082`, Round 1). It replaces the earlier "timeless 19th-century Citadel of Aether" lore while preserving existing world IDs, character kits, souls, and enemy data in `src/data/` and `docs/design/`.

**Authority note:** Owner decisions (Round 1) bind the world frame below. Items marked **[OPEN]** or **[PROVISIONAL]** must not be finalized without owner confirmation.

---

## 1. One-Page Canon Summary

* **Year & World:** **2034**, in our own world, after a **techno-magical cataclysm**. Civilisation did not collapse: nations, cities, and daily life continue in a patchwork of censored, quarantined, and open regions. Only isolated pockets struck by the cataclysm warped into "something new" — anomalous **Zones** where magic now exists and time no longer runs straight.
* **Why It Happened:** Nobody knows the exact mechanism ("it just is"). The prevailing hypothesis is a **butterfly-effect overlap**: an unprepared magic ritual conducted in a world without magic coincided to the instant with a new high-energy physics experiment. A **rift** tore open, binding the distant ritual site and the physics laboratory through a strange non-local link.
* **Magic as Science:** Across the wider 2034 world, states, researchers, religious orders, criminals, and emerging mages race to measure, classify, and weaponize magic as a new branch of science.
* **The Game's Zone:** *Vibrant Castle* takes place inside one such transformed Zone, encircled by a defended **buffer zone** (defenders **[OPEN]**). Within the Zone, raw rift magic and a **summoned demon and its hosts** reshaped real 2034 locations. Because the demon and its hosts did not understand 21st-century technology, they reinterpreted factories, laboratories, utility tunnels, and defense complexes in their own feudal-occult terms—anchored around a transformed historic **French château** at the Zone's threshold (`courtyard`).
* **Mood & Aesthetics:** Golden autumn decay meets warped 2034 hardware (*Castlevania: Aria of Sorrow* atmosphere, warm amber lanterns, falling leaves, oxidized brass, and stone), paired with *Mario*-like responsive stage flow and dry *Bastion*-style reactive narration.
* **Heroes (No Main Hero):** **Valen** (*Sun Knight* / *Słoneczny Rycerz*) and **Aurelia** (*Arcane Scholar* / *Uczona Arkanów*) are longtime friends with slightly different goals, forced by Zone reality to act together. She is talented and hardworking, yet frustrated when things fail; he has less raw talent, yet is diligent, organized, and solves problems one by one. Their teamwork follows **Brazilian zouk**: neither rules; the leader proposes, the follower decides whether and how and can take over. Their titles and abilities (solar rapier magic; astral/frost/chrono magic) are explained provisionally in the 2034 frame; their pre-cataclysm past and power origins remain **[OPEN]**.
* **The Narrator:** An **in-world character** (identity **[OPEN]**, revealed later) with a **deadpan, classy** voice. "Bastion" names only the reactive commentary style (and World 7 as a place), never an order or guild.
* **Enemies & Interested Parties:** Adversaries span **demons, devils, constructs, and *Ghost in the Shell*-style cyborgs**, yielding absorbable **souls** on defeat. Around the Zone orbit states, religions, terrorist and criminal networks, new mages, and otherworldly beings.
* **Campaign & Leaning Climax:** Eight interconnected worlds (`8 × 8` planned; Map 1 of each shipped), ending in a temporal loop from `eclipse_crown` back to `courtyard`. The leaning candidate for the W8-8 final boss is **the Possessed** (*Opętany*) — the unprepared ritual leader who ran the ceremony without believing in magic, at the exact moment of the experiment.

---

## 2. World Order & 2034 Reinterpretation

| # | `locationId` | Canonical EN / PL | 2034 Real-World Origin | Demon's Reinterpretation |
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
| Narrator | The Narrator | Narrator | In-world character, identity **[OPEN]**. Retires *Bastion Narrator* as a faction/title. |
| Leaning Boss | **The Possessed** | **Opętany** | Unprepared ritual leader; leaning W8-8 world boss (not final). |

### Key Setting Terms

| Canonical EN | Canonical PL | Meaning in 2034 Canon | Status |
| :--- | :--- | :--- | :--- |
| The Cataclysm (2034) | Kataklizm (2034) | Butterfly-effect rift event that introduced magic and fractured linear time. | Binding |
| The Rift | Szczelina | Non-local breach linking the distant physics lab and the ritual site. | Binding |
| The Zone | Strefa | Local region warped into "something new" by rift magic and the demon. | Binding |
| Buffer Zone | Strefa buforowa | Defended quarantine ring separating the Zone from the rest of 2034 society. | Binding (defenders **[OPEN]**) |
| The Summoned Demon | Przyzwany Demon | Otherworldly entity drawn through the rift; misreads 2034 tech as castle/alchemy lore. | Binding |
| Aether | Aether | Working scientific/colloquial name for the new magical substrate. | **[PROVISIONAL]** |
| Citadel of Aether | Cytadela Aetheru | The demon's mythic title for the reshaped Zone (not the real 2034 map name). | **[PROVISIONAL]** |
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

## 4. Open Questions (Do Not Invent Final Answers)

1. **Buffer Zone Defenders:** Who staffs, commands, and enforces the defended buffer zone around the Zone (national army, international coalition, corporate contractor, covert agency, or mixed force)?
2. **Valen & Aurelia Before 2034 & Origin of Powers:** Who were Valen and Aurelia before the cataclysm, why did they enter (or wake inside) this Zone, and exactly how did they gain solar rapier magic and astral/chrono magic?
3. **The Narrator's Identity:** Which in-world character is narrating their journey, where are they observing from, and when is their identity revealed?
4. **Outsiders Inside the Zone:** Do outside humans (soldiers, artifact hunters, criminal/terrorist smugglers, cultists, rival new mages) cross the buffer zone and appear inside the Zone during gameplay?
5. **Naming of Magic & the Demon's Enclave:**
   * **Provisional default for magic:** Keep **Aether** (*Aether*) as an early scientific/colloquial label used by researchers and present in legacy spells/items (`aether_bolt`, `aether_staff`), pending owner confirmation of whether a newer 2034 scientific term replaces or coexists with it.
   * **Provisional default for the demon's name for the Zone:** Keep **Citadel of Aether** (*Cytadela Aetheru*) provisionally as the **demon's mythic name** for its conquered enclave (not the real-world 2034 designation).
6. **Final Boss Confirmation:** Confirm whether **the Possessed** (*Opętany*) is locked as the W8-8 world boss and how `eclipse_monarch_boss` / legacy *Grand Chronomancer* concepts merge into that encounter.
7. **Code & Palette Backlog Alignment (N1–N12):**
   * **N1–N3, N6–N11:** Legacy strings in `src/i18n/modules/lore.ts`, `locations.ts`, `narrations.ts`, `dialogues.ts`, `docs/wiki/*/bestiary.md`, and `src/data/narrative/dialogues_vn.json` (which currently treats Valen and Aurelia as strangers, points Clocktower directly to Sanctuary, uses masculine narration, and places `trainingIntro` on W7/W8) await follow-up sync PRs (`VC-083`, `VC-021`..`VC-028`).
   * **N12 (Palette):** `alchemist_library` (emerald) and `aether_sanctuary` (cerulean) plus Aurelia's `cyan` cast particles remain flagged for the Phase 8+ autumn palette review (`docs/tasks/VISION.md`).

---

## 5. Document Index

* [world.md](./world.md) — 2034 Earth, the cataclysm, Zones, magic as science, and the demon's reinterpretation per world.
* [scenario.md](./scenario.md) — 8-world campaign arc, partnership progression, temporal loop, and leaning climax.
* [characters.md](./characters.md) — Valen & Aurelia, Brazilian zouk dynamic, voice notes, VC-030 L1 attributes, and kits.
* [narrator.md](./narrator.md) — In-world deadpan-classy narrator rules, humour boundaries, and 10 bilingual example lines.
* [`worlds/`](./worlds/courtyard.md) — Individual dossiers for all 8 worlds (`courtyard`, `thorn_chasm`, `ashen_catacombs`, `clocktower`, `alchemist_library`, `aether_sanctuary`, `grand_bastion`, `eclipse_crown`).
* [locations.md](./locations.md) — Technical Map-1 atlas synced to `src/data/locations/*.json`.
* [enemies.md](./enemies.md) — Factions, origins, souls, and the 19 `enemies.json` templates.
* [npcs.md](./npcs.md) — Narrator, Corvus, Pip/Amber, the Zone Sage, and Master Oakhaven's château legacy.
* [artifacts.md](./artifacts.md) — Environmental mechanisms, 18 armory items, and Constellation Grimoire spells.
