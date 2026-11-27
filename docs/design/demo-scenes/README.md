# Playable Demo Scenarios: Map 1 Across All 8 Worlds (VC-083)

Canonical Map-1 playable scenarios aligned with the 2034 lore canon (`docs/lore/`) and the map contract (`docs/design/maps-contract.md`, `VC-020`). These documents guide map expansions (`VC-021`..`VC-028`) and text/trigger wiring (`VC-075`, Phase 5 reactive narration).

---

## 1. World Index

| # | `locationId` | File | Canonical EN / PL | Slot | Map Card |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `courtyard` | [courtyard.md](./courtyard.md) | Courtyard of Awakening / *Dziedziniec Przebudzenia* | `W1-1` | `VC-021` |
| 2 | `thorn_chasm` | [thorn_chasm.md](./thorn_chasm.md) | Chasm of Thorns and Shadows / *Rozpadlina Cierni i Cieni* | `W2-1` | `VC-022` |
| 3 | `ashen_catacombs` | [ashen_catacombs.md](./ashen_catacombs.md) | Ashen Catacombs / *Katakumby Popiołu* | `W3-1` | `VC-026` |
| 4 | `clocktower` | [clocktower.md](./clocktower.md) | Clockwork Tower & Angled Range / *Wieża Zegarowa i Poligon Kątowy* | `W4-1` | `VC-023` |
| 5 | `alchemist_library` | [alchemist_library.md](./alchemist_library.md) | Alchemist's Library / *Biblioteka Alchemika* | `W5-1` | `VC-027` |
| 6 | `aether_sanctuary` | [aether_sanctuary.md](./aether_sanctuary.md) | Aether Sky Sanctuary & Aqueduct / *Sanktuarium Aetheru i Podniebny Akwedukt* | `W6-1` | `VC-024` |
| 7 | `grand_bastion` | [grand_bastion.md](./grand_bastion.md) | Sunlit Bastion / *Słoneczny Bastion* | `W7-1` | `VC-025` |
| 8 | `eclipse_crown` | [eclipse_crown.md](./eclipse_crown.md) | Eclipse Crown / *Korona Zaćmienia* | `W8-1` | `VC-028` |

### Key & Tag Conventions

* **Narrator keys (`narr_<locationId>_<beat>_<n>`):** Shared triggers use `<beat>` values (`entry`, `enemy`, `lever`, `mid`, `secret`, `goal`, `fall`, `linger`). Hero-specific variants append the hero name (`hero_valen`, `hero_aurelia`). Map contract beat slots (`narrationW<w>M<m>Entry`, `...Mid`, `...Goal`) map directly to `entry_1`, `mid_1`, and `goal_1`.
* **Dialogue banter (`dlg_<locationId>_banter_<n>`):** Spoken exchanges between Valen and Aurelia are marked explicitly as **Dialogue (not Narrator)** and use speaker lines rather than narration subtitles.
* **`phase 5` tag:** Enemies patrol and take hits today, but deal no damage yet. Any reactive line triggered by enemy hits or combat HP loss is marked **`phase 5`**.

---

## 2. Narrator Tone Guide (9 Rules — Aligned with `docs/lore/narrator.md`)

1. **In-world deadpan observer:** The Narrator is an educated 2034 character watching Valen and Aurelia across the Zone—unhurried, classy, observant, never melodramatic or shouting tutorial button names.
2. **2034 meets feudal theater:** Point out the collision between 2034 infrastructure (museum exhibits, utility quarries, district boilers, robotics plants, cleanrooms, concrete aqueducts, blast bunkers, accelerator spires) and the demon's medieval-occult reinterpretation without breaking composure.
3. **Hero-neutral shared lines:** Every shared trigger works identically for Valen solo, Aurelia solo, or 2P co-op. Never default to masculine or feminine forms in shared Polish or English lines (`narrationOpening`-style masculine phrasing is retired); use present-tense second person, plural *you / wy*, or impersonal observation.
4. **Paired hero-specific variants:** Whenever a line explicitly names a hero, ship both `..._hero_valen_1` and `..._hero_aurelia_1` variants matching their voices and silhouettes.
5. **Subtitle discipline (<= 110 characters):** Keep every narrator line to one short subtitle so players read cleanly mid-jump during *Mario*-paced stage flow. Natural literary Polish first—never translated English syntax.
6. **Layered humour:** Keep wit understated across three channels: situational absurdity, quiet fencing/engineering/literary winks, and dry notes on Valen and Aurelia's rapport. Never break the fourth wall or use brand names.
7. **Zero humour in key dramatic beats:** Drop all irony at solemn thresholds—the human cost beneath the Ashen Catacombs, the butterfly-effect discovery in the Alchemist's Library, the gravity awe of the Sky Sanctuary, the siege stakes of the Sunlit Bastion, and the entire Eclipse Crown finale.
8. **Equal partners, Brazilian zouk dynamic:** Valen (*Sun Knight*) and Aurelia (*Arcane Scholar*) are longtime friends with no "main hero." Their banter reflects her quick frustration when mechanisms or wards misfire and his calm, step-by-step composure. Clocktower is a spatial-warp reunion leading into the Library—never a first meeting.
9. **Respect `[OPEN]` and `[PROVISIONAL]` canon boundaries:** Never invent the Narrator's identity, buffer-zone defenders, outsiders entering the Zone, the heroes' pre-2034 past or power origins, or confirm the final W8-8 boss beyond the leaning candidate (*the Possessed* / *Opętany*). Keep *Aether* strictly in its provisional role, and never treat *Sunlit Bastion* as an order or World 7 as a training range.

---

## 3. Campaign Arc (Acts I–III + Temporal Loop)

**World 1 — Courtyard of Awakening (`courtyard`):** Inside the perimeter of a 2034 transformed Zone, Valen and Aurelia step onto a historic French château estate bathed in autumn twilight, where museum plate walks on its own, Master Oakhaven's fencing dummies stand in line, and amber thorns choke the dry moat. Testing steel, dashes, and early discharges against reinterpreted heritage sentinels, the pair uncover both sunken crypt passages and a hidden tower shortcut before unbarring the eastern gate toward the fractured hillside.

**World 2 — Chasm of Thorns and Shadows (`thorn_chasm`):** Beyond the château walls, the estate's terraced limestone quarry and botanical conservatory have sheared apart along a rift fault into a jagged ravine. Snapped high-voltage conduits coil into crystallized amber briars while roof ornaments and sensor rigs take wing above an unpowered quarry trolley still running its rail, teaching disciplined spacing before the cliff drops into buried service shafts.

**World 3 — Ashen Catacombs (`ashen_catacombs`):** Below the quarry, ancient château burial crypts collide with 2034 municipal district-heating boilers and maintenance corridors choked with soot and lingering embers. As flickering inspection lamps and a time-looped patrol hound rattle down the service tunnels, the pair descend into the solemn Chapel of Embers—where a silent Shadow Knight proves the Zone holds more than repurposed machinery.

**World 4 — Clockwork Tower & Angled Range (`clocktower`):** Rising from the deep shafts into an automated high-bay robotics factory recast as a monumental brass horologium, Valen and Aurelia navigate counterweight lifts, swinging escapements, and an optical calibration gallery built for 45° and 90° shots. Separated briefly by spatial distortion on the climb, the longtime friends reunite on the upper range under backward-ticking clock hands before unsealing the summit bridge into the adjacent research wing.

**World 5 — Alchemist's Library (`alchemist_library`):** Cleanroom synthesis bays, biovats, and server farms stand transmuted into emerald flasks, leather-bound data archives, and a towering brass astrolabe. Beyond the absurdity of server manuals shelved beside alchemy, surviving 2034 incident logs in the high stacks deliver the campaign's intellectual turning point: the Zone was born when a physics experiment overlapped to the instant with an unprepared occult ritual, and everything inside reflects a demon's misreading of modern tech.

**World 6 — Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`):** Ascending from the dome onto an elevated coolant aqueduct and power-relay viaduct torn into floating concrete islets by upper-rift gravity shear, Valen and Aurelia cross drifting stone piers and wind rafts suspended above white mist. Defeating the telemetry-bound Aether Archon quiets the broken relay array and clears the cloud bridge toward the Zone's armored inner ring.

**World 7 — Sunlit Bastion (`grand_bastion`):** At the fortified military-industrial perimeter guarding Ground Zero, blast concrete and tactical armor stand forged into royal-gold siege ramparts rather than any knightly order or warm-up yard. Methodically breaching twin portcullises, thorn trenches, and heavy cyborg defenders alongside the Bastion Sentinel Commander opens the final approach beneath the crimson glare of the epicenter.

**World 8 — Eclipse Crown (`eclipse_crown`):** At Ground Zero, the shattered high-energy physics spire fuses across non-local space with the distant ritual site beneath a motionless black-and-crimson eclipse. Ascending jagged obsidian piers past vanguard and throne guardians without flippancy or distraction, Valen and Aurelia reach the threshold behind the Throne of the Eclipse—where fractured time folds them back onto the French courtyard stones, stronger with every cycle until the deeper anchor can be broken.
