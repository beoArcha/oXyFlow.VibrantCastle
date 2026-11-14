import { encodePngBuffer } from "../lib/png";
import { parseColor } from "./colors";
import { TRANSPARENT } from "./pixelCanvas";
import type { PropSpriteDefinition } from "./propTypes";
import type { SheetImage } from "./render";

/** Dark stage the light is judged against. */
const BACKGROUND = 0x161210;
const MAX_STRIP_WIDTH = 1600;
const MAX_STRIP_SCALE = 4;
/** Flicker frames sample the runtime's 0.75..1.0 alpha range in order. */
const FLICKER_MIN = 0.75;

const channel = (rgb: number, shift: number): number => (rgb >> shift) & 0xff;

/** Alpha of the glow for one frame: constant, or ramping 0.75..1.0 across the frames when it flickers. */
function glowAlpha(def: PropSpriteDefinition, frame: number): number {
  if (!def.glow?.flicker) return 1;
  const phase = def.frames > 1 ? frame / (def.frames - 1) : 1;
  return FLICKER_MIN + (1 - FLICKER_MIN) * phase;
}

/** Writes one tier's frames into the strip; `top` is the output row of the tier. */
function paintTier(
  data: Uint8Array,
  stripWidth: number,
  def: PropSpriteDefinition,
  sheet: SheetImage,
  layout: { pad: number; cellWidth: number; cellHeight: number; scale: number; top: number },
): void {
  const { pad, cellWidth, cellHeight, scale, top } = layout;
  const worldPerPixel = def.size.width / sheet.cell;
  const glowRgb = def.glow ? parseColor(def.glow.color) : 0;
  for (let frame = 0; frame < def.frames; frame++) {
    const alpha = glowAlpha(def, frame);
    for (let oy = 0; oy < cellHeight * scale; oy++) {
      for (let ox = 0; ox < cellWidth * scale; ox++) {
        const wx = (ox + 0.5) / scale;
        const wy = (oy + 0.5) / scale;
        const sx = wx - pad;
        const sy = wy - pad;
        let rgb = BACKGROUND;
        if (sx >= 0 && sy >= 0 && sx < def.size.width && sy < def.size.height) {
          const pixel = sheet.pixels[Math.floor(sy / worldPerPixel) * sheet.width + frame * sheet.cell + Math.floor(sx / worldPerPixel)];
          if (pixel !== TRANSPARENT) rgb = pixel;
        }
        let [r, g, b] = [channel(rgb, 16), channel(rgb, 8), channel(rgb, 0)];
        if (def.glow) {
          const dist = Math.hypot(wx - (pad + def.glow.x), wy - (pad + def.glow.y));
          const falloff = 1 - dist / def.glow.radius;
          if (falloff > 0) {
            const strength = falloff * falloff * alpha;
            r = Math.min(255, r + channel(glowRgb, 16) * strength);
            g = Math.min(255, g + channel(glowRgb, 8) * strength);
            b = Math.min(255, b + channel(glowRgb, 0) * strength);
          }
        }
        const index = ((top + oy) * stripWidth + frame * cellWidth * scale + ox) * 4;
        data[index] = Math.round(r);
        data[index + 1] = Math.round(g);
        data[index + 2] = Math.round(b);
        data[index + 3] = 255;
      }
    }
  }
}

/**
 * Animation strip for judging the light: one row per tier (hi-8bit above hi-16bit), every frame of the
 * animation side by side, both drawn at world size. The glow is added on top of the sprite (additive),
 * on a dark stage, with a radial falloff of radius `glow.radius` around `glow.x, glow.y`.
 */
export function renderPropStrip(def: PropSpriteDefinition, sheets: { hi8bit: SheetImage; hi16bit: SheetImage }): Buffer {
  const pad = def.glow ? Math.ceil(def.glow.radius) : 0;
  const cellWidth = def.size.width + 2 * pad;
  const cellHeight = def.size.height + 2 * pad;
  const scale = Math.min(MAX_STRIP_SCALE, Math.max(1, Math.floor(MAX_STRIP_WIDTH / (def.frames * cellWidth))));
  const width = def.frames * cellWidth * scale;
  const height = 2 * cellHeight * scale;
  const data = new Uint8Array(width * height * 4);
  const layout = { pad, cellWidth, cellHeight, scale, top: 0 };
  paintTier(data, width, def, sheets.hi8bit, layout);
  paintTier(data, width, def, sheets.hi16bit, { ...layout, top: cellHeight * scale });
  return encodePngBuffer({ width, height, data });
}
