# Parallax Performance Harness (VC-106)

Headless Playwright benchmark and budget checker for Vibrant Castle's 8 world maps across `desktop`, `tablet`, and `low-power-laptop` profiles.

## Profiles

| Profile | Viewport | DPRs | CPU Throttling | Work Budget (`p95`) | Cadence Target |
|---|---|---|---|---|---|
| `desktop` | `1280x720` | `1`, `2` | `1x` (none) | `<= 8.3 ms` | 120 Hz (`8.33 ms`) |
| `tablet` | `1024x768` | `2` | `4x` (`Emulation.setCPUThrottlingRate`) | `<= 16.6 ms` | 60 Hz (`16.67 ms`) |
| `low-power-laptop` | `1280x720` | `1` | `6x` (`Emulation.setCPUThrottlingRate`) | `<= 16.6 ms` | 60 Hz (`16.67 ms`) |

## Commands

```bash
# Build production client, run desktop (DPR 1 & 2) + tablet (DPR 2, 4x CPU) + low-power-laptop (DPR 1, 6x CPU) across all 8 maps
bun run perf:parallax

# Run a single profile or quality mode
bun run perf:parallax -- --profile desktop
bun run perf:parallax -- --profile tablet
bun run perf:parallax -- --profile low-power-laptop --quality low

# Fail (exit 1) if any run exceeds its profile work p95 budget
bun run perf:parallax -- --strict

# Update docs/perf/baseline.json from a fresh run (both profiles)
bun run perf:parallax -- --write-baseline

# Re-check an existing report against docs/perf/baseline.json
bun scripts/perf/parallaxBudget.ts scripts/perf/out/latest.json --strict
```

## Browser Resolution

- Set `PLAYWRIGHT_CHROMIUM_PATH` to override the Chromium binary path.
- When unset, the harness checks `%LOCALAPPDATA%\ms-playwright\chromium-1248\chrome-win64\chrome.exe` on Windows and otherwise falls back to `playwright-core`'s default browser resolution (Linux CI).

## Metrics & Budgets

| Metric | How collected |
|---|---|
| `work.p50Ms` / `p95Ms` / `p99Ms` / `maxMs` | Wraps `window.requestAnimationFrame` before app boot and records `performance.now()` before/after each callback while holding right (`KeyD`) and jumping (`Space`) |
| `work.overBudgetPct` | Share of sampled frames whose work duration exceeds the profile frame budget (`8.3 ms` desktop, `16.6 ms` tablet) |
| `cadence.droppedFrames` | Secondary rAF interval delta metric (`> 1.5 * targetFrameMs`: `12.5 ms` desktop, `25.0 ms` tablet) |
| `longFrames.count` / `totalBlockingTimeMs` | `PerformanceObserver` for `long-animation-frame` (or `longtask` fallback) active from navigation start to capture map-entry decode hitches |
| `jsHeapUsedMB` | `performance.memory.usedJSHeapSize` (when supported by Chromium, `null` otherwise) |
| `decodedParallaxMB` | Sum of `naturalWidth * naturalHeight * 4` across unique decoded parallax images |
| `timeToFirstParallaxFrameMs` | `performance.now()` on the first `drawImage` of a parallax asset onto `#game-viewport-canvas` |

Reports are written to `scripts/perf/out/` (git-ignored).
