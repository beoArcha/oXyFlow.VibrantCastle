# Pixel sprite compiler

Enemy sprite sheets are authored as small TypeScript draw scripts (one enemy per file in `scripts/sprites/enemies/`) and compiled into:

- `<id>_hi8bit.svg` - "hi-8bit" sheet for quality tier `low` (12-bit colour, 48 px cells)
- `<id>_hi16bit.svg` - "hi-16bit" sheet for quality tier `mid` (RGB565 colour, 96 px cells)
- `<id>_meta.json` - atlas meta (same shape as `clockwork_owl_gargoyle_meta.json`, plus `layout.bodyBox`)

Output goes to `src/assets/enemies/<id>/`. Fixtures in `__fixtures__/` are never compiled by `--all`. Hero sheets (Valen, Aurelia) use a second contract, see [Heroes](#heroes). Platform tilesets use a third, see [Tilesets](#tilesets). Decor props use a fourth, see [Props](#props).

## Authoring contract

```ts
// scripts/sprites/enemies/court_sentinel.ts
import { defineEnemySprite } from "../defineEnemySprite";

export default defineEnemySprite({
  id: "court_sentinel",
  kind: "ground",                    // "ground" | "aerial" | "static"
  description: "one sentence",
  hitbox: { width: 42, height: 62 }, // gameplay hitbox in world units (from enemies.json)
  cellScale: 1,                      // 1 -> cells 48 (hi-8bit) / 96 (hi-16bit); 1.5 -> 72 / 144
  animations: {                      // idle, move, hit required; attack, death optional
    idle: { frames: 2, fps: 4, loop: true },
    move: { frames: 4, fps: 8, loop: true },
    hit:  { frames: 2, fps: 10, loop: false },
  },
  draw: {
    hi8bit(c, anim, frame)  { /* draw one frame on c (a PixelCanvas of one cell) */ },
    hi16bit(c, anim, frame) { /* same character, more detail */ },
  },
});
```

Sheet grid (identical for both tiers): columns = longest animation; one row per defined animation in the order idle, move, hit, attack, death; frame `f` sits in column `f`. `draw.*` is called once per frame with a fresh transparent cell, `anim` being the animation name.

## PixelCanvas API

All coordinates are integer pixels inside one cell, origin top-left. Colours are `"#rgb"` or `"#rrggbb"`. Drawing outside the cell throws an error naming the call and the coordinates.

| Call | Meaning |
| :--- | :--- |
| `width`, `height` | Cell size in pixels (48/96, or 72/144 with `cellScale: 1.5`). |
| `px(x, y, color)` | One pixel. |
| `rect(x, y, w, h, color)` | Filled rectangle covering x..x+w-1, y..y+h-1. |
| `line(x0, y0, x1, y1, color)` | 1 px line, both ends included. |
| `ellipse(cx, cy, rx, ry, color)` | Filled ellipse spanning cx-rx..cx+rx, cy-ry..cy+ry. |
| `polygon(points, color)` | Filled polygon from `[x, y]` points (3 or more). |
| `clear(x, y, w, h)` | Makes a rectangle transparent again. |
| `outline(color)` | Paints every transparent pixel that touches an opaque one (up/down/left/right). Never paints outside the cell. |
| `mirrorX()` | Flips the whole cell horizontally. |
| `part(w, h)` | New blank canvas for a reusable body part. |
| `stamp(part, dx, dy)` | Copies the opaque pixels of a part to offset (dx, dy). |

## Compiler behaviour

- Colours are snapped per tier: hi-8bit to 12-bit (written `#rgb`), hi-16bit to RGB565 (written `#rrggbb`). Any number of colours is allowed.
- SVG output is one `<path fill=...>` per colour made of merged rectangles; deterministic, LF newlines.
- `layout.bodyBox` is the union box of opaque pixels over the hi-16bit idle frames, normalized to the cell (0..1). Origin: ground/static -> `feet` at the box centre x, y 1.0; aerial -> `center` of the box.
- The game cuts the sheet with a uniform grid, so hi-8bit and hi-16bit sheets must share the same grid (the compiler guarantees it).

## Validation

Compile fails (all problems listed at once, naming tier, animation and frame) when:

1. A frame is empty.
2. Opaque pixels touch the left, right or top edge of the cell (keep a 1 px margin).
3. Kind `ground`/`static`: the lowest opaque row is not the bottom row of the cell (feet on the floor).
4. A hi-8bit frame and its hi-16bit frame are pixel-identical after scaling (hi-16bit must be a real redraw).
5. The idle body box aspect ratio (w/h) differs from the hitbox aspect ratio by more than 40 %.
6. Ground kind with a hitbox taller than wide: body height below 55 % of the cell height. Hitbox wider than tall: body width below 55 % of the cell width.

Warnings (printed, not fatal): body centre x drifting more than 10 % of the cell between frames of one animation; two consecutive frames identical.

## Commands (Bun only)

```bash
bun scripts/sprites/compile.ts court_sentinel            # compile one or more ids
bun scripts/sprites/compile.ts --all                     # compile every scripts/sprites/enemies/*.ts
bun scripts/sprites/compile.ts --all --check             # exit 1 when committed files differ or are missing
bun scripts/sprites/compile.ts court_sentinel --preview tmp/preview   # also write <id>_hi8bit.png / <id>_hi16bit.png
bun scripts/sprites/compile.ts scripts/sprites/__fixtures__/sample_golem.ts --out tmp/out   # compile a script by path
bun test scripts                                         # includes the sync check for committed enemies
```

`--out <dir>` changes the output root (default `src/assets/enemies`). Preview PNGs are upscaled to about 1000 px wide on a grey checkerboard with thin cell grid lines; open them to check the result.

## Drawing guidance (you cannot see the image, so be systematic)

Copy `__fixtures__/sample_golem.ts` and edit it; it passes validation as is.

- Work out the numbers first: the body should be about as tall and wide as the hitbox aspect says. For `hitbox 42x62` on a 96 px hi-16bit cell, aim for a body about 48 px wide and 72 px tall.
- Draw from the feet up. For ground and static kinds the lowest feet row must be the last row of the cell (y = height - 1). `outline` does not paint outside the cell, so the feet row stays flat.
- Keep the body centred on `width / 2`. Leave at least 2 px to the left, right and top edge before calling `outline`, because the outline adds 1 px of opaque pixels there.
- Build the body from parts (legs, torso, arms, head) in small helper functions that take a pose; animate by moving parts 1-3 px between frames instead of redrawing the character.
- Planted feet stay on the floor; lift a foot by shortening the leg, not by moving the whole body off the ground.
- Call `outline` last, with a dark colour close to black.
- hi-8bit: flat colours, 2-3 per material, no dithering. hi-16bit: the same silhouette with 2-3 shades per material (highlight, base, shade), plus small details (cracks, glow, rivets). Writing the draw routine once with a scale factor `s` (1 or 2) and a `detailed` flag, as the sample does, keeps both tiers consistent.
- Give the hit animation a clear read: a white flash palette and a 1-2 px recoil.
- Run with `--preview` and look at the PNGs before committing.

## Heroes

Heroes (Valen, Aurelia) use the same compiler with a second contract. The runtime loads the output when present: if `src/assets/characters/<id>/<id>_pixel_meta.json` and its PNGs exist, the hero's `low` quality uses the hi-8bit sheet and `mid` the hi-16bit sheet (sliced by `frameRects`, drawn at the painted size with image smoothing off); without them the painted tiers are used unchanged, and `high` is always painted. No code registration is needed. `__fixtures__/sample_hero.ts` is the starting point for hand-drawn hero art; copy it into `heroes/<id>.ts` and replace the drawing. Valen and Aurelia are built from their painted frames instead, see [Heroes from painted frames](#heroes-from-painted-frames).

**Art intent.** A retro 8-bit / 16-bit look at modern pixel density: a limited palette, hard pixel edges, no anti-aliasing and a clear 1 px outline. It is not drawn at original console resolutions; the cells are as large as the painted `mid` sheet (hi-16bit) and half of that (hi-8bit). hi-8bit uses flat colours, hi-16bit adds shading and detail to the same figure.

```ts
// scripts/sprites/heroes/valen.ts
import { defineHeroSprite } from "../defineHeroSprite";

export default defineHeroSprite({
  id: "valen",                       // snake_case
  description: "one sentence",
  // grid: {...}                     // optional inline grid (fixtures, tests); omitted for real heroes
  draw: {
    hi8bit(c, anim, frame, span)  { /* c is a PixelCanvas of (span * cellWidth) x cellHeight */ },
    hi16bit(c, anim, frame, span) { /* same figure, more detail */ },
  },
});
```

`anim` is a string from the grid (today: idle, run, jump, fall, attack, dash, cast, crouch). `span` is the number of columns the frame occupies; wide frames (sword swings, dashes) get a canvas `span` cells wide, so the blade can reach into the extra slots.

**Grid rules.** Without an inline `grid` the grid is read from `src/assets/characters/<id>/<id>_packed_meta.json` (read-only, single source of truth):

- `layout.ordering` is the row order; per animation `frames`, `fps`, `loop` and `cells` (column span of each frame, for example Valen attack `[1, 2, 2, 2, 2, 3, 2]`).
- Frame `f` starts at column = sum of the spans of the frames before it. The sheet has `max(atlas.columns, widest row)` columns, because the painted sheet is bin-packed and its rows can hold more spans than `atlas.columns`.
- hi-16bit cell = packed `variants.mid` cellWidth x cellHeight, each rounded up to an even number (Valen 126x128, Aurelia 124x143 becomes 124x144). hi-8bit cell = exactly half (63x64, 62x72).
- Idle frames all span one cell, because the body box is measured relative to one cell.

**Validation** (all problems listed at once, naming tier, animation and frame):

1. A frame is empty.
2. Opaque pixels touch the left, right or top edge of the frame slot (keep a 1 px margin).
3. Every animation except `jump` and `fall` has its feet on the bottom row of the slot.
4. A hi-16bit frame is pixel-identical to its hi-8bit frame scaled 2x (it must be a real redraw).
5. The idle body is shorter than 55 % of the cell height.

Warnings (printed, not fatal): body centre drifting more than 10 % of the cell width between frames of the same span; two consecutive frames identical.

**Output** goes to `src/assets/characters/<id>/` (with `--out <dir>`, to `<dir>/<id>/`; the grid is still read from `src/assets/characters`):

- `<id>_hi8bit.png` (12-bit colour) and `<id>_hi16bit.png` (RGB565): lossless 1:1 RGBA PNG sheets with deterministic bytes (`--check` compares them byte for byte). Heroes use PNG, not SVG, because quantized painted frames make multi-megabyte SVGs (Valen hi-16bit 2.6 MB as SVG, about 200 KB as PNG). Enemies keep SVG.
- `<id>_pixel_meta.json`: `characterId`, the `grid` (`ordering`, `columns`, `rows`, per animation `row`, `frames`, `fps`, `loop`, `cells`), `variants.low` (hi-8bit) and `variants.mid` (hi-16bit) with `file`, `cellWidth`, `cellHeight`, `sheetWidth`, `sheetHeight`, `scale` (cell width relative to the packed `mid` cell, so the runtime draws both tiers at the same world size) and `frameRects` (tight opaque bounds in sheet pixels keyed `<anim>_<frame>`, the format of `frameRects` in `<id>_packed_meta.json`), plus `layout.origin` (feet at the body box centre x, y 1.0) and `layout.bodyBox` (normalized, from the hi-16bit idle frames).

## Heroes from painted frames

Valen and Aurelia set `source: { kind: "painted", colors, remap? }` in `defineHeroSprite` instead of drawing pixels. The quantizer (`quantize.ts`, `paintedHero.ts`) reads the painted `_packed_high.png` frames and builds both tiers:

- **hi-16bit** places each painted frame 1:1 on the painted feet anchor; **hi-8bit** area-averages it 2x down.
- Alpha is thresholded at 50 %: a pixel is fully opaque or fully transparent, so there is no anti-aliasing.
- An optional hue remap (`remap`, ranges of hue, saturation and value) recolours the painted colours first, for example Valen's blue slash and glow to amber.
- One global palette per tier (`colors.hi16bit`, `colors.hi8bit`) is built from all frames by median cut plus k-means, deterministic, and snapped to RGB565 (hi-16bit) or 12-bit (hi-8bit). Every pixel takes its nearest palette entry.
- The darkest palette entry becomes the 1 px outline around the figure.
- Optional `draw` hooks run on top of the quantized frame for touch-ups.
- Output is PNG (see Output above); enemies are unaffected.

`bun scripts/sprites/compile.ts <id>` looks the id up in `enemies/` first and `heroes/` second; `--all`, `--all --check` and `--preview <dir>` cover both kinds.

## Tilesets

Platform tilesets (solid and oneway platforms) are authored in `scripts/sprites/tilesets/<id>.ts` with `defineTileset`, and compile to `src/assets/tiles/<id>/`:

- `<id>_hi8bit.png` (16 px tiles) and `<id>_hi16bit.png` (32 px tiles): lossless PNG sheets. Tiles are packed row-major in listing order, at most 8 columns, no spacing.
- `<id>_tiles_meta.json`: `tilesetId`, `kind`, `worldTile` (32), `columns`, `rows`, `variants` (`low` = hi-8bit file and tile size, `mid` = hi-16bit) and `tiles` (name to `col`, `row`).

```ts
// scripts/sprites/tilesets/courtyard_stone.ts
import { defineTileset, type PixelCanvas } from "../defineTileset";

export default defineTileset({
  id: "courtyard_stone",
  kind: "solid",                         // "solid" | "oneway"
  description: "one sentence",
  tiles: ["top_left", "top", "top_right", /* ... */ "fill_2"], // listing order = sheet order
  draw: {
    hi8bit(c, tile)  { /* c is a 16x16 PixelCanvas for this tile */ },
    hi16bit(c, tile) { /* c is a 32x32 PixelCanvas, the same tile with more detail */ },
  },
});
```

`__fixtures__/sample_tileset.ts` is a complete worked example (solid stone with a `fill_2` variant).

**Tile names.** Solid tilesets require `top_left, top, top_right, left, fill, right, bottom_left, bottom, bottom_right, ledge_left, ledge, ledge_right`. Oneway tilesets require `ledge_left, ledge, ledge_right` and may add `support` (a bracket under the ledge). Any listed base may have numbered variants `<base>_<n>` with n from 2 (`fill_2`, `ledge_3`); the base must be listed too. `defineTileset` rejects a bad id, a missing required tile, a variant without its base, `support` on a solid tileset, duplicate names and missing draw functions, and lists all of them in one error.

**Validation.** Compile fails with every problem at once, naming tier and tile:

1. A tile is empty.
2. A tile has transparent pixels, except oneway `ledge*` tiles and `support`: a ledge may be open below the walking surface.
3. A hi-16bit tile is identical to its hi-8bit tile scaled 2x. Both are compared after snapping to 12-bit, as enemies and heroes do, so the hi-16bit tile must be a real redraw.

Warning, not fatal: for `top`, `fill`, `ledge`, `bottom` and their variants, the right edge of one tile does not continue into the left edge of another (more than 25 % of rows differ).

**Runtime rules.** The rect is tiled on a `worldTile` grid anchored at the entity's top-left; the last column or row is cropped, not stretched. A platform no taller than one tile is one row: `ledge_left`, `ledge`, `ledge_right`, or `ledge` alone when one cell wide. A taller platform has a `top_*` row, `left/fill/right` middle rows and a `bottom_*` row; a one-cell-wide block uses the middle names only. A base with variants is chosen by `variantHash(col, row, originX, originY) % (1 + variants)` from `tilingRules.ts`, which is stable across frames. It is the same formula as `tileHash` in `src/game/engine/tiles/tilePlan.ts` (scripts cannot import the runtime); keep the two in step.

**Commands.**

```bash
bun scripts/sprites/compile.ts courtyard_stone                       # tileset ids are found in tilesets/ as well
bun scripts/sprites/compile.ts courtyard_stone --preview tmp/preview # also <id>_hi8bit_x4.png, <id>_hi16bit_x4.png, <id>_tiling_demo.png
bun scripts/sprites/compile.ts --all --check                         # enemies, heroes, tilesets and props
bun scripts/sprites/compile.ts scripts/sprites/__fixtures__/sample_tileset.ts --out tmp/out   # worked example by path
```

The tiling demo shows the hi-8bit panel above the hi-16bit panel, each tile drawn at the same world size: a 10-tile ledge strip and, for solid tilesets, a 6x4 block. Seams and variant repeats show there, so open it before committing art.

## Props

Decor props (lanterns, torches, banners, braziers, crystals) are authored in `scripts/sprites/props/<id>.ts` with `defineProp`, and compile to `src/assets/props/<id>/`. Props never collide; the runtime places them from `layout.decor` and draws the glow, so this compiler only produces the art and its meta.

- `<id>_hi8bit.png` (half the world size per frame, quality `low`) and `<id>_hi16bit.png` (world size, quality `mid`): lossless PNG sheets with the frames in one row, in frame order.
- `<id>_prop_meta.json`: `propId`, `worldWidth`, `worldHeight`, `anchor`, `frames`, `fps`, `variants` (`low` and `mid` with `file`, `frameWidth`, `frameHeight`) and `glow` (only when the prop emits light: `color`, `radius`, `x`, `y`, `flicker`).

```ts
// scripts/sprites/props/wall_torch.ts
import { defineProp, type PixelCanvas } from "../defineProp";

export default defineProp({
  id: "wall_torch",
  description: "one sentence",
  size: { width: 24, height: 48 },   // world units == hi-16bit pixels; both even; hi-8bit frame is half
  anchor: "bottom",                  // "bottom" stands on the floor, "top" hangs, "center" is free
  frames: 3,                         // 1..12, one row
  fps: 8,                            // > 0
  glow: { color: "#ffb347", radius: 72, x: 12, y: 8, flicker: true }, // optional; x/y inside the sprite
  draw: {
    hi8bit(c: PixelCanvas, frame: number) { /* c is 12 x 24 */ },
    hi16bit(c: PixelCanvas, frame: number) { /* c is 24 x 48, the same prop with more detail */ },
  },
});
```

`__fixtures__/sample_prop.ts` is a complete worked example (a three-frame iron torch with a flickering glow); copy it to start a prop.

**Validation.** `defineProp` rejects a bad id, an odd or zero size, an anchor other than `bottom`, `top` or `center`, frames outside 1..12, fps of 0 or less, a glow with a bad colour, radius of 0 or a centre outside the sprite, and missing draw functions; every problem is listed at once. Compile then checks every tier and frame, naming both:

1. A frame is empty.
2. Anchor rule: `bottom` props must touch the bottom row, `top` props the top row.
3. A 1 px transparent margin on every side except the anchor side (`center` props keep all four sides clear).
4. A hi-16bit frame is identical to its hi-8bit frame scaled 2x (after snapping to 12-bit, as tilesets do). It must be a real redraw.

Warning, not fatal: two consecutive frames identical in one tier.

**Previews.** `--preview <dir>` writes `<id>_hi8bit_x4.png` and `<id>_hi16bit_x4.png` (each tier enlarged 4x with the frame grid) and `<id>_strip.png`: every frame of both tiers side by side at world size, with the glow added on a dark stage so the light can be judged. A flickering glow samples the runtime's 0.75..1.0 alpha across the frames. Open the strip before committing a light source.

**Commands.**

```bash
bun scripts/sprites/compile.ts <prop-id>                        # prop ids are found in props/ as well
bun scripts/sprites/compile.ts <prop-id> --preview tmp/preview  # also the x4 sheets and the strip
bun scripts/sprites/compile.ts scripts/sprites/__fixtures__/sample_prop.ts --out tmp/out   # worked example by path
bun scripts/sprites/compile.ts --all --check                    # enemies, heroes, tilesets and props
```

`props/README.md` is the folder note; the folder holds no real props until the first one is authored.

## Notes for authors

- Type pose tables as `Partial<Record<AnimationName, Pose[]>>` (a full `Record` fails the type check because `attack` and `death` are optional).
- Verify one sprite with `bun scripts/sprites/compile.ts <id> --check`; the full sync check for all sprites runs in `bun test scripts`.
- Finished examples to copy from: `enemies/court_sentinel.ts` (upright humanoid), `enemies/chasm_crawler.ts` (wide, low creature), `enemies/chasm_gargoyle.ts` (aerial).
- A compiled enemy needs no code registration: the game discovers `src/assets/enemies/<id>/` automatically; the template in `src/data/enemies/enemies.json` selects it with `atlas.presetId`.
