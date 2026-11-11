import type { RgbaImage } from "../lib/png";
import type { LabelledImage } from "./islands";
import type { HeroLayout } from "./heroLayout";

/** Copies only the pixels of each frame's own islands, so touching neighbours never leak into a frame. */
export function composeHeroSheet(source: RgbaImage, labelled: LabelledImage, layout: HeroLayout): RgbaImage {
  const target: RgbaImage = { width: layout.width, height: layout.height, data: new Uint8Array(layout.width * layout.height * 4) };
  for (const row of layout.placements) {
    for (const placement of row) {
      const own = new Set(placement.group.islands.map((island) => island.id));
      const { extent } = placement.group;
      for (let y = extent.y; y < extent.y + extent.h; y++) {
        for (let x = extent.x; x < extent.x + extent.w; x++) {
          const si = y * source.width + x;
          if (!own.has(labelled.labels[si])) continue;
          const ti = ((placement.y + y - extent.y) * target.width + placement.x + x - extent.x) * 4;
          target.data.set(source.data.subarray(si * 4, si * 4 + 4), ti);
        }
      }
    }
  }
  return target;
}

/** 2x2 box filter on premultiplied colour; odd sizes are padded with transparent pixels first. */
export function halveSheet(image: RgbaImage): RgbaImage {
  const width = Math.ceil(image.width / 2);
  const height = Math.ceil(image.height / 2);
  const out: RgbaImage = { width, height, data: new Uint8Array(width * height * 4) };
  const sample = (x: number, y: number, channel: number): number =>
    x < image.width && y < image.height ? image.data[(y * image.width + x) * 4 + channel] : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let alpha = 0;
      const premultiplied = [0, 0, 0];
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const a = sample(2 * x + dx, 2 * y + dy, 3);
          alpha += a;
          for (let c = 0; c < 3; c++) premultiplied[c] += sample(2 * x + dx, 2 * y + dy, c) * a;
        }
      }
      const o = (y * width + x) * 4;
      if (alpha > 0) for (let c = 0; c < 3; c++) out.data[o + c] = Math.round(premultiplied[c] / alpha);
      out.data[o + 3] = Math.round(alpha / 4);
    }
  }
  return out;
}
