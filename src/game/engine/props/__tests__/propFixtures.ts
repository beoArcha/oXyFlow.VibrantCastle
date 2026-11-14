import type { PropAnchor } from "../propMeta";

/** Inline prop meta in the contract shape: 4 frames, 32x64 world size, warm flickering glow. */
export function createPropMetaJson(
  propId = "test_lantern",
  anchor: PropAnchor = "top",
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    propId,
    worldWidth: 32,
    worldHeight: 64,
    anchor,
    frames: 4,
    fps: 8,
    variants: {
      low: { file: `${propId}_hi8bit.png`, frameWidth: 16, frameHeight: 32 },
      mid: { file: `${propId}_hi16bit.png`, frameWidth: 32, frameHeight: 64 },
    },
    glow: { color: "#ffb347", radius: 72, x: 16, y: 44, flicker: true },
    ...overrides,
  };
}
