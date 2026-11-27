# Final Play-Test Before Phase 4 Gate (VC-089)

**Date:** 2026-11-28  
**Branch:** `docs/vc089-final-playtest`  
**Build / Targets Tested:**
- **Built Pages distribution (`bun run build:pages` + `bun run preview:pages`)**: served under `/oXyFlow.VibrantCastle/`, headless Chromium 1248 (`%LOCALAPPDATA%/ms-playwright/chromium-1248`), `1280×800`.
- **Vite dev build (`vite`, `NODE_ENV=development`)**: Game dialog, keyboard & fake-gamepad navigation (`navigator.getGamepads`), confirmations, display/parallax quality tiers, PL/EN language switch, inventory, and all 6 "Tworzenie" developer tools.
- **Screenshot gallery:** 44 PNG captures + `index.html` contact sheet saved to `%TEMP%\vc089-playtest\index.html`.

---

## 1. End-to-End Checklist

| Area | Check | Pass/Fail | Note |
| :--- | :--- | :---: | :--- |
| **Built Wiki** | Wiki landing page loads under `/oXyFlow.VibrantCastle/` | **PASS** | Title `"Vibrant Castle — Kronika Cytadeli Aetheru"`, 0 console errors (`01_wiki_landing.png`). |
| **Built Wiki** | Wiki "Graj" button mounts `./game/index.html` inside `#game-viewport` | **PASS** | Canvas active and non-empty, 0 console errors (`02_wiki_graj_frame.png`). |
| **Built Game** | Direct `/game/index.html` loads and hides "Tworzenie" in production build | **PASS** | No Tworzenie header button; pressing `C` opens 0 dialogs; 0 console errors (`03_built_game_direct.png`). |
| **World 1 (`courtyard`)** | Load via `?location=courtyard`, render, move, jump, attack, forward portal | **PASS** | `Dziedziniec Przebudzenia` loaded; 9970/10000 non-zero canvas samples; `portal_exit_chasm` transitions `courtyard` → `thorn_chasm` (`04_world_1_courtyard.png`, `05b_courtyard_portal_forward.png`). |
| **World 2 (`thorn_chasm`)** | Load via `?location=thorn_chasm`, render, move, jump, attack, back portal | **PASS** | `Rozpadlina Cierni i Cieni` loaded; back portal transitioned to `Dziedziniec Przebudzenia`; 0 errors (`04_world_2_thorn_chasm.png`, `05_portal_transition.png`). |
| **World 3 (`ashen_catacombs`)** | Load via `?location=ashen_catacombs`, render, move, jump, attack, back portal | **PASS** | `Katakumby Popiołu` loaded; back portal transitioned to `Rozpadlina Cierni i Cieni`; 0 errors (`04_world_3_ashen_catacombs.png`). |
| **World 4 (`clocktower`)** | Load via `?location=clocktower`, render, move, jump, attack, back portal | **PASS** | `Wieża Zegarowa & Poligon Kątowy` loaded; back portal transitioned to `Katakumby Popiołu`; 0 errors (`04_world_4_clocktower.png`). |
| **World 5 (`alchemist_library`)** | Load via `?location=alchemist_library`, render, move, jump, attack, back portal | **PASS** | `Biblioteka Alchemika` loaded; back portal transitioned to `Wieża Zegarowa & Poligon Kątowy`; 0 errors (`04_world_5_alchemist_library.png`). |
| **World 6 (`aether_sanctuary`)** | Load via `?location=aether_sanctuary`, render, move, jump, attack, back portal | **PASS** | `Sanktuarium Aetheru & Podniebny Akwedukt` loaded; back portal transitioned to `Biblioteka Alchemika`; 0 errors (`04_world_6_aether_sanctuary.png`). |
| **World 7 (`grand_bastion`)** | Load via `?location=grand_bastion`, render, move, jump, attack, back portal | **PASS** | `Słoneczny Bastion (Wielki Poligon)` loaded; back portal transitioned to `Sanktuarium Aetheru & Podniebny Akwedukt`; 0 errors (`04_world_7_grand_bastion.png`). |
| **World 8 (`eclipse_crown`)** | Load via `?location=eclipse_crown`, render, move, jump, attack, back portal | **PASS** | `Korona Zaćmienia` loaded; back portal transitioned to `Słoneczny Bastion (Wielki Poligon)`; 0 errors (`04_world_8_eclipse_crown.png`). |
| **Game Dialog** | All 7 L1 tabs (`Gra`, `Mapa`, `Postać`, `Ekwipunek`, `Magia`, `Ustawienia`, `Pomoc`) + 4 Settings L2 sub-tabs | **PASS** | All tabs mounted and selected cleanly (`06_dialog_tab_*.png`, `07_settings_subtab_*.png`); 0 errors. |
| **Game Dialog** | Keyboard navigation (`Esc` open/close, `Q`/`E` L1 tabs, `[`/`]` L2 sub-tabs) | **PASS** | `E` → `locations`, `Q` → `menu`, `]` → `audio`, `[` → `display`, `Esc` closes dialog; 0 errors. |
| **Game Dialog** | Pad navigation via mocked `navigator.getGamepads` | **PASS** | `LB+RB` 0.5 s hold opened dialog with gamepad legend footer; `RB`/`LB` stepped L1 tabs; `RT`/`LT` stepped L2 sub-tabs; `B` closed dialog (`08_gamepad_nav_dialog.png`). |
| **Game Dialog** | Confirmations (`ConfirmDialog` on restart location & reset controls) | **PASS** | `Anuluj` focused by default; clicking cancel or pressing `Esc` closes nested dialog without closing main dialog (`09_confirm_dialog.png`). |
| **Settings** | Parallax quality tiers (`auto`, `low`, `mid`, `high`, `simplified`, `off`) | **PASS** | Background visibly changes across tiers (`off` flat gradient `var=0.0`, `simplified` `var=24.2`, `high` full layers `var=119.4`); 0 errors (`10_parallax_*.png`). |
| **Language** | Live PL / EN switching in Interface tab | **PASS** | Switching updates dialog & tabs immediately (`Game[M]` ↔ `Gra[M]`); 0 errors (`11_lang_en.png`, `12_lang_pl.png`). |
| **Inventory** | Paperdoll, quickbelt, 16-slot backpack, item comparison, equip, discard confirmation | **PASS** | Selecting `backpack:0` (`Lodowy Rapier Północy`) opens inspector + deltas; `Wyrzuć` opens `ConfirmDialog` (`Anuluj` focused); `Załóż Przedmiot` equips cleanly (`13_inventory.png`, `13_inventory_compare.png`). |
| **Tworzenie: Atlas** | Preset selection, grid/frame/chroma overlays, inspector tabs, JSON output | **PASS** | Presets render on canvas (`54` frames for Valen); all 4 inspector tabs switch cleanly; 0 errors (`14_dev_atlas.png`). |
| **Tworzenie: Poziomy 8×8** | Matrix, VC-075 Map Browser & Text Tool, Audit, Layers | **PASS** | Map Browser renders entities; Text Tool creates narration trigger (`narr_thorn_chasm_beat_1`), applies draft to map, exports JSON patch; Audit & Layers switch cleanly; 0 errors (`15_dev_levels_matrix.png`, `16_dev_levels_browser_text.png`, `16_dev_levels_text_patch.png`). |
| **Tworzenie: Studio danych** | All 6 domain tabs (`Zaklęcia`, `Bestiariusz`, `Przedmioty`, `Dialogi VN & Portrety`, `Drzewko DAG`, `AI Prompt & Walidator`) | **PASS** | All 6 tabs render and validate schemas with 0 errors (`17_dev_datastudio.png`). |
| **Tworzenie: Tester** | Spawn checkpoints, time-scale presets, toggles, monster spawn, particle presets | **PASS** | Actions execute with 0 errors (`18_dev_testing.png`). |
| **Tworzenie: Debug** | Telemetry tiles, player inspector, diagnostic switches | **PASS** | Live telemetry and entity counts update cleanly with 0 errors (`19_dev_debug.png`). |
| **Tworzenie: Logi** | Ring buffer stream, level filters, clear/export controls | **PASS** | Filters and modal close (`Esc`) work with 0 errors (`20_dev_logs.png`). |

**Summary:** **24 / 24 checks PASS** (`0` failures).

---

## 2. Console & Runtime Errors Found

- **Console errors (`console.error`):** `0` across all built-game, Wiki iframe, Game Dialog, Settings, Inventory, and Tworzenie runs.
- **Uncaught page errors (`pageerror`):** `0`.
- **Failed network requests (`requestfailed`):** `0`.

*(Note: inside the Tworzenie `Logi` ring-buffer viewer, `game:inventory` emits repeated `WARN Quick potion slot 1 is empty` entries when potion slot 1 is empty/queried — tracked as a non-blocker below.)*

---

## 3. Blockers & Fixes

**No blockers found.** No crashes, broken builds, unclosable dialogs, or unloadable maps occurred in either the Pages production distribution or the Vite dev build.

---

## 4. Non-Blocker Bugs & Follow-Up Cards (Phase 5)

Items already tracked in existing Phase 5 cards (`docs/tasks/phase-5-0.4.x.md`):
- Header / subtitle still displays `"Słoneczny Bastion Zamku"` instead of `"Vibrant Castle"` → **VC-156**.
- `aether_sanctuary` / `alchemist_library` opening narration (`"his fingers"`) & `aether_sanctuary` neon palette → **VC-155**, **VC-158**.
- DevTools parity cards (`DebugStateDumpCard`, `LogsItemDrawer`, Data Studio bestiary/VN/export) → **VC-140..VC-145**.

New non-blocker issues observed during VC-089 and filed as cards in `docs/tasks/phase-5-0.4.x.md`:

1. **VC-190 · Sync initial player max HP/MP/Stamina with equipped starter gear**
   - On fresh load in `courtyard`, the HUD displays `115 / 115` HP, `90 / 90` Mana, `115 / 115` Stamina, whereas `InventoryStats` (`activeDerivedStats`) displays `115 / 190`, `90 / 125`, `115 / 135` because equipped item bonuses are not synced into `Player.maxHealth` / `maxMana` / `maxStamina` until an equip/unequip occurs.
2. **VC-191 · Keep Inventory item inspector visible above the fold at 1280×800**
   - Inside `GameMenuDialog` (`h-[min(85vh,760px)]`), selecting a backpack item leaves the `InventoryItemDetails` card partially below the fold at `1280×800` (`13_inventory_compare.png`), hiding action buttons and stat comparison deltas until scrolled.
3. **VC-192 · Clean up raw hero id, duplicate vitals labels, and legacy status title**
   - `DebugSubtab.tsx` shows `P1 · valen` (raw lowercase id) and duplicates `115/115` above and inside the `ProgressBar` (`19_dev_debug.png`).
   - `src/i18n/modules/hud.ts` still labels P1 as `"Gracz 1 (Valen - Szkarłat)"` in `Postać` (`06_dialog_tab_character.png`).
4. **VC-193 · Throttle or downgrade `Quick potion slot 1 is empty` ring-buffer warnings**
   - `Logi` (`20_dev_logs.png`) shows repeated `WARN [game:inventory] Quick potion slot 1 is empty` entries filling the diagnostic ring buffer.
5. **VC-194 · Deduplicate floating `Włącz Dźwięk` HUD button against top bar audio toggle**
   - When audio is not yet initialized (seen in `02_wiki_graj_frame.png`), both the top header audio icon and a floating `Włącz Dźwięk` pill on the right canvas edge appear simultaneously.
