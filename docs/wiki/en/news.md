# What's New

## 0.3.x (phase 4, gate review): stabilisation, parallax & art completion

Phase 4 recovered from the post-0.3.0 cleanup (which removed tilesets, props, the sprite pipeline, tests and docs), rebuilt the two-level menu, unified the parallax pipeline, and closed every `hi8bit` and `hi16bit` sprite gap ahead of the Phase 4 quality gate. The most recent work is listed first.

- **Phase 4 playtests & feel metrics.** All 8 Map-1 stages, the rebuilt menu, gamepad navigation, and every "Tworzenie" dev tool passed the end-to-end gate playtest (`24/24` checks, 0 console errors), alongside a deterministic 60 Hz gameplay-feel test suite.
- **Parallax pipeline, zones & performance.** Consolidated background rendering into one meta-driven system with progressive off-thread loading, smooth `boss` and `rest` zone crossfades, derived `hi8bit` / `hi16bit` tiers for the 5 PNG worlds, and `auto` / `high` / `mid` / `low` / `simplified` / `off` quality modes in Settings > Display.
- **Art tiers & new Aether gate.** Fixed `hi8bit` box flicker, added missing `hi16bit` SVGs for PNG-backed enemies and structures, upgraded `hi8bit` art, and replaced `aether_gate` with a three-tier animated sprite. Every enemy, structure, prop, tileset and hero now ships both `hi8bit` and `hi16bit` assets.
- **Tworzenie map browser & text tool.** Added a pan/zoom Map Browser and narration trigger Text Placement patch builder inside Poziomy 8x8, plus a full dev-tools parity review and local `preview:pages` static preview.
- **2034 lore canon & demo scenes.** Finalized Round 1–2 lore canon, bilingual world dossiers, archived source catalogs, and Map-1 demo narration scenes across all 8 worlds.
- **Release & CI hardening.** Release promotion runs at phase gates only and publishes a versioned GitHub Release with the game zip alongside the Pages site.
- **Inventory & menu rebuild.** Restored the paper-doll Inventory with stat comparison and discard confirmations, split the single game dialog from dev-only "Tworzenie", wired restricted gamepad navigation (`LB`/`RB`, `LT`/`RT`, `Start` or 0.5 s `LB+RB` hold), and added "Coming soon" reserved cards.
- **Contracts, tests & pipeline restored.** Approved the Map Contract and D20×10 Character System specs, restored tilesets, decor props, the sprite compiler (`scripts/sprites/compile.ts`), and the per-suite coverage gate (74% unit / 58% integration / 73% combined).

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
