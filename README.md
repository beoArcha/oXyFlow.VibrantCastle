# Vibrant Castle

[![Wiki & Play in Browser](https://img.shields.io/badge/Wiki_&_Web_Game-GitHub_Pages-amber.svg)](https://beoarcha.github.io/oXyFlow.VibrantCastle/)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL_2.0-blue.svg)](LICENSE.md)
[![Art License: CC BY 4.0](https://img.shields.io/badge/Lore_&_Art-CC_BY_4.0-lightgrey.svg)](LICENSE.md)

*Vibrant Castle* is a 2D metroidvania set in a melancholic gothic fantasy world bathed in an eternal golden autumn. It aims for the feel of movement of *Mario*, the style of maps, heroes and enemies of *Castlevania: Aria of Sorrow*, an autumn palette and mood, and *Bastion*-style narration, with simplified Castlevania gameplay that works on keyboard or pad.

## 🌐 Play Online & Gothic Wiki

Experience *Vibrant Castle* directly in your browser and explore the full documentation on our **GitHub Pages portal**:

* **Interactive Wiki & Playable Game**: [https://beoarcha.github.io/oXyFlow.VibrantCastle/](https://beoarcha.github.io/oXyFlow.VibrantCastle/)
* Complete chronicles of lore, kinetic controls reference, champion attributes, and engine architecture specifications.

## Overview

Players explore the ancient Citadel of Aether—once the seat of horologists, astronomers, and fencing scholars—now suspended in temporal stasis following a catastrophic fracture. As the Awakened Duelists, players navigate interconnected sectors, reactivate dormant clockwork machinery, and overcome corrupted guardians under the guidance of an omniscient Narrator.

## Key Features

* **Responsive Locomotion & Melee Combat**: Variable-height jumps with coyote time and jump buffering, slides and backsteps, melee strikes and spells. (Enemy attacks, ability gating and the restricted pad layout are still in progress; see the [roadmap](docs/tasks/ROADMAP.md).)
* **Playable Champions**:
  * **Valen (Sun Knight)**: A diligent engineer utilizing rapier precision and solar glyph magic.
  * **Aurelia (Arcane Scholar)**: A perceptive investigator commanding astral, frost, and temporal Aether magic.
* **Co-op & Solo Modes**: Experience the campaign solo or in two-player cooperative play.
* **Citadel Worlds**: The campaign is planned as 8 worlds x 8 maps. Today map 1 of each world exists, from `courtyard` to `eclipse_crown`. Each map is checked by an automated level-logic validator.
* **Art Quality Tiers**: heroes, enemies and props are drawn in one of three tiers, chosen in the Display settings: `hi8bit` (8-bit look), `hi16bit` (16-bit look) or `high` (painted). Definitions: [`.agents/rules/content_and_assets.md`](.agents/rules/content_and_assets.md) §6.1.
* **Two Menu Levels**: a game dialog (game, map, character, inventory, magic, settings, help) and a separate dev dialog, "Tworzenie" (Atlas, levels, Data Studio, tester, debug, logs), in dev builds.
* **Rich World & Lore**: Comprehensive documentation of characters, locations, artifacts, enemies, and lore.

## Tech Stack & Getting Started

Built with React 19, TypeScript, Tailwind CSS, Motion, and Vite.

### Prerequisites

* [Bun](https://bun.sh) (Node.js and npm are not used)

### Installation

```bash
bun install
```

### Running Locally

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Common Commands

```bash
bun run typecheck                      # Static type check
bun test                               # Full test suite (unit, integration, scripts, arch, e2e)
bun test src/tests/arch                # Architecture and boundary tests
bun scripts/validate-level.ts <id>     # Validate one map's logic
bun scripts/sprites/compile.ts <id>    # Compile hi8bit / hi16bit sprite sheets
bun scripts/repack-atlas.ts <id>       # Repack a painted sheet onto a clean grid
bun run build:game                     # Production game client
bun run build:pages                    # Full distribution (wiki + /game/)
bun run preview:pages                  # Local static preview at /oXyFlow.VibrantCastle/
```

> **Note:** Do not run `bun run dist/index.html` to preview the Pages build — it starts Bun's single-entry HTML dev server and serves the wiki page for every path (including `/game/index.html`). Always use `bun run build:pages` followed by `bun run preview:pages`.

## Documentation

* [Documentation Index](docs/README.md): central map of planning, design, lore, and specifications.
* [Vision](docs/tasks/VISION.md), [Roadmap](docs/tasks/ROADMAP.md), and [Tasks](docs/tasks/README.md): what we are building, phases, and the `VC-xxx` cards (one file per phase).
* [Lore](docs/lore/): characters, locations, bestiary, artifacts, NPCs, and scenario.
* [System Specifications (Manifesto)](docs/manifesto/): engineering, gameplay, content pipeline, rendering, UI, and CI/CD.
* [Design docs](docs/design/), e.g. the [menu UX plan](docs/design/menu-ux-plan.md).
* [AGENTS.md](AGENTS.md) and [`.agents/rules/`](.agents/rules): engineering and orchestration rules.

## License

This project utilizes a dual-licensing model:

* **Code & Engine**: [Mozilla Public License 2.0 (MPL-2.0)](LICENSE.md#1-source-code--engine).
* **Story, Characters & Visual Design**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE.md#2-creative-content-characters--lore-free-to-use-with-game) — free to use, adapt, and build upon for games and interactive media.

See [LICENSE.md](LICENSE.md) for full terms.
