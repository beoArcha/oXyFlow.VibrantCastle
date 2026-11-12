# Pixel sprite compiler

Enemy sprite sheets are authored as small TypeScript draw scripts (one enemy per file in `scripts/sprites/enemies/`) and compiled into:

- `<id>_hi8bit.svg` - "hi-8bit" sheet for quality tier `low` (12-bit colour, 48 px cells)
- `<id>_hi16bit.svg` - "hi-16bit" sheet for quality tier `mid` (RGB565 colour, 96 px cells)
- `<id>_meta.json` - atlas meta (same shape as `clockwork_owl_gargoyle_meta.json`, plus `layout.bodyBox`)

Output goes to `src/assets/enemies/<id>/`. Fixtures in `__fixtures__/` are never compiled by `--all`.

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

## Notes for authors

- Type pose tables as `Partial<Record<AnimationName, Pose[]>>` (a full `Record` fails the type check because `attack` and `death` are optional).
- Verify one sprite with `bun scripts/sprites/compile.ts <id> --check`; the full sync check for all sprites runs in `bun test scripts`.
- Finished examples to copy from: `enemies/court_sentinel.ts` (upright humanoid), `enemies/chasm_crawler.ts` (wide, low creature), `enemies/chasm_gargoyle.ts` (aerial).
- A compiled enemy needs no code registration: the game discovers `src/assets/enemies/<id>/` automatically; the template in `src/data/enemies/enemies.json` selects it with `atlas.presetId`.
