import { describe, it, expect } from "bun:test";
import { createServer } from "vite";

const REGISTRY_MODULE = "/src/game/engine/meta/registry/AtlasAssetRegistry.ts";

describe("AtlasAssetRegistry Vite glob wiring", () => {
  it("lets Vite inline the bundled asset globs so the browser registry is populated", async () => {
    // Arrange
    const server = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      logLevel: "error",
    });

    try {
      // Act
      const result = await server.transformRequest(REGISTRY_MODULE);
      const code = result?.code ?? "";

      // Assert: globs are expanded into module maps (valen sheet is bundled) ...
      expect(code).toContain("characters/valen/valen_level_1_high_packed.png");
      expect(code).toContain("characters/valen/valen_packed_meta.json");
      // ... and are not gated behind a runtime check that is false in the browser.
      expect(code).not.toMatch(/typeof\s+import\.meta\.glob/);
    } finally {
      await server.close();
    }
  });
});
