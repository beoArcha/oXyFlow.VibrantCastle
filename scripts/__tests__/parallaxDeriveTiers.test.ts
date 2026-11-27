import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { blankImage, fillRect } from "../atlas/syntheticSheet";
import { decodePngBuffer, encodePngBuffer } from "../lib/png";
import { resolveTargetDimensions, runDeriveTiers } from "../parallax/deriveTiers";

function setupSyntheticWorld(root: string): void {
  const worldDir = join(root, "courtyard");
  mkdirSync(worldDir, { recursive: true });

  const far = blankImage(64, 24);
  fillRect(far, { x: 0, y: 0, w: 64, h: 24 }, [40, 60, 90, 255]);
  fillRect(far, { x: 8, y: 4, w: 20, h: 10 }, [180, 120, 60, 255]);
  writeFileSync(join(worldDir, "courtyard_far_high.png"), encodePngBuffer(far, { colorType: 2 }));

  const varD = blankImage(64, 24);
  fillRect(varD, { x: 0, y: 10, w: 64, h: 14 }, [90, 50, 40, 220]);
  writeFileSync(join(worldDir, "courtyard_var_d_high.png"), encodePngBuffer(varD));

  writeFileSync(
    join(worldDir, "courtyard_parallax_meta.json"),
    JSON.stringify({
      worldId: "courtyard",
      placeholder: { top: "#101010", bottom: "#202020", silhouette: "#303030" },
      layers: {
        far: { band: "far", depth: 0.08, speed: [0.04, 0.02], opaque: true },
        var_d: { band: "close", depth: 0.86, speed: [0.78, 0.24], tiling: "mirror" },
      },
      generated: {},
    })
  );
}

describe("parallax deriveTiers", () => {
  it("keeps all committed parallax tiers and zone variants in sync in --check mode", () => {
    // Arrange
    const logs: string[] = [];

    // Act
    const result = runDeriveTiers({ check: true, log: (line) => logs.push(line) });

    // Assert
    expect(result.outOfSyncFiles).toEqual([]);
    expect(result.exitCode).toBe(0);
  }, 60000);

  it("computes multiple-of-8 target dimensions within doc tier limits", () => {
    // Arrange & Act
    const farMid = resolveTargetDimensions(2048, 768, true, "hi16bit");
    const farLow = resolveTargetDimensions(2048, 768, true, "hi8bit");
    const varMid = resolveTargetDimensions(2172, 724, false, "hi16bit");
    const varLow = resolveTargetDimensions(2172, 724, false, "hi8bit");

    // Assert
    expect(farMid).toEqual({ width: 1024, height: 384 });
    expect(farLow).toEqual({ width: 512, height: 192 });
    expect(varMid.width % 8).toBe(0);
    expect(varLow.width % 8).toBe(0);
    expect(varMid.width).toBeLessThanOrEqual(1280);
    expect(varLow.width).toBeLessThanOrEqual(640);
  });

  it("generates deterministic PNGs, enforces alpha-free far tiers, and flags stale files in --check", () => {
    // Arrange
    const root = mkdtempSync(join(tmpdir(), "vc-derive-tiers-"));
    try {
      setupSyntheticWorld(root);

      // Act
      const beforeCheck = runDeriveTiers({
        check: true,
        worlds: ["courtyard"],
        parallaxRoot: root,
        log: () => undefined,
      });
      const generated = runDeriveTiers({
        check: false,
        worlds: ["courtyard"],
        parallaxRoot: root,
        log: () => undefined,
      });
      const firstFarLow = readFileSync(join(root, "courtyard", "courtyard_far_hi8bit.png"));
      const afterCheck = runDeriveTiers({
        check: true,
        worlds: ["courtyard"],
        parallaxRoot: root,
        log: () => undefined,
      });

      runDeriveTiers({ check: false, worlds: ["courtyard"], parallaxRoot: root, log: () => undefined });
      const secondFarLow = readFileSync(join(root, "courtyard", "courtyard_far_hi8bit.png"));

      // Tamper one output and confirm --check detects drift.
      writeFileSync(join(root, "courtyard", "courtyard_var_d_zone_boss_hi8bit.png"), Buffer.from([1, 2, 3]));
      const staleCheck = runDeriveTiers({
        check: true,
        worlds: ["courtyard"],
        parallaxRoot: root,
        log: () => undefined,
      });

      // Assert
      expect(beforeCheck.exitCode).toBe(1);
      expect(generated.exitCode).toBe(0);
      expect(afterCheck.exitCode).toBe(0);
      expect(firstFarLow.equals(secondFarLow)).toBe(true);
      expect(firstFarLow[25]).toBe(2);
      expect(decodePngBuffer(firstFarLow).width).toBe(16);
      expect(staleCheck.exitCode).toBe(1);
      expect(staleCheck.outOfSyncFiles.some((p) => p.endsWith("courtyard_var_d_zone_boss_hi8bit.png"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
