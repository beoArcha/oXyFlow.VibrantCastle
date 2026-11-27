import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { WorldId } from "../../src/game/locations/types";
import type { ParallaxFileTier, WorldParallaxMeta } from "../../src/game/parallax/meta";
import { drawText } from "../atlas/bitmapFont";
import { decodePngBuffer, encodePngBuffer, type RgbaImage } from "../lib/png";
import { WORLD_IDS } from "./buildMeta";
import { downscaleArea } from "./imageOps";

const DEFAULT_PARALLAX_ROOT = fileURLToPath(new URL("../../src/assets/parallax", import.meta.url));
const TIERS: readonly ParallaxFileTier[] = ["hi8bit", "hi16bit", "high"];
const THUMB_W = 360;
const THUMB_H = 120;
const LABEL_COL_W = 230;
const HEADER_H = 34;
const PAD = 10;
const CHECKER_SIZE = 12;

function fillCheckerboard(canvas: RgbaImage, x0: number, y0: number, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dark = ((Math.floor(x / CHECKER_SIZE) + Math.floor(y / CHECKER_SIZE)) & 1) === 0;
      const v = dark ? 34 : 46;
      const idx = ((y0 + y) * canvas.width + (x0 + x)) * 4;
      canvas.data[idx] = v;
      canvas.data[idx + 1] = v;
      canvas.data[idx + 2] = v + 4;
      canvas.data[idx + 3] = 255;
    }
  }
}

function compositeThumb(canvas: RgbaImage, img: RgbaImage, x0: number, y0: number): void {
  const scale = Math.min(THUMB_W / img.width, THUMB_H / img.height);
  const drawW = Math.max(1, Math.round(img.width * scale));
  const drawH = Math.max(1, Math.round(img.height * scale));
  const thumb = downscaleArea(img, drawW, drawH, false);
  const ox = x0 + Math.floor((THUMB_W - drawW) / 2);
  const oy = y0 + Math.floor((THUMB_H - drawH) / 2);

  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      const s = (y * drawW + x) * 4;
      const a = thumb.data[s + 3] / 255;
      if (a <= 0) continue;
      const d = ((oy + y) * canvas.width + (ox + x)) * 4;
      canvas.data[d] = Math.round(thumb.data[s] * a + canvas.data[d] * (1 - a));
      canvas.data[d + 1] = Math.round(thumb.data[s + 1] * a + canvas.data[d + 1] * (1 - a));
      canvas.data[d + 2] = Math.round(thumb.data[s + 2] * a + canvas.data[d + 2] * (1 - a));
    }
  }
}

function fillSwatch(canvas: RgbaImage, hex: string, x0: number, y0: number): void {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 48;
  const g = parseInt(clean.slice(2, 4), 16) || 48;
  const b = parseInt(clean.slice(4, 6), 16) || 48;
  for (let y = 8; y < THUMB_H - 8; y++) {
    for (let x = 8; x < THUMB_W - 8; x++) {
      const d = ((y0 + y) * canvas.width + (x0 + x)) * 4;
      canvas.data[d] = r;
      canvas.data[d + 1] = g;
      canvas.data[d + 2] = b;
      canvas.data[d + 3] = 255;
    }
  }
}

interface SheetRow {
  readonly label: string;
  readonly sourceWorld: string;
  readonly sourceSlot: string;
  readonly borrowed: boolean;
}

function collectSheetRows(worldId: WorldId, meta: WorldParallaxMeta): SheetRow[] {
  const rows: SheetRow[] = [];
  for (const [slot, layer] of Object.entries(meta.layers)) {
    const [srcWorld, srcSlot] = layer.source ? layer.source.split(":") : [worldId, slot];
    rows.push({
      label: slot.replace(/_/g, " "),
      sourceWorld: srcWorld,
      sourceSlot: srcSlot,
      borrowed: Boolean(layer.source),
    });
    if (layer.zones) {
      for (const zoneKind of Object.keys(layer.zones).sort()) {
        rows.push({
          label: `${slot} ${zoneKind}`.replace(/_/g, " "),
          sourceWorld: worldId,
          sourceSlot: `${slot}_zone_${zoneKind}`,
          borrowed: false,
        });
      }
    }
  }
  return rows;
}

/**
 * Renders one contact sheet PNG per world (far, variations, and zone variants across all 3 tiers).
 */
export function generateWorldContactSheets(
  outDir: string = join(tmpdir(), "vc-parallax-sheets"),
  worlds: readonly WorldId[] = WORLD_IDS,
  parallaxRoot: string = DEFAULT_PARALLAX_ROOT
): string[] {
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];

  for (const worldId of worlds) {
    const meta = JSON.parse(
      readFileSync(join(parallaxRoot, worldId, `${worldId}_parallax_meta.json`), "utf-8")
    ) as WorldParallaxMeta;
    const rows = collectSheetRows(worldId, meta);
    const width = LABEL_COL_W + TIERS.length * (THUMB_W + PAD) + PAD;
    const height = HEADER_H + rows.length * (THUMB_H + PAD) + PAD;
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 18;
      data[i + 1] = 20;
      data[i + 2] = 26;
      data[i + 3] = 255;
    }
    const canvas: RgbaImage = { width, height, data };

    drawText(canvas, worldId.replace(/_/g, " "), PAD, 10, 2, [245, 190, 105]);
    TIERS.forEach((tier, col) => {
      const tx = LABEL_COL_W + col * (THUMB_W + PAD);
      drawText(canvas, tier, tx, 10, 2, [210, 220, 235]);
    });

    rows.forEach((row, r) => {
      const ry = HEADER_H + r * (THUMB_H + PAD);
      drawText(canvas, row.label, PAD, ry + 16, 2, [230, 230, 235]);
      if (row.borrowed) {
        drawText(canvas, `src ${row.sourceWorld.replace(/_/g, " ")}`, PAD, ry + 38, 1, [160, 175, 195]);
      }

      TIERS.forEach((tier, col) => {
        const cx = LABEL_COL_W + col * (THUMB_W + PAD);
        fillCheckerboard(canvas, cx, ry, THUMB_W, THUMB_H);

        const pngPath = join(parallaxRoot, row.sourceWorld, `${row.sourceWorld}_${row.sourceSlot}_${tier}.png`);
        const jpgPath = join(parallaxRoot, row.sourceWorld, `${row.sourceWorld}_${row.sourceSlot}_${tier}.jpg`);
        const highJpgPath = join(parallaxRoot, row.sourceWorld, `${row.sourceWorld}_${row.sourceSlot}_high.jpg`);
        if (existsSync(pngPath)) {
          const img = decodePngBuffer(readFileSync(pngPath));
          compositeThumb(canvas, img, cx, ry);
          drawText(canvas, `${img.width}x${img.height}`, cx + 6, ry + THUMB_H - 14, 1, [245, 245, 245]);
        } else if (existsSync(jpgPath) || existsSync(highJpgPath)) {
          const avg = meta.generated[row.sourceSlot]?.avg ?? "#333333";
          fillSwatch(canvas, avg, cx, ry);
          drawText(canvas, existsSync(jpgPath) ? "jpg deferred" : "uses high jpg", cx + 10, ry + 12, 2, [235, 200, 140]);
        } else {
          drawText(canvas, "missing", cx + 10, ry + 12, 2, [220, 90, 90]);
        }
      });
    });

    const outPath = join(outDir, `${worldId}_contact_sheet.png`);
    writeFileSync(outPath, encodePngBuffer(canvas, { colorType: 2, filter: "paeth", compressionLevel: 6 }));
    written.push(outPath);
  }

  return written;
}

if (import.meta.main) {
  const paths = generateWorldContactSheets();
  for (const p of paths) console.log(p);
}
