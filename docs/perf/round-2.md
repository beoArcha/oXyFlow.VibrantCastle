# VC-108 Round 2 — Decode-Time Pre-Scaling, Idle Budgeting & Cross-Browser Verification

Measured with `bun run perf:parallax` (2× runs on desktop Chromium; 1× on desktop WebKit and tablet Chromium). Desktop target: 120 Hz (`work p95 <= 8.3 ms`, tail targets `p99 <= 2 × p95` and `max < 33 ms`).

## Changes Applied

1. **Off-thread decode-time pre-scaling (`src/game/parallax/loading/browserBitmapDecoder.ts`, `src/game/parallax/loading/ParallaxLoadQueue.ts`, `src/game/renderer/background/parallaxGeometry.ts`, `src/game/locations/locationAssetLifecycle.ts`, `src/game/loop/engine.ts`)**:
   - Moved parallax bitmap downscaling out of the first-draw render path into `ParallaxLoadQueue` / `browserParallaxBitmapDecoder` via `createImageBitmap(img, { resizeWidth, resizeHeight, resizeQuality })`, using `computeParallaxPreScaleDimensions` with `allowUpscale: false` (never upscaling `hi8bit`/`hi16bit` sources into larger VRAM bitmaps).
   - Preserved original source `naturalWidth` / `naturalHeight` metrics on decoded `ImageBitmap` instances while using actual `bitmap.width` / `bitmap.height` as source pixel dimensions in `ParallaxBackdropRenderer`, `parallaxTiling`, and `ParallaxSurfaceCache` (`isPreScaledBitmapSource` fast path skips `OffscreenCanvas` work when dimensions already match).
   - Added fallback to unresized `createImageBitmap(img)` when `resizeWidth` / `resizeHeight` options are unsupported, and added an off-DOM `<canvas>` fallback in `createBrowserParallaxSurfaceFactory` (`src/game/parallax/parallaxWiring.ts`) when `OffscreenCanvas` is unavailable (e.g., WebKit).
2. **Idle-frame work budgeting (`src/game/parallax/loading/ParallaxLoadQueue.ts`, `src/game/parallax/render/ParallaxSurfaceCache.ts`, `src/game/locations/locationAssetLifecycle.ts`)**:
   - Kept `PARALLAX_LOAD_PRIORITY.FAR` immediate for fast time-to-first-parallax-frame, while spreading lower-priority background tasks (`LAYER`, `ZONE_VARIANT`, `EFFECT`, `NEIGHBOUR`) across idle frames via `scheduleIdle` (`requestIdleCallback`, falling back to `requestAnimationFrame` + `setTimeout` on WebKit) bounded by `idleFrameBudgetMs` (`2.5 ms`) and `maxStartsPerIdleSlice` (`1`).
   - Added `maxCreationsPerFrame: 1` (`beginFrame()`) to `ParallaxSurfaceCache` for any fallback on-demand surface scaling.
3. **Bitmap release on location unload (`src/game/parallax/loading/ParallaxLoadQueue.ts`, `src/game/parallax/render/ParallaxSystem.ts`)**:
   - Ensured `evict()` tracks and cancels matching in-flight tasks (`cancelledInFlight`) so bitmaps arriving after location unload are closed immediately, and wired `subscribeRelease` so `ParallaxSurfaceCache.evict()` releases any fallback offscreen surfaces synchronously when a location unloads.
4. **Cross-browser perf harness (`scripts/perf/parallaxRunner.ts`, `scripts/perf/parallaxBrowserProbe.ts`)**:
   - Added `--browser chromium|firefox|webkit`, dynamic local `ms-playwright` executable discovery, and Chromium-only gating for CDP CPU throttling.
5. **Unit tests (`src/game/parallax/loading/__tests__/parallaxLoadQueue.unit.test.ts`, `src/game/parallax/render/__tests__/parallaxSurfaceCache.unit.test.ts`, `scripts/__tests__/parallaxPerf.test.ts`)**:
   - Added isolated-queue tests for decode-time `createImageBitmap` pre-scaling, resize-options fallback, in-flight eviction release, idle-slice frame budgeting, `ParallaxSurfaceCache` pre-scaled fast path & `maxCreationsPerFrame` spreading, and `--browser` runner CLI parsing.

## Before (Round 1) / After (Round 2) — Desktop Chromium (ms, 2-run medians)

| Location | DPR | R1 p50 | R2 p50 | R1 p95 | R2 p95 | R1 p99 | R2 p99 | R1 max | R2 max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `courtyard` | 1x | 0.95 | 1.05 | 3.84 | **2.85** | 9.28 | **3.85** | 28.30 | **4.90** |
| `courtyard` | 2x | 1.05 | **1.00** | 3.85 | **2.40** | 18.30 | **3.10** | 28.40 | **5.50** |
| `thorn_chasm` | 1x | 0.95 | 1.30 | 3.19 | **2.96** | 6.68 | **4.09** | 25.70 | **9.05** |
| `thorn_chasm` | 2x | 1.20 | 1.50 | 3.84 | 4.02 | 8.94 | 9.04 | 45.30 | **19.45** |
| `ashen_catacombs` | 1x | 0.80 | 0.85 | 2.35 | **2.20** | 3.43 | **2.90** | 10.10 | **4.55** |
| `ashen_catacombs` | 2x | 0.95 | **0.95** | 3.36 | **2.70** | 7.75 | **3.44** | 32.75 | **4.15** |
| `clocktower` | 1x | 1.20 | **1.05** | 3.50 | **2.50** | 7.04 | **3.60** | 19.20 | **6.50** |
| `clocktower` | 2x | 1.25 | **1.05** | 3.90 | **2.34** | 10.17 | **3.45** | 16.50 | **4.25** |
| `alchemist_library` | 1x | 1.05 | 1.57 | 2.85 | 3.00 | 5.96 | **3.80** | 23.65 | **5.30** |
| `alchemist_library` | 2x | 1.45 | 1.70 | 4.22 | **3.15** | 8.26 | **4.05** | 20.70 | **4.80** |
| `aether_sanctuary` | 1x | 0.95 | **0.80** | 3.08 | **2.33** | 9.82 | **3.22** | 31.20 | **9.55** |
| `aether_sanctuary` | 2x | 0.85 | **0.80** | 3.40 | **1.90** | 12.57 | **2.89** | 23.90 | **10.00** |
| `grand_bastion` | 1x | 0.93 | 1.00 | 3.13 | **2.59** | 7.09 | **4.13** | 13.20 | **8.00** |
| `grand_bastion` | 2x | 1.05 | **0.90** | 4.24 | **2.40** | 12.06 | **3.35** | 65.00 | **9.95** |
| `eclipse_crown` | 1x | 1.00 | 1.55 | 3.00 | 3.35 | 7.12 | **4.75** | 22.85 | **5.05** |
| `eclipse_crown` | 2x | 0.85 | 1.65 | 4.70 | **3.34** | 11.23 | **4.30** | 49.10 | **5.50** |

- **16/16** desktop Chromium runs pass `p95 <= 8.3 ms` (`1.90–4.02 ms`).
- **16/16** desktop Chromium runs pass `max < 33 ms` (`4.15–19.45 ms`, down from Round 1's worst `65.00 ms` on `grand_bastion` 2× and `49.10 ms` on `eclipse_crown` 2×).
- **15/16** desktop Chromium runs pass `p99 <= 2 × p95` (`2.89–4.75 ms`); `thorn_chasm` 2× measured `9.04 ms` vs `2 × 4.02 = 8.04 ms` (single-run `v2` checks were `3.60 ms` / `4.40 ms` vs `p95 = 3.10 ms` / `3.00 ms`, showing occasional headless GPU compositing variance on `fx_sigil`).
- **Tablet Chromium (4× CPU throttle)**: **8/8** runs pass `p95 <= 16.6 ms` (`2.80–6.19 ms`, beating stored `baseline.json` `p95` on 6/8 maps).
- `docs/perf/baseline.json` is left unchanged because progressive-loading `p95` on 4-core desktop does not yet beat the pre-progressive-loading `baseline.json` `p95` across all 24 runs.

## Cross-Browser Verification

### Desktop WebKit (`WebKit 27.2`, 1× run)

`WebKit` lacks `OffscreenCanvas` and `requestIdleCallback`, and supports `createImageBitmap(img, { resizeWidth, resizeHeight, resizeQuality })`. Using the new `<canvas>` fallback factory and `requestAnimationFrame` + `setTimeout` idle scheduler, all 16 desktop WebKit runs completed with `max <= 17.00 ms` (note: WebKit coarsens `performance.now()` to `1 ms` steps):

| Location | DPR | p50 | p95 | p99 | max | pxMB | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `courtyard` | 1x | 1.00 | 2.00 | 5.52 | 10.00 | 14.3 | PASS |
| `courtyard` | 2x | 1.00 | 2.00 | 2.00 | 2.00 | 14.4 | PASS |
| `thorn_chasm` | 1x | 1.00 | 2.00 | 3.64 | 6.00 | 16.3 | PASS |
| `thorn_chasm` | 2x | 1.00 | 2.00 | 2.78 | 3.00 | 16.5 | PASS |
| `ashen_catacombs` | 1x | 1.00 | 2.00 | 5.26 | 7.00 | 17.8 | PASS |
| `ashen_catacombs` | 2x | 1.00 | 2.95 | 5.37 | 6.00 | 18.0 | PASS |
| `clocktower` | 1x | 2.00 | 3.50 | 8.00 | 10.00 | 19.9 | PASS |
| `clocktower` | 2x | 2.00 | 7.80 | 13.53 | 15.00 | 20.2 | PASS |
| `alchemist_library` | 1x | 1.00 | 2.00 | 2.00 | 2.00 | 17.9 | PASS |
| `alchemist_library` | 2x | 1.50 | 2.00 | 2.00 | 2.00 | 18.1 | PASS |
| `aether_sanctuary` | 1x | 1.00 | 3.00 | 5.59 | 7.00 | 16.5 | PASS |
| `aether_sanctuary` | 2x | 1.00 | 2.00 | 2.80 | 3.00 | 16.7 | PASS |
| `grand_bastion` | 1x | 1.00 | 3.00 | 6.96 | 8.00 | 16.5 | PASS |
| `grand_bastion` | 2x | 1.00 | 5.10 | 6.62 | 7.00 | 16.7 | PASS |
| `eclipse_crown` | 1x | 1.00 | 2.50 | 3.50 | 4.00 | 23.3 | PASS |
| `eclipse_crown` | 2x | 1.00 | 10.35 | 15.67 | 17.00 | 23.6 | OVER (`p95 > 8.3 ms`) |

### Desktop Firefox

Local Playwright cache contains `firefox-1555`, while `playwright-core@1.65.1` expects `firefox-1572` and fails in `newContext` with a Juggler protocol mismatch (`Browser.setDownloadOptions`: unknown `legacyInterceptor` field). Per task scope, `firefox-1572` was not downloaded; `parallaxRunner.ts` supports `--browser firefox` for matching Playwright environments.
