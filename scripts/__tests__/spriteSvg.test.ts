import { describe, expect, it } from "bun:test";
import { parseColor, snap12, snap565, toHex } from "../sprites/colors";
import { compileEnemySprite } from "../sprites/compileSprite";
import { aSprite } from "../sprites/__fixtures__/minimalSprite";
import { TRANSPARENT } from "../sprites/pixelCanvas";
import type { SheetImage } from "../sprites/render";
import { sheetToSvg } from "../sprites/svgWriter";

function tinySheet(rows: number[][]): SheetImage {
  const height = rows.length;
  const width = rows[0].length;
  return { tier: "hi8bit", cell: 2, cellHeight: 2, columns: 2, rows: 1, width, height, pixels: Int32Array.from(rows.flat()) };
}

describe("sprite colour snapping", () => {
  it("should write 12-bit colours as #rgb when snapping for the hi-8bit tier", () => {
    // Arrange
    const input = parseColor("#808080");

    // Act
    const hex = toHex(snap12(input), "hi8bit");

    // Assert
    expect(hex).toBe("#888");
  });

  it("should write RGB565 colours as #rrggbb when snapping for the hi-16bit tier", () => {
    // Arrange
    const input = parseColor("#808080");

    // Act
    const hex = toHex(snap565(input), "hi16bit");

    // Assert
    expect(hex).toBe("#848284");
  });

  it("should keep pure white white when snapping to either depth", () => {
    // Arrange
    const white = parseColor("#fff");

    // Act
    const hexes = [toHex(snap12(white), "hi8bit"), toHex(snap565(white), "hi16bit")];

    // Assert
    expect(hexes).toEqual(["#fff", "#ffffff"]);
  });
});

describe("sprite SVG writer", () => {
  it("should merge horizontal then vertical runs into one rectangle per colour when pixels form a block", () => {
    // Arrange
    const red = 0xff0000;
    const blue = 0x0000ff;
    const sheet = tinySheet([
      [red, red, TRANSPARENT, blue],
      [red, red, TRANSPARENT, blue],
    ]);

    // Act
    const svg = sheetToSvg(sheet);

    // Assert
    expect(svg).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 2" width="4" height="2" shape-rendering="crispEdges">',
        '<path fill="#00f" d="M3 0h1v2h-1z"/>',
        '<path fill="#f00" d="M0 0h2v2h-2z"/>',
        "</svg>",
        "",
      ].join("\n"),
    );
  });

  it("should keep separate sub-paths when runs differ in width between rows", () => {
    // Arrange
    const red = 0xff0000;
    const sheet = tinySheet([
      [red, red, red],
      [red, TRANSPARENT, TRANSPARENT],
    ]);

    // Act
    const svg = sheetToSvg(sheet);

    // Assert
    expect(svg).toContain('d="M0 0h3v1h-3zM0 1h1v1h-1z"');
  });

  it("should emit identical output when the same definition is compiled twice", () => {
    // Arrange
    const def = aSprite();

    // Act
    const first = compileEnemySprite(def);
    const second = compileEnemySprite(def);

    // Assert
    expect([second.hi8bitSvg, second.hi16bitSvg, second.metaJson]).toEqual([first.hi8bitSvg, first.hi16bitSvg, first.metaJson]);
  });

  it("should use LF newlines and no comments or extra elements when serialising", () => {
    // Arrange
    const compiled = compileEnemySprite(aSprite());

    // Act
    const body = compiled.hi16bitSvg;

    // Assert
    expect(body).not.toContain("\r");
    expect(body).not.toContain("<!--");
    expect(body).not.toContain("<rect");
    expect(body).not.toContain("<g");
  });
});
