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
  listPropIds,
  loadSprite,
  PROPS_DIR,
  run,
  TILESETS_DIR,
  type SpriteDirs,
} from "../sprites/cli";

const FIXTURES_DIR = fileURLToPath(new URL("../sprites/__fixtures__", import.meta.url));
const FIXTURE_SCRIPT = join(FIXTURES_DIR, "sample_prop.ts");
const root = mkdtempSync(join(tmpdir(), "prop-cli-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

const propDirs = (props: string, out: string): SpriteDirs => ({
  enemies: ENEMIES_DIR,
  heroes: HEROES_DIR,
  tilesets: TILESETS_DIR,
  props,
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

describe("prop CLI id resolution", () => {
  it("should resolve a prop id from the props folder when it is not an enemy, hero or tileset", async () => {
    // Arrange
    const dirs = propDirs(FIXTURES_DIR, root);

    // Act
    const def = await loadSprite("sample_prop", dirs);

    // Assert
    expect(def.id).toBe("sample_prop");
  });

  it("should list prop scripts without the props README", () => {
    // Arrange & Act
    const ids = listPropIds(PROPS_DIR);

    // Assert
    expect(ids).not.toContain("README");
  });
});

describe("prop CLI compile and check", () => {
  it("should write the tier sheets and prop meta to the prop output folder when no --out is given", async () => {
    // Arrange
    const out = join(root, "default-out");

    // Act
    const code = await run(["sample_prop"], () => undefined, propDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(0);
    expect(existsSync(join(out, "sample_prop", "sample_prop_hi8bit.png"))).toBe(true);
    expect(existsSync(join(out, "sample_prop", "sample_prop_hi16bit.png"))).toBe(true);
    expect(existsSync(join(out, "sample_prop", "sample_prop_prop_meta.json"))).toBe(true);
  });

  it("should pass --check when the committed prop matches its script", async () => {
    // Arrange
    const out = join(root, "check-clean");
    await run(["sample_prop", "--out", out], () => undefined, propDirs(FIXTURES_DIR, out));

    // Act
    const code = await run(["sample_prop", "--check", "--out", out], () => undefined, propDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(0);
  });

  it("should flag the prop sheet as out of date when its bytes differ from the script", async () => {
    // Arrange
    const out = join(root, "check-stale");
    await run(["sample_prop", "--out", out], () => undefined, propDirs(FIXTURES_DIR, out));
    const sheet = join(out, "sample_prop", "sample_prop_hi8bit.png");
    writeFileSync(sheet, Buffer.concat([readFileSync(sheet), Buffer.from([0])]));
    const lines: string[] = [];

    // Act
    const code = await run(["sample_prop", "--check", "--out", out], (line) => lines.push(line), propDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(1);
    expect(lines.some((line) => line.includes("out of date") && line.includes("sample_prop_hi8bit.png"))).toBe(true);
  });

  it("should flag the prop meta as missing when it was never compiled", async () => {
    // Arrange
    const out = join(root, "check-missing");
    await run(["sample_prop", "--out", out], () => undefined, propDirs(FIXTURES_DIR, out));
    rmSync(join(out, "sample_prop", "sample_prop_prop_meta.json"));
    const lines: string[] = [];

    // Act
    const code = await run(["sample_prop", "--check", "--out", out], (line) => lines.push(line), propDirs(FIXTURES_DIR, out));

    // Assert
    expect(code).toBe(1);
    expect(lines.some((line) => line.includes("missing:") && line.includes("sample_prop_prop_meta.json"))).toBe(true);
  });

  it("should compile every prop script when --all is given", async () => {
    // Arrange
    const props = join(root, "all-props");
    mkdirSync(props, { recursive: true });
    const importPath = relative(props, FIXTURE_SCRIPT).replace(/\\/g, "/");
    writeFileSync(join(props, "sample_prop.ts"), `export { default } from "${importPath}";\n`);
    const out = join(root, "all");

    // Act
    const code = await run(["--all", "--out", out], () => undefined, {
      ...propDirs(props, out),
      enemies: emptyFolder("no-enemies"),
      heroes: emptyFolder("no-heroes"),
      tilesets: emptyFolder("no-tilesets"),
    });

    // Assert
    expect(code).toBe(0);
    expect(existsSync(join(out, "sample_prop", "sample_prop_prop_meta.json"))).toBe(true);
  });

  it("should write 4x sheets per tier and an animated strip when --preview is given", async () => {
    // Arrange
    const out = join(root, "preview-out");
    const previews = join(root, "previews");

    // Act
    await run(["sample_prop", "--out", out, "--preview", previews], () => undefined, propDirs(FIXTURES_DIR, out));
    const low = decodePngBuffer(readFileSync(join(previews, "sample_prop_hi8bit_x4.png")));
    const mid = decodePngBuffer(readFileSync(join(previews, "sample_prop_hi16bit_x4.png")));
    const strip = decodePngBuffer(readFileSync(join(previews, "sample_prop_strip.png")));

    // Assert
    expect([low.width, low.height]).toEqual([3 * 12 * 4, 24 * 4]);
    expect([mid.width, mid.height]).toEqual([3 * 24 * 4, 48 * 4]);
    // 3 frames of (24 + 2 * 72) x (48 + 2 * 72) world units, both tiers stacked, scaled 3x to fit 1600 px.
    expect([strip.width, strip.height]).toEqual([1512, 1152]);
  });
});

describe("committed props", () => {
  it("should match the committed assets when every script in props/ is compiled", async () => {
    // Arrange
    const ids = listPropIds();

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
