# Developer Tools Parity Check (VC-070)

Updated: 2026-11-27.

Comparison of the "Tworzenie" developer dialog (`src/developer/**`) between baseline commit `8121dad` and current `HEAD`.

## Summary

- **Suspected losses confirmed missing or partial:**
  - Data Studio Bestiary Gallery (`BestiaryGalleryView`, `BestiaryCardItem`, `BestiaryEntryInspector`, `BestiaryFilters`) — **missing** (`VC-140`).
  - Data Studio VN Stage Preview (`MultiCharacterStage`, `DialogueBubble`, `SceneSelectorHeader`) — **partially present**; replaced by plain text node stepper + 5×5 Portrait Matrix (`VC-141`).
  - Data Studio JSON Export Modal (`JsonExportModal`, `ExportToolbar`) — **missing** (`VC-142`).
  - Debug State Dump (`DebugStateDumpCard`) — **missing**; only a clipboard "Copy Snapshot" button remains (`VC-143`).
  - Log Item Drawer (`LogsItemDrawer`) — **partially present**; replaced by inline `<pre>` expansion where `context` has no copy button (`VC-144`).
- **Suspected losses that are actually present:**
  - Tester simulation speed & single-frame step card (`TesterSimulationSpeedCard`) — **present** (inlined into `TestingSubtab.tsx` with `0.25x`–`4x` presets and `stepSingleFrame()`).
  - Debug collisions / sensor toggles (`DebugCollisionsCard` / `DebugTogglesCard`) — **present** (`DebugCollisionsCard` in `8121dad` was a re-export alias of `DebugTogglesCard`; all 4 toggles are inlined in `DebugSubtab.tsx`).
- **Additional gap found:**
  - Atlas Hero Pixel Tier Toggle (`AtlasTierToggle`, `heroPixelTiers.ts`) — **missing** from `AtlasSlicerSubtab.tsx` / `AtlasPresetPicker.tsx` (`VC-145`).

## Parity Table

| Tool | 8121dad location | Current status | Notes |
| :--- | :--- | :--- | :--- |
| Atlas Texture Viewer & Slicer | `src/developer/subtabs/atlas/AtlasTextureViewer.tsx`, `viewer/*` | **present** (moved) | Refactored in VC-071 into `AtlasTextureViewer.tsx`, `atlasCanvasRenderer.ts`, `hooks/useAtlasViewport.ts`. |
| Atlas Animation Preview & Filmstrip | `src/developer/subtabs/atlas/AtlasAnimationPreview.tsx`, `preview/*` | **present** (moved) | Refactored in VC-071 into `AtlasAnimationPreview.tsx` and `hooks/useAtlasPlayback.ts`. |
| Atlas Slicing Inspector & Background Baker | `src/developer/subtabs/atlas/AtlasSlicingInspector.tsx`, `slicing/*`, `AtlasBackgroundPanel.tsx` | **present** (moved) | Present in `AtlasSlicingInspector.tsx` and `AtlasBackgroundPanel.tsx`. |
| Atlas JSON Export Panel | `src/developer/subtabs/atlas/AtlasJsonExportPanel.tsx` | **present** | Live `meta.json` editor, syntax badge, copy, download, reset in `AtlasJsonExportPanel.tsx`. |
| Atlas Preset Selector | `src/developer/subtabs/atlas/AtlasPresetSelector.tsx`, `presets/*` | **present** (moved) | Replaced by `AtlasPresetPicker.tsx` (category filters, search, PNG/meta upload). |
| Atlas Hero Pixel Tier Toggle (`hi8bit` / `hi16bit` / `high`) | `src/developer/subtabs/atlas/AtlasTierToggle.tsx`, `heroPixelTiers.ts` | **missing** | `8121dad` switched hero sheets across `hi8bit` / `hi16bit` / `high` in the header. Follow-up: **VC-145**. |
| Atlas Status Bar / Log Strip | `src/developer/subtabs/atlas/AtlasStatusBar.tsx`, `status/*` | **partially present** | Replaced by `AtlasSlicerLogStrip.tsx` (collapsible `AtlasSlicing` log strip + "Open Logs" button); inline error banner / duration metrics removed. |
| Levels 8×8 (Matrix, Browser, Audit, Layers) | *(not in 8121dad)* | **present** (new) | Added after `8121dad` in `src/developer/subtabs/levels/LevelsSubtab.tsx`. |
| Data Studio: Spell & Skill Editor | `src/developer/subtabs/datastudio/SpellAndSkillEditorCard.tsx` | **present** (moved) | Inlined into `DataStudioSubtab.tsx` (`spells` tab) with schema validation, copy, and download. |
| Data Studio: Bestiary Gallery | `src/developer/subtabs/datastudio/EnemyEditorCard.tsx`, `components/bestiary/*` | **missing** | Enemy editor form is present, but `BestiaryGalleryView`, `BestiaryCardItem`, `BestiaryFilters`, and `BestiaryEntryInspector` were lost. Follow-up: **VC-140**. |
| Data Studio: Item Editor | `src/developer/subtabs/datastudio/ItemEditorCard.tsx` | **present** (moved) | Inlined into `DataStudioSubtab.tsx` (`items` tab). |
| Data Studio: VN Preview | `src/developer/subtabs/datastudio/VisualNovelPreviewCard.tsx`, `components/vn/*`, `services/visualNovelService.ts` | **partially present** | Plain text node stepper + 5×5 Portrait Matrix exist, but `MultiCharacterStage`, `DialogueBubble`, and `SceneSelectorHeader` were lost. Follow-up: **VC-141**. |
| Data Studio: Skill Tree DAG Visualizer | `src/developer/subtabs/datastudio/SkillTreeVisualizerCard.tsx` | **present** (moved) | Inlined into `DataStudioSubtab.tsx` (`skillTree` tab) with zoom, cycle check, and node inspector. |
| Data Studio: AI Prompt & Validator Sandbox | `src/developer/subtabs/datastudio/AIGeneratorCard.tsx` | **present** (moved) | Inlined into `DataStudioSubtab.tsx` (`aiSandbox` tab). |
| Data Studio: JSON Export Modal | `src/developer/subtabs/datastudio/components/JsonExportModal.tsx`, `ExportToolbar.tsx` | **missing** | Only direct copy/download buttons remain; preview modal with byte count and formatted snippet was lost. Follow-up: **VC-142**. |
| Tester: Teleport & Checkpoints | `src/developer/subtabs/tester/TesterTeleportCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Tester: Cheats & HP Controls | `src/developer/subtabs/tester/TesterCheatsCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Tester: Inventory & Gold | `src/developer/subtabs/tester/TesterInventoryCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Tester: Combat & Enemy Spawner | `src/developer/subtabs/tester/TesterCombatCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Tester: Simulation Speed & Step | `src/developer/subtabs/tester/TesterSimulationSpeedCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx` (`0.25x`, `0.5x`, `1x`, `2x`, `4x` + `stepSingleFrame()`; buttons instead of `SegmentedControl`). |
| Tester: Diagnostics (Hitboxes & Profiler) | `src/developer/subtabs/tester/TesterDiagnosticsCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Tester: Parallax, Music & Particles | `src/developer/subtabs/tester/TesterParallaxCard.tsx` | **present** (moved) | Inlined into `TestingSubtab.tsx`. |
| Debug: Telemetry Grid | `src/developer/subtabs/debug/DebugTelemetryCard.tsx` | **present** (moved) | Inlined into `DebugSubtab.tsx` (8 `MetricTile`s + Copy Snapshot button). |
| Debug: Player Inspector | `src/developer/subtabs/debug/DebugPlayerInspectorCard.tsx` | **present** (moved) | Inlined into `DebugSubtab.tsx`. |
| Debug: Collisions / Sensor Toggles | `src/developer/subtabs/debug/DebugCollisionsCard.tsx`, `DebugTogglesCard.tsx` | **present** (moved) | `DebugCollisionsCard` was an alias of `DebugTogglesCard`; all 4 toggles (Hitboxes, Profiler, Click-to-Teleport, Freeze AI) are in `DebugSubtab.tsx`. |
| Debug: Entity Table | `src/developer/subtabs/debug/DebugEntityTableCard.tsx` | **present** (moved) | Inlined into `DebugSubtab.tsx`. |
| Debug: State Dump | `src/developer/subtabs/debug/DebugStateDumpCard.tsx` | **missing** | On-screen live JSON `CopyableSnippet` card was lost; only clipboard "Copy Snapshot" button remains. Follow-up: **VC-143**. |
| Logs: Header Toolbar, Filters & Stream | `src/developer/subtabs/logs/LogsHeaderToolbar.tsx`, `LogsFilterControls.tsx`, `LogsTerminalList.tsx` | **present** (moved) | Inlined into `LogsSubtab.tsx`. |
| Logs: Log Item Drawer | `src/developer/subtabs/logs/LogsItemDrawer.tsx` | **partially present** | Replaced by inline `<pre>` expansion; structured `CopyableSnippet` drawer for `context` (with copy button) and styled error card was lost. Follow-up: **VC-144**. |
