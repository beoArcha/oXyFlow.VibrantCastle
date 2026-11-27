import { encodePngBuffer } from "../lib/png";
import { spriteError } from "./errors";
import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";
import { tileLayout, type TileCell } from "./tilesetLayout";
import { blockBaseNames, chooseTile, stripBaseNames } from "./tilingRules";
import type { TilesetKind, TilesetSpriteDefinition } from "./tilesetTypes";

const STRIP_WIDTH = 10;
const BLOCK_COLUMNS = 6;
const BLOCK_ROWS = 4;

/** Every world tile is shown at this size, so the hi-8bit and hi-16bit panels line up. */
const DISPLAY_TILE = 64;
const MARGIN = 16;
const PANEL_GAP = 32;
const ROW_GAP = 16;
const BACKGROUND = 0x3a3a3a;

interface DemoLine {
  top: number;
  baseNames: string[];
}

function demoLines(kind: TilesetKind): DemoLine[] {
  const strip: DemoLine = { top: 0, baseNames: stripBaseNames(STRIP_WIDTH) };
  if (kind === "oneway") return [strip];
  const blockTop = DISPLAY_TILE + ROW_GAP;
  const block = blockBaseNames(BLOCK_COLUMNS, BLOCK_ROWS).map((baseNames, row) => ({
    top: blockTop + row * DISPLAY_TILE,
    baseNames,
  }));
  return [strip, ...block];
}

function paintTile(data: Uint8Array, width: number, sheet: SheetImage, cell: TileCell, x0: number, y0: number): void {
  const tile = sheet.cell;
  const scale = DISPLAY_TILE / tile;
  for (let y = 0; y < DISPLAY_TILE; y++) {
    for (let x = 0; x < DISPLAY_TILE; x++) {
      const rgb = sheet.pixels[(cell.row * tile + Math.floor(y / scale)) * sheet.width + cell.col * tile + Math.floor(x / scale)];
      if (rgb === TRANSPARENT) continue;
      data.set([(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff, 0xff], ((y0 + y) * width + x0 + x) * 4);
    }
  }
}

function fillBackground(data: Uint8Array): void {
  for (let i = 0; i < data.length; i += 4) data.set([(BACKGROUND >> 16) & 0xff, (BACKGROUND >> 8) & 0xff, BACKGROUND & 0xff, 0xff], i);
}

/**
 * Two panels, hi-8bit above hi-16bit: a 10-tile ledge strip and, for solid tilesets, a 6x4 block
 * tiled with the runtime rules. Transparent pixels show the background, so ledge gaps are visible.
 */
export function renderTilingDemo(
  def: TilesetSpriteDefinition,
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage },
): Uint8Array {
  const lines = demoLines(def.kind);
  const panelHeight = Math.max(...lines.map((line) => line.top)) + DISPLAY_TILE;
  const width = 2 * MARGIN + STRIP_WIDTH * DISPLAY_TILE;
  const height = 2 * MARGIN + 2 * panelHeight + PANEL_GAP;
  const data = new Uint8Array(width * height * 4);
  fillBackground(data);
  const cells = new Map(tileLayout(def.tiles).cells.map((cell) => [cell.name, cell] as const));
  [sheets.hi8bit, sheets.hi16bit].forEach((sheet, panel) => {
    const panelTop = MARGIN + panel * (panelHeight + PANEL_GAP);
    lines.forEach((line, row) => {
      line.baseNames.forEach((base, col) => {
        const name = chooseTile(def.tiles, base, col, row, 0, 0);
        const cell = cells.get(name);
        if (!cell) throw spriteError(`Tiling demo of "${def.id}" needs tile "${name}".`, { id: def.id, tile: name });
        paintTile(data, width, sheet, cell, MARGIN + col * DISPLAY_TILE, panelTop + line.top);
      });
    });
  });
  return encodePngBuffer({ width, height, data });
}
