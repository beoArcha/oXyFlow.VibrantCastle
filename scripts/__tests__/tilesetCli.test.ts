import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePngBuffer } from "../lib/png";
import {
  DEFAULT_DIRS,
  ENEMIES_DIR,
  HEROES_DIR,
  listTilesetIds,
  loadSprite,
  run,
  TILESETS_DIR,
  type SpriteDirs,
} from "../sprites/cli";

const FIXTURES_DIR = fileURLToPath(new URL("../sprites/__fixtures__", import.meta.url));
const FIXTURE_SCRIPT = join(FIXTURES_DIR, "sample_tileset.ts");
const root = mkdtempSync(join(tmpdir(), "tileset-cli-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

const tilesetDirs = (tilesets: string, out: string): SpriteDirs => ({
  enemies: ENEMIES_DIR,
  heroes: HEROES_DIR,
  tilesets,
  props: join(out, "no-props"),
  enemyOut: out,
  heroOut: out,
  tileOut: out,
  propOut: out,
});

function emptyFolder(name: string): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("tileset CLI id resolution", () => {
  it("should resolve a tileset id from the tilesets folder when it is not an enemy or hero", async () => {
    // Arrange
    const dirs = tilesetDirs(FIXTURES_DIR, root);

    // Act
    const def = await loadSprite("sample_tileset", dirs);

    // Assert
    expect(def.id).toBe("sample_tileset");
  });

  it("should reject an id that exists in two script folders when it is resolved", async () => {
    // Arrange
    const dirs = tilesetDirs(FIXTURES_DIR, root);

    // Act
    const load = loadSprite("sample_tileset", { ...dirs, enemies: FIXTURES_DIR });

    // Assert
    await expect(load).rejects.toThrow(/sample_tileset" is ambiguous/);
  });

  it("should ignore the tilesets README when listing the scripts", () => {
    // Arrange & Act
    const ids = listTilesetIds(TILESETS_DIR);

    // Assert
    expect(ids).not.toContain("README");
  });
});

describe("tileset CLI compile and check", () => {
  it("should write the tier sheets and tiles meta when a tileset id is compiled", async () => {
    // Arrange
    const out = join(root, "compile");

    // Act
    const code = await run(["sample_tileset", "--out", out], () => undefined, tilesetDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(0);
    expect(existsSync(join(out, "sample_tileset", "sample_tileset_tiles_meta.json"))).toBe(true);
    expect(existsSync(join(out, "sample_tileset", "sample_tileset_hi16bit.png"))).toBe(true);
  });

  it("should pass --check when the committed tileset matches its script", async () => {
    // Arrange
    const out = join(root, "check-clean");
    await run(["sample_tileset", "--out", out], () => undefined, tilesetDirs(FIXTURES_DIR, out));

    // Act
    const code = await run(["sample_tileset", "--check", "--out", out], () => undefined, tilesetDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(0);
  });

  it("should flag the tileset sheet as out of date when its bytes differ from the script", async () => {
    // Arrange
    const out = join(root, "check-stale");
    await run(["sample_tileset", "--out", out], () => undefined, tilesetDirs(FIXTURES_DIR, out));
    const sheet = join(out, "sample_tileset", "sample_tileset_hi8bit.png");
    writeFileSync(sheet, Buffer.concat([readFileSync(sheet), Buffer.from([0])]));
    const lines: string[] = [];

    // Act
    const code = await run(["sample_tileset", "--check", "--out", out], (line) => lines.push(line), tilesetDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(1);
    expect(lines.some((line) => line.includes("out of date") && line.includes("sample_tileset_hi8bit.png"))).toBe(true);
  });

  it("should compile every tileset script when --all is given", async () => {
    // Arrange
    const tilesets = join(root, "all-tilesets");
    mkdirSync(tilesets, { recursive: true });
    const importPath = relative(tilesets, FIXTURE_SCRIPT).replace(/\\/g, "/");
    writeFileSync(join(tilesets, "sample_tileset.ts"), `export { default } from "${importPath}";\n`);
    const out = join(root, "all");

    // Act
    const code = await run(["--all", "--out", out], () => undefined, {
      ...tilesetDirs(tilesets, out),
      enemies: emptyFolder("no-enemies"),
      heroes: emptyFolder("no-heroes"),
    });

    // Assert
    expect(code).toBe(0);
    expect(existsSync(join(out, "sample_tileset", "sample_tileset_hi16bit.png"))).toBe(true);
  });

  it("should write 4x previews and the tiling demo when --preview is given", async () => {
    // Arrange
    const out = join(root, "preview-out");
    const previews = join(root, "previews");

    // Act
    await run(["sample_tileset", "--out", out, "--preview", previews], () => undefined, tilesetDirs(FIXTURES_DIR, out));
    const demo = decodePngBuffer(readFileSync(join(previews, "sample_tileset_tiling_demo.png")));

    // Assert
    expect([demo.width, demo.height]).toEqual([672, 736]);
    expect(existsSync(join(previews, "sample_tileset_hi8bit_x4.png"))).toBe(true);
  });
});

describe("committed tilesets", () => {
  it("should match the committed assets when every script in tilesets/ is compiled", async () => {
    // Arrange
    const ids = listTilesetIds();

    // Act
    const stale: string[] = [];
    for (const id of ids) {
      const code = await run([id, "--check"], (line) => stale.push(line), DEFAULT_DIRS);
      if (code !== 0) stale.push(id);
    }

    // Assert
    expect(stale).toEqual([]);
  });
});
