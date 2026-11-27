# What's New

## 0.3.x (phase 4, in progress): stabilisation and recovery

Phase 4 recovers from the clean-up of 0.3.0, which removed tilesets, props, the sprite pipeline, tests and docs. It rebuilds what was lost and sets the direction for the next phase.

- **Menu rebuilt as one game dialog.** The game menu is now a single two-level dialog with a registry of tabs. Dangerous actions ask for confirmation. The developer dialog ("Tworzenie") appears only in development builds.
- **Gamepad and keyboard tab navigation.** Menus can be driven with the pad: <kbd>LB</kbd> / <kbd>RB</kbd> for top tabs and <kbd>LT</kbd> / <kbd>RT</kbd> for second-level tabs. See *Controls*.
- **Assets and pipeline restored.** Platform tilesets, decor props and the sprite tools are back. The platform tilesets are restored on the floor and platform prefabs.
- **Sprite slicing fixed.** Hero and owl sheets are sliced correctly again.
- **Tests and CI.** The character and error-boundary tests are back, and the coverage gate runs per suite.
- **Docs and wiki.** The wiki is a bilingual Markdown wiki again, and the articles are checked against the game data.

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
