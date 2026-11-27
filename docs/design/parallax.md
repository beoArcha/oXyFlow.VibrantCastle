# Parallax: engine review, asset taxonomy and work plan (VC-100)

Status: proposed (VC-100, phase 4, 0.3.x). Owner request 2026-11-27. This doc is the contract for VC-101..VC-109.
Line numbers refer to `origin/main` at a9ac1bc.

**Target layer model per world:** 1 `far` background + 3 standard variations (up to 5) for the mid / close bands, combined
differently across the world's 8 maps, + zone variants. A zone (boss, rest, others) swaps the map's **closest** layer for a
slightly different variant. Every image exists as `hi8bit` / `hi16bit` / `high` PNG (code keys `low` / `mid` / `high`),
plus two image-free modes, `simplified` and `off`. Layers and effects load one after another.

---

## 1. Engine review (ranked by impact)

The pipeline today: `LocationParser.parse` → `resolveLocationParallaxLayers` (registry hydration, at module load in
`src/game/locations/definitions/*.ts:7`) → `GameRenderer.render` → `ParallaxRenderer.render` → (always)
`MultiLayerBackgroundSystem.render` → `renderTiledDynamicLayer` / `drawHorizontalTiles`. Textures come from the global
`assetLoader`. `LocationAssetLifecycle` preloads the current map and its portal neighbours.

| # | Impact | Finding | Evidence |
|---|---|---|---|
| F1 | **High** (one place, DRY) | **Two image pipelines, one of them dead.** `ParallaxRenderer` hands off to `MultiLayerBackgroundSystem` whenever `isSupported()` is true, and that is true for all 8 shipped ids plus any location with an `image` layer. All 49 shipped layers are `type: "image"`, so the `ParallaxRenderer` switch, `ParallaxImageRenderer` and the 5 procedural sub-renderers (about 900 lines) are unreachable from shipped content. The two paths duplicate preload/getImage and draw `far` differently (one plain cover-fit, the other with 6 % overscan and pan). | `parallaxRenderer.ts:94-107`, `:135-278`; `multiLayerBackgroundSystem.ts:46-55`, `:114-127`; preload/getImage twice: `parallax/parallaxImageRenderer.ts:34-50` and `multiLayerBackgroundSystem.ts:129-146`; far twice: `parallaxImageRenderer.ts:68-79` and `multiLayerBackgroundSystem.ts:398-453` |
| F2 | **High** (performance) | **Overdraw and decode cost.** Each frame does about 8 full-viewport passes before gameplay: the canvas fill, a gradient under `far`, `far` at 1.06 x 1.03 overscan, 4 dynamic tiers (each at least the viewport height), sector atmosphere, plus the boss layers. At DPR 2 (capped) the backing store is up to ~8 Mpx, so that is roughly 60 Mpx per frame, or 7 Gpx/s at 120 Hz. Three mid layers and both boss layers use `screen` blending to fake alpha on JPGs. Images load through `new Image()` with no `decode()` / `createImageBitmap`, so the first `drawImage` of a 6 MB texture decodes on the main thread and the frame hitches on map entry. Sources (2048-2172 px wide) are resampled every frame. | `renderer.ts:163-164`; `multiLayerBackgroundSystem.ts:424-425`, `:442-450`, `:325-331`; `background/parallaxGeometry.ts:30-33`; `hud/hooks/useResponsiveCanvas.ts:26`; screen blend: `parallaxLayerRegistry.ts:228-229`, `:249-250`, `:279-280`, `:387-400`; `engine/assetLoader.ts:161` |
| F3 | **High** (scales to 8x8) | **World identity comes from the location id.** The supported-world set, the `thorn_chasm` colour special case and the sector-atmosphere `switch` all key on `location.id`. Maps 2-8 are named `<worldId>_m<m>` (maps-contract §1), so `courtyard_m2` silently loses its atmosphere and takes the default colours. | `multiLayerBackgroundSystem.ts:46-55`, `:410-411`; `background/atmospheric/atmosphericSectorRenderer.ts:92-114` |
| F4 | **High** (DI, registry design) | **Registry and loader are global singletons, and hydration mutates.** The catalog is a module-level array of 33 static imports with a module-level lookup map. Hydration mutates the parsed location and overloads `imageUrl` (it holds a key in the JSON and a URL afterwards). Lookup is ambiguous: `layerKey ?? imageUrl ?? id`, plus 2 aliases per entry. The renderers import `assetLoader` and `debugManager` directly, inside `render()`. (Good: `ParallaxRenderer` and `LocationAssetLifecycle` already take optional deps.) | `parallaxLayerRegistry.ts:5-43`, `:405-413`, `:432-450`, `:433-436`; `parallaxImageRenderer.ts:9`; `multiLayerBackgroundSystem.ts:7-8`, `:155`; `background/parallaxTiling.ts:6`, `:146` |
| F5 | Medium (SRP) | **Layer semantics are guessed from strings.** `resolveBackgroundTier` infers the tier from substrings of the id, with a fallback by depth. `ParallaxImageRenderer` has its own `id.includes("_far")` rule. Per-tier default speeds live in `DEFAULT_TIER_SPEEDS`, in every JSON and in the old manifesto table, and they disagree (`mid_far` 0.2 vs 0.18). The default boss opacities are written twice. | `parallaxTiling.ts:30-62`; `parallaxImageRenderer.ts:68`; `multiLayerBackgroundSystem.ts:372` vs `parallaxLayerRegistry.ts:387`, `:399` |
| F6 | Medium (zero-alloc rule) | **Allocations inside `render()`.** Template-string cache keys are built every frame, and stop-array literals are built every frame. The debug wireframe allocates a string and a dash array per layer. The gradient caches are keyed by viewport size and never pruned, so they grow on every resize. | `multiLayerBackgroundSystem.ts:414`, `:419-422`, `:475`, `:485-488`; `atmosphericSectorRenderer.ts:132`, `:175`, `:203`, `:231`, `:259`, `:288`, `:315`, `:342`, `:371`; `parallaxTiling.ts:175`, `:179` |
| F7 | Medium (loading) | **Loading is all at once, high tier only.** A map's layers load through `Promise.all` with no order or priority. Neighbours preload every layer at `high` (about 36 MB decoded per map). The renderers' `preload()` methods are never called. There are no tiers and no off mode. | `locations/locationAssetLifecycle.ts:100-104`, `:150-155`; `parallaxRenderer.ts:76-78` |
| F8 | Low-medium (FAR invariant) | **`opaque` is declarative only.** It is checked in JSON but never read by the engine. The engine still paints a gradient under the opaque `far` and accepts `far` opacity below 1. Physically the invariant holds: the 5 PNG fars are colour type 2 (RGB, no alpha) and the 3 JPGs have no alpha. Nothing tests the pixels. | `locationSchema.ts:55`; `tests/arch/locationBlueprints.test.ts:258-276`; `multiLayerBackgroundSystem.ts:424`, `:436-438`; `parallaxImageRenderer.ts:73-75` |
| F9 | Low | **Mirror tiles churn state.** `drawHorizontalTiles` does save/translate/scale/restore for every mirrored tile, and the procedural sub-renderers are hard-wired to `location.id`. Both are fine at today's scale; they are noted for VC-108. | `parallaxTiling.ts:89-95` |

What is already good and should be kept:

* The tiling geometry: shared rounded edges, `MAX_LAYER_UPSCALE`, ping-pong Y drift (`parallaxGeometry.ts`, `parallaxTiling.ts:70-100`), with unit tests.
* The smoothstep boss-zone feather (`multiLayerBackgroundSystem.ts:163-207`).
* The procedural far fallback while the far image loads.
* The neighbour-bounded eviction in `LocationAssetLifecycle`.
* The seam checker (`scripts/check-parallax-seams.ts`, `scripts/parallax/seamMetrics.ts`).
* The `parallaxFiles` arch test.

## 2. Asset inventory (today)

33 images, 41.0 MB on disk, about 182 MB if all are decoded (w x h x 4). Only the `high` tier exists, and there are no metas.

| World (W) | Folder | Files (far, mid_far, mid, mid_close, close) | Size px | KB each | Notes |
|---|---|---|---|---|---|
| courtyard (1) | `bg/courtyard/` | `courtyard_{far,mid-far,mid,mid-close,close}_high.png` | 2048x768 | 1968-2371 (10.6 MB total) | hyphens, unlike every other world |
| thorn_chasm (2) | `bg/thorn_chasm/` | `..._far, _mid_far, _mid, _close_mid, _close` | 2172x724 (mid **2171**) | 672-1316 | `close_mid` is reversed; odd width |
| ashen_catacombs (3) | `images/` | `ashen_catacombs_far_1795727387342.jpg`, `shared_mid_catacomb_arches_1795727389151.jpg` | 1376x768 | 765, 724 | timestamp names, JPG, no alpha; mid_far / mid_close / close borrowed from W2 / W7 / W1 |
| clocktower (4) | `bg/clocktower/` | `clocktower_{far,mid_far,mid,mid_close,close}_high.png` | 2172x724 | 1291-1714 | consistent |
| alchemist_library (5) | `images/` | `alchemist_library_far_….jpg`, `shared_mid_alchemy_shelves_….jpg` | 1376x768 | 973, 890 | borrows W6 mid_far, W4 mid_close, W6 close |
| aether_sanctuary (6) | `bg/aether_sanctuary/` | 5 x `_high.png` | far 2048x768, rest 2172x724 | 823-1900 | the far size differs from its own layers |
| grand_bastion (7) | `bg/grand_bastion/` | 5 x `_high.png` | far **2050x767**, rest 2172x724 | 520-1241 | odd far size |
| eclipse_crown (8) | `images/` | `eclipse_crown_far_….jpg`, `shared_mid_obsidian_spires_….jpg`, `boss_world_eclipse_throne_….jpg` | 1376x768 | 675-801 | borrows W7 mid_far / close, W6 mid_close |
| (all worlds) | `images/` | `boss_stage_arcane_sigil_1795727392388.jpg` | 1376x768 | 762 | one sigil overlay for all 8 stage-boss zones |

Registry keys today: `world:<id>:far`, `shared:<tier>:<motif>_a`, `boss:<scope>:<motif>`, plus 2 aliases each (`bg_*` and the
file stem). No world has a zone variant of its close layer; the boss layers are full-screen `screen` overlays.

## 3. Taxonomy

### 3.1 Files

```
src/assets/parallax/<worldId>/<worldId>_far_<fileTier>.png
src/assets/parallax/<worldId>/<worldId>_var_<a..e>_<fileTier>.png
src/assets/parallax/<worldId>/<worldId>_var_<x>_zone_<zoneKind>_<fileTier>.png
src/assets/parallax/<worldId>/<worldId>_fx_<effectId>_<fileTier>.png
src/assets/parallax/_shared/fx_<effectId>_<fileTier>.png
src/assets/parallax/<worldId>/<worldId>_parallax_meta.json
```

* `fileTier` is `hi8bit` | `hi16bit` | `high`. These are the repo's file tier names (content rules §6.1).
* The world prefix keeps every basename unique, which matters for bundler output, devtools and seam-checker reports. It
  also matches the `<id>_<tier>` convention used by heroes, tiles and props.
* `snake_case` only, no timestamps, no hyphens. Allowed characters: `[a-z0-9_]`.
* The old suggestion `far.<tier>.png` was rejected: 8 identical basenames, and it breaks the repo convention.
* A zone variant names the variation it replaces (`var_c_zone_boss`), so "slightly different variant of the closest
  layer" is explicit and checkable.
* Zone kinds: `boss` | `rest` | `secret` | `story` (an extensible enum; new kinds are added to the schema).
* `fx_` files are image effects (today's sigil and throne overlays), never part of a combination.
* Placeholders have **no file**. Their colours live in the meta.

### 3.2 Meta: one file per world (`<worldId>_parallax_meta.json`)

```jsonc
{
  "worldId": "courtyard",
  "placeholder": { "top": "#2a150b", "bottom": "#0d0502", "silhouette": "#1a0c06" },
  "layers": {
    "far":   { "band": "far", "depth": 0.08, "speed": [0.04, 0.02], "opaque": true, "fit": "cover", "overscan": [1.06, 1.03] },
    "var_a": { "band": "mid_far", "depth": 0.24, "speed": [0.18, 0.07], "tiling": "repeat", "labelKey": "parallax.courtyard.var_a" },
    "var_b": { "band": "mid", "depth": 0.45, "speed": [0.36, 0.12], "tiling": "mirror", "opacity": 1, "tint": null },
    "var_c": { "band": "close", "depth": 0.86, "speed": [0.78, 0.24], "tiling": "repeat", "drift": [0, 0],
               "zones": { "boss": {}, "rest": { "tint": "#f5b04a22" } } },
    "var_d": { "band": "mid_close", "source": "grand_bastion:var_c" }
  },
  "effects": { "haze": { "kind": "procedural", "band": "mid" }, "sigil": { "kind": "image", "source": "_shared:fx_sigil", "blend": "screen" } },
  "generated": {
    "var_b": { "tiers": { "high": [2048, 768, 2300], "hi16bit": [1024, 384, 410] }, "seam": [3.1, 2.7, "pass"], "avg": "#3b2414" }
  }
}
```

| Field | Authored / generated | Meaning |
|---|---|---|
| `band` | authored | `far` \| `mid_far` \| `mid` \| `mid_close` \| `close`. Replaces the tier string guessing (F5). |
| `depth`, `speed [x,y]`, `drift [x,y]` | authored | Draw order and parallax factors. **Defaults per band live only in the meta schema module** (one place). |
| `opacity`, `tint`, `blend` | authored | Blend defaults to `source-over`. `screen` is only allowed on `fx_` and on legacy JPG layers until VC-109. |
| `tiling` | authored | `none` (far) \| `repeat` \| `mirror`. Replaces `mirrorTile`, set from the seam verdict. |
| `opaque` | authored | Only on `far`, and must be `true` there. |
| `zones.<kind>` | authored | Declares that `var_x_zone_<kind>_*` exists. It may override `tint` / `opacity`. An empty object means the variant file is drawn as is. |
| `source` | authored | A borrowed layer `<worldId>:<slot>` (no file in this folder). It is temporary; VC-109 replaces it with own art. |
| `placeholder` | authored, seeded from `generated.avg` | The colours used for `off` / `simplified` and while loading. |
| `generated.*` | **script only** | Per tier: width, height, KB; seam diff, floor and verdict; average colour. Written by `bun scripts/parallax/buildMeta.ts`. A `test:scripts` check fails when it is out of sync. |

### 3.3 Registry keys

`<worldId>:far`, `<worldId>:var_<x>`, `<worldId>:var_<x>@<zoneKind>`, `<worldId>:fx_<id>`, `_shared:fx_<id>`.

* The tier is **not** part of the key; it is resolved at load time (§3.6).
* There are no aliases. JSON references keys only, in fields named `layers` / `effects`, never `imageUrl`.
* The registry is built once from the metas: `import.meta.glob` over `parallax/*/*_parallax_meta.json` and the PNGs.
* It is exposed as an injectable `ParallaxRegistry` interface, and the renderer receives resolved layer handles.

### 3.4 Map selection (location JSON)

```jsonc
"parallax": {
  "layers": ["var_a", "var_b", "var_c"],   // the combination for this map (1-4 of the world's 3-5 variations); far is implicit
  "overrides": { "var_b": { "opacity": 0.8 } },
  "effects": ["haze"],
  "box": { "width": 5400, "height": 1160 }
},
"zones": [
  { "id": "courtyard_trial_square", "kind": "boss", "scope": "stage", "x": 2660, "y": 180, "width": 580, "height": 540,
    "bossEnemyId": "courtyard_captain_1", "ambientColor": "rgba(245,158,11,0.22)", "effects": ["sigil"], "featherPx": 260 }
]
```

* The world comes from the blueprint's `worldId` (maps-contract §1), never from the location id. This fixes F3.
* Layers are drawn back to front by meta `depth`. The **closest layer** is the one with the highest depth in the
  combination, and only that layer is ever swapped by zones.
* `zones` generalises `bossZones`; `kind: "boss"` plus `scope` keeps the maps-contract boss rules.
  `boss_stage` / `boss_world` stop being layer tiers and become zone effects.
* Validator rules (`scripts/validate-level.ts`):
  * `PARALLAX_COMBO`: 1-4 keys, all exist in the world meta, no duplicates.
  * `PARALLAX_ZONE`: warns when a zone kind has no variant for the closest layer.

### 3.5 Zone swap and transition

* **Weight.** A spatial weight `w` in [0,1] uses today's smoothstep feather (camera centre to zone rect, `featherPx`,
  default 260). This is deterministic and needs no timers.
* **Drawing.** For the closest layer, draw the base with alpha `1-w` and the variant with alpha `w`, using the same
  geometry and the same tile phase. Outside a transition only one image is drawn, so the zone swap adds overdraw only
  while the player is crossing the feather.
* **Overlapping zones.** The highest `w` wins; ties go to `boss`, then `story`, `rest`, `secret`. Zone `effects` fade
  with the same `w`.
* **Fallbacks.** No variant file at the active tier means: try the other tiers, then keep the base layer and apply the
  zone `tint` / `ambientColor` at `w`. VC-103 can therefore ship before VC-109 art exists.

### 3.6 Tiers and the image-free modes

The Display setting `parallaxQuality` takes `auto | high | mid | low | simplified | off`. `auto` picks from device
signals and is lowered by the VC-108 runtime guard.

| Mode | What draws | Images loaded | Fallback order per layer |
|---|---|---|---|
| `high` / `mid` / `low` | far + combination + zone variant + effects | the requested tier | reuse `atlasVariantResolver`'s chain (high→mid→low, mid→high→low, low→mid→high), then the placeholder |
| `simplified` | the placeholder gradient (`top`/`bottom`) + the closest layer at `low` only + procedural effects off | 1 small image | low → placeholder silhouette band (a flat `silhouette` colour rect) |
| `off` | the placeholder gradient only; no effects | none | n/a |

Tier size targets (VC-106 confirms them):

| Layer | `high` | `hi16bit` | `hi8bit` |
|---|---|---|---|
| far | 2048x1152 | 1024x576 | 512x288 |
| variations / zones | height 1024, width ≤ 2560 | height 512, width ≤ 1280 | height 256, width ≤ 640 |

Widths are multiples of 8, and each variation tiles or is marked `mirror`.

Decoded budget per map at `high`: about 60 MB. Neighbours are preloaded at `low` only (about 3 MB each).

### 3.7 Progressive load order

One `ParallaxLoadQueue` (injected) serves all parallax images. It runs one image at a time (2 at most on fast devices),
decodes with `createImageBitmap` or `img.decode()` before an image becomes drawable, and cancels on map change by
generation counter. Priorities:

| P | Item | Shown meanwhile |
|---|---|---|
| 0 | the placeholder gradient (no I/O, available on frame 1) | — |
| 1 | `far` at the active tier (if a `low` copy is already cached, draw it first and refine) | the placeholder |
| 2 | combination layers, back to front | nothing for that layer; each fades in over 200 ms |
| 3 | zone variants of the closest layer, nearest zone first | the base layer + tint |
| 4 | image effects (`fx_`), then procedural effects are enabled | — |
| 5 | idle: neighbour maps' `far` + closest layer at `low` | — |

## 4. Migration plan

### 4.1 Rename map

A script, `scripts/parallax/migrate.ts`, moves the files with `git mv` from this table, so no hand renames drift. The
pattern rows apply to all 5 PNG worlds W ∈ {courtyard, thorn_chasm, clocktower, aether_sanctuary, grand_bastion}.

| Old file | New file | Old key | New key |
|---|---|---|---|
| `bg/W/W_far_high.png` | `parallax/W/W_far_high.png` | `world:W:far` | `W:far` |
| `bg/W/W_mid_far_high.png` (courtyard: `mid-far`) | `parallax/W/W_var_a_high.png` | `shared:mid_far:<motif>_a` | `W:var_a` |
| `bg/W/W_mid_high.png` | `parallax/W/W_var_b_high.png` | `shared:mid:<motif>_a` | `W:var_b` |
| `bg/W/W_mid_close_high.png` (courtyard `mid-close`, thorn_chasm `close_mid`) | `parallax/W/W_var_c_high.png` | `shared:mid_close:<motif>_a` | `W:var_c` |
| `bg/W/W_close_high.png` | `parallax/W/W_var_d_high.png` | `shared:close:<motif>_a` | `W:var_d` |
| `images/ashen_catacombs_far_1795727387342.jpg` | `parallax/ashen_catacombs/ashen_catacombs_far_high.jpg` | `world:ashen_catacombs:far` | `ashen_catacombs:far` |
| `images/shared_mid_catacomb_arches_1795727389151.jpg` | `parallax/ashen_catacombs/ashen_catacombs_var_b_high.jpg` | `shared:mid:catacomb_arches_a` | `ashen_catacombs:var_b` |
| `images/alchemist_library_far_1795727386557.jpg` | `parallax/alchemist_library/alchemist_library_far_high.jpg` | `world:alchemist_library:far` | `alchemist_library:far` |
| `images/shared_mid_alchemy_shelves_1795727389972.jpg` | `parallax/alchemist_library/alchemist_library_var_b_high.jpg` | `shared:mid:alchemy_shelves_a` | `alchemist_library:var_b` |
| `images/eclipse_crown_far_1795727388177.jpg` | `parallax/eclipse_crown/eclipse_crown_far_high.jpg` | `world:eclipse_crown:far` | `eclipse_crown:far` |
| `images/shared_mid_obsidian_spires_1795727392169.jpg` | `parallax/eclipse_crown/eclipse_crown_var_b_high.jpg` | `shared:mid:obsidian_spires_a` | `eclipse_crown:var_b` |
| `images/boss_world_eclipse_throne_1795727391907.jpg` | `parallax/eclipse_crown/eclipse_crown_fx_throne_high.jpg` | `boss:world:eclipse_throne_colossus` | `eclipse_crown:fx_throne` |
| `images/boss_stage_arcane_sigil_1795727392388.jpg` | `parallax/_shared/fx_sigil_high.jpg` | `boss:stage:arcane_sigil_arena` | `_shared:fx_sigil` |

Borrowed layers become meta `source` entries, so no file is copied:

* ashen_catacombs: `var_a` ← `thorn_chasm:var_a`, `var_c` ← `grand_bastion:var_c`, `var_d` ← `courtyard:var_d`.
* alchemist_library: `var_a` ← `aether_sanctuary:var_a`, `var_c` ← `clocktower:var_c`, `var_d` ← `aether_sanctuary:var_d`.
* eclipse_crown: `var_a` ← `grand_bastion:var_a`, `var_c` ← `aether_sanctuary:var_c`, `var_d` ← `grand_bastion:var_d`.

The 8 JPGs keep their format under a taxonomy test allow-list that expires with VC-109. Re-encoding them to PNG would
triple their size without adding alpha.

Each map's combination today is `["var_a","var_b","var_c","var_d"]`, which is behaviour-preserving. The far is implicit,
and the boss layers become zone `effects`.

### 4.2 Reuse vs regenerate (VC-109)

| Asset | Decision |
|---|---|
| 5 PNG fars | **Reuse** as `high`. Normalise grand_bastion 2050x767 → 2048x768 by crop, and derive `hi16bit` / `hi8bit` by quantised downscale (the hero quantizer approach). |
| 20 PNG variations | **Reuse** as `high`. Fix thorn_chasm 2171 → 2172 px. Derive the lower tiers. Re-run the seam checker. |
| 3 JPG fars | **Regenerate** as PNG (no alpha needed, but tier set and size spec). |
| 3 JPG mids (screen-blended) | **Regenerate** with true alpha. This removes `screen` from the layer path (F2). |
| 9 borrowed slots | **Generate** own art for each world (3 per JPG world). |
| Zone variants (`var_d_zone_boss`, `_rest`) | **Generate** for all 8 worlds (16 minimum). |
| Sigil / throne fx | **Reuse** until a per-world sigil is wanted (owner decision, not blocking). |
| W6 / W5 cyan palettes | Out of scope; follows the autumn palette review in VISION. |

## 5. PR cut (VC-101..VC-109)

Each PR is one small branch from `origin/main`, with at most 4 build/test delegates at once. "∥" means the PR can run in
parallel with the PRs listed, without file conflicts.

| PR | Scope | Main files | Tests | Acceptance | Depends / ∥ |
|---|---|---|---|---|---|
| **106a** perf harness | Headless Playwright run with a scripted camera path per map, at 1x and 2x DPR. Records frame p50 / p95, dropped frames, decoded MB, time to first parallax frame. Writes a JSON report and a budget check. | `scripts/perf/parallax*.ts`, `src/tests/e2e/perf/`, `docs/perf/baseline.json` | script tests for the report and budget logic | baseline stored **before** VC-102 merges; budgets: p95 ≤ 8.3 ms desktop at 120 Hz, ≤ 16.6 ms tablet profile | none; ∥ all |
| **107a** visual review | Contact sheet per map x tier x viewport (desktop, laptop, tablet) plus 3 s clips. Builds a gallery HTML page in `dist-review/` (git-ignored). | `scripts/review/parallaxSheet.ts` | script test (grid layout) | one command produces a gallery of all 8 maps | none; ∥ all |
| **101a** move + rename | `migrate.ts` and the §4.1 table; registry import paths updated, keys unchanged; seam checker root moves to `parallax/` | `src/assets/parallax/**`, `parallaxLayerRegistry.ts` (imports only), `scripts/check-parallax-seams.ts` | `parallaxFiles`, the seam test | no file outside `parallax/`, no timestamp or hyphen names; game identical | none; ∥ 102a/b, 106, 107 |
| **101b** metas | 8 `*_parallax_meta.json`, the meta types and band defaults module, `buildMeta.ts` (sizes, seam, avg colour) | `src/game/parallax/meta/`, `scripts/parallax/buildMeta.ts`, metas | unit tests (schema, defaults); script test (meta in sync); new arch `parallaxTaxonomy.test.ts` (names, far colour type without alpha, `zones` ⇒ files exist) | metas generated, test green | 101a; ∥ 102a/b |
| **101c** keys + JSON | Registry built from metas (glob) behind `ParallaxRegistry`; location JSON `parallax` + `zones` shape; parser; drop aliases, `imageUrl` keys and `bossZones`; validator rules | `parallaxLayerRegistry.ts` → `src/game/parallax/registry.ts`, `locationSchema.ts`, `locationParser`, 8 JSON, `validate-level.ts`, `locationBlueprints.test.ts` | arch + unit; screenshots before and after (107) | no hydration mutation; JSON holds keys only | 101b, 102a; **owns `locationSchema.ts`** |
| **102a** one pipeline | Delete the dead image path (`ParallaxImageRenderer`, the image branch of `ParallaxRenderer`). One `ParallaxSystem` with injected `registry`, `loader`, `flags` (replaces the `debugManager` reads). Procedural renderers move behind a `PlaceholderRenderer` used by `simplified` / `off`. | `src/game/renderer/parallax*`, `multiLayerBackgroundSystem.ts` → `src/game/parallax/render/`, `renderer.ts` (wiring), `LevelPreviewCanvas.tsx` | unit per unit with fakes; existing geometry tests unchanged | pixel-identical strip in 107; no `assetLoader` / `debugManager` import under `parallax/render` (arch test) | none; ∥ 101a/b |
| **102b** render hygiene | Precompute gradient keys and stops on location change or resize (bounded cache); no template strings or literals in `render()`; skip the under-far fill and the canvas fill when the far is drawn and opaque; clamp far alpha to 1; world-keyed atmosphere (`worldId`) | `parallax/render/*`, `atmosphericSectorRenderer.ts`, `renderer.ts:163` | unit tests: an allocation spy over 1,000 frames; `courtyard_m2` fixture gets its atmosphere | 106 shows fewer full-screen passes (-2) and no regression | 102a |
| **104** progressive loading | `ParallaxLoadQueue` (priorities §3.7, concurrency 1-2, `createImageBitmap`, generation cancel, fade-in); `LocationAssetLifecycle` delegates to it; neighbours at `low` | `src/game/parallax/loading/`, `locationAssetLifecycle.ts` | unit tests with a fake loader and clock (order, cancel, refine low→high) | first frame never waits; measured time to first parallax frame; no decode hitch over 4 ms in 106 | 102a; ∥ 103 (different folders), ∥ 105a |
| **103** zones | Zone resolver (weight, priority), closest-layer crossfade, zone effects, tint fallback | `src/game/parallax/zones/`, a small hook in `parallax/render` | unit (weights, ties, fallback); 107 strip entering a boss zone | smooth swap; one extra draw only inside the feather | 101c, 102a; ∥ 104 |
| **105a** setting | `parallaxQuality` Display setting, i18n PL / EN, `auto` device heuristic | `src/game-menu/**` display settings, `src/i18n/**`, settings types | UI unit tests | the setting persists and is read by the engine snapshot | none (pure UI + type); ∥ all except 105b |
| **105b** tier resolution | The registry picks tier files via the shared `atlasVariantResolver` chain; `simplified` / `off` paths | `parallax/registry.ts`, `parallax/render/PlaceholderRenderer` | unit (chains, modes); 106 runs per mode | `off` loads 0 images; `simplified` loads 1 | 101c, 104, 105a |
| **108 r1 / r2 / r3** | Optimisation rounds: desktop Chromium; then Firefox + WebKit; then tablet / low-power (CPU 4x throttle, DPR 2, reduced layers, `auto` downgrade guard) | wherever 106 points; mostly `parallax/render`, `loading` | 106 budgets in CI (r1 sets the gate) | budgets met per profile; a report each round | 106a, 102b; rounds sequential |
| **109-W1..W8** | Art per world: own variations, zone variants (`boss`, `rest`), the 3 tiers, the PNG replacements for the JPGs, placeholder colours; re-run `buildMeta` and seams | `src/assets/parallax/<worldId>/` + that world's meta only | taxonomy arch test; the JPG allow-list shrinks | contact sheet approved by the orchestrator / owner | 101b, 105b (size spec); **8 PRs ∥ each other** (4 at a time) |

**Suggested waves**

| Wave | PRs |
|---|---|
| 1 | 106a ∥ 107a ∥ 101a ∥ 102a |
| 2 | 101b ∥ 102b ∥ 105a |
| 3 | 101c, then 104 ∥ 103 |
| 4 | 105b, then 108 r1..r3 ∥ 109-W* (4 at a time) |

Shared-file hotspots:

* `locationSchema.ts`: only 101c touches it.
* `renderer.ts`: 102a, then 102b, in sequence.
* `locationAssetLifecycle.ts`: only 104 touches it.

## 6. Open owner decisions (not blocking VC-101/102)

1. The `high` tier size: 1024 px tall (proposed), or keep 768 and accept softness at DPR 2.
2. Whether the stage-boss sigil fx stays shared or gets one per world in VC-109.
3. The zone kinds beyond `boss` / `rest` (`secret`, `story` are proposed).
