import { propFrameSize, type PropAnchor, type PropSpriteDefinition } from "./propTypes";

interface PropVariantMeta {
  file: string;
  frameWidth: number;
  frameHeight: number;
}

export interface PropMeta {
  propId: string;
  worldWidth: number;
  worldHeight: number;
  anchor: PropAnchor;
  frames: number;
  fps: number;
  variants: { low: PropVariantMeta; mid: PropVariantMeta };
  /** present only for props that emit light. */
  glow?: { color: string; radius: number; x: number; y: number; flicker: boolean };
}

/** meta for the runtime: the world size, animation timing, both tier sheets and the optional glow. */
export function buildPropMeta(def: PropSpriteDefinition): PropMeta {
  const low = propFrameSize(def.size, "hi8bit");
  const mid = propFrameSize(def.size, "hi16bit");
  const meta: PropMeta = {
    propId: def.id,
    worldWidth: def.size.width,
    worldHeight: def.size.height,
    anchor: def.anchor,
    frames: def.frames,
    fps: def.fps,
    variants: {
      low: { file: `${def.id}_hi8bit.png`, frameWidth: low.width, frameHeight: low.height },
      mid: { file: `${def.id}_hi16bit.png`, frameWidth: mid.width, frameHeight: mid.height },
    },
  };
  if (def.glow) {
    const { color, radius, x, y, flicker } = def.glow;
    meta.glow = { color, radius, x, y, flicker: flicker === true };
  }
  return meta;
}
