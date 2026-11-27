# Graphics Quality

The display settings, under **Settings > Display** in the game menu, control the graphics quality tier, the aspect ratio, the scaling filter and the frame rate. The quality tier changes how heroes, enemies, platforms and decor are drawn. Gameplay, collisions and the level layout are the same on every tier. A change takes effect at once, with no restart.

## The three tiers

The menu shows these names. The settings store them as `low`, `mid` and `high`, and the art files use the suffixes `hi8bit`, `hi16bit` and `high`.

| Menu name | Heroes (Valen, Aurelia) | Enemies | Platforms and decor | What it looks like |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Small pixel sprite sheets | Simple SVG placeholders in a chunky, 8-bit style | Pixel tiles and props | Flat colours from a small palette, hard outlines and blocky shapes. The lightest option. |
| **hi-16bit** | Richer pixel sprite sheets | Vector sprites with more colour and detail | Pixel tiles and props at full resolution | More colours, simple shading and highlights, crisp pixel edges. |
| **high** (default) | Painted animation sheets | Vector sprites in the hi-16bit style | Pixel tiles and props in the hi-16bit style | Full-colour painted frames where they exist, with the most detail. |

Where a tier has no art for an element, the game uses the next tier down the list: from **high** it falls back to hi-16bit and then hi-8bit, and from **hi-8bit** it falls back to hi-16bit and then **high**. So every element gets a sprite on every tier.

Every enemy, structure, prop, tileset and hero now has both `hi8bit` and `hi16bit` files. Painted **high** sheets exist today for the two heroes, the Clockwork Owl Gargoyle, the Training Dummy and four structures (`aether_gate`, `chrono_lever`, `grand_portcullis`, `hazard_thorns`). The remaining 13 enemy folders, 12 props and 8 tilesets have no painted `high` sheet yet, so on **high** they show their hi-16bit art.

## Display settings

These options are in **Settings > Display** (Obraz), in the game menu.

- **Aspect ratio.** Auto (fills the window, the default), 16:9, 16:10 or 4:3. A fullscreen button sits beside them.
- **Scaling filter.** Pixelated (sharp, nearest-neighbour, the default) or Smooth (bilinear, softer edges).
- **Asset quality.** The three sprite tiers above (`hi-8bit`, `hi-16bit`, `high`), switched live.
- **Parallax quality.** **Auto** (detects device capability and steps down if frame times exceed budget), **High**, **Mid**, **Low** (`hi8bit` layers without heavy atmosphere/fx overlays), **Simplified** (loads only the `far` horizon at `hi8bit` resolution), or **Off** (gradient backdrop only, zero parallax images).
- **Target frame rate.** 30, 60 (the default), 90 or 120 FPS. The simulation runs at the chosen rate, and the multiplier shown in the menu tells you how each step scales the time.
- **FPS counter.** A toggle that shows the frame rate on screen.
- **GPU acceleration.** On by default. The toggle is in the same tab.
- **Reset display.** Restores the display defaults. It does not touch the other settings.

## How the pixel art is made

The sprite tools live in `scripts/sprites/`. Every sprite is either a script or painted and then converted, so it can be rebuilt and checked.

- **Heroes from painted frames.** Valen and Aurelia are painted first. A palette quantizer reads the frames and builds the hi-8bit and hi-16bit sheets.
- **Platform tilesets.** Each tileset is a small script that describes its tiles. The compiler writes hi-8bit and hi-16bit sheets with a tile map.
- **Decor props.** Lanterns, braziers, banners and crystals are scripts too, with an anchor point for placement.
- **Enemies & structures.** Enemy and structure sprites are described in code and compiled into the tier files (`hi8bit`, `hi16bit`, and `high` for compiled structures like `aether_gate`).

To look at the output before committing, add `--preview <dir>`:

```bash
bun scripts/sprites/compile.ts <id> --preview tmp/preview
```

The preview folder gets the tier sheets, enlarged for easy viewing. `--check` confirms that the committed files still match their scripts.

## Planned

- Painted `high` sheets for the enemies, platforms and decor that have only vector or pixel art today (phase 6).
- Build-time baking of the hi-16bit art (phase 5).
