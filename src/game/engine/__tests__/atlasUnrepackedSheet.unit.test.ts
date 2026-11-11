import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAtlasCatalog, discoverAtlasFiles } from "../atlas";

const META = JSON.stringify({
  entityType: "creature",
  atlas: { columns: 2, rows: 1, cellWidth: 96, cellHeight: 96 },
  animations: { idle: { row: 0, frames: 2, fps: 4 } },
  layout: { origin: { type: "feet", normalized: { x: 0.5, y: 1 } } },
});

describe("unrepacked AI sheets (only <id>_high.png + <id>_meta.json)", () => {
  const originalCwd = process.cwd();
  let root = "";

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "vc-atlas-"));
    const dir = join(root, "src", "assets", "enemies", "raw_ghoul");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "raw_ghoul_high.png"), "");
    writeFileSync(join(dir, "raw_ghoul_meta.json"), META);
    process.chdir(root);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it("registers no atlas through the filesystem fallback", () => {
    // Act
    const files = discoverAtlasFiles();
    const catalog = buildAtlasCatalog(files, { structureAllowList: [] });

    // Assert
    expect(Object.keys(files.images)).toEqual([]);
    expect(catalog.find((entry) => entry.id === "raw_ghoul")).toBeUndefined();
  });

  it("is also excluded by the Vite glob patterns", () => {
    // Arrange
    const source = readFileSync(join(originalCwd, "src/game/engine/atlas/atlasFileDiscovery.ts"), "utf-8");

    // Act
    const imageGlobs = source.match(/import\.meta\.glob<string>\("([^"]+)"/g) ?? [];

    // Assert
    expect(imageGlobs.length).toBe(2);
    for (const glob of imageGlobs) {
      expect(glob).toContain("{_packed_high.png,.svg}");
      expect(glob).not.toMatch(/\*_high\.png/);
    }
  });
});
