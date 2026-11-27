# Asset Animation Review (VC-120)

Audit of every **used** enemy, structure, and prop referenced in `src/data/locations/*.json` or `src/data/enemies/enemies.json` across all three art tiers (`hi8bit` / `low`, `hi16bit` / `mid`, `high`).

- **Method**: Inspected all `*_meta.json` / `*_prop_meta.json` definitions, SVG/PNG sheet dimensions, and captured 6-frame in-game contact strips per asset per tier via headless Chromium (`?location=<id>&vcReview=1&god=1`, `vibrant_castle_full_settings.display.assetQuality` set to `low` / `mid` / `high`).
- **Scope note**: `VC-121` (owl animation / box flicker) is tracked in parallel; this document records all findings without modifying code.
- **Unused assets note**:
  - 11 prop folders in `src/assets/props/` (`aether_crystal_cluster`, `candelabra`, `ember_skull_lantern`, `garden_lamp_post`, `iron_chain`, `leaf_pile`, `tattered_banner`, `thorn_bramble`, `wall_gear`, `wall_torch`, `war_brazier`) are not referenced in any `src/data/locations/*.json` (`layout.decor` only uses `hanging_lantern`).
  - `src/assets/enemies/chasm_gargoyle/` has its own `hi8bit`/`hi16bit` SVGs and meta, but `enemies.json` maps `chasm_gargoyle` (along with `gargoyle_scout` and `bastion_gargoyle`) to `atlas.presetId: "clockwork_owl_gargoyle"`, leaving the `chasm_gargoyle` asset folder unused in-game.

---

## Summary of Top Issues

1. **`freeform_rects` slicing applied to `hi8bit` SVGs causes broken sprites and box flicker (`VC-121`, `VC-123`)**:
   - `clockwork_owl_gargoyle_meta.json` (shared by `clockwork_owl_gargoyle`, `chasm_gargoyle`, `gargoyle_scout`, `bastion_gargoyle`), `training_dummy_meta.json` (shared by `training_dummy`, `training_target`, `grand_dummy`), and `aether_gate_meta.json` declare `slicing.method: "freeform_rects"` with pixel coordinates from the `high` PNG sheets (`1400x1150` / `1536x1024`).
   - Their `hi8bit` SVGs are `48x240` or `48x192` (`1` column x `4–5` rows of `48x48`, only 1 frame per row). Slicing a `48px`-wide SVG with `high`-tier `freeform_rects` reads out-of-bounds (blank/flickering frames) or clips a flat brown/navy rectangle.
2. **Missing `hi16bit` SVGs on 6 PNG-backed assets (`VC-122`)**:
   - `clockwork_owl_gargoyle`, `training_dummy`, `aether_gate`, `chrono_lever`, `grand_portcullis`, and `hazard_thorns` have no `*_hi16bit.svg`; `hi16bit` (`mid`) falls back to the `high` PNG.
3. **Missing `low` (`hi8bit`) variant declarations in metas (`VC-123` / `new`)**:
   - `shadow_knight_meta.json`, `bastion_sentinel_boss_meta.json`, and `hanging_lantern_prop_meta.json` only declare `variants.mid` even though `*_hi8bit.svg` exists on disk. `hi8bit` falls back to `hi16bit` and never loads the `hi8bit` SVG.
4. **Crude blocky placeholders and missing combat/death animations (`VC-122`, `VC-123`, `new`)**:
   - `shadow_knight` and `bastion_sentinel_boss` use crude blocky geometric placeholders (`64x64` / `48x48`) with no `hit` or `death` animations (`states.hit` maps to `idle`).
   - All 13 SVG-only enemies (`aether_archon`, `aether_sentinel`, `aether_wisp`, `chasm_crawler`, `chrono_hound`, `clockwork_automaton`, `court_sentinel`, `gear_mite`, `lantern_warden`, `thorn_creeper`, plus unused `chasm_gargoyle`) only have `idle`, `move`, `hit` — missing `attack` and `death` animations.
   - `training_dummy_meta.json` names its destruction row `destroy` and omits `states`, while `enemies.json` sets `deathAnimation: "broken"`.
5. **No `high` tier PNGs for 13 enemies and `hanging_lantern` (`new`)**:
   - 13 enemies and `hanging_lantern` have no `*_high.png`; `high` tier falls back to `hi16bit` (`mid`).
   - Structures (`chrono_lever`, `grand_portcullis`, `hazard_thorns`, `aether_gate`) render statically in idle/closed states in-game; interactive state transitions (`activating`, `opening`, `active`) were not triggered in passive idle capture.

---

## Asset Animation Audit Table

| Asset | Kind | Tier | Animations Present (Meta) | Plays? | Issues | Proposed Fix Card |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `clockwork_owl_gargoyle` | enemy | `hi8bit` | `fly` (r0, 7f), `attack` (r1, 7f), `hit` (r2, 4f), `death` (r3, 6f), `bestiary` (r4, 7f) | No | `hi8bit.svg` is `48x240` (1 col x 5 rows of `48x48`, 1 frame/row) while meta uses `high` `freeform_rects`; sprite flickers as a flat brown/navy box or disappears. | `VC-121 fix` + `VC-123 hi8bit` |
| `clockwork_owl_gargoyle` | enemy | `hi16bit` | Same as above | Yes (fallback) | Missing `clockwork_owl_gargoyle_hi16bit.svg`; falls back to `high` PNG (`_packed_high.png`). | `VC-122 hi16bit` |
| `clockwork_owl_gargoyle` | enemy | `high` | Same as above | Yes | Packed PNG (`_packed_high.png`) `fly` wings flap smoothly; `states` mapped cleanly. | — |
| `chasm_gargoyle` | enemy | `hi8bit` | Uses `presetId: "clockwork_owl_gargoyle"` (own meta has `idle`, `move`, `hit`) | No | `enemies.json` points to `clockwork_owl_gargoyle`, inheriting `hi8bit` box flicker/disappearance; own `chasm_gargoyle/` SVG folder is unused. | `VC-121 fix` + `new` (wire own atlas) |
| `chasm_gargoyle` | enemy | `hi16bit` | Same as above | Yes (fallback) | Uses `clockwork_owl_gargoyle` (`high` PNG fallback); own `chasm_gargoyle_hi16bit.svg` is unused and lacks `attack`/`death`. | `new` (wire own atlas + `attack`/`death`) |
| `chasm_gargoyle` | enemy | `high` | Same as above | Yes | Uses `clockwork_owl_gargoyle_packed_high.png`; no dedicated `chasm_gargoyle_high.png`. | `new` |
| `gargoyle_scout` | enemy | `hi8bit` | Uses `presetId: "clockwork_owl_gargoyle"` | No | Inherits `clockwork_owl_gargoyle` `hi8bit` `freeform_rects` mismatch -> box flicker / missing frames. | `VC-121 fix` + `VC-123 hi8bit` |
| `gargoyle_scout` | enemy | `hi16bit` | Same as above | Yes (fallback) | Falls back to `clockwork_owl_gargoyle` `high` PNG (no `hi16bit.svg`). | `VC-122 hi16bit` |
| `gargoyle_scout` | enemy | `high` | Same as above | Yes | Shares `clockwork_owl_gargoyle_packed_high.png`; plays smoothly. | — |
| `bastion_gargoyle` | enemy | `hi8bit` | Uses `presetId: "clockwork_owl_gargoyle"` | No | Inherits `clockwork_owl_gargoyle` `hi8bit` `freeform_rects` mismatch -> box flicker / missing frames. | `VC-121 fix` + `VC-123 hi8bit` |
| `bastion_gargoyle` | enemy | `hi16bit` | Same as above | Yes (fallback) | Falls back to `clockwork_owl_gargoyle` `high` PNG (no `hi16bit.svg`). | `VC-122 hi16bit` |
| `bastion_gargoyle` | enemy | `high` | Same as above | Yes | Shares `clockwork_owl_gargoyle_packed_high.png`; plays smoothly. | — |
| `training_dummy` | enemy | `hi8bit` | `idle` (r0, 6f), `hit` (r1, 5f), `destroy` (r2, 6f), `bestiary` (r3, 8f) | No | `hi8bit.svg` is `48x192` (1 frame/row) while meta uses `high` `freeform_rects`; flickers in/out as a grey/brown rectangle. Also meta lacks `states` and names `destroy` vs `deathAnimation: "broken"`. | `VC-121 fix` + `VC-123 hi8bit` |
| `training_dummy` | enemy | `hi16bit` | Same as above | Yes (fallback) | Missing `training_dummy_hi16bit.svg`; falls back to `training_dummy_high.png`. | `VC-122 hi16bit` |
| `training_dummy` | enemy | `high` | Same as above | Yes | `training_dummy_high.png` wobbles smoothly in `idle`; `destroy` vs `"broken"` mismatch in `enemies.json`. | `new` (align `deathAnimation` / `states`) |
| `training_target` | enemy | `hi8bit` | Uses `presetId: "training_dummy"` | No | Inherits `training_dummy` `hi8bit` `freeform_rects` mismatch -> box flicker. | `VC-121 fix` + `VC-123 hi8bit` |
| `training_target` | enemy | `hi16bit` | Same as above | Yes (fallback) | Falls back to `training_dummy_high.png`. | `VC-122 hi16bit` |
| `training_target` | enemy | `high` | Same as above | Yes | Shares `training_dummy_high.png`; plays smoothly. | — |
| `grand_dummy` | enemy | `hi8bit` | Uses `presetId: "training_dummy"` | No | Inherits `training_dummy` `hi8bit` `freeform_rects` mismatch -> box flicker. | `VC-121 fix` + `VC-123 hi8bit` |
| `grand_dummy` | enemy | `hi16bit` | Same as above | Yes (fallback) | Falls back to `training_dummy_high.png`. | `VC-122 hi16bit` |
| `grand_dummy` | enemy | `high` | Same as above | Yes | Shares `training_dummy_high.png`; plays smoothly. | — |
| `aether_archon` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death` animations. | `VC-123 hi8bit` |
| `aether_archon` | enemy | `hi16bit` | Same as above | Yes | Orbiting orbs and tail sway smoothly; missing `attack` and `death` animations. | `new` (add `attack`/`death`) |
| `aether_archon` | enemy | `high` | Same as above | Yes (fallback) | No `aether_archon_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `aether_sentinel` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; simple placeholder chest sigil; missing `attack` and `death`. | `VC-123 hi8bit` |
| `aether_sentinel` | enemy | `hi16bit` | Same as above | Yes | Floating arms & tendrils animate cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `aether_sentinel` | enemy | `high` | Same as above | Yes (fallback) | No `aether_sentinel_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `aether_wisp` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `aether_wisp` | enemy | `hi16bit` | Same as above | Yes | Orbiting shards animate cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `aether_wisp` | enemy | `high` | Same as above | Yes (fallback) | No `aether_wisp_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `bastion_sentinel_boss` | enemy | `hi8bit` | `idle` (r0, 4f), `move` (r1, 4f), `attack` (r2, 4f) | Yes (fallback) | `variants.low` missing from meta, so `hi8bit.svg` (`192x144`) is ignored and falls back to `hi16bit.svg`; crude placeholder art; missing `hit` and `death`. | `VC-123 hi8bit` |
| `bastion_sentinel_boss` | enemy | `hi16bit` | Same as above | Yes | Crude blocky placeholder (`256x192`); `states.hit` maps to `idle`; missing `hit` and `death`. | `VC-122 hi16bit` |
| `bastion_sentinel_boss` | enemy | `high` | Same as above | Yes (fallback) | No `bastion_sentinel_boss_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `chasm_crawler` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `chasm_crawler` | enemy | `hi16bit` | Same as above | Yes | Legs and pincers animate cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `chasm_crawler` | enemy | `high` | Same as above | Yes (fallback) | No `chasm_crawler_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `chrono_hound` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `chrono_hound` | enemy | `hi16bit` | Same as above | Yes | Legs stride and wind-up key spins smoothly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `chrono_hound` | enemy | `high` | Same as above | Yes (fallback) | No `chrono_hound_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `clockwork_automaton` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `clockwork_automaton` | enemy | `hi16bit` | Same as above | Yes | Saw arm, legs, and steam puff animate cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `clockwork_automaton` | enemy | `high` | Same as above | Yes (fallback) | No `clockwork_automaton_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `court_sentinel` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `court_sentinel` | enemy | `hi16bit` | Same as above | Yes | Walk cycle advances cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `court_sentinel` | enemy | `high` | Same as above | Yes (fallback) | No `court_sentinel_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `gear_mite` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `gear_mite` | enemy | `hi16bit` | Same as above | Yes | Scuttle cycle advances cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `gear_mite` | enemy | `high` | Same as above | Yes (fallback) | No `gear_mite_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `lantern_warden` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | Advances cleanly; missing `attack` and `death`. | `VC-123 hi8bit` |
| `lantern_warden` | enemy | `hi16bit` | Same as above | Yes | Eye and dangling chains animate cleanly; missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `lantern_warden` | enemy | `high` | Same as above | Yes (fallback) | No `lantern_warden_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `shadow_knight` | enemy | `hi8bit` | `idle` (r0, 4f), `move` (r1, 4f), `attack` (r2, 4f) | Partial (fallback) | `variants.low` missing from meta, so `hi8bit.svg` (`192x144`) is ignored and falls back to `hi16bit.svg`; crude blocky placeholder; minimal leg motion; missing `hit` and `death`. | `VC-123 hi8bit` |
| `shadow_knight` | enemy | `hi16bit` | Same as above | Partial | Crude blocky placeholder (`256x192`); minimal walk motion; `states.hit` maps to `idle`; missing `hit` and `death`. | `VC-122 hi16bit` |
| `shadow_knight` | enemy | `high` | Same as above | Partial (fallback) | No `shadow_knight_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `thorn_creeper` | enemy | `hi8bit` | `idle` (r0, 2f), `move` (r1, 4f), `hit` (r2, 2f) | Yes | `speed: 0` in `enemies.json` so `move` is unused; missing `attack` and `death`. | `VC-123 hi8bit` |
| `thorn_creeper` | enemy | `hi16bit` | Same as above | Yes | Missing `attack` and `death`. | `new` (add `attack`/`death`) |
| `thorn_creeper` | enemy | `high` | Same as above | Yes (fallback) | No `thorn_creeper_high.png`; falls back to `hi16bit.svg`. | `new` (high PNG) |
| `aether_gate` | structure | `hi8bit` | `idle` (r0, 7f), `light_up` (r1, 8f), `action` (r2, 5f), `close_up` (r3, 6f), `info` (r4, 9f) | No | `hi8bit.svg` is `48x240` (1 frame/row) while meta uses `high` `freeform_rects`. | `VC-121 fix` + `VC-123 hi8bit` |
| `aether_gate` | structure | `hi16bit` | Same as above | Yes (fallback) | Missing `aether_gate_hi16bit.svg`; falls back to `aether_gate_high.png`. | `VC-122 hi16bit` |
| `aether_gate` | structure | `high` | Same as above | Yes | `aether_gate_high.png` present with `freeform_rects`. | — |
| `chrono_lever` | structure | `hi8bit` | `idle` (r0, 6f), `activating` (r1, 6f), `active` (r2, 6f) | Static in idle | `hi8bit.svg` is `288x144` (`48x48` cells) vs meta `96x96`; idle frames appear static. | `VC-123 hi8bit` |
| `chrono_lever` | structure | `hi16bit` | Same as above | Static (fallback) | Missing `chrono_lever_hi16bit.svg`; falls back to `chrono_lever_high.png`. | `VC-122 hi16bit` |
| `chrono_lever` | structure | `high` | Same as above | Static in idle | Renders crisp lever in idle; `activating`/`active` not triggered in passive review. | — |
| `grand_portcullis` | structure | `hi8bit` | `closed` (r0, 6f), `opening` (r1, 6f), `open` (r2, 6f) | Static in closed | `hi8bit.svg` is `288x288` (`48x96` cells) vs meta `96x192`; closed state is static. | `VC-123 hi8bit` |
| `grand_portcullis` | structure | `hi16bit` | Same as above | Static (fallback) | Missing `grand_portcullis_hi16bit.svg`; falls back to `grand_portcullis_high.png`. | `VC-122 hi16bit` |
| `grand_portcullis` | structure | `high` | Same as above | Static in closed | Renders crisp gate in closed state; `opening`/`open` not triggered in passive review. | — |
| `hazard_thorns` | structure | `hi8bit` | `idle` (r0, 6f), `active` (r1, 6f) | Static in idle | `hi8bit.svg` is `576x64` (`96x32` cells) vs meta `192x64`; idle frames appear static. | `VC-123 hi8bit` |
| `hazard_thorns` | structure | `hi16bit` | Same as above | Static (fallback) | Missing `hazard_thorns_hi16bit.svg`; falls back to `hazard_thorns_high.png`. | `VC-122 hi16bit` |
| `hazard_thorns` | structure | `high` | Same as above | Static in idle | Renders crisp spikes in idle. | — |
| `hanging_lantern` | prop | `hi8bit` | `frames: 4`, `fps: 6` | Fallback | `variants.low` missing from `_prop_meta.json`, so `hanging_lantern_hi8bit.svg` (`64x32`) is never loaded; falls back to `mid`. | `VC-123 hi8bit` (add `variants.low`) |
| `hanging_lantern` | prop | `hi16bit` | `frames: 4`, `fps: 6` | Yes | `hanging_lantern_hi16bit.svg` (`128x64`, `32x64` frames) declared as `variants.mid`. | — |
| `hanging_lantern` | prop | `high` | `frames: 4`, `fps: 6` | Fallback | No `hanging_lantern_high.png`; falls back to `mid` (`hi16bit.svg`). | `new` (high PNG) |
