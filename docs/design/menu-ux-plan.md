# Vibrant Castle: in-game menu UX plan (max gain, min work)

Scope: layout, grouping, labels, navigation, feedback only. No new game systems.
Based on: report-menu-ux.md, report-menu.md, screenshots (h_menu_m*, narrow/m.png, h_ekwipunek_i), HEAD after #62, baseline 8121dad.

Problem today, in one line: one Modal per ModalId. Each one repeats the L1 row (`ModalNavigationTabs`), so Menu > Tworzenie can stack 3 tab rows plus a filter row. Game and dev tools are mixed, the width jumps between 4xl/5xl/7xl, and the gamepad does nothing in menus.

---

## 1. Target information architecture

### 1a. Game dialog (player-facing). One shell, fixed size, L1 always visible, L2 only where marked

| L1 (PL / EN) | Hotkey | Pauses | L2 | Feeds from (existing code) |
|---|---|---|---|---|
| Gra / Game | M | yes | none | `menu/tabs/GameplayTab.tsx` reduced to `GameModeSection`, `GameSaveSection`, plus "Restart lokacji" from `GameConfigBarSection` |
| Mapa / Map | | yes | none (reserved: 8 worlds x 8 maps as an in-panel grid, **not** tabs) | `menu/tabs/LocationsTab.tsx` |
| Postać / Character | | yes | hidden while it has 1 section. Reserved: `Atrybuty` and `Kronika` | `modal/views/StatsMenuTab.tsx` + `menu/stats/*` (shown as "Kronika"; attributes slot later) |
| Ekwipunek / Inventory | I | no (live) | none (reserved: `Wyposażenie` and `Plecak` if the rebuild needs it) | `modal/views/InventoryModalView.tsx` (rebuild from 8121dad `inventory/*` is deferred) |
| Magia / Magic | K | no (live) | none | body of `skills/SkillTreePanel.tsx`, extracted to `skills/SkillTreeView.tsx` (Modal wrapper removed) |
| Ustawienia / Settings | | yes | **Obraz, Dźwięk, Sterowanie, Interfejs** | `menu/tabs/DisplayTab.tsx`, `menu/tabs/AudioTab.tsx`, `modal/views/ControlsMenuTab.tsx` (+ restored `GamepadMapper`), new `menu/tabs/InterfaceTab.tsx` = `GameHudSection` + `LanguageSelector` + export/import/reset from `GameConfigBarSection` |
| Pomoc / Help | H, F1, ? | yes | none | `modal/views/HelpModalView.tsx` without the binding table. It gets an "Otwórz Sterowanie" button that jumps to Ustawienia > Sterowanie |

- L1 ids stay in `modal/modalRegistry.ts` (`ModalId`), so hotkeys, pause and header hints keep working. Add `Locations`, `Character`, `Settings`. Keep `ModalId.Menu` as the id for "Gra" so the M hotkey and tests don't churn. Add `dialog: "game" | "dev"` to `ModalDefinition`.
- L2 registry: `menu/menuTabRegistry.ts` becomes `SETTINGS_TAB_REGISTRY` (Display, Audio, Controls, Interface). `MenuTabId.Developer`, `Gameplay`, `Locations` and `Stats` leave it.
- `GameCombatTipsSection` moves from Gra into Pomoc, its natural home.
- Max rows: L1 + L2 = 2. Filter chips inside a panel are content, not tab rows. They are styled as chips, never as `Tabs`.

### 1b. Dev dialog ("Tworzenie", key C only). Separate shell, never shows game tabs

| L1 | Feeds from |
|---|---|
| Atlas, Poziomy 8x8, Studio danych, Tester, Debug, Logi | `developer/registry/devToolRegistry.tsx` via `developer/DeveloperSuite.tsx` |

- L2 = at most one tab row owned by the tool (e.g. Atlas: Podgląd, Cięcie i ścieżki, Tło alpha, JSON). Category filters stay chips.
- Labels move from hardcoded PL strings to `labelKey` in `i18n/modules/developer/*`.
- Emerald accent, title "Tworzenie", no Wznów and no game L1 row. Removed from the game dialog completely, including the `renderDeveloperSuite` use inside the Menu tab.

---

## 2. Navigation model

### Hotkeys (keyboard; `layout/useAppHotkeys.ts` + registry)
| Key | Closed (gameplay) | Game dialog open | Dev dialog open |
|---|---|---|---|
| Esc | open game dialog on last-used L1 (default Gra) | close the top layer: confirm, then rebind, then dialog (resumes if it paused) | close |
| M / I / K / H / F1 / ? | open that L1 | another tab: switch. Same tab: close (toggle, as today) | close dev, open game tab |
| C | open dev dialog | ignored (never mix) | close |
| P | toggle pause | Wznów = close + unpause | ignored |
| Q / E | | previous / next L1 (wraps), mirrors LB/RB | previous / next tool |
| [ / ] | | previous / next L2 (no-op without L2), mirrors LT/RT | previous / next tool section |
| Tab / Shift+Tab, arrows, Enter/Space | | standard focus; Base UI tablist already handles arrows | same |
Restore F1: in the Help entry, `hotkeys: ["h", "?", "F1"]` (`findModalByHotkey` already matches the raw key).

### Restricted gamepad (standard mapping, new `game-menu/controls/useMenuGamepad.ts`)
| Button | In dialog |
|---|---|
| LB / RB (4/5) | previous / next **L1** tab |
| LT / RT (6/7) | previous / next **L2** tab (only Ustawienia today; Postać later) |
| A (0) | confirm: activate the focused element |
| B (1) | back: close confirm, then close dialog and resume |
| X (2) | context action on the focused item (Ekwipunek: Wyrzuć, which always opens a confirm; Ustawienia: Przywróć domyślne for the section) |
| Y (3) | details: inspect item / skill; elsewhere it toggles the control-legend footer |
| D-pad / left stick | up/down = previous/next focusable in the dialog. Left/right = send ArrowLeft/Right to `document.activeElement` (sliders, radio groups and tablists handle it natively) |
| Start (9), if present | open (last tab) / close the game dialog. The dev dialog has no pad entry |

- Edge-triggered with repeat (400 ms delay, 120 ms repeat). Polls with rAF **only while a dialog is open**.
- While the game dialog is open, the menu captures pad input. Add `input.setMenuCapture(bool)` in `game/loop/input.ts` so live tabs (Ekwipunek, Magia) don't also jump or cast.
- Pads with no Start button: open question for the owner (an LB+RB hold chord would fire potion1/magic2). Deferred.

### Focus and open/close
- Open: focus goes to the active L1 tab. Switching L1/L2 with bumpers keeps focus on that tablist, and D-pad down enters the panel.
- Close: the Modal restores focus (already built in). Closing a pausing tab unpauses (`useModalCoordinator`, already built in).
- Lift the active L2 into the coordinator: `activeSubTab` per L1, which bumpers and triggers need. Remember last L1/L2 for the session (memory only).
- Footer legend bar: with a pad connected, "A Wybierz · B Wróć · LB/RB Zakładki · LT/RT Sekcje · X Akcja". Otherwise, "Enter · Esc · Q/E · [ ]". This alone fixes most "how do I navigate" confusion.

---

## 3. Consistency rules
1. **Sizes.** Game dialog: `max-w-5xl` and a fixed height `h-[min(85vh,760px)]`. Header and tab rows don't scroll; only the panel body scrolls. Dev dialog: `max-w-7xl` at the same height. Confirm: `max-w-md`. Width never changes when switching tabs.
2. **Header (game).** Icon + title = active L1 label. Subtitle = location name + badge "Pauza" (amber) / "Na żywo" (green). Right side: `Wznów [P]` and close X. The dialog header has no LanguageSelector; it stays in the app header and moves into Ustawienia > Interfejs.
3. **Tab rows.** Each row is a single line (`flex-nowrap`, `overflow-x-auto` as fallback). Key badges `[M]` show from `lg` up. Icons are always shown. Never put an action button (Wznów) in a tab row.
4. **Where actions live.** Panel-level actions sit in a right-aligned panel footer row, with the destructive one last (outline-danger). Item-level actions sit in the item detail card. Global actions (Wznów, close) sit in the header.
5. **Destructive confirm.** Use `ConfirmDialog` from `@ui` with a verb-specific confirm label ("Wyrzuć", "Zresetuj", "Wczytaj"), never "OK". **Default focus is on Anuluj.** B/Esc cancels. It applies to stats reset, item discard, reset settings, reset controls (already has one), restart location, load save (overwrites progress) and import settings.
6. **Empty and reserved states.** Empty slot = slot name muted + dashed border (not "—"). Empty backpack or stats get one i18n sentence. Future content (attributes, locked maps) appears as a disabled "Wkrótce" card, never hidden, so the slot reads as reserved.
7. **Labels.** L1 is a single noun in sentence case. Buttons are verb + object. PL default, EN second. Every visible string goes through `t()` with a typed key. No `fallbackLabel`, no English in PL ("Co-op Ready", "2P Active", "Live"), no raw keys.

---

## 4. Ranked changes (UX impact / effort)

| # | Change | Impact | Effort | Kind | Files |
|---|---|---|---|---|---|
| 1 | Remove Menu > Tworzenie; dev dialog without game L1 row | High | S | move | `layout/GameModalHost.tsx`, `menu/menuTabRegistry.ts`, `modal/ModalNavigationTabs.tsx` (`showCreation` exists), `modal/modalRegistry.ts` |
| 2 | Fix labels: `displayTab` to `tabDisplay`, `musicVolume` to `tabAudio` (both keys exist), Co-op Ready / 2P Active / Pauza / Live / "Skróty Interfejsu", dev tool labels | High | S | rename | `menuTabRegistry.ts`, `HelpModalView.tsx`, `devToolRegistry.tsx`, `i18n/modules/hud.ts`, `i18n/modules/developer/index.ts`, `i18n/types.ts` |
| 3 | One fixed width for all game modals | High | S | rename | `GameModalHost.tsx`, `skills/SkillTreePanel.tsx` |
| 4 | Restore F1 | Med | S | new (tiny) | `modalRegistry.ts` |
| 5 | Single game shell, Wznów in header, fixed height, single-line tab rows | High | M | move | new `layout/GameMenuDialog.tsx`, `GameModalHost.tsx`, `ModalNavigationTabs.tsx`, `skills/SkillTreePanel.tsx` to `SkillTreeView.tsx`, `ui/core/tabs/tabs.tsx` (nowrap prop) |
| 6 | New IA: Gra / Mapa / Postać / Ekwipunek / Magia / Ustawienia(L2) / Pomoc | High | M | mostly move | `modalRegistry.ts`, `menuTabRegistry.ts` to settings registry, `GameplayTab.tsx`, new `InterfaceTab.tsx`, `App.tsx` (icon map), i18n settings/hud |
| 7 | Help without binding table + "Otwórz Sterowanie" deep link | Med | S | new (small) | `HelpModalView.tsx`, coordinator `openModal(id, subTab?)` |
| 8 | Confirm for stats reset, discard, reset defaults, restart, load, import | High | S | new | `StatsMenuTab.tsx`, `InventoryModalView.tsx:277,325`, `GameplayTab.tsx`, `InterfaceTab.tsx`, `gameplay/GameSaveSection.tsx`, i18n |
| 9 | Wire dead HUD toggles (`showControlsHint` mounts `HUDControlsHint`; `showRpgButtons` from settings instead of `false`) | Med | S | new (wiring) | `hud/HUDOverlay.tsx:152,159` |
| 10 | Empty states + "Wkrótce" reserved cards | Med | S | new | `InventoryModalView.tsx`, `StatsMenuTab.tsx`, i18n |
| 11 | Gamepad + Q/E/[ ] navigation, legend footer, menu input capture | High | M | new | new `controls/useMenuGamepad.ts`, `useAppHotkeys.ts`, `menu/hooks/useModalCoordinator.ts`, `GameMenuDialog.tsx`, `game/loop/input.ts` |
| 12 | Restore gamepad mapping UI in Ustawienia > Sterowanie | Med | M | restore (move) | `controls/GamepadMapper.tsx`, `controls/hooks/useGamepad.ts` (from 8121dad), `ControlsMenuTab.tsx` |

### PR cut (each independently mergeable, under ~400 changed lines, in order)

**PR-1 `fix(menu): separate dev dialog, fix labels, stable width, F1`** (#1-4, ~150 lines, about 90% moves/renames)
Drop `MenuTabId.Developer` and its renderer. The Creation modal renders without `ModalNavigationTabs`, and game modals pass `showCreation={false}`. Swap label keys, i18n the Help badges and the dev registry, use `max-w-5xl` for every game modal, add F1.

**PR-2 `refactor(menu): single game dialog shell`** (#5, ~300 lines, move + small new)
Add `GameMenuDialog` (one Modal; the body switches on `activeModal`). Extract `SkillTreeView`. Add a `ResumeButton` in `headerRight`, the fixed height, and a `wrap={false}` option on `Tabs`. Remember the last L1 for Esc.

**PR-3 `feat(menu): game IA with Settings L2 and deduplicated Help`** (#6, #7, ~350 lines, mostly moves)
Add the new registry entries and settings sub-registry, split `GameplayTab` into Gra and `InterfaceTab`, move `GameCombatTipsSection` into Pomoc, and add the Help deep link. Coordinator: `openModal(id, subTab?)` + `activeSubTab`.

**PR-4 `feat(menu): confirmations, HUD toggles, empty states`** (#8-10, ~250 lines, new behavior)

**PR-5 `feat(menu): gamepad and keyboard tab navigation`** (#11, ~350 lines, new behavior)

**PR-6 (optional, after PR-5) `feat(controls): restore gamepad mapper`** (#12, ~300 lines, restore of 8121dad code + its tests)

---

## 5. Test plan (bun test + happy-dom; headless Playwright chromium at 1600x900 and 1024x640)

**PR-1**
- Unit: `modalRegistry.unit.test.ts` checks that each `labelKey` in MODAL/MENU/DEV registries resolves to a non-key string in PL and EN, and that `findModalByHotkey("F1")` returns Help.
- Unit: `gameModalHost.unit.test.tsx` checks the Menu has no "Tworzenie" tab, the Creation modal has no game tablist, and every game modal has the same `max-w` class.
- Screenshot: Menu shows only 2 tab rows. Opening C shows only dev tabs. DOM text has no camelCase token (`/\b[a-z]+[A-Z]\w*\b/`) and no "Co-op", "Live" or "2P" in PL. Dialog bounding box width is equal for M/H/I/K.

**PR-2**
- Unit: `gameMenuDialog.unit.test.tsx` checks that switching M to I to K keeps one dialog node (same element, no remount of the shell), that Wznów is in the header and not inside any `role=tablist`, and that Esc reopens the last tab.
- Screenshot: dialog box width **and height** are identical across all L1 tabs. The tab row is single-line at 1024px (row height = one tab height).

**PR-3**
- Unit: L1 order and labels (Gra, Mapa, Postać, Ekwipunek, Magia, Ustawienia, Pomoc). Ustawienia shows 4 L2 tabs and the other L1s show none. The Help deep link lands on Ustawienia > Sterowanie. Help no longer renders `BINDABLE_ACTION_CATALOG` rows.
- Screenshot: at most 2 `role=tablist` visible in any state (walk the whole tree). Gra holds mode/hero/save, Ustawienia > Obraz holds display.

**PR-4**
- Unit: clicking Reset statystyk / Wyrzuć / Przywróć domyślne / Wczytaj opens a confirm, and the state is unchanged until confirm. Anuluj is focused by default and Esc cancels. Toggling `showControlsHint` / `showRpgButtons` mounts or unmounts the HUD element.
- Screenshot: confirm dialog over Ekwipunek, empty backpack state, "Wkrótce" card.

**PR-5**
- Unit: `useMenuGamepad.unit.test.ts` with a mocked `navigator.getGamepads`. It checks that RB/LB cycle L1 with wrap, LT/RT cycle L2 (no-op on tabs without L2), B closes a confirm before the dialog, A clicks the focused element, the repeat timing holds, and nothing polls while closed. `useAppHotkeys.unit.test.ts` checks Q/E, [ ], P resume, and that C is ignored while the game dialog is open. `input` checks that capture suppresses game actions.
- Screenshot: inject a fake pad via `page.addInitScript`, press RB x2 and LT, and assert the active tab ids. The legend footer shows pad glyph labels when a pad is connected and keyboard labels otherwise.

**PR-6**
- Unit: restore `GamepadMapper.unit.test.tsx` and `useGamepad.unit.test.ts` from 8121dad, adapted. A rebind calls `rebindGamepadAction`.
- Screenshot: Ustawienia > Sterowanie shows keyboard and pad cards with no wrap at 1024px.

---

## 6. Not now (deferred)
- Inventory rebuild from 8121dad `inventory/*` (UX first, visuals later). Only the confirm and empty states land now.
- 6 attributes with 1/2/3 priority growth (only the Postać L2 slot and a "Wkrótce" card), and the 8x8 location select (only the Mapa panel slot, a grid not tabs).
- Visual reskin, controller glyph art, tab transitions.
- Dev dialog internals: raw ids valen/aurelia in Studio danych, unfilled `world:<świat>:far` placeholders in Poziomy. Separate dev-tools PR.
- Hiding the "Tworzenie" header button in production builds. Owner decision.
- Pad-without-Start open chord. Owner to confirm the hardware first.
- Gameplay bugs seen in screenshots (e.g. HP 165/135 in Ekwipunek). Not UI; file separately.
- Removing `ModalId` per-modal helpers in `useModalManager` (`openHelp` etc.). Cosmetic churn.
