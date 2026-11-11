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

* **Responsive Locomotion & Melee Combat**: Variable-height jumps with coyote time and jump buffering, slides and backsteps, melee strikes and spells. (Enemy attacks, ability gating and the restricted pad layout are still in progress; see `AGENTS.md`.)
* **Playable Champions**:
  * **Valen (Chrono Duelist)**: A calculated scholar utilizing rapier precision and solar glyph magic.
  * **Aurelia (Aetherblade Warden)**: An agile protector commanding organic celestial energy and an ethereal manifested blade.
* **Co-op & Solo Modes**: Experience the campaign solo or in two-player cooperative play.
* **Citadel Sectors**: Five large linked maps: the Courtyard of Awakening, the Chasm of Thorns, the Clockwork Tower, the Aether Sky Sanctuary and the Grand Bastion, each checked by an automated level-logic validator.
* **Pixel Art Tiers**: 19 enemy types, with NES-class, SNES-class and painted art tiers selectable in the Display settings.
* **Two Menu Levels**: a game menu (settings, help, inventory, skills) and a Developer Suite (Atlas Studio, Data Studio, debug, logs).
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
bun scripts/validate-level.ts <id>     # Validate one map's logic
bun scripts/sprites/compile.ts <id>    # Compile NES/SNES class enemy sheets
bun scripts/repack-atlas.ts <id>       # Repack an AI sheet onto a clean grid
bun run build:game                     # Production game client
```

The canonical design and architecture specifications live in `docs/manifesto/`.

## License

This project utilizes a dual-licensing model:

* **Code & Engine**: [Mozilla Public License 2.0 (MPL-2.0)](LICENSE.md#1-source-code--engine).
* **Story, Characters & Visual Design**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE.md#2-creative-content-characters--lore-free-to-use-with-game) — free to use, adapt, and build upon for games and interactive media.

See [LICENSE.md](LICENSE.md) for full terms.
