# Characters: Valen & Aurelia

**Status:** Canonical character framing (`VC-082`, Round 1 & Round 2) combined with live engine stats (`src/game/characters/characterProfiles.ts`) and approved Level-1 attribute profiles (`docs/design/character-system.md`, `VC-030`).

---

## 1. The Partnership: No Main Hero (Brazilian Zouk Dynamic)

In *Vibrant Castle*, **there is no main protagonist and no secondary sidekick**. **Valen** and **Aurelia** are longtime good friends who know each other's habits, strengths, and blind spots intimately. Inside the 2034 Zone, they carry slightly different personal goals, yet warped space, hostile constructs, and broken time force them to act together.

Their dynamic works like **Brazilian zouk**:

* **Proposal, Never Command:** Whoever takes the initiative proposes a line of action—an aggressive feint, a sudden change of route, a risky leap—without ruling the other.
* **Choice & Counter-Lead:** The partner decides *whether* and *how* to answer, and can seamlessly take over the lead whenever priorities shift.
* **Complementary Temperament:**
  * **Aurelia** has natural talent and works relentlessly hard, **yet gets sharply frustrated when things fail**—an unstable ward, a mistimed phase, a puzzle that refuses to yield.
  * **Valen** has less raw talent, **yet is diligent, organized, and solves problems one at a time**—steadying the rhythm when chaos spikes and turning complex threats into manageable steps.
  * Together, they are distinctly more than the sum of their parts: her breakthroughs unlock doors his method alone could never force, and his calm cadence keeps her brilliance from burning out against immovable walls.
* **Solo & 2P Co-Op Consistency (Resolves N3):** In solo mode, the player chooses who takes the point for that run; in local 2P co-op, both act side by side on the same jumping/running physics. All canonical narration (`narrator.md`) treats them as equals without defaulting to male pronouns.

---

## 2. 2034 Framing, Pre-Cataclysm Past & Why Them (Round 2)

* **Canonical Titles (Resolves N1):**
  * Valen: **Sun Knight** (*Słoneczny Rycerz*; `Solar Knight` in current UI i18n keys). *Retired legacy names: Crimson Duelist, Chrono Duelist, Szkarłatny Szermierz.*
  * Aurelia: **Arcane Scholar** (*Uczona Arkanów*; `Scholar of Arcanum` in current UI i18n keys). *Retired legacy names: Cyan Sentinel, Aetherblade Warden, Cyjanowa Strażniczka.*
* **Ordinary People & The Call (Round 2 Canon):** Valen and Aurelia were ordinary people before magic entered the world in **2028**. Both felt a **"call"** near the cataclysm, each tied to one half of the non-local rift:
  * **Valen (age 38 in 2034):** An **engineer** who designed the **access bridge to the new laboratory**.
  * **Aurelia (age 31 in 2034):** A **brilliant police officer on track to become a detective**, who was **investigating a new cult**.
* **2034 Resonance Explanation:** Why do two ordinary people in 2034 carry titles like *Sun Knight* and *Arcane Scholar* and wield solar rapier arts and astral magic? Within the emerging magical science of Aether—born in 2028 and studied for six years—and inside a Zone that translates modern equipment and human intent into knightly/arcane archetypes, such labels describe distinct **resonance profiles**: Valen channels focused thermal-photonic discharges through kinetic fencing, while Aurelia interfaces directly with spatial, cryogenic, and temporal anomalies.

---

## 3. Attribute Profiles (Approved VC-030 Baseline & Live Stats)

All heroes and monsters share a D&D-like six-attribute model stored on a **D20 × 10 scale** (`STR / DEX / CON / INT / WIS / CHA`, level-1 average `151`, sum `906`, starting range `110–180`; implemented in Phase 5 via `VC-031`).

| Champion | STR | DEX | CON | INT | WIS | CHA | Default Priority (1 / 2 / 3) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Valen** (*Sun Knight*) | 151 | 166 | 156 | 136 | 146 | 151 | `DEX / CON / CHA` |
| **Aurelia** (*Arcane Scholar*) | 131 | 152 | 136 | 176 | 162 | 149 | `INT / WIS / CON` |

### Current Live Profile Constants (`src/game/characters/characterProfiles.ts`)

| Stat | Valen | Aurelia |
| :--- | :---: | :---: |
| **Max HP / Max MP / Max Stamina** | `115` / `90` / `115` | `90` / `125` / `95` |
| **Base Attack / Base Defense** | `23` / `7` | `18` / `4` |
| **Mana Regen / Stamina Regen (per tick)** | `0.07` / `0.30` | `0.14` / `0.24` |
| **Spell Power / Mana Cost Multiplier** | `1.0x` / `1.0x` | `1.15x` / `0.90x` |
| **Attack Cooldown (ticks)** | `18` | `22` |
| **Dash Cost / Slide CD / Backstep CD** | `18` / `38` / `32` | `15` / `30` / `26` |
| **Theme Token & Emblem** | `crimson` / `sun` | `cyan` / `astrolabe` |

---

## 4. Valen — Sun Knight (*Słoneczny Rycerz*)

* **Role:** Equal partner; methodical point-fighter, spatial anchor, and duelist.
* **Combat Philosophy:** Economy of motion, steady guard, resolving threats in sequence.
* **Armament & Magic (`src/data/skills/spells.json`):**
  * **Weapon:** Precision dueling **rapier** (`solar_rapier` / steel blade), optimized for rapid thrusts and crisp recoveries.
  * **Solar Arts (`solar` domain):** `solar_flare` (focused beam), `solar_fireball` (explosive thermal sphere), `radiant_strike` (threefold light wave), `shield_bash` (close deflection), `prismatic_shield` (hazard-absorbing ward), `sun_sentinel` (orbiting flame orb), and passives `blade_infusion`, `stamina_surge`, `vitality_surge`.
* **Appearance & Silhouette:** Long graphite/charcoal greatcoat (`#1e293b`, `#334155`) with muted leather browns (`#78350f`, `#92400e`), practical waistcoat and boots, short unruly chestnut hair, signature **rectangular spectacles**, warm amber/gold solar cast accents (`#f59e0b`, `#fbbf24`), and calm, watchful expression.
* **Voice & Dialogue Notes:** Grounded, dry, concise, and gently pragmatic. When something breaks or a hallway defies geometry, he catalogs the nearest lever first and answers Aurelia's frustration with measured focus rather than lectures.

---

## 5. Aurelia — Arcane Scholar (*Uczona Arkanów*)

* **Role:** Equal partner; analytical-yet-intuitive arcanist, temporal/spatial specialist, and long-range burst caster.
* **Combat Philosophy:** Continuous flow—weaving quick low slides and cheaper backsteps between high-output astral, frost, and chrono volleys.
* **Armament & Magic (Resolves N2):**
  * **Weapon:** Arcane focus / **`aether_staff`** (carved mahogany conduit crowned with an amber-lit core in `items.json`; shares base melee strike hitbox mechanically in-engine today). *Note: older wiki claims of an "Aether blade" and `lore.ts` claims of defense-only rays are retired.*
  * **Astral, Frost & Chrono Arts (`astral`, `frost`, `chrono` domains):** `aether_bolt` (omnidirectional beam), `frost_nova` (8-way freezing burst), `emerald_barrage` (triple crystalline volley), `celestial_comet` (arcing cosmic blast), `aether_barrier` (kinetic shield), `chrono_rewind` (localized temporal phase & recovery), `sentinel_spark` (homing orb), and passives `mana_font`, `scholarly_focus`, `astral_attunement`.
* **Appearance & Silhouette:** Flowing imperial violet and twilight purple dress (`#4c1d95`, `#581c87`, `#7e22ce`) with gold filigree (`#f59e0b`, `#d97706`), long chestnut hair that trails dynamically with dashes, resonant crystal pendants, and alert, expressive poise.
* **Palette Note (N12):** Current cast particles use `#38bdf8` (primary cyan) and `#a855f7` (secondary violet) with `cyan` UI theme tokens; harmonizing cyan accents with the autumn palette is tracked for Phase 8+.
* **Voice & Dialogue Notes:** Quick-minded, articulate, intensely driven—curious about the Zone's physics anomalies, visibly impatient when an experiment, lock, or spell misfires, yet immediately receptive when Valen spots the practical angle she overlooked.

---

## 6. Unison Dynamic & Scene Notes

* **Unison Skill (`unison_supernova_nova`):** Valen's solar blade arc and Aurelia's astral surge merge into a radial cosmic blast (`220` base damage)—the mechanical expression of their zouk-like synchronization.
* **Clocktower Scene (`dialogues_vn.json`, Resolves N7):** Existing prototype dialogue in `src/i18n/modules/dialogues.ts` writes their Clocktower encounter as if they are strangers meeting for the first time. In canon, they already know each other well; any Clocktower scene is a reunion after Zone spatial distortion separated them, trading sharp relief and dry banter before moving forward together.
* **Sprite Tiers:** Both heroes maintain three asset tiers (`hi8bit`, `hi16bit`, and painted `high`) quantized from painted frames, plus 25-expression portrait matrices (`5 × 5`) in `src/assets/characters/<hero>/`.
