import type { RgbaImage } from "../lib/png";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Island extends Rect {
  id: number;
  area: number;
}

export interface LabelledImage {
  islands: Island[];
  /** Per-pixel island id (index into `islands` + 1), 0 where transparent. */
  labels: Int32Array;
}

export const OPAQUE_ALPHA = 128;

export function labelIslands(image: RgbaImage, alphaThreshold = OPAQUE_ALPHA): LabelledImage {
  const { width, height, data } = image;
  const labels = new Int32Array(width * height);
  const islands: Island[] = [];
  const stack: number[] = [];

  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== 0 || data[start * 4 + 3] <= alphaThreshold) continue;
    const id = islands.length + 1;
    let minX = width, minY = height, maxX = 0, maxY = 0, area = 0;
    labels[start] = id;
    stack.push(start);
    while (stack.length > 0) {
      const p = stack.pop() as number;
      const px = p % width;
      const py = (p - px) / width;
      area++;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const n = ny * width + nx;
          if (labels[n] !== 0 || data[n * 4 + 3] <= alphaThreshold) continue;
          labels[n] = id;
          stack.push(n);
        }
      }
    }
    islands.push({ id, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
  }
  return { islands, labels };
}

export function unionRect(rects: readonly Rect[]): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Groups islands into visual rows. Islands at least `bodyRatio` of the largest island's area
 * define the rows by vertical overlap; smaller debris joins the row it is vertically closest to.
 */
export function groupRows(islands: readonly Island[], bodyRatio = 0.05): Island[][] {
  if (islands.length === 0) return [];
  const maxArea = Math.max(...islands.map((i) => i.area));
  const bodies = islands.filter((i) => i.area >= maxArea * bodyRatio).sort((a, b) => a.y - b.y);

  const rows: { top: number; bottom: number; members: Island[] }[] = [];
  for (const island of bodies) {
    const bottom = island.y + island.h;
    const row = rows.find((r) => {
      const overlap = Math.min(r.bottom, bottom) - Math.max(r.top, island.y);
      return overlap >= 0.5 * Math.min(island.h, r.bottom - r.top);
    });
    if (!row) {
      rows.push({ top: island.y, bottom, members: [island] });
      continue;
    }
    row.members.push(island);
    row.top = Math.min(row.top, island.y);
    row.bottom = Math.max(row.bottom, bottom);
  }

  const bodySet = new Set(bodies);
  for (const debris of islands.filter((i) => !bodySet.has(i))) {
    const centre = debris.y + debris.h / 2;
    let best = rows[0];
    let bestDist = Infinity;
    for (const row of rows) {
      const dist = centre < row.top ? row.top - centre : centre > row.bottom ? centre - row.bottom : 0;
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    }
    best.members.push(debris);
  }

  return rows
    .sort((a, b) => a.top - b.top)
    .map((r) => r.members.sort((a, b) => a.x - b.x));
}

export function rectGap(a: Rect, b: Rect): { dx: number; dy: number } {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return { dx, dy };
}

/**
 * Merges every small island (area below `bodyRatio` of the row maximum) into the nearest large
 * island of the same row, then returns the groups ordered left to right by body centre.
 */
export function mergeDebris(row: readonly Island[], bodyRatio = 0.25): Island[][] {
  const maxArea = Math.max(...row.map((i) => i.area));
  const bodies = row.filter((i) => i.area >= maxArea * bodyRatio);
  const groups = bodies.map((b) => [b]);
  for (const debris of row.filter((i) => !bodies.includes(i))) {
    let best = 0;
    let bestDist = Infinity;
    bodies.forEach((body, idx) => {
      const gap = rectGap(debris, body);
      const dist = Math.hypot(gap.dx, gap.dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = idx;
      }
    });
    groups[best].push(debris);
  }
  return groups.sort((a, b) => bodyCentreX(a) - bodyCentreX(b));
}

export function bodyOf(group: readonly Island[]): Island {
  return group.reduce((best, i) => (i.area > best.area ? i : best));
}

export function bodyCentreX(group: readonly Island[]): number {
  const body = bodyOf(group);
  return body.x + body.w / 2;
}
