import { defineTileset, type PixelCanvas } from "../defineTileset";

// Both tiers share one drawing routine. Coordinates are in hi-8bit pixels (16 px tile); `s` is 1
// for hi-8bit and 2 for hi-16bit, which adds speckles to the stone.

interface Palette {
  stone: string;
  mortar: string;
  rim: string;
  shade: string;
  edge: string;
  speck: string | null;
}

const HI8BIT: Palette = { stone: "#877c6b", mortar: "#4d463d", rim: "#ccaa55", shade: "#6b6255", edge: "#3d3830", speck: null };
const HI16BIT: Palette = { stone: "#8c8170", mortar: "#48413a", rim: "#d9b766", shade: "#675e52", edge: "#36302a", speck: "#a39780" };

const HI8_TILE = 16;
const MORTAR_ROWS = [3, 7, 11];
const COURSES: [number, number][] = [[0, 2], [4, 6], [8, 10], [12, 15]];
const JOINTS = [[8], [4, 12], [8], [4, 12]];
const SHIFTED_JOINTS = [[6], [3, 11], [9], [5, 12]];

function drawCourses(c: PixelCanvas, s: number, pal: Palette, joints: number[][]): void {
  COURSES.forEach(([top, bottom], course) => {
    for (const x of joints[course]) c.rect(x * s, top * s, s, (bottom - top + 1) * s, pal.mortar);
  });
  for (const y of MORTAR_ROWS) c.rect(0, y * s, c.width, s, pal.mortar);
}

function drawSpeckles(c: PixelCanvas, s: number, pal: Palette): void {
  if (pal.speck === null) return;
  for (let y = 1; y < HI8_TILE - 1; y++) {
    for (let x = 1; x < HI8_TILE - 1; x++) {
      if ((x * 5 + y * 3) % 11 === 0) c.rect(x * s, y * s, s, s, pal.speck);
    }
  }
}

function drawStone(c: PixelCanvas, tile: string, s: number, pal: Palette): void {
  c.rect(0, 0, c.width, c.height, pal.stone);
  drawSpeckles(c, s, pal);
  drawCourses(c, s, pal, tile === "fill_2" ? SHIFTED_JOINTS : JOINTS);
  if (/^(top|ledge)/.test(tile)) c.rect(0, 0, c.width, 2 * s, pal.rim);
  if (tile.startsWith("bottom")) c.rect(0, c.height - s, c.width, s, pal.shade);
  if (tile.includes("left")) c.rect(0, 0, s, c.height, pal.edge);
  if (tile.includes("right")) c.rect(c.width - s, 0, s, c.height, pal.edge);
}

export default defineTileset({
  id: "sample_tileset",
  kind: "solid",
  description: "Worked example: grey-brown courtyard stone with an ochre lip on the walkable top.",
  tiles: [
    "top_left", "top", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_right",
  ],
  draw: {
    hi8bit: (c, tile) => drawStone(c, tile, 1, HI8BIT),
    hi16bit: (c, tile) => drawStone(c, tile, 2, HI16BIT),
  },
});
