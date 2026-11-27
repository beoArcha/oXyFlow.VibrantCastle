import { defineHeroSprite } from "../defineHeroSprite";

// Valen's hi-8bit / hi-16bit sheets are quantized from his painted frames (valen_level_1_high_packed.png),
// not drawn. The painted slash, dash glow and magic are blue; the autumn palette keeps blue out of the game,
// so the vivid blues are turned to amber before the palettes are built. The dark navy coat stays untouched
// (minValue keeps the dark shades out of the remap).
export default defineHeroSprite({
  id: "valen",
  description: "Valen, the scarlet-blade duelist, quantized from his painted frames to a hard-edged 16-colour hi-16bit and 12-colour hi-8bit palette.",
  source: {
    kind: "painted",
    colors: { hi16bit: 16, hi8bit: 12 },
    remap: [{ hue: [180, 260], toHue: 40, minSaturation: 0.3, minValue: 0.45 }],
    // hi-8bit only: brighter mids so the skin reads, a firmer contrast so the navy coat stands off the brown boots.
    tune: { hi8bit: { gamma: 0.8, contrast: 1.15, saturation: 1.2 } },
  },
});
