# Project Architectural Guidelines & Agent Standards (Vibrant Castle)

This document establishes the authoritative engineering rules, code standards, UI architecture, documentation links, and AI agent operating guidelines for *Vibrant Castle*. Every new feature, refactoring, or module must strictly comply with these specifications.

---

## 1. World & Scenario Documentation Hierarchy

Comprehensive game world lore, level design, narrative branches, characters, and items are organized into dedicated documentation:

* **[`/SCENARIO.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/SCENARIO.md)**: Full game narrative campaign (in English), Act structure, interconnected gameplay walkthrough across 5 sectors (Courtyard, Thorn Chasm, Clocktower, Aether Sanctuary, Grand Bastion), and future chapter outlines.
* **Directory [`/lore/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/) (Game World Codex)**:
* **[`/lore/characters.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/characters.md)**: Playable champions (Valen – Chrono Duelist / Bastion Survivor, Aurelia – Aetherblade Warden / Bastion Protector), signature combat kits, aether magic styles, and v4.0 asset specifications.
* **[`/lore/enemies.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/enemies.md)**: Complete bestiary of 10 enemy classes (Training Dummies, Watchers, Gargoyles, Briar Thorns, Clockwork Automata, Aether Constructs, Aether Archon, Shadow Knight).
* **[`/lore/npcs.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/npcs.md)**: Non-player characters, the omniscient Bastion Narrator (dynamic reactive commentary), allies, and companions (Corvus the Raven, Pip the Cat, Bastion Sage, Master Oakhaven).
* **[`/lore/locations.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/locations.md)**: Technical breakdown of the 5 implemented sectors (`courtyard`, `thorn_chasm`, `clocktower`, `aether_sanctuary`, `grand_bastion`), portal transitions, parallax planes, and environmental hazards.
* **[`/lore/artifacts.md`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/artifacts.md)**: Interactive world mechanisms (floodgate levers, portcullises, mechanical lifts, warp gates), classic BG2-style inventory tables (`items.json`), and save state schemas.

---

## 2. Frontend UI Architecture & Atomic Primitives (`/src/components/ui/`)

All HUD overlays, panels, and modals (`HUDOverlay`, `MenuPanel`, `InventoryPanel`, `SkillTreePanel`, `KeyboardMapper`, `GamepadMapper`) are composed exclusively from reusable, accessible atomic UI primitives:

* **`Button.tsx`**: Typed variant buttons (`primary`, `secondary`, `danger`, `purple`, `ghost`, `outline`), size scale (`sm`, `md`, `lg`), and SVG icon slots.
* **`Card.tsx`**: Modular card composition (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`).
* **`ProgressBar.tsx`**: Dynamic resource meters (Health, Mana, Stamina) with animations, numeric value readouts, and fluid width scaling.
* **`Modal.tsx`**: Accessible modal overlay featuring `Escape` key handling, backdrop blur filters, and entrance transitions.
* **`Badge.tsx`**: Categorical badges for item tiers, elemental types, statuses, and keybindings.
* **`Slider.tsx`**: Accessible step sliders for audio volume, sensitivity, and graphical settings.
* **`ItemSlot.tsx`**: Classic inventory and potion belt slots with rarity-tinted borders (`common`, `uncommon`, `rare`, `legendary`).
* **`KbdKey.tsx`**: Visual keycap indicators for keyboard and gamepad inputs.
* **`Tabs.tsx`**: Tabbed navigation switchers for menus and multi-view dialogs.
* **`StatRow.tsx`**: Combat and character stat display row with icons and dynamic modifiers.
* **`/src/styles/theme.ts`**: Centralized design tokens (amber accents, deep obsidian, weathered slate, burnished bronze, and glowing aether).

---

## 3. Dynamic Scaling & Fluid Viewport (No Rigid Pixel Dimensions)

* **Virtual World Coordinates**: The game engine calculates world physics and coordinates on logical units (`baseWidth: 1000`).
* **Dynamic `ResizeObserver`**: The canvas wrapper in `HUDOverlay` continuously observes container dimensions, resizing the Canvas buffer dynamically while respecting `window.devicePixelRatio`.
* **Aspect Ratio Handling**: Native support for target aspect ratios (`16:10`, `16:9`, `Auto Fill`) with switchable sampling (`Pixel Art Sharp` vs. `Smooth Bilinear`).
* **Fluid UI Sizing**: The user interface relies on Flexbox, CSS Grid, `rem`, `%`, `aspect-ratio`, and `clamp()` expressions, forbidding fixed hardcoded pixel dimensions that break responsiveness.

---

## 4. Ergonomic Two-Player Scheme & Gamepad API Integration

* **Keyboard Dual-Layout (Zero Key Collisions)**:
* **Player 1 (Left Flank)**: `WASD` (Movement), `Space` / `K` (Jump), `J` (Primary Attack), `L` (Dash / Slide / Dodge), `U` (Primary Spell), `I` (Secondary Spell), `1-3` (Potion Belt).
* **Player 2 (Right Flank)**: `Arrow Keys` (Movement), `Numpad 0` / `/` (Jump), `Numpad 1` / `N` (Primary Attack), `Numpad 2` / `M` (Dash), `Numpad 4` / `[` (Primary Spell), `Numpad 5` / `]` (Secondary Spell), `Numpad 7-9` / `8-0` (Potion Belt).
* **Gamepad Controller Architecture**:
* Full out-of-the-box support for Xbox, PlayStation, and DirectInput/Generic gamepads via the standard Gamepad API.
* Player 1 binds to Gamepad Index 0; Player 2 binds to Gamepad Index 1.
* `GamepadMapper.tsx` provides real-time button state visualization, analog stick deadzone configuration, and runtime remapping.

---

## 5. RPG Systems, Baldur's Gate II Inventory & Skill Constellations

* **Classic Paperdoll Inventory (`/src/game/logic/inventory.ts`)**: Silhouette equipment slots (Head, Main Hand, Off-Hand, Armor, Amulet, Ring), 12-slot backpack grid, and 3-slot quick potion belt.
* **Magic Skill Tree (`/src/game/logic/skills.ts`)**: Branching offensive, defensive, and passive constellations unlocked via Skill Points (SP) gained from combat and milestone tasks.
* **Dynamic Attribute Recalculation**: Equipping gear or learning passive traits immediately recalculates base and modifier values for maximum Health, Mana, Stamina, Attack Power, and Physical/Elemental Defense.

---

## 6. Strict Internationalization & Localization (Strict i18n Rule)

* **NO HARDCODED USER-FACING STRINGS**: No user-visible text may be hardcoded into `.tsx` components or `.ts` gameplay logic.
* **DICTIONARY-DRIVEN**: Every string must reside in [`/src/game/assets/i18n.ts`](file:///c:/Users/Krzysiu/Source/vibrant_castle/src/game/assets/i18n.ts) under explicit keys in both `pl` and `en` dictionaries.
* **RETRIEVAL VIA DICTIONARY**: React components and engine systems access text exclusively through `translations[lang].key` or typed localization helpers.

---

## 7. SOLID Principles & Clean Code Standards

* **S - Single Responsibility Principle**: Each class, function, component, or custom hook manages exactly one distinct concern.
* **O - Open-Closed Principle**: Core systems are open for extension (e.g., new enemies, spells, or artifacts) but closed for invasive modification of working foundations.
* **L - Liskov Substitution Principle**: Subclasses, strategies, and state implementations must be swappable without altering system correctness.
* **I - Interface Segregation Principle**: Fine-grained, purposeful interfaces; strict TypeScript settings (`strict: true`), zero tolerance for arbitrary `any` or reckless type assertions (`as unknown as ...`).
* **D - Dependency Inversion Principle**: High-level game modules depend upon abstractions and event buses rather than tight couplings to concrete implementations.
* **Zero Technical Debt**: No commented-out dead code, no unexplained magic numbers (use named constants/enums), and comprehensive typing for all state and component props.

---

## 8. Środowisko Uruchomieniowe i Narzędzia (Bun, NOT Node)

* **WYŁĄCZNIE BUN**: Projekt korzysta z runtime'u i menedżera pakietów **Bun** (`bun`), a NIE z Node.js (`node`, `npm`, `npx`, `yarn`, `pnpm`).
* **Polecenia deweloperskie i instalacja**:
* Uruchamianie serwera deweloperskiego: `bun dev` (lub `bun run dev`)
* Budowanie produkcyjne: `bun run build`
* Weryfikacja typów / linting: `bun run lint` (lub `bunx --bun tsc --noEmit`)
* Instalacja i zarządzanie zależnościami: `bun install`, `bun add <pakiet>`, `bun add -d <pakiet>`
* Wykonywanie narzędzi CLI i skryptów: `bun <skrypt>` lub `bunx <narzędzie>` zamiast `node` / `npx`
* **Plik blokady (Lockfile)**: Centralnym i jedynym plikiem blokady projektu jest `bun.lock`. Nie wolno używać `npm` ani tworzyć plików `package-lock.json` / `yarn.lock`.

---

## 9. Agent Operating Protocol & Engineering Culture

Every AI coding assistant operating in this repository **must strictly adhere** to the following workflow:

### A. Plan-First Approach

1. **Context & Dependency Analysis**: Before touching code, thoroughly inspect existing architecture (`AGENT.md`, `SCENARIO.md`, [`/lore/`](file:///c:/Users/Krzysiu/Source/vibrant_castle/lore/)) and the relevant source files.
2. **Present Plan Before Execution**: For architectural, multi-file, or complex tasks, **first formulate and present a clear implementation plan** outlining what will change, where, and why. Proceed with execution only after alignment.
3. **Incremental Execution**: Implement modifications in clean, logical batches to prevent sweeping, uncontrolled changes across unrelated systems.

### B. Proactive Clarification & Inquiry (Ask & Clarify)

1. **Never Assume or Guess**: If user instructions are ambiguous, incomplete, or if multiple valid design paths exist, **ask the user targeted questions** before making binding assumptions.
2. **Present Concrete Options**: Clearly outline alternatives (e.g., Option A vs. Option B), noting the architectural trade-offs and providing an expert recommendation.
3. **Warn of Risks & Regressions**: Explicitly flag potential regressions, breaking changes, i18n violations, or canvas loop performance bottlenecks, offering safer engineering alternatives.

### C. Self-Verification & Quality Assurance

1. **Validation Checks**: Verify syntax, TypeScript type safety, and linting rules (Markdown lint, code formatting) after every code modification.
2. **Concise Reporting**: Conclude tasks with a focused summary:
   * Exactly what was modified or created.
   * How it conforms to project architecture.
   * Clear steps for manual or automated verification.
