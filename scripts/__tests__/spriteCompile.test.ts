import { describe, expect, it } from "bun:test";
import { defaultMetaParser } from "../../src/game/engine/meta/MetaParser";
import { DEFAULT_OUT_DIR, findStaleFiles, listEnemyIds, loadDefinition, outputFiles, parseArgs } from "../sprites/cli";
import { compileEnemySprite } from "../sprites/compileSprite";
import { renderPreviewPng } from "../sprites/previewPng";
import { aSprite } from "../sprites/__fixtures__/minimalSprite";
import sampleGolem from "../sprites/__fixtures__/sample_golem";

describe("sample golem compilation", () => {
  it("should produce SVG roots that match the sheet grid when compiled", () => {
    // Arrange
    const columns = 4;
    const rows = 3;

    // Act
    const compiled = compileEnemySprite(sampleGolem);

    // Assert
    const root = (cell: number) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns * cell} ${rows * cell}" width="${columns * cell}" height="${rows * cell}" shape-rendering="crispEdges">\n`;
    expect(compiled.hi8bitSvg.startsWith(root(48))).toBe(true);
    expect(compiled.hi16bitSvg.startsWith(root(96))).toBe(true);
  });

  it("should write one path per colour and no other elements when serialised", () => {
    // Arrange
    const compiled = compileEnemySprite(sampleGolem);

    // Act
    const lines = compiled.hi16bitSvg.trim().split("\n").slice(1, -1);

    // Assert
    expect(lines.length).toBeGreaterThan(5);
    expect(lines.every((line) => /^<path fill="#[0-9a-f]{6}" d="[^"]+"\/>$/.test(line))).toBe(true);
  });

  it("should parse the meta with the creature parser when compiled", () => {
    // Arrange
    const raw: unknown = JSON.parse(compileEnemySprite(sampleGolem).metaJson);

    // Act
    const parsed = defaultMetaParser.parseCreature(raw);

    // Assert
    expect(parsed.atlas.columns).toBe(4);
    expect(parsed.atlas.rows).toBe(3);
    const tracks = Object.keys(parsed.animations.animations ?? {});
    expect(["idle", "move", "hit"].every((name) => tracks.includes(name))).toBe(true);
    expect(parsed.animations.animations?.hit?.row).toBe(2);
  });

  it("should expose body box, feet origin and file names in the meta when compiled", () => {
    // Arrange
    const meta = JSON.parse(compileEnemySprite(sampleGolem).metaJson);

    // Act
    const { bodyBox, origin } = meta.layout;

    // Assert
    expect(bodyBox.h).toBeGreaterThan(0.55);
    expect(origin.type).toBe("feet");
    expect(origin.normalized.y).toBe(1);
    expect(origin.normalized.x).toBeCloseTo(bodyBox.x + bodyBox.w / 2, 3);
    expect(meta.variants.low.file).toBe("sample_golem_hi8bit.svg");
    expect(meta.variants.mid.file).toBe("sample_golem_hi16bit.svg");
    expect(meta.states.walk).toEqual({ animation: "move" });
  });

  it("should compile without warnings when using the worked example", () => {
    // Arrange & Act
    const { warnings } = compileEnemySprite(sampleGolem);

    // Assert
    expect(warnings).toEqual([]);
  });
});

describe("sprite meta variants", () => {
  it("should add attack and death rows in canonical order when they are defined", () => {
    // Arrange
    const def = aSprite({
      animations: {
        ...aSprite().animations,
        death: { frames: 2, fps: 6, loop: false },
        attack: { frames: 3, fps: 9, loop: false },
      },
    });

    // Act
    const meta = JSON.parse(compileEnemySprite(def).metaJson);

    // Assert
    expect(meta.layout.ordering).toEqual(["idle", "move", "hit", "attack", "death"]);
    expect(meta.animations.death.row).toBe(4);
    expect(meta.atlas.columns).toBe(3);
    expect(meta.states.attack).toEqual({ animation: "attack" });
  });
});

describe("sprite preview PNG", () => {
  it("should emit a PNG signature and sheet-sized IHDR when rendering a preview", () => {
    // Arrange
    const { sheets } = compileEnemySprite(aSprite());

    // Act
    const png = renderPreviewPng(sheets.hi8bit);

    // Assert
    expect(Array.from(png.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const width = new DataView(png.buffer, png.byteOffset).getUint32(16);
    expect(width).toBe(sheets.hi8bit.width * Math.round(1000 / sheets.hi8bit.width));
  });
});

describe("sprite CLI helpers", () => {
  it("should reject the call when neither ids nor --all are given", () => {
    // Arrange & Act
    const parse = () => parseArgs(["--check"]);

    // Assert
    expect(parse).toThrow(/Usage/);
  });

  it("should collect ids and options when arguments are valid", () => {
    // Arrange & Act
    const options = parseArgs(["a", "b", "--check", "--out", "x"]);

    // Assert
    expect(options.ids).toEqual(["a", "b"]);
    expect(options.check).toBe(true);
  });

  it("should flag missing files when nothing was written yet", () => {
    // Arrange
    const compiled = compileEnemySprite(sampleGolem);
    const files = outputFiles(sampleGolem, compiled, `${DEFAULT_OUT_DIR}/__does_not_exist__`);

    // Act
    const stale = findStaleFiles(files);

    // Assert
    expect(stale).toHaveLength(3);
  });
});

describe("committed enemy sprites", () => {
  it("should match the committed assets when every script in enemies/ is compiled", async () => {
    // Arrange
    const ids = listEnemyIds();

    // Act
    const stale: string[] = [];
    for (const id of ids) {
      const def = await loadDefinition(id);
      stale.push(...findStaleFiles(outputFiles(def, compileEnemySprite(def), DEFAULT_OUT_DIR)));
    }

    // Assert
    expect(stale).toEqual([]);
  });
});
