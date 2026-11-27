# What's New

## 0.3.x (phase 4, in progress): stabilisation and recovery

Phase 4 recovers from the clean-up of 0.3.0, which removed tilesets, props, the sprite pipeline, tests and docs. It rebuilds what was lost and sets the direction for the next phase. The most recent work is listed first.

- **Placeholder art.** Missing hi-8bit placeholder art was added for several sprites. A test tracks the few structures and enemies that still lack a tier.
- **Character and map contracts.** The character system and the map contract are written down as design documents, so the next phase can build against them.
- **Planning cards.** The phase-4 task cards for the lore discussion, the demo scenarios and the Tworzenie map and text tool are on the task board.
- **Gamepad mapper.** Settings > Controls has a pad mapper for the restricted layout. Only <kbd>A</kbd> / <kbd>B</kbd> / <kbd>X</kbd> / <kbd>Y</kbd>, <kbd>LB</kbd> / <kbd>RB</kbd> and <kbd>LT</kbd> / <kbd>RT</kbd> can be bound. Resetting the controls asks first.
- **Menu rebuilt as one game dialog.** The game menu is a single two-level dialog with a registry of tabs: Game, Map, Character, Inventory, Magic, Settings and Help. The developer dialog ("Tworzenie") appears only in development builds.
- **Pad navigation.** Menus can be driven with the pad: <kbd>LB</kbd> / <kbd>RB</kbd> for top tabs, <kbd>LT</kbd> / <kbd>RT</kbd> for second-level tabs, and <kbd>Start</kbd> or a 0.5 s hold of <kbd>LB</kbd> + <kbd>RB</kbd> to open the menu. See *Controls*.
- **Confirmations.** Dangerous actions ask first: restarting a location, loading a save, importing or resetting settings, resetting controls and discarding an item.
- **Tests restored.** Character, error-boundary, menu, controls and layout tests are back. The coverage gate runs per suite, with minimums of 74% for unit, 58% for integration and 73% combined.
- **Docs, lore and wiki restored.** The lore, the manifesto and the per-phase task files are back. This wiki is written in Markdown and built with the game.
- **Tilesets and props back.** Platform tilesets are restored on the floor and platform prefabs, and the decor props and the sprite tools are back in the pipeline.
- **Hero and owl sheets sliced again.** The hero pixel sheets and the Clockwork Owl sprite sheet are cut correctly again.
- **Roadmap with phases.** The roadmap lists every phase up to 1.0, with its goals and quality gates.

### Roadmap

- **Phase 4 (0.3.x, now):** stabilise, rebuild the menu, restore the docs, tests and CI, and write the map and character contracts.
- **Phase 5 (0.4.x, next):** worlds and characters. Map 1 of each world meets the map contract, attributes drive HP, mana and stamina, enemies deal damage, and the narrator is wired to the engine.
- **Phase 6 (0.5.x):** metroidvania depth. Ability pickups that gate routes, a map screen, maps 2 to 8 of the first worlds, and painted `high` sheets for the enemies.
- **Phase 7 (0.6.x):** story and co-op. The in-game visual novel, narration that reacts to play style, two-player co-op polish and bosses.
- **Phase 8+ (towards 1.0):** the full campaign of 8 x 8 maps, the autumn palette review of every world, and release hardening.

## 0.3.0 (2026-11-14): hi-bit art, tilesets, decor and gates

- **Quality tiers with live switching**: hi-8bit, hi-16bit and high, changed from the display settings.
- **Heroes quantized from painted frames**: Valen and Aurelia look the same on every tier.
- **Platform tilesets and decor props** with light and glow.
- **Opening gates**: portcullises lift when their lever is struck.
- **Five rebuilt maps** and a full portal route with the victory loop.
- **Nineteen enemy templates**, which patrol and can be defeated.
