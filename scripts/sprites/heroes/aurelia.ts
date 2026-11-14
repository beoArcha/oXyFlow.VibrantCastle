import { defineHeroSprite } from "../defineHeroSprite";

// Aurelia's hi-8bit / hi-16bit sheets are quantized from her painted frames (aurelia_level_1_high_packed.png).
// Her painted magic is purple and the purple also dresses her, so there is no remap: colours stay as painted.
export default defineHeroSprite({
  id: "aurelia",
  description: "Aurelia, the arcane duelist, quantized from her painted frames to a hard-edged 16-colour hi-16bit and 8-colour hi-8bit palette.",
  source: {
    kind: "painted",
    colors: { hi16bit: 16, hi8bit: 8 },
  },
});
