import type { RgbaImage } from "../lib/png";

/** 3x5 glyphs, rows joined by `/`; `#` is ink. Only the characters overlay labels need. */
const GLYPHS: Record<string, string> = {
  a: ".#./#.#/###/#.#/#.#",
  b: "##./#.#/##./#.#/##.",
  c: ".##/#../#../#../.##",
  d: "##./#.#/#.#/#.#/##.",
  e: "###/#../##./#../###",
  f: "###/#../##./#../#..",
  g: ".##/#../#.#/#.#/.##",
  h: "#.#/#.#/###/#.#/#.#",
  i: "###/.#./.#./.#./###",
  j: "..#/..#/..#/#.#/.#.",
  k: "#.#/#.#/##./#.#/#.#",
  l: "#../#../#../#../###",
  m: "#.#/###/###/#.#/#.#",
  n: "##./#.#/#.#/#.#/#.#",
  o: ".#./#.#/#.#/#.#/.#.",
  p: "##./#.#/##./#../#..",
  q: ".#./#.#/#.#/##./.##",
  r: "##./#.#/##./#.#/#.#",
  s: ".##/#../.#./..#/##.",
  t: "###/.#./.#./.#./.#.",
  u: "#.#/#.#/#.#/#.#/###",
  v: "#.#/#.#/#.#/#.#/.#.",
  w: "#.#/#.#/###/###/#.#",
  x: "#.#/#.#/.#./#.#/#.#",
  y: "#.#/#.#/.#./.#./.#.",
  z: "###/..#/.#./#../###",
  "0": "###/#.#/#.#/#.#/###",
  "1": ".#./##./.#./.#./###",
  "2": "##./..#/.#./#../###",
  "3": "##./..#/.#./..#/##.",
  "4": "#.#/#.#/###/..#/..#",
  "5": "###/#../##./..#/##.",
  "6": ".##/#../###/#.#/###",
  "7": "###/..#/.#./.#./.#.",
  "8": "###/#.#/###/#.#/###",
  "9": "###/#.#/###/..#/##.",
  ":": "..././#./.../#./...",
  " ": ".../.../.../.../...",
};

export const GLYPH_WIDTH = 3;
export const GLYPH_HEIGHT = 5;

/** Draws `text` at integer `scale` with a dark halo so it stays readable over sprites. */
export function drawText(image: RgbaImage, text: string, x: number, y: number, scale: number, ink: readonly [number, number, number]): void {
  const put = (px: number, py: number, color: readonly [number, number, number]): void => {
    if (px < 0 || py < 0 || px >= image.width || py >= image.height) return;
    image.data.set([color[0], color[1], color[2], 255], (py * image.width + px) * 4);
  };
  const paint = (color: readonly [number, number, number], grow: number): void => {
    let cursor = x;
    for (const ch of text.toLowerCase()) {
      const rows = (GLYPHS[ch] ?? GLYPHS[" "]).split("/");
      rows.forEach((row, ry) => {
        [...row].forEach((cell, rx) => {
          if (cell !== "#") return;
          for (let dy = -grow; dy < scale + grow; dy++) {
            for (let dx = -grow; dx < scale + grow; dx++) put(cursor + rx * scale + dx, y + ry * scale + dy, color);
          }
        });
      });
      cursor += (GLYPH_WIDTH + 1) * scale;
    }
  };
  paint([0, 0, 0], 1);
  paint(ink, 0);
}
