# Vibrant Castle — Documentation Index

Central navigation for project vision, roadmap, approved designs, world lore, and technical specifications.

## Planning & Task Tracking (`docs/tasks/`)

* [Vision](tasks/VISION.md) — Core pillars, identity, architecture overview, and current gaps.
* [Roadmap](tasks/ROADMAP.md) — Versioned phases, exit criteria, and phase quality gates.
* [Tasks](tasks/README.md) — phase index and the `VC-xxx` task cards, one file per phase.

## Approved Design Contracts (`docs/design/`)

* [Menu UX Plan](design/menu-ux-plan.md) — Two-level menu architecture, restricted pad navigation, and consistency rules.

## World & Lore (`docs/lore/`)

* [Characters](lore/characters.md) — Valen (*Solar Knight*) and Aurelia (*Scholar of Arcanum*), base stats, magic, and level-1 attributes.
* [Locations](lore/locations.md) — The 8 current worlds (map 1 of each) and the 8 × 8 campaign layout.
* [Enemies](lore/enemies.md) — Complete 17-entry bestiary, elemental multipliers, and planned attack behaviors.
* [Artifacts](lore/artifacts.md) — Environmental mechanisms, 18 armory items, and Constellation Grimoire spells.
* [NPCs & Guides](lore/npcs.md) — The Bastion Narrator and planned companions (Corvus, Amber, Bastion Sage, Master Oakhaven).
* [Scenario](lore/scenario.md) — Citadel setting, 8-world circuit narrative, and future campaign outline.

## System Specifications (`docs/manifesto/`)

* [Engineering](manifesto/ENGINEERING.md) — Pure TS simulation loop, subsystems, clocks, `GameEventBus`, and `GameBaseError`.
* [Gameplay](manifesto/GAMEPLAY.md) — Kinematics, collision strategies, levers/gates, combat, and champion skills.
* [Content Pipeline](manifesto/CONTENT_PIPELINE.md) — `src/data/` schemas, 3-tier asset policy, and restored Bun sprite/atlas tooling.
* [Parallax & Rendering](manifesto/PARALLAX_AND_RENDERING.md) — 5+ tier parallax, `FAR` opacity invariant, zero-allocation `render()`, tilesets, and props.
* [User Interface](manifesto/USERINTERFACE.md) — Passive React 19 overlay, two-level menu, restricted pad navigation, `@ui` primitives, and themes.
* [CI/CD](manifesto/CICD.md) — GitHub Actions workflows, 74/58/73 coverage gate, release promotion, and phase-gate releases.

## Engineering Rules

* [AGENTS.md](../AGENTS.md) and [`.agents/rules/`](../.agents/rules/) — Mandatory architectural, testing, cleanliness, and orchestration standards.
