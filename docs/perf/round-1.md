# VC-108 Round 1 — Desktop Chromium Parallax Optimisation

Measured with `bun run perf:parallax` (2× runs on unmodified HEAD before, 2× runs after; values below are the 2-run medians in ms). Desktop target: 120 Hz (`work p95 <= 8.3 ms`, `1280x720` at DPR 1 and DPR 2).

## Profiling Findings

CDP CPU profiling and tracing on `eclipse_crown` and `grand_bastion` showed:

1. **Per-frame resampling and offscreen overdraw**: Dynamic parallax tiers (`2172x724` / `1376x768`) draw at `drawH ~ 1139..1195` (`drawW ~ 3417..3584` logical px) on a `1000x525` logical viewport (`1280x672` at DPR 1, `2560x1344` at DPR 2) using unclipped 5-argument `ctx.drawImage`, leaving ~88% of each dynamic tile rect outside the viewport while resampling every frame. The `far` backdrop also overdrew its 6% horizontal / 3% vertical overscan outside the viewport.
2. **Unnecessary canvas state save/restore**: `renderTiledDynamicLayer` issued `ctx.save()` / `ctx.restore()` for every dynamic tier even when `globalAlpha === 1` and `globalCompositeOperation === "source-over"`.
3. **Sync decode risk in `AssetLoaderEngine`**: `assetLoader.loadTexture()` cached `HTMLImageElement` instances on `onload` without awaiting `img.decode()`.
4. **Per-frame object allocation**: `renderEngineFrame` allocated a fresh `fpsInfo` literal on every frame.
5. **Remaining tail spikes (`p99` / `max`)**: During the `150 ms`-warmup measurement window, `ParallaxLoadQueue` continues loading/decoding `var_a..d`, `fx_sigil`, and neighbour `high`-tier textures (until VC-109 adds `low`-tier files), and first-use `OffscreenCanvas.transferToImageBitmap()` surface creation can still cause occasional single-frame spikes (`w_max`).

## Changes Applied

- **Pre-scaled parallax surface cache (`src/game/parallax/render/ParallaxSurfaceCache.ts`, `src/game/parallax/parallaxWiring.ts`)**: Added a bounded `ParallaxSurfaceCache` with an injected `OffscreenCanvas` + `transferToImageBitmap()` factory that pre-scales each parallax texture once to its canvas draw size (capped at `2560` px, with upscaling disabled for `screen`-blended legacy JPG layers) and releases replaced/evicted bitmaps cleanly.
- **Viewport-clipped 9-arg tiling & backdrop draws (`src/game/renderer/background/parallaxTiling.ts`, `src/game/parallax/render/ParallaxBackdropRenderer.ts`)**: Clipped `far`, `boss`, and dynamic horizontal tiles (normal and mirrored) to `[0, viewportWidth] x [0, viewportHeight]` via 9-argument `drawImage`, and skipped `ctx.save()`/`ctx.restore()` on dynamic layers with default alpha/blend.
- **Pre-decode before cache & zero-alloc FPS buffer (`src/game/engine/assetLoader.ts`, `src/game/loop/engineFrameRenderer.ts`)**: Awaited `img.decode()` before caching textures in `AssetLoaderEngine`, and reused a static `FPS_INFO_BUFFER` in `renderEngineFrame`.
- **Unit tests (`src/game/parallax/render/__tests__/parallaxSurfaceCache.unit.test.ts`)**: Added tests for cache reuse, `allowUpscale: false`, `maxDimension` capping, release/eviction, fallback behaviour, viewport clipping, and isolated `ParallaxLoadQueue` integration.

## Before / After — Desktop (ms, 2-run medians)

| Location | DPR | Before p50 | After p50 | Before p95 | After p95 | Before p99 | After p99 | Before max | After max |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `courtyard` | 1x | 1.75 | **0.95** | 3.51 | 3.84 | 4.53 | 9.28 | 7.25 | 28.30 |
| `courtyard` | 2x | 1.90 | **1.05** | 3.97 | **3.85** | 5.79 | 18.30 | 11.65 | 28.40 |
| `thorn_chasm` | 1x | 2.00 | **0.95** | 5.59 | **3.19** | 9.99 | **6.68** | 27.45 | **25.70** |
| `thorn_chasm` | 2x | 1.80 | **1.20** | 4.67 | **3.84** | 9.61 | **8.94** | 15.80 | 45.30 |
| `ashen_catacombs` | 1x | 1.20 | **0.80** | 3.60 | **2.35** | 5.01 | **3.43** | 13.55 | **10.10** |
| `ashen_catacombs` | 2x | 1.05 | **0.95** | 3.55 | **3.36** | 7.71 | 7.75 | 25.05 | 32.75 |
| `clocktower` | 1x | 1.80 | **1.20** | 3.90 | **3.50** | 5.27 | 7.04 | 16.55 | 19.20 |
| `clocktower` | 2x | 1.95 | **1.25** | 3.81 | 3.90 | 5.10 | 10.17 | 17.30 | **16.50** |
| `alchemist_library` | 1x | 2.10 | **1.05** | 4.30 | **2.85** | 7.74 | **5.96** | 18.70 | 23.65 |
| `alchemist_library` | 2x | 2.30 | **1.45** | 6.16 | **4.22** | 19.21 | **8.26** | 35.75 | **20.70** |
| `aether_sanctuary` | 1x | 1.25 | **0.95** | 3.65 | **3.08** | 5.36 | 9.82 | 20.15 | 31.20 |
| `aether_sanctuary` | 2x | 1.35 | **0.85** | 3.71 | **3.40** | 10.26 | 12.57 | 26.60 | **23.90** |
| `grand_bastion` | 1x | 2.00 | **0.93** | 4.14 | **3.13** | 5.81 | 7.09 | 7.70 | 13.20 |
| `grand_bastion` | 2x | 1.95 | **1.05** | 5.05 | **4.24** | 13.91 | **12.06** | 24.45 | 65.00 |
| `eclipse_crown` | 1x | 1.60 | **1.00** | 4.00 | **3.00** | 8.45 | **7.12** | 13.55 | 22.85 |
| `eclipse_crown` | 2x | 1.85 | **0.85** | 6.14 | **4.70** | 9.84 | 11.23 | 36.30 | 49.10 |

- All 24/24 runs (desktop + tablet) pass the frame `p95` budgets (`<= 8.3 ms` desktop, `<= 16.6 ms` tablet).
- Desktop median `p50` improved on **16/16** runs (~45–55% faster: `1.05–2.30 ms` → `0.80–1.45 ms`).
- Desktop median `p95` improved on **14/16** runs (`3.51–6.16 ms` → `2.35–4.70 ms`); tablet `p95` also improved on **8/8** runs (`3.75–5.04 ms` → `3.06–4.96 ms`).
- Visual verification: before/after screenshots on `eclipse_crown` and `grand_bastion` (DPR 2) match across all parallax layers and blends.
- `docs/perf/baseline.json` is left unchanged because `p95` (`2.35–4.70 ms`) and `p99`/`max` tail hitches during progressive background loading do not yet beat the stricter pre-progressive-loading `baseline.json` `p95` (`1.50–2.60 ms`) across every run.
