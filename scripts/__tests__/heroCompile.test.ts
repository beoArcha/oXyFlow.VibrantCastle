import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_DIRS,
  DEFAULT_HERO_OUT_DIR,
  ENEMIES_DIR,
  loadSprite,
  outputFiles,
  run,
  type SpriteDirs,
} from "../sprites/cli";
import { compileHeroSprite } from "../sprites/compileHero";
import { renderPreviewPng } from "../sprites/previewPng";
import sampleHero from "../sprites/__fixtures__/sample_hero";

const FIXTURES_DIR = fileURLToPath(new URL("../sprites/__fixtures__", import.meta.url));

const fixtureDirs = (out: string): SpriteDirs => ({
  enemies: ENEMIES_DIR,
  heroes: FIXTURES_DIR,
  enemyOut: out,
  heroOut: out,
});

const compileFixture = () => compileHeroSprite(sampleHero, DEFAULT_HERO_OUT_DIR);

describe("sample hero compilation", () => {
  it("should compile without warnings when using the worked example", () => {
    // Arrange & Act
    const { warnings } = compileFixture();

    // Assert
    expect(warnings).toEqual([]);
  });

  it("should produce identical output when compiled twice", () => {
    // Arrange
    const first = compileFixture();

    // Act
    const second = compileFixture();

    // Assert
    expect(second.metaJson).toBe(first.metaJson);
    expect(second.hi16bitSvg).toBe(first.hi16bitSvg);
  });

  it("should size the SVG roots by the derived cell and sheet columns when compiled", () => {
    // Arrange & Act
    const compiled = compileFixture();

    // Assert
    const root = (width: number, height: number) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">\n`;
    expect(compiled.hi8bitSvg.startsWith(root(120, 160))).toBe(true);
    expect(compiled.hi16bitSvg.startsWith(root(240, 320))).toBe(true);
    expect(compiled.hi16bitSvg.includes("\r")).toBe(false);
  });

  it("should write tier files, scale and sheet size to the meta when compiled", () => {
    // Arrange
    const meta = JSON.parse(compileFixture().metaJson);

    // Act
    const { low, mid } = meta.variants;

    // Assert
    expect(low).toMatchObject({ file: "sample_hero_hi8bit.svg", cellWidth: 24, cellHeight: 32, sheetWidth: 120, sheetHeight: 160, scale: 0.5 });
    expect(mid).toMatchObject({ file: "sample_hero_hi16bit.svg", cellWidth: 48, cellHeight: 64, sheetWidth: 240, sheetHeight: 320, scale: 1 });
  });

  it("should record the grid with row, frames, fps, loop and cells when compiled", () => {
    // Arrange
    const meta = JSON.parse(compileFixture().metaJson);

    // Act
    const { grid } = meta;

    // Assert
    expect(grid.ordering).toEqual(["idle", "run", "jump", "fall", "attack"]);
    expect(grid.columns).toBe(5);
    expect(grid.rows).toBe(5);
    expect(grid.animations.attack).toEqual({ row: 4, frames: 3, fps: 8, loop: false, cells: [1, 2, 2] });
  });

  it("should place wide frames at their column offset in frameRects when compiled", () => {
    // Arrange
    const { mid } = JSON.parse(compileFixture().metaJson).variants;

    // Act
    const { attack_0, attack_1, attack_2 } = mid.frameRects;

    // Assert
    expect(attack_0.x).toBeLessThan(48);
    expect(attack_1.x).toBeGreaterThanOrEqual(48);
    expect(attack_1.x + attack_1.width).toBeGreaterThan(48 * 2);
    expect(attack_2.x).toBeGreaterThanOrEqual(48 * 3);
    expect(attack_2.y).toBeGreaterThanOrEqual(4 * 64);
  });

  it("should keep every frame rect inside its sheet and name it anim_frame when compiled", () => {
    // Arrange
    const { low } = JSON.parse(compileFixture().metaJson).variants;

    // Act
    const entries = Object.entries<{ x: number; y: number; width: number; height: number }>(low.frameRects);

    // Assert
    expect(entries.map(([key]) => key)).toEqual([
      "idle_0", "idle_1", "run_0", "run_1", "jump_0", "fall_0", "attack_0", "attack_1", "attack_2",
    ]);
    expect(entries.every(([, r]) => r.x + r.width <= low.sheetWidth && r.y + r.height <= low.sheetHeight)).toBe(true);
  });

  it("should anchor the origin at the feet below the body box centre when compiled", () => {
    // Arrange
    const { layout } = JSON.parse(compileFixture().metaJson);

    // Act
    const { origin, bodyBox } = layout;

    // Assert
    expect(origin.type).toBe("feet");
    expect(origin.normalized.y).toBe(1);
    expect(origin.normalized.x).toBeCloseTo(bodyBox.x + bodyBox.w / 2, 3);
    expect(bodyBox.h).toBeGreaterThan(0.55);
  });

  it("should render a preview PNG sized to the sheet when previewing a hero", () => {
    // Arrange
    const { sheets } = compileFixture();

    // Act
    const png = renderPreviewPng(sheets.hi16bit);

    // Assert
    const view = new DataView(png.buffer, png.byteOffset);
    const scale = Math.round(1000 / sheets.hi16bit.width);
    expect(view.getUint32(16)).toBe(sheets.hi16bit.width * scale);
    expect(view.getUint32(20)).toBe(sheets.hi16bit.height * scale);
  });
});

describe("hero sprite CLI", () => {
  it("should resolve a hero id from the hero folder when the enemy folder has no such script", async () => {
    // Arrange
    const dirs = fixtureDirs("unused");

    // Act
    const def = await loadSprite("sample_hero", dirs);

    // Assert
    expect(def.id).toBe("sample_hero");
    expect("grid" in def).toBe(true);
  });

  it("should still resolve an enemy id when heroes are supported", async () => {
    // Arrange & Act
    const def = await loadSprite("court_sentinel", DEFAULT_DIRS);

    // Assert
    expect("animations" in def).toBe(true);
  });

  it("should name both folders when the id is unknown", async () => {
    // Arrange & Act
    const load = loadSprite("nobody_at_all", DEFAULT_DIRS);

    // Assert
    await expect(load).rejects.toThrow(/nobody_at_all.*enemies.*heroes/);
  });

  it("should name the hero files in pixel_meta form when listing output files", () => {
    // Arrange
    const compiled = compileFixture();

    // Act
    const names = outputFiles(sampleHero, compiled, "out").map((file) => file.path.split(/[\\/]/).pop());

    // Assert
    expect(names).toEqual(["sample_hero_hi8bit.svg", "sample_hero_hi16bit.svg", "sample_hero_pixel_meta.json"]);
  });

  it("should report missing hero files when --check runs before anything was written", async () => {
    // Arrange
    const out = mkdtempSync(join(tmpdir(), "hero-check-"));
    const lines: string[] = [];

    // Act
    const code = await run(["sample_hero", "--check"], (line) => lines.push(line), fixtureDirs(out));
    rmSync(out, { recursive: true, force: true });

    // Assert
    expect(code).toBe(1);
    expect(lines.filter((line) => line.startsWith("sample_hero missing:"))).toHaveLength(3);
  });

  it("should pass --check after the hero was compiled to the same folder", async () => {
    // Arrange
    const out = mkdtempSync(join(tmpdir(), "hero-write-"));
    const dirs = fixtureDirs(out);
    await run(["sample_hero"], () => undefined, dirs);

    // Act
    const code = await run(["sample_hero", "--check"], () => undefined, dirs);
    rmSync(out, { recursive: true, force: true });

    // Assert
    expect(code).toBe(0);
  });
});
