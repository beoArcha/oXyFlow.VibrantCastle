import { defineHeroSprite } from "../defineHeroSprite";

// Aurelia's hi-8bit / hi-16bit sheets are quantized from her painted frames (aurelia_level_1_high_packed.png).
// Her painted magic is purple and the purple also dresses her, so there is no remap: colours stay as painted.
export default defineHeroSprite({
  id: "aurelia",
  description: "Aurelia, the arcane duelist, quantized from her painted frames to a hard-edged 16-colour hi-16bit and 12-colour hi-8bit palette.",
  source: {
    kind: "painted",
    colors: { hi16bit: 16, hi8bit: 12 },
    // hi-8bit only: brighter mids so the skin reads, a firmer contrast so the purple dress stands off the brown hair.
    tune: { hi8bit: { gamma: 0.8, contrast: 1.15, saturation: 1.2 } },
  },
});
