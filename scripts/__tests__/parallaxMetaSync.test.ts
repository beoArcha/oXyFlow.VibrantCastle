import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import type { WorldParallaxMeta } from "../../src/game/parallax/meta";
import { buildWorldParallaxMeta, metaFilePathFor, WORLD_IDS } from "../parallax/buildMeta";

describe("parallax meta sync", () => {
  for (const worldId of WORLD_IDS) {
    it(`keeps ${worldId}_parallax_meta.json in sync with buildMeta output`, () => {
      // Arrange
      const metaPath = metaFilePathFor(worldId);
      expect(existsSync(metaPath)).toBe(true);
      const committed = JSON.parse(readFileSync(metaPath, "utf-8")) as WorldParallaxMeta;

      // Act
      const rebuilt = buildWorldParallaxMeta(worldId, committed);

      // Assert
      expect(committed).toEqual(rebuilt);
    }, { timeout: 20000 });
  }
});
