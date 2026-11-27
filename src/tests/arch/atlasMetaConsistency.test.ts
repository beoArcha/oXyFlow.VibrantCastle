import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { AssetError, ErrorCode, LayerBoundaryViolationError } from "@lib/errors";

/**
 * ARCHITECTURAL TEST SUITE: Atlas Meta vs Image Consistency
 *
 * Verifies every `*_meta.json` under `src/assets`:
 * 1. `columns * cellWidth` and `rows * cellHeight` match the referenced PNG (IHDR bytes 16-23)
 *    or SVG (`width` / `height` attributes) dimensions.
 * 2. Every animation has `row < rows` and `startCol + frames <= columns` (for grid-sliced tracks).
 * 3. Any explicit `frameRects` or `slicing.tracks` stay within the referenced image bounds.
 */

interface ImageSize {
  width: number;
  height: number;
}

interface DimensionTolerance {
  dx: number;
  dy: number;
  reason: string;
}

/**
 * Explicit integer-rounding tolerances for sheets whose image pixel dimensions are not exact
 * multiples of their grid column/row counts.
 */
const ROUNDING_TOLERANCES: Record<string, DimensionTolerance> = {
  "characters/aurelia/aurelia_meta.json:low": { dx: 3, dy: 5, reason: "687x573 / 12x8 integer cell rounding (57x71)" },
  "characters/aurelia/aurelia_meta.json:mid": { dx: 6, dy: 1, reason: "1374x1145 / 12x8 integer cell rounding (114x143)" },
  "characters/aurelia/aurelia_meta.json:high": { dx: 6, dy: 1, reason: "1374x1145 / 12x8 integer cell rounding (114x143)" },
  "characters/aurelia/aurelia_packed_meta.json:low": { dx: 0, dy: 3, reason: "744x573 / 12x8 integer cell rounding (62x72)" },
  "characters/aurelia/aurelia_packed_meta.json:mid": { dx: 0, dy: 1, reason: "1488x1145 / 12x8 integer cell rounding (124x143)" },
  "characters/aurelia/aurelia_packed_meta.json:high": { dx: 0, dy: 1, reason: "1488x1145 / 12x8 integer cell rounding (124x143)" },
  "characters/aurelia/aurelia_portraits_meta.json:atlas": { dx: 0, dy: 1, reason: "1175x1339 / 5x5 integer cell rounding (235x268)" },
  "characters/valen/valen_meta.json:mid": { dx: 4, dy: 3, reason: "1024x683 / 12x8 integer cell rounding (85x85)" },
  "characters/valen/valen_portraits_meta.json:atlas": { dx: 1, dy: 4, reason: "1161x1354 / 5x5 integer cell rounding (232x270)" },
  "enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json:atlas": { dx: 2, dy: 0, reason: "1374x1145 / 7x5 integer cell rounding (196x229)" },
  "enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json:high": { dx: 2, dy: 0, reason: "1374x1145 / 7x5 integer cell rounding (196x229)" },
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPngSize(filePath: string): ImageSize {
  const buf = fs.readFileSync(filePath);
  expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function readSvgSize(filePath: string): ImageSize {
  const text = fs.readFileSync(filePath, "utf-8");
  const svgTag = text.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const wMatch = svgTag.match(/\bwidth\s*=\s*["'](\d+(?:\.\d+)?)/i);
  const hMatch = svgTag.match(/\bheight\s*=\s*["'](\d+(?:\.\d+)?)/i);
  if (!wMatch || !hMatch) {
    throw new AssetError(`Missing width/height attributes in SVG: ${filePath}`, ErrorCode.ASSET_CORRUPTED);
  }
  return {
    width: Math.round(Number(wMatch[1])),
    height: Math.round(Number(hMatch[1])),
  };
}

function readImageSize(filePath: string): ImageSize {
  return filePath.toLowerCase().endsWith(".svg") ? readSvgSize(filePath) : readPngSize(filePath);
}

function findMetaFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMetaFiles(full));
    } else if (entry.isFile() && entry.name.endsWith("_meta.json") && !entry.name.endsWith("_parallax_meta.json")) {
      results.push(full);
    }
  }
  return results.sort();
}

function assertSizeMatches(
  relMeta: string,
  tag: string,
  columns: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  imgSize: ImageSize
): void {
  const tol = ROUNDING_TOLERANCES[`${relMeta}:${tag}`] ?? { dx: 0, dy: 0, reason: "exact" };
  const diffX = Math.abs(columns * cellWidth - imgSize.width);
  const diffY = Math.abs(rows * cellHeight - imgSize.height);
  if (diffX > tol.dx) {
    throw new LayerBoundaryViolationError(
      `${relMeta} [${tag}]: ${columns}*${cellWidth}=${columns * cellWidth} vs image width ${imgSize.width} (tol ${tol.dx})`,
      [{ relMeta, tag, expected: columns * cellWidth, actual: imgSize.width }]
    );
  }
  if (diffY > tol.dy) {
    throw new LayerBoundaryViolationError(
      `${relMeta} [${tag}]: ${rows}*${cellHeight}=${rows * cellHeight} vs image height ${imgSize.height} (tol ${tol.dy})`,
      [{ relMeta, tag, expected: rows * cellHeight, actual: imgSize.height }]
    );
  }
  expect(diffX).toBeLessThanOrEqual(tol.dx);
  expect(diffY).toBeLessThanOrEqual(tol.dy);
}

describe("Architectural Rule: Atlas Meta & Image Consistency", () => {
  const assetsDir = path.join(process.cwd(), "src", "assets");
  const metaFiles = findMetaFiles(assetsDir);

  it("discovers all *_meta.json files under src/assets", () => {
    expect(metaFiles.length).toBeGreaterThan(0);
  });

  for (const metaPath of metaFiles) {
    const relMeta = path.relative(assetsDir, metaPath).replace(/\\/g, "/");
    const dir = path.dirname(metaPath);

    it(`validates dimensions and animation bounds for ${relMeta}`, () => {
      const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as Record<string, any>;
      const variants = (raw.variants ?? {}) as Record<string, Record<string, any>>;

      // Prop metadata (frameWidth/frameHeight on variant, no atlas grid)
      if (!raw.atlas && variants.mid?.file && variants.mid?.frameWidth && variants.mid?.frameHeight) {
        const imgPath = path.join(dir, variants.mid.file);
        expect(fs.existsSync(imgPath)).toBe(true);
        const imgSize = readImageSize(imgPath);
        const fw = Number(variants.mid.frameWidth);
        const fh = Number(variants.mid.frameHeight);
        expect(imgSize.width % fw).toBe(0);
        expect(imgSize.height % fh).toBe(0);
        const cols = imgSize.width / fw;
        const anims = (raw.animations ?? {}) as Record<string, Record<string, any>>;
        for (const anim of Object.values(anims)) {
          expect(Number(anim.frames ?? 1)).toBeLessThanOrEqual(cols);
        }
        return;
      }

      // Tileset metadata (top-level columns/rows, per-variant square tile size, and tiles map)
      if (!raw.atlas && !raw.grid && raw.tilesetId && raw.tiles) {
        const columns = Number(raw.columns);
        const rows = Number(raw.rows);
        expect(columns).toBeGreaterThan(0);
        expect(rows).toBeGreaterThan(0);

        const variantEntries = Object.entries(variants);
        expect(variantEntries.length).toBeGreaterThan(0);
        for (const [tier, v] of variantEntries) {
          expect(typeof v.file).toBe("string");
          const tile = Number(v.tile);
          expect(tile).toBeGreaterThan(0);
          const imgPath = path.join(dir, v.file);
          expect(fs.existsSync(imgPath)).toBe(true);
          const size = readImageSize(imgPath);
          assertSizeMatches(relMeta, tier, columns, rows, tile, tile, size);
        }

        const tiles = raw.tiles as Record<string, { col?: number; row?: number }>;
        expect(Object.keys(tiles).length).toBeGreaterThan(0);
        for (const tile of Object.values(tiles)) {
          const col = Number(tile.col);
          const row = Number(tile.row);
          expect(col).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThan(columns);
          expect(row).toBeGreaterThanOrEqual(0);
          expect(row).toBeLessThan(rows);
        }
        return;
      }

      const atlas = raw.atlas ?? raw.grid ?? {};
      const columns = Number(atlas.columns);
      const rows = Number(atlas.rows);
      expect(columns).toBeGreaterThan(0);
      expect(rows).toBeGreaterThan(0);

      const checkedImages: Array<{ tag: string; path: string; size: ImageSize }> = [];
      const baseName = path.basename(metaPath, "_meta.json");
      const isPacked = baseName.endsWith("_packed");
      const entityStem = isPacked ? baseName.slice(0, -"_packed".length) : baseName;

      // 1. Explicit atlas.image reference (portraits, structures)
      if (typeof atlas.image === "string") {
        const imgPath = path.join(dir, atlas.image);
        expect(fs.existsSync(imgPath)).toBe(true);
        const size = readImageSize(imgPath);
        checkedImages.push({ tag: "atlas", path: imgPath, size });
        assertSizeMatches(relMeta, "atlas", columns, rows, Number(atlas.cellWidth), Number(atlas.cellHeight), size);
      }

      // 2. Variant-level explicit files or tier-named sheets
      for (const tier of ["low", "mid", "high"] as const) {
        const v = variants[tier];
        if (!v) continue;

        let candidateFile: string | null = typeof v.file === "string" ? v.file : null;
        if (!candidateFile && !atlas.image) {
          const candidates = isPacked
            ? [`${entityStem}_level_1_${tier}_packed.png`, `${entityStem}_packed_${tier}.png`]
            : [`${entityStem}_level_1_${tier}.png`, `${entityStem}_${tier}.png`];
          candidateFile = candidates.find((f) => fs.existsSync(path.join(dir, f))) ?? null;
        }

        if (candidateFile) {
          const imgPath = path.join(dir, candidateFile);
          expect(fs.existsSync(imgPath)).toBe(true);
          const size = readImageSize(imgPath);
          checkedImages.push({ tag: tier, path: imgPath, size });
          const cw = Number(v.cellWidth ?? atlas.cellWidth);
          const ch = Number(v.cellHeight ?? atlas.cellHeight);
          assertSizeMatches(relMeta, tier, columns, rows, cw, ch, size);
        }
      }

      // 3. Fallback if neither atlas.image nor variant files resolved
      if (checkedImages.length === 0) {
        const fallbackCandidates = isPacked
          ? [`${entityStem}_packed_high.png`, `${entityStem}_level_1_high_packed.png`]
          : [`${entityStem}_high.png`, `${entityStem}_level_1_high.png`];
        const found = fallbackCandidates.find((f) => fs.existsSync(path.join(dir, f)));
        expect(found).toBeDefined();
        const imgPath = path.join(dir, found!);
        const size = readImageSize(imgPath);
        checkedImages.push({ tag: "atlas", path: imgPath, size });
        assertSizeMatches(relMeta, "atlas", columns, rows, Number(atlas.cellWidth), Number(atlas.cellHeight), size);
      }

      // 4. Validate animation rows and column bounds
      const anims = (raw.animations ?? raw.grid?.animations ?? {}) as Record<string, Record<string, any>>;
      const isFreeform = raw.slicing?.method === "freeform_rects";
      const slicingTracks = (raw.slicing?.tracks ?? {}) as Record<string, Array<{ x: number; y: number; w: number; h: number }>>;
      const highSize = checkedImages[checkedImages.length - 1].size;

      for (const [animName, anim] of Object.entries(anims)) {
        const row = Number(anim.row ?? 0);
        const startCol = Number(anim.startCol ?? 0);
        const frames = Number(anim.frames ?? 1);
        expect(row).toBeLessThan(rows);

        const freeformRects = isFreeform ? slicingTracks[animName] : undefined;
        if (freeformRects && freeformRects.length > 0) {
          expect(freeformRects.length).toBe(frames);
          for (const rect of freeformRects) {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.w).toBeGreaterThan(0);
            expect(rect.h).toBeGreaterThan(0);
            expect(rect.x + rect.w).toBeLessThanOrEqual(highSize.width);
            expect(rect.y + rect.h).toBeLessThanOrEqual(highSize.height);
          }
        } else {
          expect(startCol + frames).toBeLessThanOrEqual(columns);
        }
      }

      // 5. Validate packed frameRects stay within the high sheet bounds
      if (raw.frameRects && typeof raw.frameRects === "object") {
        for (const rect of Object.values(raw.frameRects as Record<string, Record<string, number>>)) {
          const w = rect.width ?? rect.w ?? 0;
          const h = rect.height ?? rect.h ?? 0;
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.y).toBeGreaterThanOrEqual(0);
          expect(w).toBeGreaterThan(0);
          expect(h).toBeGreaterThan(0);
          expect(rect.x + w).toBeLessThanOrEqual(highSize.width);
          expect(rect.y + h).toBeLessThanOrEqual(highSize.height);
        }
      }
    });
  }
});
