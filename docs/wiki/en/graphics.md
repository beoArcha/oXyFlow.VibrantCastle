# Graphics Quality

The graphics quality setting (in the in-game menu, display settings) changes how heroes, enemies, platforms and decor are drawn. Gameplay, collisions and the level layout are identical on every setting.

## The three tiers

| Setting | Heroes | Enemies | Platforms and decor | What it looks like |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Small pixel sprites, lightly graded for a brighter look | Chunky sprites in the style of 8-bit games | Pixel tiles drawn at double size | Flat colours from a small palette, hard outlines and blocky shapes, kept sharp on today's screens. The lightest option for weaker devices. |
| **hi-16bit** | Richer pixel sprites with more colours | Richer sprites in the style of 16-bit games | Pixel tiles at their full resolution | More colours, simple shading and highlights, still crisp pixel edges. |
| **high** | Painted animation sheets | Painted animation sheets, where one exists | Uses the hi-16bit look | Full-colour painted frames with the most detail. |

Some art has no painted version yet. Enemies without a painted sheet use the hi-16bit art on **high**, and platforms and decor use the hi-16bit look on **high**, so nothing is ever left without a sprite.

Changes apply immediately, with no restart: heroes, enemies, platforms and decor switch to the chosen tier as soon as you pick it.

## Why the game stays light

The quality tiers only change the look. Hero, platform and decor sheets are lossless PNG files, and enemy sheets are small vector files. All of them are loaded the first time they are needed, so the game starts quickly on any tier.

If the game feels slow on your device, lower the quality first; the level layout and gameplay stay exactly the same on every setting.

## How the pixel art is made

Creators make the art with the Bun sprite tools in `scripts/sprites/`. Everything the game uses is either authored as code or painted and then converted, so the art can be regenerated and checked.

* **Heroes from painted frames.** Valen and Aurelia are painted first. A palette quantizer reads the painted frames and builds the hi-8bit and hi-16bit sheets from them. The hi-8bit tier has a small colour grade (gamma, contrast and saturation) so the faces and coats read clearly; the hi-16bit tier is not graded.
* **Platform tilesets.** Each tileset (for example `courtyard_stone` or `sanctuary_crystal`) is written as a small script that describes its tiles. The compiler turns it into a hi-8bit and a hi-16bit sheet with a tile map. Validation rejects empty or see-through solid tiles, and warns about seams that do not join.
* **Decor props.** Lanterns, braziers, banners and crystals are scripts too. A prop is a short animation with an anchor point and an optional glow; the compiler checks the anchor (a bottom-anchored prop must touch the bottom row of its frames, a top-anchored one the top row) and writes a hi-8bit and a hi-16bit sheet.
* **Enemies.** Enemy sprites are drawn pixel by pixel with the PixelCanvas API. They compile to SVG for the hi-8bit and hi-16bit tiers, and the compiler rejects frames with empty cells, floating feet or frames that look the same on both tiers.

To check the art before committing, add `--preview <dir>`:

```bash
bun scripts/sprites/compile.ts <id> --preview tmp/preview
```

The preview folder gets the tier sheets for the sprite. Enemies and heroes get one PNG per tier at normal size; tilesets get enlarged copies (4x) and a tiling demo; props get enlarged copies (4x) and a strip with the glow on a dark stage. Open them and look at them before you commit. `--check` confirms that the committed files still match their scripts, and `--all` rebuilds everything.

See `scripts/sprites/README.md` for the authoring contract of each kind of sprite.
