# Gameplay Playtest & Fun Assessment (VC-084)

**Date:** 2026-11-27  
**Build tested:** `0.3.0` (Vite dev server on `http://localhost:3000`, headless Chromium 1248 via Playwright)  
**Scope:** All 8 shipped Map-1 locations (`src/data/locations/*.json`), deterministic 60 Hz simulation benchmarks, live browser input/latency/hazard sweeps, combat & narration checks (Valen and Aurelia), and static level validation (`scripts/validate-level.ts --all`).

---

## 1. Per-Map Playtest Summary

> **Completable? Legend:** Geometrically, `validate-level.ts` (`CORE_PATH_COMFORT`) confirms every map has a jumpable route from spawn to goal. In live play, however, a **lever hitbox bug** (`VC-150`) rejects sword-reach and spell hits on levers unless the player's body overlaps the lever AABB, and **zero player i-frames on hazards** (`VC-151`) caused instant-melt deaths on `thorn_chasm` (`60 HP` lost in `50 ms` on thorns) while `aether_sanctuary` punishes missed gaps with instant pit death.

| World / Map (`locationId`) | Dimensions (px) | Completable? | Difficulty (1–5) | Fun (1–5) | Top Issues Observed |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Courtyard** (`courtyard`) | `4800 × 1040` | Yes (with body-on-lever) | 2 / 5 | 3.5 / 5 | Lever rejects normal sword reach & spells (`VC-150`); `moat_thorns` deals 60 HP in 3 ticks (`0` i-frames); enemies deal `0` contact/attack damage; narrator box overlaps `sentinel_gate` at bottom-center. |
| **2. Thorn Chasm** (`thorn_chasm`) | `4560 × 1120` | Yes (fragile) | 3.5 / 5 | 2.5 / 5 | `0` levers and `0` narration triggers; falling into `thorns_gorge_1` melts HP rapidly (`0` i-frames, died at `x=913`); blind drops off cliff steps; back portal close to start risks accidental exit. |
| **3. Ashen Catacombs** (`ashen_catacombs`) | `2640 × 1560` | Yes (with body-on-lever) | 2.5 / 5 | 3.5 / 5 | Great gothic atmosphere, but narrow `2640` width ends quickly; lever hitbox bug on `lever_ossuary_gate`; reuses `narrationMovement` & `"automaton"` kill line on `shadow_knight`. |
| **4. Clocktower** (`clocktower`) | `2440 × 1740` | Yes (with body-on-lever) | 3 / 5 | 3.5 / 5 | Vertical lifts & `pendulum_mover` are engaging, but `2440` width feels cramped; lever bug on `lever_spire_gate`; no return portal to `courtyard` (`PORTAL_ONE_WAY` warning); enemies only patrol. |
| **5. Alchemist's Library** (`alchemist_library`) | `3840 × 1380` | Yes (with body-on-lever) | 2.5 / 5 | 3.0 / 5 | Tested with Aurelia: shares `narrationMagicUsed` (`"between his fingers"`) — wrong pronoun for Aurelia; lever bug on `lever_archive_gate`; `aether_void` hazard below `distillery_lift`. |
| **6. Aether Sanctuary** (`aether_sanctuary`) | `4240 × 1400` | Yes (fragile) | 3.5 / 5 | 2.5 / 5 | Neon cerulean palette & `sanctuary_crystal` tiles clash with autumn mood; `0` triggers, `0` levers, `0` hazards; pit fall at `x=837` kills instantly with no checkpoint; `aether_archon` boss does not attack. |
| **7. Grand Bastion** (`grand_bastion`) | `4840 × 1140` | Yes (with body-on-lever) | 2 / 5 | 2.5 / 5 | Opens with `trainingIntro` (`"grand training bastion"`) despite being World 7; `0` triggers; lever bug on `lever_bastion_keep`; `bastion_sentinel_boss` deals 0 damage and uses blocky placeholder art. |
| **8. Eclipse Crown** (`eclipse_crown`) | `4640 × 1460` | Yes (with body-on-lever) | 2 / 5 | 2.5 / 5 | Striking crimson eclipse backdrop ruined by `trainingIntro` opening narration, `0` triggers, passive non-attacking bosses (`ec_archon_throne`, `ec_monarch_boss` overlapping balcony), and blocky boss silhouette. |

---

## 2. Movement & Platforming Feel

The simulation core (`src/game/physics/playerKinematics.ts`) implements genuine platformer mechanics: asymmetric gravity (`baseGravity: 0.42`, `fallGravity: 0.62`, `lowJumpGravity: 0.85`), apex hang (`apexGravityMultiplier: 0.45` when `|vy| < 1.8`), variable jump hold (`jumpHoldAcceleration: -0.32` up to `12` ticks), corner nudging (`8 px` tolerance in `SolidCollisionStrategy`), coyote time, and jump buffering.

### Measured Numbers vs. Classic 2D Precision-Platformer Targets

| Metric | Measured (60 Hz / Live Browser) | Classic 2D Platformer Target | Verdict |
| :--- | :--- | :--- | :--- |
| **Input-to-movement latency** | `1.7–12.0 ms` (mean `5.9 ms`, 5 trials) | `< 16.7 ms` (≤ 1 frame) | **Excellent** — instant response on `keydown`. |
| **Tap jump (1 tick / 16.7 ms)** | `45.05 px` high · `30 ticks` (`500 ms`) air · `141.14 px` run dx | `35–55 px` small hop | **Good** — crisp micro-hop for dodging/spacing. |
| **Short real-time tap (~40–60 ms)** | `55.36–114.41 px` high · `32–51 ticks` | Smooth linear scaling with hold | **Steep ramp** — `jumpHoldAcceleration` (`-0.32/tick`) jumps quickly from `45 px` to `114 px` within 3–4 ticks, making mid-height hops touchy. |
| **Full hold jump** | `137.92 px` high (`130.22 px` live) · `54 ticks` (`900 ms`) · `256.34 px` run dx | `110–150 px` · `200–260 px` gap reach | **Good** — clears all contract gaps (`216 px` max flat) comfortably. |
| **Variable jump ratio** | `3.06×` (`45.05 px` vs `137.92 px`) | `2.2×–3.0×` | **Strong** — distinct hop vs full vault. |
| **Ascent vs. descent ratio** | `32 ticks` (`533 ms`) up vs `21 ticks` (`350 ms`) down (`1.52×` faster fall) | `1.3×–1.6×` faster descent | **Very good** — snappy fall with zero floatiness. |
| **Apex hang window (`\|vy\| < 1.8`)** | `12 ticks` (`200 ms`) | `100–180 ms` | **Slightly generous** — reads nicely for platform landings. |
| **Air control (standstill jump + hold right)** | `207.0 px` horizontal drift (`airAcceleration: 0.55`, `maxRunSpeed: 4.8`) | Responsive mid-air steering | **Very good** — easy mid-air corrections. |
| **Coyote time (effective)** | **5 ticks (`83.3 ms`)** *(configured `maxCoyoteFrames: 6`, decremented before check)* | `80–120 ms` (ideally `100–120 ms`) | **Borderline tight** — pre-decrement steals 1 tick (`16.7 ms`). |
| **Jump buffer (effective)** | **5 ticks (`83.3 ms`)** *(configured `maxJumpBufferFrames: 6`, decremented before check)* | `100–150 ms` | **Below target** — 5 ticks feels slightly unforgiving on fast landings. |
| **Slide (`KeyL`) / Backstep** | Slide: `12 active / 38 cd / +151.4 px` · Backstep: `9 active / 32 cd / -92.5 px` | Snappy dodge roll / backdash | **Good** — backstep hop feels authentic to gothic-castle action games. |

**Key platforming takeaway:** The underlying movement math is **surprisingly strong**—easily the most polished part of the current build (`4 / 5`). Fixing the 1-tick pre-decrement on coyote/buffer (`VC-153`), smoothing the early hold-jump acceleration curve, and adding subtle camera lookahead (`VC-159`) would elevate it from "good indie feel" to "classic plumber-genre crispness."

---

## 3. Combat Assessment (vs. Early 8-Bit Castle-Action Simplicity)

The owner's target is clean, readable, few-button action closer to early 8-bit gothic-castle games than a deep combo RPG.

### Measured Combat Timings
- **Valen Melee (`KeyJ`)**: `1 tick` (`16.7 ms`) startup · `14 ticks` (`233.3 ms`) active hitbox (`40 px` reach) · `18 ticks` (`300.0 ms`) total cooldown.
- **Aurelia Melee (`KeyJ`)**: `1 tick` startup · `14 ticks` active · `22 ticks` (`366.7 ms`) total cooldown.
- **Spell Cast (`KeyU` Solar Flare / Aether Bolt)**: `16 ticks` (`266.7 ms`) cast state · `24 ticks` (`400.0 ms`) magic cooldown; supports `90°` vertical and `45°` diagonal aim while standing/running.
- **Enemy Post-Hit I-Frames (`damageTimer`)**: `15 ticks` (`250 ms`), flashes red with `10` spark particles and `cameraManager.triggerShake(7, 4)`.
- **Player Post-Hit I-Frames**: **`0 ticks` (`0 ms`) — MISSING.**

### What Works & What Breaks Fun
1. **Controls & multi-directional magic fit well:** Attack (`J`), Dodge (`L`), Spells (`U`/`O`), Jump (`Space`) are simple and immediate, and 45°/90° spell aiming solves vertical aerial enemies (`clockwork_owl_gargoyle`, `aether_wisp`) without needing complex combo inputs.
2. **Critical Gap — Enemies Do Not Fight Back (`VC-152`):** `EnemyAISystem.update` only calls `physics.updateEnemy(enemy)`, which patrols `patrolMinX..patrolMaxX`. Standing inside `mite_crypt` or `bastion_sentinel_boss` for `1.5 s` kept player HP at `115 / 115` with zero knockback and zero enemy attacks. Without enemy threat, combat has no stakes or rhythm.
3. **Critical Gap — Zero Player I-Frames on Hazards (`VC-151`):** Stepping onto `amber_thorns` in `courtyard` (`moat_thorns`) dealt `-20 HP` on tick 0, `-20 HP` on tick 1, and `-20 HP` on tick 2 (`115 -> 55` in `50 ms`) until knockback (`vy = -5`) cleared the hitbox.
4. **Missing Impact / Hitstun (`VC-154`):** Enemies flash red on hit, but keep sliding uninterrupted along their patrol line with zero knockback or hitstop.
5. **Broken Lever Hitboxes (`VC-150`):** `CombatSystem` delegates lever hits to `CollisionEngine.resolve(player, entity)`, which checks the **player's body AABB** instead of the sword `attackBox` or spell projectile. Confirmed in live engine check (`leverAfterSwordFromRange: false`, `leverAfterSwordOverlap: true`): slashing a lever from normal `6 px` sword spacing or hitting it with a spell fails to flip the lever.

---

## 4. Narration Assessment (*Bastion* Reactivity, Frequency & Tone)

- **Is it *Bastion*-like today?** **No (`1.5 / 5`).** `ReactiveNarratorManager` (`src/game/logic/narrative/reactiveNarratorManager.ts`) and `src/data/narrative/narrator_reactive.json` are not wired into `GameEngine` yet.
- **Frequency & Coverage:** 4 of 8 maps (`thorn_chasm`, `aether_sanctuary`, `grand_bastion`, `eclipse_crown`) have **0** map triggers. On maps that do have triggers, beats are sparse (1–3) and never react dynamically to player performance, dodging, low health, or secrets.
- **Tone & Canon Mismatches (`VC-155`):**
  - `alchemist_library` and `aether_sanctuary` share `openingNarrationKey: "narrationMagicUsed"`, which reads *"Aether sparked between his fingers..."* — breaking immersion whenever playing as **Aurelia**.
  - `grand_bastion` (World 7) and `eclipse_crown` (World 8) both open with `trainingIntro`: *"Welcome to the grand training bastion. Master dashes, backsteps, magic, and multi-directional aim."*
  - Defeating any enemy (including `shadow_knight` or bosses) triggers *"Another training automaton collapsed, yielding crystallized combat insight."*
  - The HUD header displays `"VOICE FROM THE BEYOND"`, and the Defeat modal reads *"The light of the past century has flickered out..."* (contradicting the 2034 canon).
- **HUD Placement (`VC-156`):** `HUDNarratorBanner` renders at bottom-center directly above the QuickBelt, covering ground-level enemies and portals during combat.

*(Note: The canonical lines already written in `docs/lore/narrator.md` and `docs/design/demo-scenes/*.md` capture the dry, observant 2034 tone well—they simply need to be wired to `GameEngine` and `GameEventBus`.)*

---

## 5. Art & Mood Assessment (*Castlevania: Aria of Sorrow* & Autumn Palette)

- **Strengths (`3.5 / 5`):** The multi-layer parallax backdrops (`courtyard`, `thorn_chasm`, `ashen_catacombs`, `clocktower`, `grand_bastion`, `eclipse_crown`), floating autumn leaves/embers, Valen & Aurelia high-tier sprites, `aether_gate` portals, and dark-timber/amber HUD panels nail the melancholic autumn gothic atmosphere.
- **Gaps (`VC-158`):**
  - **`aether_sanctuary` & `sanctuary_crystal` tileset:** Electric neon cerulean (`#0f172a -> #1e3a8a`) and cyan crystal tips on warm bricks break the cohesive autumn dusk mood (also visible in `eclipse_crown` platforms).
  - **Placeholder Bosses & Enemies:** `bastion_sentinel_boss` (World 7 & World 8 boss preview) and `aether_sentinel` look noticeably blocky/geometric compared to the rich painted backdrops and hero pixel sprites.
  - **Unused Environmental Props:** `hanging_lantern` is the sole prop placed across all 8 maps (`11` other authored props sit unused in `src/assets/props/`).
  - **Header Branding:** Top-left app title still displays `"Sunny Bastion of the Castle"` instead of `"Vibrant Castle"`.

---

## 6. Overall Fun Verdict & Top 10 Improvements

| Category | Score (1–5) | Notes |
| :--- | :---: | :--- |
| **Movement & Platforming** | **4.0 / 5** | Crisp, responsive, great variable jump & air control; minor 1-tick coyote/buffer pre-decrement. |
| **Combat & Challenge** | **1.5 / 5** | Clean player controls, but zero enemy attacks, zero contact damage, zero player i-frames, broken lever sword reach. |
| **Narration & Reactivity** | **1.5 / 5** | Static/legacy training strings, pronoun mismatches on Aurelia, reactive manager unwired. |
| **Art, Mood & UI** | **3.5 / 5** | Gorgeous autumn parallax & heroes; held back by neon-blue Sanctuary, blocky boss art, and bottom-center narrator overlap. |
| **Overall Fun Today** | **2.5 / 5** | Feels great to run, slide, and jump around a beautiful world, but quickly feels like an empty museum tour with no danger or reactive story. |

### Top 10 Most Impactful Improvements (Ranked by Impact / Effort)

| Rank | Card | Type / Class | Improvement | Impact / Effort Rationale |
| :---: | :---: | :---: | :--- | :--- |
| **1** | **VC-150** | `fix` · `small` | **Fix lever activation from melee reach and spell projectiles** | Eliminates a progression-breaking hitbox bug across 6/8 maps in ~15 lines (`CombatSystem` / `CollisionEngine`). |
| **2** | **VC-151** | `fix` · `small` | **Add player post-hit invulnerability frames (i-frames)** | Stops instant `60 HP / 50 ms` thorn melts (`thorn_chasm`, `courtyard`) and prepares for enemy damage. |
| **3** | **VC-153** | `tune` · `tiny` | **Fix 1-tick pre-decrement & tune coyote/buffer to 7–8 ticks (117–133 ms)** | Immediate platforming feel upgrade to classic precision-platformer targets (`PlayerKinematics`). |
| **4** | **VC-156** | `tune` · `small` | **Move HUD narrator banner off combat plane, complete key hints, fix title** | Instantly clears ground-level combat occlusion and teaches Jump (`Space`) + Magic (`U`/`O`) on screen. |
| **5** | **VC-152** | `feat` · `medium` | **Implement enemy contact damage, knockback, and 1–2 telegraphed attacks** | Single biggest gameplay gap: turns passive patrol targets into actual gothic-castle combat encounters. |
| **6** | **VC-154** | `feat` · `small` | **Add enemy hitstun/knockback and subtle melee hitstop** | Makes every rapier/staff hit feel weighty and readable instead of slicing through sliding sprites. |
| **7** | **VC-155** | `feat` · `medium` | **Wire `ReactiveNarratorManager` to `GameEventBus` & replace legacy keys** | Delivers the *Bastion* reactive narrator pillar and removes `"his fingers"` / `"training bastion"` bugs. |
| **8** | **VC-157** | `fix` · `small` | **Honor portal `activation: "interact"` (or safe back-portal buffers) + `checkpoint_mid` respawn** | Prevents accidental back-portal exits (`thorn_chasm`) and removes full-map restarts on single pit deaths. |
| **9** | **VC-159** | `tune` · `small` | **Smooth variable jump hold ramp & add directional camera lookahead** | Gives finer control over mid-height hops and reveals blind drops in `thorn_chasm` / `aether_sanctuary`. |
| **10** | **VC-158** | `tune` · `small` | **Shift `aether_sanctuary` / `sanctuary_crystal` toward autumn twilight & prioritize boss sprites** | Unifies all 8 worlds under the golden autumn *Aria of Sorrow* aesthetic. |

---

## 7. Evidence Paths

All raw measurement JSONs, screenshot strips, and WebM clips captured during this playtest are stored outside the repository under `%TEMP%\vc084-playtest\`:

- `%TEMP%\vc084-playtest\map_reports.json`
- `%TEMP%\vc084-playtest\courtyard\` (`01_spawn.png`..`06_before_goal_portal.png`, `courtyard.webm`)
- `%TEMP%\vc084-playtest\thorn_chasm\` (`01_spawn.png`, `02_defeat.png`, `02_mid_play.png`, `03_combat.png`, `06_before_goal_portal.png`, `thorn_chasm.webm`)
- `%TEMP%\vc084-playtest\ashen_catacombs\` (`01_spawn.png`..`06_before_goal_portal.png`, `ashen_catacombs.webm`)
- `%TEMP%\vc084-playtest\clocktower\` (`01_spawn.png`..`06_before_goal_portal.png`, `clocktower.webm`)
- `%TEMP%\vc084-playtest\alchemist_library\` (`01_spawn.png`..`06_before_goal_portal.png`, `alchemist_library.webm`)
- `%TEMP%\vc084-playtest\aether_sanctuary\` (`01_spawn.png`, `02_defeat.png`, `02_mid_play.png`, `03_combat.png`, `06_before_goal_portal.png`, `aether_sanctuary.webm`)
- `%TEMP%\vc084-playtest\grand_bastion\` (`01_spawn.png`..`06_before_goal_portal.png`, `grand_bastion.webm`)
- `%TEMP%\vc084-playtest\eclipse_crown\` (`01_spawn.png`..`06_before_goal_portal.png`, `eclipse_crown.webm`)
