import { describe, expect, it } from "bun:test";
import { PARALLAX_MOVES, mapParallaxPath } from "../parallax/migrate";

describe("parallax migrate mapping", () => {
  it("maps a standard PNG world layer to its canonical slot", () => {
    // Arrange
    const legacy = "bg/clocktower/clocktower_mid_high.png";

    // Act
    const mapped = mapParallaxPath(legacy);

    // Assert
    expect(mapped).toBe("parallax/clocktower/clocktower_var_b_high.png");
  });

  it("maps the hyphenated courtyard mid-far and mid-close names", () => {
    expect(mapParallaxPath("bg/courtyard/courtyard_mid-far_high.png")).toBe(
      "parallax/courtyard/courtyard_var_a_high.png",
    );
    expect(mapParallaxPath("bg/courtyard/courtyard_mid-close_high.png")).toBe(
      "parallax/courtyard/courtyard_var_c_high.png",
    );
  });

  it("maps the reversed thorn_chasm close_mid name to var_c", () => {
    expect(mapParallaxPath("bg/thorn_chasm/thorn_chasm_close_mid_high.png")).toBe(
      "parallax/thorn_chasm/thorn_chasm_var_c_high.png",
    );
  });

  it("maps a timestamped JPG to its canonical name and keeps the extension", () => {
    // Arrange
    const legacy = "images/eclipse_crown_far_1795727388177.jpg";

    // Act
    const mapped = mapParallaxPath(legacy);

    // Assert
    expect(mapped).toBe("parallax/eclipse_crown/eclipse_crown_far_high.jpg");
  });

  it("maps the shared sigil to the _shared folder", () => {
    expect(mapParallaxPath("images/boss_stage_arcane_sigil_1795727392388.jpg")).toBe(
      "parallax/_shared/fx_sigil_high.jpg",
    );
  });

  it("accepts backslash separators", () => {
    expect(mapParallaxPath("bg\\grand_bastion\\grand_bastion_far_high.png")).toBe(
      "parallax/grand_bastion/grand_bastion_far_high.png",
    );
  });

  it("returns undefined for paths outside the rename table", () => {
    expect(mapParallaxPath("bg/courtyard/courtyard_far_high.webp")).toBeUndefined();
    expect(mapParallaxPath("characters/valen/valen_main.png")).toBeUndefined();
  });

  it("covers all 33 legacy parallax images with unique, clean target names", () => {
    // Arrange
    const targets = PARALLAX_MOVES.map((move) => move.to);

    // Act / Assert
    expect(PARALLAX_MOVES).toHaveLength(33);
    expect(new Set(targets).size).toBe(targets.length);
    for (const target of targets) {
      expect(target.startsWith("parallax/")).toBe(true);
      expect(target).not.toMatch(/-/);
      expect(target).not.toMatch(/\d{10,}/);
    }
  });
});
