import { toHex } from "./colors";
import { TRANSPARENT } from "./pixelCanvas";
import type { SheetImage } from "./render";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rowRuns(sheet: SheetImage, y: number, color: number): Rect[] {
  const runs: Rect[] = [];
  let x = 0;
  while (x < sheet.width) {
    if (sheet.pixels[y * sheet.width + x] !== color) {
      x++;
      continue;
    }
    const start = x;
    while (x < sheet.width && sheet.pixels[y * sheet.width + x] === color) x++;
    runs.push({ x: start, y, w: x - start, h: 1 });
  }
  return runs;
}

/** Merges horizontal runs first, then stacks vertically identical runs. */
export function colorRects(sheet: SheetImage, color: number): Rect[] {
  const done: Rect[] = [];
  let open: Rect[] = [];
  for (let y = 0; y < sheet.height; y++) {
    const next: Rect[] = [];
    for (const run of rowRuns(sheet, y, color)) {
      const above = open.find((r) => r.x === run.x && r.w === run.w);
      if (above) above.h++;
      next.push(above ?? run);
    }
    done.push(...open.filter((r) => !next.includes(r)));
    open = next;
  }
  done.push(...open);
  return done.sort((a, b) => a.y - b.y || a.x - b.x);
}

function pathData(rects: Rect[]): string {
  return rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join("");
}

export function sheetToSvg(sheet: SheetImage): string {
  const colors = [...new Set(sheet.pixels)].filter((rgb) => rgb !== TRANSPARENT);
  const hexes = colors.map((rgb) => ({ rgb, hex: toHex(rgb, sheet.tier) })).sort((a, b) => (a.hex < b.hex ? -1 : 1));
  const { width, height } = sheet;
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">`,
    ...hexes.map(({ rgb, hex }) => `<path fill="${hex}" d="${pathData(colorRects(sheet, rgb))}"/>`),
    "</svg>",
  ];
  return `${lines.join("\n")}\n`;
}
