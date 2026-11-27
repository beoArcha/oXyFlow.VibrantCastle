# Phase 4 General Code Review (VC-090)

**Scope:** PRs `#62`–`#147` (`git log --oneline --merges -60` covering Phase 4 `0.3.x`), focusing on `src/game/parallax/**`, `src/game/locations/locationAssetLifecycle.ts`, `src/game/loop/*`, `src/game/engine/atlas/**`, `scripts/sprites/**`, `scripts/parallax/**`, `src/developer/subtabs/levels/**`, `src/game-menu/**`, and `.github/workflows/*`.

**Baseline checks at review checkout (`81816ca`):**
- `bun run typecheck` (`tsc --noEmit`): 0 errors.
- Targeted module tests (`src/game/parallax`, `src/game/locations`, `src/game/loop`, `scripts/__tests__/structureCompile.test.ts`, `src/developer/subtabs/levels`): 250 pass, 0 fail.
- `bun test src/tests/arch`: 245 pass, 1 timeout (`Architectural Boundary Rules > ensures zero files in src import from obsolete game/i18n directory` at 7442 ms vs 5000 ms timeout; see verification section after edits).

---

## Release Verdict for `0.3.x`: YES (Fit to Release)

The codebase is **fit to release `0.3.x` with 0 blockers**.

1. **Core Architecture Holds:** `src/game/` has zero DOM or React imports, React layers (`src/game-menu/`, `src/hud/`, `src/developer/`) remain passive views driven by snapshots/contexts without gameplay state, and production code under `src/` contains zero `new Error(...)` calls.
2. **Primary Runtime Flows Verified:** Typechecking passes cleanly, unit/integration specs across parallax, locations, loop, developer map tools, and sprite compilation pass (`250/250`), and the preceding Phase-4 headless playtest (`VC-089`) already established baseline navigability across worlds and menus.
3. **Remaining Issues Are Non-Blocking for `0.3.x`:** High and medium findings affect multi-map prolonged sessions (zone-variant VRAM growth and dual cache paths at 8×8 scale), developer map draft editing edge cases, and `release-promote.yml` workflow hygiene (duplicate Pages deployment and late tag collision checks) — all tracked as Phase 5 follow-up cards (`VC-200`–`VC-211`) rather than regressions blocking a `0.3.x` release (with release operators ensuring `package.json` version bump lands before triggering `release-promote.yml`).

---

## Severity Summary & Follow-Up Cards

| Severity | Count | Phase 5 Cards |
| :--- | :---: | :--- |
| Blocker | 0 | — |
| High | 6 | `VC-200` – `VC-205` |
| Medium | 6 | `VC-206` – `VC-211` |
| Low | 7 | Logged below only |
| **Total** | **19** | **12 cards (`VC-200`–`VC-211`)** |

---

## Blockers (0)

None.

---

## High Findings (6)

### H-1 · Zone variant textures leak across map unloads and cannot upgrade quality (`VC-200`)
- **Location:** `src/game/locations/locationAssetLifecycle.ts:396-405, 486-503`, `src/game/locations/parser/locationParser.ts:76-140`, `src/game/parallax/render/ParallaxSystem.ts:990-1020`
- **Issue:** `unloadLocation()` (`locationAssetLifecycle.ts:486-503`) only evicts URLs/keys present in `location.parallaxBackground?.layers`. However, `buildResolvedParallax()` (`locationParser.ts:76-140`) never places zone variant URLs (`@boss`, `@rest`, `@secret`, `@story`) into `layers`; instead, `ParallaxSystem.enqueueNearbyZoneVariant()` (`ParallaxSystem.ts:990-1014`) enqueues them lazily at runtime. Additionally:
  1. `enqueueNearbyZoneVariant()` guards with `!this.loadQueue.isManaged(slot.cacheKey) && !this.loadQueue.isManaged(slot.url)` (`ParallaxSystem.ts:997`), while `LocationAssetLifecycle.setParallaxQuality()` (`locationAssetLifecycle.ts:396-405`) only calls `queue.clear()` on downgrades (`off`, `simplified`, or lower tier), never on upgrades.
  2. In the fallback `loader` branch (`ParallaxSystem.ts:1018-1020`), `pendingVariantUrls.add(slot.url)` is never removed on promise failure or completion.
- **Concrete Failure Scenario:** Playing through 8 worlds × 8 maps keeps every visited zone variant `ImageBitmap` resident in `defaultParallaxLoadQueue` without calling `bitmap.close()`, accumulating GPU/RAM memory indefinitely. Upgrading quality from `mid` to `high` inside a boss/rest zone leaves zone variants permanently stuck at `mid` because `isManaged()` remains true. A single transient network failure on a fallback variant URL permanently blocks retries.
- **Suggested Fix:** Track all zone-variant keys/URLs enqueued for a `locationId` (either on `LocationAssetLifecycle` or via a `ParallaxSystem.unloadLocation(locationId)` hook) and evict/close them in `unloadLocation()`; key zone-variant cache entries by tier or invalidate managed variant entries on quality upgrade; remove from `pendingVariantUrls` in `.finally()`.

### H-2 · Map Text Tool silently drops newly created narration triggers on a second "Apply Draft" (`VC-201`)
- **Location:** `src/developer/subtabs/levels/useMapBrowserState.ts:107-119, 139-157, 178-200`, `src/developer/subtabs/levels/mapEntities.ts:202-217`, `src/developer/subtabs/levels/mapTextPatch.ts:173-175`
- **Issue:** `handleCreateTriggerArea()` (`useMapBrowserState.ts:139-157`) opens the form with `mode: "create-trigger"` and `triggerIndex: undefined`. After the first `handleApplyDraft()` creates the draft (`kind: "create"`), line `200` flips `textForm` to `mode: "edit-trigger"` while `triggerIndex` stays `undefined` (selecting a newly created trigger on the canvas via `mapEntities.ts:202-217` and `useMapBrowserState.ts:107-119` produces the same `undefined` index). On a second click of "Apply Draft", `handleApplyDraft()` takes the `"edit-trigger"` branch (`kind: "edit"`, `originalIndex: undefined`), and `buildLocationTextPatch()` (`mapTextPatch.ts:173-175`) skips every `"edit"` entry with `if (index === undefined || !before) continue;`.
- **Concrete Failure Scenario:** A designer creates a new narration trigger on the map canvas, applies it once, notices a typo or toggles `oneShot`, edits it, and clicks "Apply Draft" again. Exporting the patch or diff silently omits the trigger completely with no error or warning.
- **Suggested Fix:** Keep a stable draft identifier (or preserve `kind: "create"` / synthetic draft key when `triggerIndex === undefined`) so subsequent edits update the pending `"create"` entry in place rather than converting it into an unindexed `"edit"`. Add unit tests in `src/developer/subtabs/levels/` covering double-apply and canvas re-selection of new triggers.

### H-3 · Discarded subscriptions and missing `dispose()` in `ParallaxSystem` / `GameEngine.attachCanvas` (`VC-202`)
- **Location:** `src/game/parallax/render/ParallaxSystem.ts:237-239, 253-255`, `src/game/loop/engine.ts:184-195`, `src/game/parallax/parallaxWiring.ts:118-126`
- **Issue:** `ParallaxSystem`'s constructor subscribes to `this.registry.subscribeQuality` (`lines 237-239`) and `this.loadQueue.subscribeRelease` (`lines 253-255`) — which default to global module singletons `defaultParallaxRegistry` and `defaultParallaxLoadQueue` — and discards both unsubscribe callbacks. `ParallaxSystem` has no `dispose()` method, and `GameEngine.attachCanvas()` (`engine.ts:184-195`) replaces `this.renderer` (`new GameRenderer(...)` -> `createDefaultParallaxSystem()`) without tearing down the previous renderer instance.
- **Concrete Failure Scenario:** React strict-mode double-mounts, canvas remounts, or dev harness restarts register duplicate quality/release callbacks on global singletons that retain references to stale `ParallaxSystem`, `ParallaxSurfaceCache`, and `AtmosphericSectorRenderer` offscreen canvases across the page lifetime.
- **Suggested Fix:** Store unsubscribe functions on `ParallaxSystem`, add `ParallaxSystem.dispose()` and `GameRenderer.dispose()` (closing listeners and releasing owned surface caches), and invoke `this.renderer?.dispose()` inside `GameEngine.attachCanvas()` before instantiating the replacement renderer.

### H-4 · `release-promote.yml` triggers duplicate Pages deploy, checks tags too late, and over-scopes workflow permissions (`VC-203`)
- **Location:** `.github/workflows/release-promote.yml:23-26, 69-157, 140, 158-170, 200-207`, `.github/workflows/deploy-pages.yml:3-18`
- **Issue:**
  1. `promote` pushes to `refs/heads/release` (`release-promote.yml:140`), which fires `deploy-pages.yml`'s `push: branches: [release]` trigger (`deploy-pages.yml:3-18`), while `deploy-release` simultaneously invokes `deploy-pages.yml` via `workflow_call` (`release-promote.yml:158-170`) with `cancel-in-progress: false`.
  2. Tag existence (`git ls-remote ... refs/tags/v${VERSION}`) is verified in `create-release` (`release-promote.yml:200-207`) *after* `promote` already moved `origin/release` and `deploy-release` deployed Pages.
  3. Top-level `permissions` (`release-promote.yml:23-26`) grants `contents: write`, `pages: write`, and `id-token: write` globally across all jobs, including `verify-main` (`lines 69-107`), which executes project build and test scripts.
- **Concrete Failure Scenario:** Every promotion workflow run triggers two full `build:pages` + `test:e2e` + Pages deployments back-to-back. If a maintainer forgets to bump `package.json` before promoting, `origin/release` and the live site advance to the new commit while `create-release` fails mid-flight, leaving `release` and tags out of sync.
- **Suggested Fix:** Restrict top-level `permissions` to `contents: read` and scope write permissions strictly to the jobs that need them (`contents: write` on `promote`/`create-release`, `pages: write`/`id-token: write` on `deploy-release`); verify the target `v${VERSION}` tag does not exist in `verify-main` before mutating `origin/release`; drop either the redundant `workflow_call` or the `push: release` trigger collision so a promotion deploys once.

### H-5 · Two separate parallax caches (`assetLoader` vs `defaultParallaxLoadQueue`) bypass eviction (`VC-204`)
- **Location:** `src/game/parallax/parallaxWiring.ts:118-126`, `src/game/parallax/render/ParallaxSystem.ts:234-235, 333-359, 695-701`, `src/game/engine/assetLoader.ts:44`, `src/game/locations/locationAssetLifecycle.ts:360, 495`
- **Issue:** `createDefaultParallaxSystem()` (`parallaxWiring.ts:118-126`) passes `loader: assetLoader` without an explicit `loadQueue`, causing `ParallaxSystem` to use `defaultParallaxLoadQueue` with `this.useExplicitLoadQueue = false` (`ParallaxSystem.ts:234-235`). Because `useExplicitLoadQueue` is `false`, `ParallaxSystem.preload()` (`lines 333-359`) calls `this.loader.loadTexture(...)`, populating `assetLoader.textureCache` (`assetLoader.ts:44`), and `ParallaxSystem.getImage()` (`lines 695-701`) also falls back to `this.loader.loadTexture(...)` whenever `loadQueue.get(cacheKey)` is absent. Meanwhile `defaultLocationAssetLifecycle` is instantiated with `externalLoader = null` (`locationAssetLifecycle.ts:360, 495`), so `unloadLocation()` never evicts `assetLoader.textureCache`.
- **Concrete Failure Scenario:** Preloaded parallax backdrops and any layer fetched via `getImage()` before `loadQueue` finishes stay cached in `assetLoader.textureCache` across all 8 worlds × 8 maps, bypassing `LocationAssetLifecycle` eviction and keeping duplicate decoded textures alive.
- **Suggested Fix:** Route runtime parallax loading and preloading consistently through `ParallaxLoadQueue` (`useExplicitLoadQueue = true` or pass the queue explicitly in `createDefaultParallaxSystem()`), or wire `externalLoader` eviction cleanly if any fallback loader textures remain necessary.

### H-6 · Unpinned CI actions (`@v4`/`latest`), unused ESLint config in `bun run lint`, and duplicate main/promote CI checks (`VC-205`)
- **Location:** `.github/actions/setup-bun-cached/action.yml:8`, `.github/workflows/ci-pr.yml:94-105`, `.github/workflows/ci-main.yml:19-27, 97-108`, `.github/workflows/deploy-pages.yml`, `.github/workflows/release-promote.yml:85-106`, `package.json:15`, `eslint.config.js`, `scripts/coverage-gate.ts:288-307`
- **Issue:**
  1. All workflow actions reference mutable tags (`@v4`, `@v2`, `@v5`, `@v3`) rather than commit SHAs, and `setup-bun-cached/action.yml:8` defaults `bun-version: latest`.
  2. `package.json:15` defines `"lint": "tsc --noEmit"`, leaving `eslint.config.js` unexecuted by both `bun run lint` and CI workflows.
  3. `ci-pr.yml:94-105` and `ci-main.yml:97-108` mark `actions/download-artifact@v4` as `continue-on-error: true` before `scripts/coverage-gate.ts` (`lines 288-307`, which itself cleanly exits `1` unless `--allow-missing` is passed, though `continue-on-error` masks artifact download transport errors).
  4. `ci-main.yml` and `release-promote.yml:85-106` duplicate the full check matrix sequentially even when promoting an already-verified `main` SHA.
- **Concrete Failure Scenario:** An upstream tag rewrite or silent `bun-version: latest` upgrade can break or alter builds mid-phase; ESLint issues (`no-explicit-any` warnings) accumulate unseen because CI only runs `tsc --noEmit`.
- **Suggested Fix:** Pin all third-party GitHub Actions to full 40-char commit SHAs and set an explicit default `bun-version` in `setup-bun-cached/action.yml`; add a dedicated ESLint step (`bun run eslint` or wire ESLint into lint/CI); remove `continue-on-error: true` from coverage artifact downloads once unit/integration steps are guaranteed to upload.

---

## Medium Findings (6)

### M-1 · `ParallaxFrameTimeProbe` ignores `setTargetFps()` changes after startup window completes (`VC-206`)
- **Location:** `src/game/loop/engineSettingsController.ts:59-87, 127-132`
- **Issue:** `EngineSettingsController.setTargetFps()` (`lines 127-132`) calls `this.autoDowngradeProbe.setBudgetMs(...)` without resetting the probe or `hasProbeDowngraded`. Additionally, the constructor (`lines 59-87`) does not synchronize `fpsManager.setTargetFps(initialTargetFps)`, relying on `EngineLoopRunner.start()` to apply it later.
- **Concrete Failure Scenario:** After the first ~2.3 seconds at 60 FPS (`finished === true`), raising the target to `120 FPS` never re-runs the frame-time probe against the tighter 8.33 ms budget. Conversely, if 120 FPS triggered an auto-downgrade, lowering back to `60 FPS` keeps `hasProbeDowngraded` locked.
- **Suggested Fix:** Reset the probe state (`resetProbe(budgetMs)` or equivalent) and clear `hasProbeDowngraded` when `setTargetFps()` changes the active FPS target; synchronize `fpsManager.setTargetFps(initialTargetFps)` in the constructor.

### M-2 · Per-frame allocations in `render()` hot path and fragile `ImageBitmap` readiness checks (`VC-207`)
- **Location:** `src/game/loop/engineFrameRenderer.ts:40-42`, `src/game/locations/locationAssetLifecycle.ts:510`, `src/game/renderer/structureRenderer.ts:46, 60, 183-192, 203`, `src/game/renderer/background/parallaxTiling.ts:227-228`, `src/game/parallax/render/ParallaxBackdropRenderer.ts:62, 155`, `src/game/parallax/loading/browserBitmapDecoder.ts:58`
- **Issue:**
  1. `EngineFrameRenderer` invokes `defaultLocationAssetLifecycle.enterLocation(host.currentLocation.id)` (`engineFrameRenderer.ts:40-42`) on every render frame, returning a newly allocated `Promise` 60–120 times per second even when `currentLocation.id` matches `activeLocationId` (`locationAssetLifecycle.ts:510`).
  2. `StructureRenderer.renderGoalPortal()` (`structureRenderer.ts:183-192`) allocates a fresh options object literal per portal per frame (unlike `this.hazardOptions` at `line 60` and `this.region` at `line 46`), and `line 203` allocates a template string `cacheKey` in its procedural fallback every frame.
  3. `parallaxTiling.ts:227-228` and `ParallaxBackdropRenderer.ts:62, 155` inspect `img.complete` / `img.naturalWidth` directly; for `ImageBitmap` sources where `Object.isExtensible(bitmap)` is false, `attachBitmapImageMetrics()` (`browserBitmapDecoder.ts:58`) is a silent no-op.
- **Concrete Failure Scenario:** Continuous micro-allocations inside `render()` create avoidable GC pressure at 120 Hz across multi-entity maps, while non-extensible `ImageBitmap` instances fail readiness checks if browser implementations disallow attaching `naturalWidth`/`complete`.
- **Suggested Fix:** Cache `lastEnteredLocationId` in `EngineFrameRenderer` before calling async `enterLocation()`; preallocate a reusable `goalOptions` struct and `cacheKey` lookup on `StructureRenderer`; use `isDrawableReady()` / `resolveSourcePixelWidth()` consistently in `parallaxTiling.ts` and `ParallaxBackdropRenderer.ts`.

### M-3 · Type-safety and error-hierarchy gaps: `: any` in atlas/meta parsers and raw `new Error` in scripts (`VC-208`)
- **Location:** `src/game/engine/meta/slicing/AtlasSlicingEngine.ts:71, 143`, `src/game/engine/meta/slicing/ISlicingStrategy.ts:7-8`, `src/game/engine/meta/MetaParser.ts:177`, `src/game/engine/meta/parsers/*.ts`, `src/game/engine/spriteTypes.ts:148-150`, `scripts/review/parallaxSheet.ts:103`, `scripts/wiki/wikiContent.ts:163`, `scripts/wiki/wikiAppScript.ts:61, 97`
- **Issue:** Twenty-three `: any` / `Record<string, any>` annotations remain in atlas/meta parsing and `spriteTypes.ts`, violating `.agents/rules/code_cleanliness.md` §1 (`any` forbidden). Arch tests do not scan for `any`, and ESLint is decoupled from `bun run lint` (`package.json:15`). Additionally, `scripts/review/parallaxSheet.ts:103` and `scripts/wiki/{wikiContent.ts:163, wikiAppScript.ts:61, 97}` still throw raw `new Error(...)`.
- **Concrete Failure Scenario:** Malformed atlas/meta JSON passes parser boundaries untyped, hiding schema mismatches at compile time and surfacing runtime property errors instead of typed `ParserError` / `AssetError` diagnostics.
- **Suggested Fix:** Replace `any` and `Record<string, any>` across `MetaParser`, `AtlasSlicingEngine`, `ISlicingStrategy`, `parsers/*.ts`, and `spriteTypes.ts` with `unknown` + type guards or typed DTOs; replace raw `new Error(...)` in `scripts/review/parallaxSheet.ts` and `scripts/wiki/wikiContent.ts` with domain errors (`AssetError` / `ParserError`, keeping browser-inlined `wikiAppScript.ts` aligned with bundle constraints); consider gating `any` in arch tests or ESLint.

### M-4 · `LevelsSubtab.tsx` exceeds 850 LOC with mixed responsibilities, inline i18n, and lost map drafts (`VC-209`)
- **Location:** `src/developer/subtabs/levels/LevelsSubtab.tsx` (857 LOC; `184-240, 302-311, 329, 397-403, 464-580, 628-754`), `src/developer/subtabs/levels/useMapBrowserState.ts:60-63, 227`
- **Issue:** `LevelsSubtab.tsx` combines four distinct sub-views (`matrix`, `browser`, `audit`, `layers`) in one 857-line file (well over the ~300 LOC limit in `code_cleanliness.md` §1), repeats inline `isPl ? ... : ...` ternary translations instead of `useI18n()`, and uses inline `style={{ backgroundColor: world.accentHex }}` (`line 329`). Switching tabs away from `"browser"` unmounts `MapBrowserPanel`, discarding unsaved drafts held inside `useMapBrowserState` (`lines 60-63`), and `useMapBrowserState.ts:227` schedules a `setTimeout` without unmount cleanup.
- **Concrete Failure Scenario:** A developer creating triggers/portals switches briefly to `audit` or `matrix` to verify IDs and loses all unapplied drafts immediately upon returning to `browser`.
- **Suggested Fix:** Split `LevelsSubtab.tsx` into cohesive view components (`matrix`, `audit`, `layers`) under 300 LOC each, move copy into `src/i18n/modules/developer.ts`, hoist draft state or warn on unsaved switch, and clear the copy-feedback timer on unmount in `useMapBrowserState.ts`.

### M-5 · Hardcoded hex colors in `src/game-menu/` bypass design-system tokens and `designSystemBoundaries.test.ts` (`VC-210`)
- **Location:** `src/game-menu/layout/GameLayout.tsx:22, 41, 242`, `src/game-menu/menu/tabs/DisplayTab.tsx:55`, `src/game-menu/menu/tabs/display/GraphicsQualitySection.tsx:137`, `src/tests/arch/designSystemBoundaries.test.ts:65, 121`
- **Issue:** Several `src/game-menu/` components apply raw hex Tailwind utility classes (`bg-[#120704]`, `bg-[#160804]/95`, `bg-[#0c0402]`, `bg-[#140602]`, `border-[#5c2d18]`), violating `.agents/rules/frontend_ui.md` §1. `src/tests/arch/designSystemBoundaries.test.ts:65, 121` only audits `datastudio` and `src/ui/`, leaving `src/game-menu/` and `src/hud/` unenforced.
- **Concrete Failure Scenario:** Theme or contrast adjustments made to `@ui` semantic tokens fail to propagate to the menu frame, header/sidebar, and graphics quality controls, causing inconsistent contrast across dialogs.
- **Suggested Fix:** Replace hardcoded hex classes in `src/game-menu/` with semantic `@ui` tokens or CSS variables and extend `designSystemBoundaries.test.ts` to check `src/game-menu/` and `src/hud/` (excluding intentionally decorative HUD meters if needed via documented allowlist).

### M-6 · `simplified` tier URL mismatch, idle-pump throttling, and shared module singletons (`VC-211`)
- **Location:** `src/game/locations/locationAssetLifecycle.ts:196-215, 430-443, 610`, `src/game/parallax/loading/ParallaxLoadQueue.ts:349-352, 483`, `src/game/parallax/registry.ts:403`
- **Issue:**
  1. `LocationAssetLifecycle.getLayerUrls()` (`locationAssetLifecycle.ts:430-443`) returns URLs for all layers using `tierOverride` even when `parallaxQuality === "simplified"`, whereas `buildLocationLoadTasks()` (`lines 196-215`) intentionally loads only the `far` tier on `"simplified"`.
  2. `ParallaxLoadQueue.pump()` (`ParallaxLoadQueue.ts:349-352`) throttles `priority > FAR` layers to `1` decode start per `requestIdleCallback` slice (`timeout: 1200`), which can delay foreground parallax readiness across 6+ non-`far` layers while an active 60–120 FPS loop leaves little idle time.
  3. Production exports `defaultParallaxLoadQueue` (`ParallaxLoadQueue.ts:483`), `defaultLocationAssetLifecycle` (`locationAssetLifecycle.ts:610`), and `defaultParallaxRegistry` (`registry.ts:403`) hold mutable module-level listeners and caches; any test or caller touching defaults shares state across runs, and unit coverage currently lacks integrated `LocationAssetLifecycle` + `ParallaxSystem` transitions (`mid -> high` zone variants and unload eviction).
- **Concrete Failure Scenario:** Callers inspecting `getLayerUrls()` in `"simplified"` mode prefetch/expect layers that `buildLocationLoadTasks()` never decodes; under busy gameplay rAF frames, non-`far` layers drip-feed one per idle window up to ~1.2 s apart; test suites without explicit DI isolation can leak queued tasks or listeners into subsequent tests.
- **Suggested Fix:** Align `getLayerUrls()` with `buildLocationLoadTasks()` for `"simplified"` (`far` only); allow configurable idle burst batching or shorter fallback scheduling in `ParallaxLoadQueue.pump()`; add explicit reset/dispose helpers on defaults for test isolation plus integration tests spanning `LocationAssetLifecycle` + `ParallaxSystem`.

---

## Low Findings (7)

1. **`forceBossScope` studio override omits `ambientColor` (`src/game/parallax/render/ParallaxSystem.ts:433-438`):** Sets `kind = "boss"` and `weight = 1` without setting `zoneResolution.ambientColor`, diverging from real boss zone resolution.
2. **Surface cache creation leaks target on missing 2D context (`src/game/parallax/render/ParallaxSurfaceCache.ts:175`):** If `factory(w, h)` returns a surface with `ctx === null`, `created.release?.()` is not called before returning the source fallback.
3. **Glow pass mutates shared canvas state (`src/game/renderer/decorRenderer.ts:138-142`):** Resets `ctx.globalAlpha = 1` and `ctx.globalCompositeOperation = "source-over"` directly instead of restoring prior context state.
4. **Fragile global dialog selector in input hooks (`src/game-menu/controls/useMenuGamepad.ts:53`, `src/game-menu/layout/useAppHotkeys.ts:28`):** `document.body.querySelector('[data-slot="dialog-content"]') !== null` assumes `@ui` `Dialog` always unmounts closed portals cleanly and couples input suppression to DOM slot attributes.
5. **Dead private method in `ParallaxSystem` (`src/game/parallax/render/ParallaxSystem.ts:623-627`):** `enqueueLayersProgressive` has no remaining call sites and can be removed.
6. **JPEG Huffman parser silent fallback & stale migration script (`scripts/parallax/jpgInfo.ts:95-105`, `scripts/parallax/migrate.ts`):** `readHuffman` returns `0` on corrupted/truncated JPEG streams instead of throwing `AssetError`; `scripts/parallax/migrate.ts` still references removed `src/game/locations/parallaxLayerRegistry.ts`.
7. **Inconsistent short-circuit in `applyDisplaySettings` (`src/game/loop/engineSettingsController.ts:193-195`):** Calls `spriteSources.setQuality` unconditionally on every apply (no-op internally, unlike the explicit equality guard around `parallaxQuality`), and unit coverage across `ParallaxLoadQueue` / `LocationAssetLifecycle` uses separate instances rather than testing `ParallaxSystem` + `LocationAssetLifecycle` end-to-end eviction.
