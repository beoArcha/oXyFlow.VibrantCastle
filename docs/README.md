# Vibrant Castle — Documentation Index

Central navigation for project vision, roadmap, approved designs, world lore, and technical specifications.

## Planning & Task Tracking (`docs/tasks/`)

* [Vision](tasks/VISION.md) — Core pillars, identity, architecture overview, and current gaps.
* [Roadmap](tasks/ROADMAP.md) — Versioned phases, exit criteria, and phase quality gates.
* [Tasks](tasks/README.md) — phase index and the `VC-xxx` task cards, one file per phase.

## Approved Design Contracts & Reviews (`docs/design/`)

* [Menu UX Plan](design/menu-ux-plan.md) — Two-level menu architecture, restricted pad navigation, and consistency rules.
* [Maps Contract](design/maps-contract.md) — Campaign `8 × 8` slot rules, archetype size bands, movement limits, and validator checks (`VC-020`).
* [Character System](design/character-system.md) — Approved D20 ×10 six-attribute model, priority growth, derived stats, and monster scaling (`VC-030`).
* [Parallax Architecture & Taxonomy](design/parallax.md) — Consolidated parallax pipeline, meta/tier taxonomy, progressive loading, and zone rules (`VC-100`).
* **Phase 4 Reviews & Playtests**: [Devtools Parity](design/devtools-parity.md) (`VC-070`) · [Asset Animation Review](design/asset-animation-review.md) (`VC-120`) · [Gameplay Playtest](design/gameplay-playtest.md) (`VC-084`) · [Gameplay Feel Metrics](design/gameplay-feel-metrics.md) (`VC-085`) · [Final Playtest](design/final-playtest-phase4.md) (`VC-089`) · [Demo Scenes](design/demo-scenes/README.md) (`VC-083`) · [Phase 4 Gate Conformance](design/gate-phase4-conformance.md) (`VC-090`).

## World & Lore (`docs/lore/`)

* [Lore Canon & Glossary](lore/README.md) — Round-1 2034 canon summary, PL/EN glossary, N1–N12 tracking, and Open Questions.
* [World Setting](lore/world.md) — Earth 2034, the cataclysm, buffer zone, emerging magical science, and demon reinterpretations across all 8 worlds.
* [Scenario](lore/scenario.md) — 8-world campaign arc, temporal loop, and leaning climax (*the Possessed*).
* [Characters](lore/characters.md) — Valen (*Sun Knight*) and Aurelia (*Arcane Scholar*), Brazilian zouk partnership, VC-030 L1 attributes, and kits.
* [Narrator](lore/narrator.md) — In-world deadpan-classy voice rules, humour boundaries, and 10 bilingual example lines.
* World Dossiers (`lore/worlds/`): [Courtyard](lore/worlds/courtyard.md) · [Thorn Chasm](lore/worlds/thorn_chasm.md) · [Ashen Catacombs](lore/worlds/ashen_catacombs.md) · [Clockwork Tower](lore/worlds/clocktower.md) · [Alchemist's Library](lore/worlds/alchemist_library.md) · [Aether Sanctuary](lore/worlds/aether_sanctuary.md) · [Sunlit Bastion](lore/worlds/grand_bastion.md) · [Eclipse Crown](lore/worlds/eclipse_crown.md)
* [Locations (Technical Atlas)](lore/locations.md) — Map-1 dimensions, spawns, portals, parallax, and entity counts synced to `src/data/locations/*.json`.
* [Enemies](lore/enemies.md) — Zone factions (demons, devils, constructs, cyborgs), soul origins, and 19-template bestiary.
* [Artifacts](lore/artifacts.md) — Environmental mechanisms, 18 armory items, and Constellation Grimoire spells.
* [NPCs & Figures](lore/npcs.md) — The Narrator, Corvus, Pip/Amber, the Zone Sage, and Master Oakhaven's château legacy.

## System Specifications (`docs/manifesto/`)

* [Engineering](manifesto/ENGINEERING.md) — Pure TS simulation loop, subsystems, clocks, `GameEventBus`, and `GameBaseError`.
* [Gameplay](manifesto/GAMEPLAY.md) — Kinematics, collision strategies, levers/gates, combat, and champion skills.
* [Content Pipeline](manifesto/CONTENT_PIPELINE.md) — `src/data/` schemas, 3-tier asset policy, and restored Bun sprite/atlas tooling.
* [Parallax & Rendering](manifesto/PARALLAX_AND_RENDERING.md) — 5+ tier parallax, `FAR` opacity invariant, zero-allocation `render()`, tilesets, and props.
* [User Interface](manifesto/USERINTERFACE.md) — Passive React 19 overlay, two-level menu, restricted pad navigation, `@ui` primitives, and themes.
* [CI/CD](manifesto/CICD.md) — GitHub Actions workflows, 74/58/73 coverage gate, release promotion, and phase-gate releases.

## Wiki (`docs/wiki/`)

* Bilingual player wiki (PL / EN), 8 articles per language, published with the game build on GitHub Pages by `bun run build:pages` (`deploy-pages.yml`, from the `release` branch). Live site: https://beoarcha.github.io/oXyFlow.VibrantCastle/

## Engineering Rules

* [AGENTS.md](../AGENTS.md) and [`.agents/rules/`](../.agents/rules/) — Mandatory architectural, testing, cleanliness, and orchestration standards.
