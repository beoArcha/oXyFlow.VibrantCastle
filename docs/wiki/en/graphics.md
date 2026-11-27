# Graphics Quality

The graphics quality setting, in the game menu under the display settings, changes how heroes, enemies, platforms and decor are drawn. Gameplay, collisions and the level layout are identical on every setting. The change applies immediately, with no restart.

## The three tiers

The menu shows these names. The settings store them as `low`, `mid` and `high`, and the art files use the suffixes `hi8bit` and `hi16bit`.

| Menu name | Heroes | Enemies | Platforms and decor | What it looks like |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Small pixel sprites | Chunky sprites in the style of 8-bit games | Pixel tiles | Flat colours from a small palette, hard outlines and blocky shapes. The lightest option. |
| **hi-16bit** | Richer pixel sprites | Richer sprites in the style of 16-bit games | Pixel tiles at full resolution | More colours, simple shading and highlights, crisp pixel edges. |
| **high** (default) | Painted animation sheets | Vector art in the hi-16bit style until painted sheets exist | Uses the hi-16bit look | Full-colour painted frames with the most detail. |

Enemies without a painted sheet use the hi-16bit art on **high**. Nothing is ever left without a sprite.

## Why the game stays light

The tiers only change the look. Sprite sheets load the first time they are needed, so the game starts quickly on any tier. If the game feels slow on your device, lower the quality first. The level layout and the gameplay stay the same.

## How the pixel art is made

The art is made with the Bun sprite tools in `scripts/sprites/`. Everything the game uses is either authored as code or painted and then converted, so it can be rebuilt and checked.

- **Heroes from painted frames.** Valen and Aurelia are painted first. A palette quantizer reads the frames and builds the hi-8bit and hi-16bit sheets.
- **Platform tilesets.** Each tileset is a small script that describes its tiles. The compiler writes a hi-8bit and a hi-16bit sheet with a tile map, and rejects empty or see-through solid tiles.
- **Decor props.** Lanterns, braziers, banners and crystals are scripts too. The compiler checks each prop's anchor point, so that the prop stands on its base or hangs from its top edge as designed.
- **Enemies.** Enemy sprites are drawn pixel by pixel and compiled to vector files for the tiers. The compiler rejects frames with empty cells or floating feet.

To check the art before committing, add `--preview <dir>`:

```bash
bun scripts/sprites/cli.ts <id> --preview tmp/preview
```

The preview folder gets the tier sheets, enlarged for easy viewing. `--check` confirms that the committed files still match their scripts. See `scripts/sprites/README.md` for the authoring contract of each kind of sprite.

## Planned

- Painted `high` sheets for the enemies that have only vector art today (phase 6).
- A tier completeness test and build-time baking of the hi-16bit art (phase 5).
