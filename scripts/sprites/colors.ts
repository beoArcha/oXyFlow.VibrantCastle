import { spriteError } from "./errors";
import type { Tier } from "./types";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Parses "#rgb" or "#rrggbb" into a packed 0xRRGGBB integer. */
export function parseColor(input: string): number {
  if (typeof input !== "string" || !HEX_COLOR.test(input)) {
    throw spriteError(`Invalid colour ${JSON.stringify(input)}: use "#rgb" or "#rrggbb".`, { input });
  }
  const digits = input.slice(1);
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
  return parseInt(full, 16);
}

function channels(rgb: number): [number, number, number] {
  return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

/** Snaps to 12-bit colour (top 4 bits per channel), returned as expanded 24-bit. */
export function snap12(rgb: number): number {
  const [r, g, b] = channels(rgb);
  return (((r >> 4) * 17) << 16) | (((g >> 4) * 17) << 8) | ((b >> 4) * 17);
}

/** Snaps to RGB565, returned as expanded 24-bit. */
export function snap565(rgb: number): number {
  const [r, g, b] = channels(rgb);
  const r5 = r >> 3;
  const g6 = g >> 2;
  const b5 = b >> 3;
  const r8 = (r5 << 3) | (r5 >> 2);
  const g8 = (g6 << 2) | (g6 >> 4);
  const b8 = (b5 << 3) | (b5 >> 2);
  return (r8 << 16) | (g8 << 8) | b8;
}

export function snapTo(rgb: number, tier: Tier): number {
  return tier === "nes" ? snap12(rgb) : snap565(rgb);
}

/** Writes an already snapped colour: "#rgb" for NES, "#rrggbb" for SNES. */
export function toHex(snapped: number, tier: Tier): string {
  if (tier === "snes") return `#${snapped.toString(16).padStart(6, "0")}`;
  const [r, g, b] = channels(snapped);
  return `#${(r / 17).toString(16)}${(g / 17).toString(16)}${(b / 17).toString(16)}`;
}
