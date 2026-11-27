import { describe, expect, it } from "bun:test";
import {
  PARALLAX_BAND_DEFAULTS,
  PARALLAX_FX_DEFAULTS,
  PARALLAX_ZONE_DEFAULTS,
  resolveEffectWithDefaults,
  resolveLayerWithDefaults,
  type ParallaxEffectMeta,
  type ParallaxLayerMeta,
} from "../index";

describe("Parallax Meta Band Defaults", () => {
  it("should order default depths monotonically from far to close", () => {
    // Arrange
    const bands = ["far", "mid_far", "mid", "mid_close", "close"] as const;

    // Act
    const depths = bands.map((band) => PARALLAX_BAND_DEFAULTS[band].depth);

    // Assert
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeGreaterThan(depths[i - 1]);
    }
  });

  it("should force opaque true and tiling none for far layers", () => {
    // Arrange
    const farLayer: ParallaxLayerMeta = { band: "far", opaque: false };

    // Act
    const resolved = resolveLayerWithDefaults(farLayer);

    // Assert
    expect(resolved.opaque).toBe(true);
    expect(resolved.tiling).toBe("none");
    expect(resolved.fit).toBe("cover");
    expect(resolved.overscan).toEqual([1.06, 1.03]);
  });

  it("should populate missing depth, speed, drift, and opacity from band defaults", () => {
    // Arrange
    const midLayer: ParallaxLayerMeta = { band: "mid" };

    // Act
    const resolved = resolveLayerWithDefaults(midLayer);

    // Assert
    expect(resolved.depth).toBe(PARALLAX_BAND_DEFAULTS.mid.depth);
    expect(resolved.speed).toEqual(PARALLAX_BAND_DEFAULTS.mid.speed);
    expect(resolved.drift).toEqual([0, 0]);
    expect(resolved.tiling).toBe("repeat");
    expect(resolved.opacity).toBe(1);
    expect(resolved.blend).toBe("source-over");
    expect(resolved.tint).toBeNull();
  });

  it("should preserve authored overrides over band defaults", () => {
    // Arrange
    const customLayer: ParallaxLayerMeta = {
      band: "close",
      depth: 0.88,
      speed: [0.8, 0.25],
      tiling: "mirror",
      opacity: 0.9,
      blend: "screen",
    };

    // Act
    const resolved = resolveLayerWithDefaults(customLayer);

    // Assert
    expect(resolved.depth).toBe(0.88);
    expect(resolved.speed).toEqual([0.8, 0.25]);
    expect(resolved.tiling).toBe("mirror");
    expect(resolved.opacity).toBe(0.9);
    expect(resolved.blend).toBe("screen");
  });

  it("should apply fx defaults to image effects and band defaults to procedural effects", () => {
    // Arrange
    const imageFx: ParallaxEffectMeta = { kind: "image", band: "mid_close", source: "_shared:fx_sigil" };
    const proceduralFx: ParallaxEffectMeta = { kind: "procedural", band: "mid" };

    // Act
    const resolvedImage = resolveEffectWithDefaults(imageFx);
    const resolvedProcedural = resolveEffectWithDefaults(proceduralFx);

    // Assert
    expect(resolvedImage.depth).toBe(PARALLAX_FX_DEFAULTS.depth);
    expect(resolvedImage.speed).toEqual(PARALLAX_FX_DEFAULTS.speed);
    expect(resolvedImage.opacity).toBe(PARALLAX_FX_DEFAULTS.opacity);
    expect(resolvedImage.blend).toBe("screen");
    expect(resolvedProcedural.depth).toBe(PARALLAX_BAND_DEFAULTS.mid.depth);
    expect(resolvedProcedural.blend).toBe("source-over");
  });

  it("should expose deterministic zone tie-break order and feather defaults", () => {
    // Arrange
    const expectedOrder = ["boss", "story", "rest", "secret"];

    // Act
    const defaults = PARALLAX_ZONE_DEFAULTS;

    // Assert
    expect(defaults.featherPx).toBe(260);
    expect(defaults.tieBreakOrder).toEqual(expectedOrder);
  });
});
