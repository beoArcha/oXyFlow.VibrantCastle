# Parallax Performance Harness (VC-106)

Headless Playwright benchmark and budget checker for Vibrant Castle's 8 world maps at 1x and 2x DPR.

## Commands

```bash
# Build production client, run all 8 maps at DPR 1 & 2, write report + check budgets (report-only)
bun run perf:parallax

# Fail (exit 1) if any run exceeds the profile p95 budget
bun run perf:parallax -- --strict

# Measure tablet profile (1024x768, 60 Hz budget <= 16.6 ms)
bun run perf:parallax -- --profile tablet

# Update docs/perf/baseline.json from a fresh run
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
| `p50Ms` / `p95Ms` | In-page `requestAnimationFrame` deltas while holding right (`KeyD`) and jumping (`Space`) |
| `droppedFrames` | Frames with delta `> 1.5 * targetFrameMs` (12.5 ms at 120 Hz desktop, 25.0 ms at 60 Hz tablet) |
| `jsHeapUsedMB` | `performance.memory.usedJSHeapSize` (when supported by Chromium, `null` otherwise) |
| `decodedParallaxMB` | Sum of `naturalWidth * naturalHeight * 4` across unique decoded parallax images |
| `timeToFirstParallaxFrameMs` | `performance.now()` on the first `drawImage` of a parallax asset onto `#game-viewport-canvas` |

Budgets (from `docs/design/parallax.md`):
- `desktop`: `p95 <= 8.3 ms` (120 Hz target)
- `tablet`: `p95 <= 16.6 ms` (60 Hz target)

Reports are written to `scripts/perf/out/` (git-ignored).
