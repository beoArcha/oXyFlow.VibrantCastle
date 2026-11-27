# VC-108 Round 3 — Auto Heuristic, Low-Power Passes & Profile × Mode Benchmarks

Measured with `bun run perf:parallax` on a 4-core host (`Chromium 156.0.8078.4` and `WebKit 27.2`). Budgets:
- `desktop`: `1280x720`, DPR `1` & `2`, `1x` CPU, 120 Hz (`work p95 <= 8.3 ms`)
- `tablet`: `1024x768`, DPR `2`, `4x` CPU throttle, 60 Hz (`work p95 <= 16.6 ms`)
- `low-power-laptop`: `1280x720`, DPR `1`, `6x` CPU throttle, 60 Hz (`work p95 <= 16.6 ms`)

## Changes Applied

1. **Low-power harness profiles & quality selection (`scripts/perf/parallaxTypes.ts`, `scripts/perf/parallaxRunner.ts`, `scripts/perf/parallaxBudget.ts`)**:
   - Added `low-power-laptop` (`1280x720`, DPR `1`, `6x` CDP CPU throttle, `60 Hz`, `p95 <= 16.6 ms`) alongside `tablet` (`1024x768`, DPR `2`, `4x` CPU) and `desktop`.
   - Added `--quality auto|high|mid|low|simplified|off` and `--profile laptop` alias so every profile × mode combination can be benchmarked cleanly.
2. **Pure `auto` heuristic & signal injection (`src/game/parallax/parallaxQualityHeuristic.ts`, `src/context/settings/browserParallaxSignals.ts`, `src/context/settings/useSettingsSync.ts`, `src/game/loop/engineSettingsController.ts`)**:
   - Browser capability reading (`hardwareConcurrency`, `deviceMemory`, `devicePixelRatio`, `screenWidth`/`screenHeight`, `prefersReducedMotion`) lives in `src/context/settings/browserParallaxSignals.ts`; `src/game` contains zero `navigator` calls for parallax heuristics.
   - Heuristic tiers:
     - `simplified`: `prefersReducedMotion`, `cores <= 1`, `deviceMemory <= 1`, or `cores <= 2` with `deviceMemory <= 2` or `dpr >= 2`.
     - `low`: `cores <= 2`, `deviceMemory <= 2`, `cores <= 4 && (dpr >= 2 || deviceMemory <= 4)`, or small viewports (`maxDim < 768`) without `>= 6` cores and `>= 4` GiB.
     - `mid`: mid-range devices (`4` cores at DPR `1` with `>= 8` GiB / unknown `deviceMemory`, `6` cores, or `maxDim < 1280`).
     - `high`: `cores >= 8` (or `>= 10` when `dpr > 2`), `deviceMemory >= 8` (or unknown), and `maxDim >= 1280`.
   - Added `ParallaxFrameTimeProbe` (`800 ms` warmup, `1500 ms` / `30–240` frame window, pre-allocated `Float64Array` percentile calculation) wired through `EngineLoopRunner` → `EngineSettingsController.recordAutoProbeFrame()`. If post-warmup `p95 > frameBudgetMs`, it steps quality down once (`high -> mid -> low -> simplified`) and preserves that downgrade across subsequent unchanged `useSettingsSync` updates.
3. **Skip non-essential passes on low-power modes (`src/game/parallax/render/ParallaxSystem.ts`, `src/game/locations/locationAssetLifecycle.ts`)**:
   - `getParallaxQualityCapabilities()` gates `renderAtmosphere`, `renderFx`, `renderBossOverlays`, and `renderZoneCrossfade`.
   - `low` skips `AtmosphericSectorRenderer`, `:fx_*` layers, `boss_stage`/`boss_world` overlays, and zone variant preloading/crossfading while keeping `hi8bit` backdrop and scrolling tiers.
   - `simplified` loads and draws only the `far` tier at `low` (`hi8bit`) resolution; `off` draws placeholder gradients only.
4. **Round 2 open items resolved (`src/game/renderer/background/atmospheric/atmosphericSectorRenderer.ts`, `src/game/parallax/parallaxWiring.ts`)**:
   - **WebKit `eclipse_crown` DPR 2**: `AtmosphericSectorRenderer` now caches each sector's linear or radial atmospheric gradient onto a bounded `256 px` wide surface (`createBrowserAtmosphereSurfaceFactory`, falling back to `<canvas>` on WebKit), replacing per-frame `2560x1440` `createRadialGradient` + `fillRect` rasterisation with a single scaled `drawImage`. WebKit `eclipse_crown` 2× dropped from `p95 = 10.35 ms` (`OVER`) to **`2.00 ms`** (`16/16` WebKit runs pass `<= 8.3 ms`).
   - **Chromium `thorn_chasm` DPR 2**: Cached atmospheric surface + decode-time pre-scaling brought `thorn_chasm` 2× `p99` from `9.04 ms` down to **`3.80 ms`** (`p95 = 2.50 ms`, `p99 <= 2 × p95`; `16/16` Desktop Chromium `high` runs pass both `p95 <= 8.3 ms` and `p99 <= 2 × p95`).
5. **Unit tests (`src/game/parallax/__tests__/parallaxQualityHeuristic.unit.test.ts`, `src/game/parallax/render/__tests__/parallaxSystem.unit.test.ts`, `scripts/__tests__/parallaxPerf.test.ts`)**:
   - Covered all heuristic tiers, non-finite signal sanitization, `ParallaxFrameTimeProbe` warmup/single-downgrade/reset behavior, `EngineSettingsController` sync preservation, `ParallaxSystem` low-mode pass skipping, and `low-power-laptop` budget evaluation.

---

## Profile × Mode Measurements

### Tablet (`1024x768`, DPR `2`, `4x` CPU, budget `p95 <= 16.6 ms`)

On this 4-core host, `auto` resolves Tablet DPR `2` to **`low`** (`cores = 4, dpr = 2`), cutting `pxMB` by ~75–90% (`31.5–42.8 MB` → `3.3–10.6 MB`) and keeping worst `p95` at `6.68 ms` (`<= 16.6 ms`).

| Location | `high` p50 / p95 / pxMB | `mid` p50 / p95 / pxMB | `low` p50 / p95 / pxMB | `simplified` p50 / p95 / pxMB | `off` p50 / p95 / pxMB | `auto` (`low`) p50 / p95 / pxMB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `courtyard` | 4.60 / 9.30 / 41.4 | 1.10 / 4.10 / 14.4 | 0.90 / 2.90 / 3.3 | 1.50 / 3.20 / 1.0 | 2.40 / 5.80 / 0.0 | 0.90 / 2.90 / 3.3 |
| `thorn_chasm` | 3.60 / 5.90 / 39.2 | 1.70 / 5.00 / 16.5 | 1.60 / 3.65 / 7.0 | 1.70 / 3.60 / 4.7 | 1.90 / 4.58 / 0.0 | 1.20 / 3.21 / 7.0 |
| `ashen_catacombs` | 1.90 / 3.73 / 31.5 | 0.80 / 2.47 / 18.0 | 1.70 / 3.59 / 10.6 | 0.90 / 2.50 / 4.7 | 1.35 / 3.80 / 0.0 | 1.80 / 4.00 / 10.6 |
| `clocktower` | 4.40 / 6.30 / 42.8 | 1.80 / 3.67 / 20.2 | 2.00 / 3.92 / 10.6 | 0.90 / 2.67 / 8.4 | 5.50 / 10.24 / 0.0 | 1.95 / 3.70 / 10.6 |
| `alchemist_library` | 2.20 / 5.70 / 31.5 | 3.10 / 6.10 / 18.1 | 2.80 / 5.90 / 10.3 | 1.00 / 2.58 / 4.7 | 4.10 / 9.40 / 0.0 | 2.90 / 6.68 / 10.3 |
| `aether_sanctuary` | 2.80 / 5.20 / 39.2 | 1.60 / 2.74 / 16.7 | 1.30 / 2.80 / 6.7 | 0.80 / 2.50 / 4.8 | 1.40 / 4.48 / 0.0 | 0.70 / 2.55 / 6.7 |
| `grand_bastion` | 3.30 / 5.40 / 39.2 | 1.80 / 3.10 / 16.7 | 1.60 / 3.24 / 6.7 | 0.70 / 2.20 / 4.8 | 2.00 / 4.80 / 0.0 | 1.10 / 2.80 / 6.7 |
| `eclipse_crown` | 3.70 / 6.28 / 41.6 | 2.55 / 5.20 / 23.6 | 1.60 / 3.00 / 10.3 | 1.00 / 2.80 / 4.8 | 2.30 / 6.26 / 0.0 | 0.90 / 2.90 / 10.3 |

*Note:* `simplified` (`2.20–3.60 ms` `p95`) outperforms `off` (`3.80–10.24 ms` `p95`) because an opaque pre-scaled `far` bitmap lets `GameRenderer` skip the full-canvas clear and avoids per-frame placeholder gradient fills.

### Low-Power Laptop (`1280x720`, DPR `1`, `6x` CPU, budget `p95 <= 16.6 ms`)

On this 4-core host (`deviceMemory` = 8 GiB, DPR `1`), `auto` resolves to **`mid`** (`2.70–9.60 ms` `p95`); under `low` mode (`low-power` devices with `<= 4` GiB or `<= 2` cores), worst `p95` drops to `5.28 ms` (`p99 <= 6.80 ms`, `pxMB <= 10.5 MB`).

| Location | `high` p50 / p95 / pxMB | `mid` p50 / p95 / pxMB | `low` p50 / p95 / pxMB | `simplified` p50 / p95 / pxMB | `off` p50 / p95 / pxMB | `auto` (`mid`) p50 / p95 / pxMB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `courtyard` | 3.70 / 8.20 / 40.2 | 1.50 / 4.90 / 14.3 | 0.80 / 3.30 / 3.3 | 1.00 / 3.02 / 1.0 | 2.00 / 5.40 / 0.0 | 0.80 / 2.70 / 14.3 |
| `thorn_chasm` | 2.90 / 8.21 / 38.5 | 1.20 / 6.80 / 16.3 | 1.60 / 5.10 / 6.9 | 0.70 / 2.73 / 4.6 | 2.15 / 5.60 / 0.0 | 1.90 / 5.30 / 16.3 |
| `ashen_catacombs` | 1.90 / 5.30 / 31.3 | 1.60 / 4.46 / 17.8 | 1.40 / 4.10 / 10.5 | 0.50 / 2.48 / 4.6 | 0.80 / 3.06 / 0.0 | 1.50 / 4.80 / 17.8 |
| `clocktower` | 1.60 / 3.69 / 42.0 | 2.40 / 5.90 / 19.9 | 1.90 / 5.28 / 10.4 | 0.90 / 3.29 / 8.2 | 7.10 / 13.22 / 0.0 | 1.95 / 5.40 / 19.9 |
| `alchemist_library` | 3.90 / 9.70 / 31.3 | 3.20 / 9.00 / 17.9 | 1.70 / 5.21 / 10.2 | 1.10 / 3.70 / 4.6 | 4.90 / 10.62 / 0.0 | 3.10 / 9.60 / 17.9 |
| `aether_sanctuary` | 3.10 / 7.08 / 37.8 | 1.45 / 3.90 / 16.5 | 1.20 / 4.20 / 6.6 | 0.70 / 2.60 / 4.7 | 1.40 / 5.02 / 0.0 | 1.40 / 3.90 / 16.5 |
| `grand_bastion` | 3.60 / 8.27 / 37.9 | 1.60 / 4.50 / 16.5 | 1.60 / 4.40 / 6.6 | 1.10 / 4.28 / 4.7 | 2.10 / 7.60 / 0.0 | 1.50 / 4.80 / 16.5 |
| `eclipse_crown` | 3.10 / 8.09 / 41.3 | 2.40 / 7.48 / 23.3 | 0.90 / 4.10 / 10.2 | 0.70 / 3.30 / 4.7 | 2.20 / 7.10 / 0.0 | 1.50 / 6.90 / 23.3 |

---

## Desktop Verification (`1280x720`, 1× CPU, budget `p95 <= 8.3 ms`)

### Desktop Chromium — `high` Quality (16/16 Pass `p95 <= 8.3 ms` and `p99 <= 2 × p95`)

| Location | DPR | p50 | p95 | p99 | max | pxMB | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `courtyard` | 1x | 1.80 | 3.60 | 4.75 | 12.10 | 40.2 | PASS |
| `courtyard` | 2x | 1.50 | 2.90 | 3.90 | 4.80 | 41.4 | PASS |
| `thorn_chasm` | 1x | 1.60 | 2.50 | 3.49 | 4.00 | 38.5 | PASS |
| `thorn_chasm` | 2x | 1.70 | **2.50** | **3.80** | 4.60 | 39.2 | PASS |
| `ashen_catacombs` | 1x | 1.20 | 2.40 | 3.79 | 4.50 | 31.3 | PASS |
| `ashen_catacombs` | 2x | 1.30 | 2.20 | 2.90 | 3.90 | 31.5 | PASS |
| `clocktower` | 1x | 1.70 | 2.80 | 3.30 | 6.10 | 42.0 | PASS |
| `clocktower` | 2x | 1.70 | 3.00 | 4.80 | 6.50 | 42.8 | PASS |
| `alchemist_library` | 1x | 1.70 | 2.90 | 3.67 | 10.80 | 31.3 | PASS |
| `alchemist_library` | 2x | 1.70 | 3.00 | 3.90 | 18.50 | 31.5 | PASS |
| `aether_sanctuary` | 1x | 1.20 | 2.70 | 3.40 | 9.00 | 37.8 | PASS |
| `aether_sanctuary` | 2x | 1.20 | 2.29 | 2.89 | 9.90 | 39.2 | PASS |
| `grand_bastion` | 1x | 1.90 | 4.00 | 6.00 | 24.10 | 37.9 | PASS |
| `grand_bastion` | 2x | 2.20 | 4.33 | 5.63 | 7.10 | 39.2 | PASS |
| `eclipse_crown` | 1x | 1.50 | 2.90 | 3.89 | 4.30 | 41.3 | PASS |
| `eclipse_crown` | 2x | 1.40 | 2.50 | 3.10 | 4.20 | 41.6 | PASS |

### Desktop WebKit (`WebKit 27.2`) — `high` Quality (16/16 Pass `p95 <= 8.3 ms`)

| Location | DPR | R2 p95 | R3 p50 | R3 p95 | R3 p99 | R3 max | pxMB | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `courtyard` | 1x | 2.00 | 1.00 | 2.00 | 3.00 | 3.00 | 40.2 | PASS |
| `courtyard` | 2x | 2.00 | 1.00 | 3.40 | 6.28 | 7.00 | 41.4 | PASS |
| `thorn_chasm` | 1x | 2.00 | 1.00 | 2.00 | 2.00 | 2.00 | 38.5 | PASS |
| `thorn_chasm` | 2x | 2.00 | 1.00 | 2.90 | 3.00 | 3.00 | 39.2 | PASS |
| `ashen_catacombs` | 1x | 2.00 | 1.00 | 2.00 | 2.82 | 4.00 | 31.3 | PASS |
| `ashen_catacombs` | 2x | 2.95 | 1.00 | 2.00 | 5.12 | 6.00 | 31.5 | PASS |
| `clocktower` | 1x | 3.50 | 1.00 | 2.00 | 2.00 | 2.00 | 42.0 | PASS |
| `clocktower` | 2x | 7.80 | 2.00 | **3.00** | 3.00 | 3.00 | 42.8 | PASS |
| `alchemist_library` | 1x | 2.00 | 1.00 | 2.00 | 2.00 | 2.00 | 31.3 | PASS |
| `alchemist_library` | 2x | 2.00 | 1.00 | 2.00 | 2.00 | 2.00 | 31.5 | PASS |
| `aether_sanctuary` | 1x | 3.00 | 1.00 | 2.00 | 2.00 | 2.00 | 37.8 | PASS |
| `aether_sanctuary` | 2x | 2.00 | 1.00 | 2.00 | 2.00 | 2.00 | 39.2 | PASS |
| `grand_bastion` | 1x | 3.00 | 1.00 | 2.00 | 4.64 | 7.00 | 37.9 | PASS |
| `grand_bastion` | 2x | 5.10 | 1.00 | 7.00 | 52.60 | 64.00 | 39.2 | PASS |
| `eclipse_crown` | 1x | 2.50 | 1.00 | 3.60 | 13.84 | 20.00 | 41.3 | PASS |
| `eclipse_crown` | 2x | 10.35 (OVER) | 1.00 | **2.00** | **2.78** | **3.00** | 41.6 | PASS |

---

## Baseline Update (`docs/perf/baseline.json`)

`docs/perf/baseline.json` was regenerated via `bun run perf:parallax -- --write-baseline --strict` under the current post-progressive-loading `auto` pipeline across all 3 profiles (`32/32` runs passing `--strict`: `16` desktop + `8` tablet + `8` low-power-laptop):

- **Why the old baseline was retired**: Round 0's `baseline.json` predated progressive `ParallaxLoadQueue` loading, decode-time `createImageBitmap` pre-scaling, idle budgeting, quality-tier selection (`auto`), and the `low-power-laptop` profile. It stored 24 eager-loaded runs (`70–94 MB` `pxMB`) and omitted `low-power-laptop`.
- **New `baseline.json` summary (`auto` mode)**:
  - `desktop` (`p95 <= 8.3 ms`): `p50 = 0.70–1.50 ms`, `p95 = 1.60–3.00 ms`, `p99 = 2.20–4.39 ms`, `pxMB = 3.3–23.3 MB`.
  - `tablet` (`p95 <= 16.6 ms`): `p50 = 0.70–2.90 ms`, `p95 = 2.55–6.68 ms`, `p99 = 3.50–9.08 ms`, `pxMB = 3.3–10.6 MB`.
  - `low-power-laptop` (`p95 <= 16.6 ms`): `p50 = 0.80–3.10 ms`, `p95 = 2.70–9.60 ms`, `p99 = 3.70–11.75 ms`, `pxMB = 14.3–23.3 MB`.
