# Campaign Scenario & Narrative Arc

*Vibrant Castle* pairs responsive, *Mario*-like stage flow with the melancholic exploration and soul absorption of *Castlevania: Aria of Sorrow*, observed by a deadpan, classy in-world Narrator in the manner of *Bastion*.

**Implementation status:** The full campaign is planned as **8 worlds × 8 maps (64 stages)**. Today, **Map 1 of each of the 8 worlds** is playable in `src/data/locations/*.json`, linked in a forward/return loop with `eclipse_crown` cycling back to `courtyard`. Maps 2–8 (`VC-020`), hybrid expansions (`VC-021`..`VC-028`), reactive narration wiring, and VN scenes belong to Phases 5–7 (`docs/tasks/ROADMAP.md`).

---

## 1. Premise: Inside the 2034 Zone

In **2028**, an accidental convergence between a physics experiment and an unconvinced occultist's ritual tore open a rift. Six years later, in **2034**, states defend the quarantined buffer belt from Utah to Switzerland while the wider world studies emerging magic—strongest at the laboratory and cult site, weaker with distance—and fortune-seekers probe the perimeter for the philosopher's stone, wealth, a panacea, or adventure. Inside, a **summoned demon and its hosts** have spent the post-cataclysm years remaking a French château and its neighboring industrial, research, and defense sites into an overgrown, autumn-lit stronghold.

Two ordinary people and longtime friends—**Valen** (38, an engineer who designed the access bridge to the new laboratory; *Sun Knight*) and **Aurelia** (31, a brilliant police officer on track to become a detective, who was investigating a new cult; *Arcane Scholar*)—felt a **"call"** near the 2028 cataclysm. Inside the Zone, slightly different personal aims still pull at them, yet broken space and time bind them to rely on one another.

* **Equal Partnership (No Main Hero):** Neither Valen nor Aurelia is "the protagonist" with a sidekick. Like Brazilian zouk, their partnership is a continuous dialogue: whoever steps forward proposes a line of action, and the other answers, refines, or takes over when priority shifts. In solo play, one leads through the current stage; in 2P co-op, both move together across the same physics rules.
* **Tone & Humour:** Dry situational wit, subtle easter eggs, and banter between people who know each other's flaws well (her frustration when an unstable spell or plan misfires; his calm, methodical habit of fixing one bolted lock at a time). Humour **never** interrupts key dramatic beats—the gravity of the rift, the cost of the cataclysm, and the confrontation at the Crown stay sharp and dignified.

---

## 2. The 8-World Campaign Arc

```text
[1. courtyard] <==> [2. thorn_chasm] <==> [3. ashen_catacombs] <==> [4. clocktower]
       ^                                                                   ||
       |                                                                   vv
[8. eclipse_crown] <==> [7. grand_bastion] <==> [6. aether_sanctuary] <==> [5. alchemist_library]
```

*(Note on **N7**: Older draft data in `src/data/narrative/dialogues_vn.json` and `src/i18n/modules/dialogues.ts` treats Valen and Aurelia as strangers in the Clocktower and references opening the gate to the Sanctuary directly. Under the binding world order, World 4 leads to World 5 `alchemist_library`, and the pair already know each other—making any Clocktower scene a reunion after Zone spatial warping separates them.)*

### Act I — Outer Rim & Threshold (`W1`–`W3`)

1. **World 1: Courtyard of Awakening (`courtyard`)**
   * *2034 → Zone:* A transformed historic French château at the Zone's edge. Autumn leaves drift past stone arcades, straw fencing dummies, and a thorn-choked moat.
   * *Arc:* Awakening inside the Zone; testing steel, movement, and early magical discharges against reinterpreted heritage sentinels and perimeter bots; uncovering the high vault shortcut toward the industrial skyline (`clocktower`) or pushing across the gate into the gorge.
2. **World 2: Chasm of Thorns and Shadows (`thorn_chasm`)**
   * *2034 → Zone:* The sheared quarry and botanical utility ravine beyond the château walls, split when the rift cracked the bedrock.
   * *Arc:* Descending into exposed rift hazards—amber crystal thorns, mutated flora, and winged stone hosts—learning disciplined spacing and platform timing while signs of underground heating tunnels appear below.
3. **World 3: Ashen Catacombs (`ashen_catacombs`)**
   * *2034 → Zone:* Château crypts colliding with smouldering municipal boilers and service tunnels.
   * *Arc:* Navigating soot-choked shafts, furnace movers, and the Chapel of Embers, where the Zone's temporal drift grows obvious (`chrono_hound`) and the first *Shadow Knight* proves that not every foe is merely a repurposed machine.

### Act II — The Reinterpreted Works (`W4`–`W6`)

4. **World 4: Clockwork Tower & Angled Range (`clocktower`)**
   * *2034 → Zone:* An automated robotics factory and calibration tower rebuilt by the demon into a towering brass horologium whose summit clock ticks **backward**.
   * *Arc:* Climbing vertical lifts and moving gantries, mastering angled 45° and 90° shots across the old optical range, and—when Valen and Aurelia cross paths again after a spatial rift—synchronizing their priorities before descending into the research wing.
5. **World 5: Alchemist's Library (`alchemist_library`)**
   * *2034 → Zone:* A synthesis lab, cleanroom, and archive dome transmuted into towering bookshelves, emerald vats, and a spinning brass astrolabe.
   * *Arc:* The intellectual turning point (**N7** resolved): amid salvaged 2034 lab notes and demon-warped grimoires, the pair piece together what actually happened—an experiment overlapped with a ritual, and the Zone's architecture is a demon's misreading of modern tech.
6. **World 6: Aether Sky Sanctuary & Aqueduct (`aether_sanctuary`)**
   * *2034 → Zone:* Elevated coolant aqueducts and relay pylons torn into floating sky islets by gravity shear around the upper rift.
   * *Arc:* Crossing suspended masonry and wind-blown rafts above the mist to defeat the *Aether Archon* guarding the high relay before the final fortified ring.

### Act III — The Siege & The Epicenter (`W7`–`W8`)

7. **World 7: Sunlit Bastion (`grand_bastion`)**
   * *2034 → Zone:* A fortified military-industrial command perimeter and proving garrison reforged by the demon into royal-gold battlements. *(Note on **N8**: Current map 1 opens with `trainingIntro`; in canon and upcoming map/narrative updates, World 7 is a desperate fortress siege, not a warm-up range.)*
   * *Arc:* Breaching heavy battlements, dual gates (`VC-025`), and cybernetic/armored garrison defenders under the *Bastion Sentinel Commander* to break into the epicenter.
8. **World 8: Eclipse Crown (`eclipse_crown`)**
   * *2034 → Zone:* The physics accelerator spire entangled across space with the distant ritual altar, locked beneath a blazing crimson-black eclipse.
   * *Arc:* Ascending obsidian stairs past elite echoes of every Zone layer (`shadow_knight`, `aether_archon`, `bastion_sentinel_boss`). On Map 1 today, a vanguard clash previews the Crown; in the full `8 × 8` campaign (`W8-8`), the road across the sacrificial bridge leads to the **Throne of the Eclipse**.

---

## 3. Confirmed Climax & Temporal Loop (NG+)

* **Final Boss (Confirmed):** **The Possessed** (*Opętany*) — the leader of the **2028** ritual. He did not genuinely believe in magic; he staged the ceremony for his followers without preparation, and by sheer misfortune hit the crescendo at the exact instant the distant physics experiment ruptured reality. Now bound to the summoned demon at the Throne of the Eclipse (`W8-8`), he anchors the link between laboratory and ritual site.
* **The Mastery Loop (`eclipse_crown` → `courtyard`):** At the summit of `eclipse_crown`, the `mastery_loop_courtyard` portal loops back to the Courtyard of Awakening. Diegetically, time folds back upon itself at the rift's core: surviving the Crown without yet shattering the full `8 × 8` anchor drops the pair back onto the château stones in a fresh temporal cycle—stronger, carrying absorbed souls and insight, ready to push deeper (the narrative foundation for New Game Plus and Phase 6+ progression).

---

## 4. Narrative Hooks & Canon Status

* **Why Valen & Aurelia (Resolved, Round 2):** Both were ordinary people who felt a "call" near the 2028 cataclysm—Valen (38) designed the access bridge to the new laboratory, and Aurelia (31) was investigating a new cult.
* **The Narrator (Resolved, Round 2):** A person of unknown gender, like an AI that once watched through cameras and now has an ephemeral life, taking notes.
* **Final Boss (Resolved, Round 2):** **The Possessed** (*Opętany*) is confirmed as the W8-8 final boss (`eclipse_monarch_boss`).
* **Outsiders Inside the Zone (Gameplay [OPEN]):** People come to the buffer zone seeking the philosopher's stone, wealth, a panacea, or adventure; whether outside human factions (soldiers, smugglers, cultists, rival mages) cross paths with Valen and Aurelia inside the Zone during gameplay remains **[OPEN]**.
