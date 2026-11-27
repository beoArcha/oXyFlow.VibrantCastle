import type { PixelCanvas } from "../pixelCanvas";

/** 2x2 ordered Bayer dither threshold selector between two palette stops. */
export function bayer2(x: number, y: number, t: number, dark: string, light: string): string {
  const m = ((y & 1) * 2 + (x & 1)) & 3;
  const threshold = m === 0 ? 0.125 : m === 1 ? 0.625 : m === 2 ? 0.875 : 0.375;
  return t > threshold ? light : dark;
}

/** Maps a normalized 0..1 shade value across a 4-stop palette ramp using 2x2 Bayer dithering. */
export function shadeRamp4(
  x: number,
  y: number,
  shade: number,
  stops: readonly [string, string, string, string],
): string {
  const s = Math.max(0, Math.min(1, shade));
  if (s < 0.333) return bayer2(x, y, s / 0.333, stops[0], stops[1]);
  if (s < 0.667) return bayer2(x, y, (s - 0.333) / 0.334, stops[1], stops[2]);
  return bayer2(x, y, (s - 0.667) / 0.333, stops[2], stops[3]);
}

/** Draws a shaded sphere/orb using directional top-left lighting and 4-stop Bayer dithering. */
export function drawShadedOrb(
  c: PixelCanvas,
  cx: number,
  cy: number,
  radius: number,
  stops: readonly [string, string, string, string],
  specColor?: string,
): void {
  const r2 = radius * radius;
  const x0 = Math.floor(cx - radius);
  const x1 = Math.ceil(cx + radius);
  const y0 = Math.floor(cy - radius);
  const y1 = Math.ceil(cy + radius);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const nx = dx / radius;
      const ny = dy / radius;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const light = Math.max(0, Math.min(1, 0.42 - nx * 0.38 - ny * 0.42 + nz * 0.28));
      c.px(x, y, shadeRamp4(x, y, light, stops));
    }
  }
  if (specColor && radius >= 3) {
    const sx = Math.round(cx - radius * 0.35);
    const sy = Math.round(cy - radius * 0.35);
    c.px(sx, sy, specColor);
    if (radius >= 5) c.px(sx + 1, sy, specColor);
  }
}

/** Draws a crisp 4-point pixel sparkle star centered at (cx, cy). */
export function drawSparkle(c: PixelCanvas, cx: number, cy: number, arm: number, core: string, tip: string): void {
  c.px(cx, cy, core);
  for (let i = 1; i <= arm; i++) {
    const col = i === 1 ? core : tip;
    c.px(cx - i, cy, col);
    c.px(cx + i, cy, col);
    c.px(cx, cy - i, col);
    c.px(cx, cy + i, col);
  }
}

/** Draws a thick round-capped line segment on a PixelCanvas. */
export function drawThickLine(
  c: PixelCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
  color: string,
): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
  const r = Math.max(0, Math.floor((thickness - 1) / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Math.round(x0 + (x1 - x0) * t);
    const py = Math.round(y0 + (y1 - y0) * t);
    if (r === 0) c.px(px, py, color);
    else c.ellipse(px, py, r, r, color);
  }
}
