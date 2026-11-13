import type { PixelCanvas } from "../../defineHeroSprite";

// ─── Coordinate space ────────────────────────────────────────────────────────
// All base coordinates are defined in hi-8bit pixels for a 63 × 64 cell (s = 1).
// For hi-16bit (126 × 128 cell, s = 2), coordinates scale cleanly with genuine
// redraw detail, richer shading, specular glints, and fine trims.
//
// Origin top-left.
// Feet MUST sit on the bottom row (y = 63 in hi-8bit, y = 127 in hi-16bit)
// in EVERY frame (physics engine handles airborne displacement).
// Body is centered at BODY_X8 = 31 in the first cell; wide frames extend right.

export const BODY_X8 = 31;
export const FLOOR8 = 63;

// ─── Autumn Palettes ─────────────────────────────────────────────────────────

export interface Palette {
  outline: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  coat: string;
  coatLight: string;
  coatShade: string;
  trim: string;
  trimShade: string;
  boot: string;
  blade: string;
  bladeEdge: string;
  bladeShadow: string;
  solar: string;
  solarCore: string;
}

export const HI8: Palette = {
  outline: "#111",
  skin: "#ea9",
  skinShade: "#ea9",
  hair: "#842",
  hairShade: "#842",
  coat: "#234",
  coatLight: "#234",
  coatShade: "#234",
  trim: "#ea2",
  trimShade: "#ea2",
  boot: "#842",
  blade: "#def",
  bladeEdge: "#def",
  bladeShadow: "#def",
  solar: "#ea2",
  solarCore: "#def",
};

export const HI16: Palette = {
  outline: "#100c08",
  skin: "#efba9c",
  skinShade: "#b57152",
  hair: "#8c4929",
  hairShade: "#4a2410",
  coat: "#293039",
  coatLight: "#4a5563",
  coatShade: "#181c21",
  trim: "#e7a221",
  trimShade: "#945910",
  boot: "#7b4521",
  blade: "#7b92a5",
  bladeEdge: "#deebf7",
  bladeShadow: "#425163",
  solar: "#ffa621",
  solarCore: "#deebf7",
};

// ─── Drawing Brush ───────────────────────────────────────────────────────────

export class Brush {
  constructor(
    readonly c: PixelCanvas,
    readonly s: number,
    readonly detailed: boolean,
    readonly pal: Palette,
  ) {}

  px(x: number, y: number, col: string): void {
    const sx = Math.round(x * this.s);
    const sy = Math.round(y * this.s);
    if (sx >= 1 && sy >= 1 && sx < this.c.width - 1 && sy < this.c.height) {
      this.c.px(sx, sy, col);
    }
  }

  // Draw a fine pixel directly in 16-bit space (half-pixel in 8-bit space)
  px16(sx: number, sy: number, col: string): void {
    if (sx >= 1 && sy >= 1 && sx < this.c.width - 1 && sy < this.c.height) {
      this.c.px(sx, sy, col);
    }
  }

  rect(x: number, y: number, w: number, h: number, col: string): void {
    if (w <= 0 || h <= 0) return;
    const sx = Math.round(x * this.s);
    const sy = Math.round(y * this.s);
    const sw = Math.round(w * this.s);
    const sh = Math.round(h * this.s);
    if (sw <= 0 || sh <= 0) return;
    const cx0 = Math.max(1, sx);
    const cy0 = Math.max(1, sy);
    const cx1 = Math.min(this.c.width - 2, sx + sw - 1);
    const cy1 = Math.min(this.c.height - 1, sy + sh - 1);
    if (cx1 >= cx0 && cy1 >= cy0) {
      this.c.rect(cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1, col);
    }
  }

  rect16(sx: number, sy: number, sw: number, sh: number, col: string): void {
    if (sw <= 0 || sh <= 0) return;
    const cx0 = Math.max(1, sx);
    const cy0 = Math.max(1, sy);
    const cx1 = Math.min(this.c.width - 2, sx + sw - 1);
    const cy1 = Math.min(this.c.height - 1, sy + sh - 1);
    if (cx1 >= cx0 && cy1 >= cy0) {
      this.c.rect(cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1, col);
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, col: string): void {
    const { s } = this;
    const shallow = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    for (let i = 0; i < s; i++) {
      const ox = shallow ? 0 : i;
      const oy = shallow ? i : 0;
      const lx0 = Math.max(1, Math.min(this.c.width - 2, Math.round(x0 * s) + ox));
      const ly0 = Math.max(1, Math.min(this.c.height - 1, Math.round(y0 * s) + oy));
      const lx1 = Math.max(1, Math.min(this.c.width - 2, Math.round(x1 * s) + ox));
      const ly1 = Math.max(1, Math.min(this.c.height - 1, Math.round(y1 * s) + oy));
      this.c.line(lx0, ly0, lx1, ly1, col);
    }
  }

  line16(sx0: number, sy0: number, sx1: number, sy1: number, col: string): void {
    const lx0 = Math.max(1, Math.min(this.c.width - 2, sx0));
    const ly0 = Math.max(1, Math.min(this.c.height - 1, sy0));
    const lx1 = Math.max(1, Math.min(this.c.width - 2, sx1));
    const ly1 = Math.max(1, Math.min(this.c.height - 1, sy1));
    this.c.line(lx0, ly0, lx1, ly1, col);
  }
}

// ─── Pose Specification ─────────────────────────────────────────────────────

export type CoatStyle = "rest" | "billow_back" | "flare_up" | "stream_up" | "crouch_bunch";
export type ArmStyle = "rest" | "pump_forward" | "pump_back" | "lunge" | "parry" | "cast_raise" | "cast_thrust" | "crouch";

export interface LegPose {
  x: number;      // foot horizontal position
  lift: number;   // raised off floor (0 = planted at FLOOR8)
  kneeX: number;  // knee bend horizontal position
}

export type CastEffectStage =
  | "spark"
  | "gather"
  | "glow_gather"
  | "bolt_fire"
  | "bolt_peak"
  | "bolt_fade"
  | "sparks_fade"
  | "sparks_end";

export interface CastEffect {
  stage: CastEffectStage;
  reachX: number;
}

export interface Pose {
  bob: number;         // downward compression of torso/head (px)
  lean: number;        // forward horizontal lean of torso/head (px)
  legL: LegPose;       // left (back) leg
  legR: LegPose;       // right (front) leg
  coat: CoatStyle;     // coat tails silhouette
  coatShift?: number;  // coat flutter offset
  armL: ArmStyle;      // left arm mode
  // Rapier positioning
  hiltOffset: [number, number]; // offset from right shoulder [dx, dy]
  tipPos: [number, number];     // blade tip absolute position in 8-bit coords
  // Special action properties
  spectacleGlint?: boolean;
  dashStreak?: number;          // afterimage streak offset
  slashArc?: boolean;           // attack 5 golden sparkle trail
  castEffect?: CastEffect;
}

export const REST_POSE: Pose = {
  bob: 0,
  lean: 0,
  legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
  legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
  coat: "rest",
  armL: "rest",
  hiltOffset: [6, 18],
  tipPos: [BODY_X8 + 19, 28],
};

// ─── Draw Coordinate Helpers ────────────────────────────────────────────────

export function torsoTopY(p: Pose): number {
  return 16 + p.bob;
}

export function getTorsoHeight(p: Pose): number {
  return p.coat === "crouch_bunch" ? 14 : 20;
}

export function getHipY(p: Pose): number {
  return torsoTopY(p) + getTorsoHeight(p);
}

export function headTopY(p: Pose): number {
  return 2 + p.bob;
}

// ─── Shared Body Parts ──────────────────────────────────────────────────────

// 1. Draw Greatcoat Tails (behind character)
export function drawCoatTails(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hipY = getHipY(p);
  const shift = p.coatShift ?? 0;
  const hipX = BODY_X8 - 3 + p.lean;

  switch (p.coat) {
    case "billow_back": {
      // Tapered, angled flap attached firmly at the waist/hips,
      // narrowing toward the tip; 3 alternating dynamic shapes.
      const variant = Math.abs(shift) % 3;

      let spans: Array<[number, number, number]>; // [yOffset, minX, maxX]
      if (variant === 0) {
        // Mid-angle dynamic flutter (~45 deg)
        spans = [
          [-2, hipX - 2, hipX + 1],
          [-1, hipX - 3, hipX + 1],
          [0, hipX - 5, hipX],
          [1, hipX - 7, hipX - 1],
          [2, hipX - 9, hipX - 2],
          [3, hipX - 11, hipX - 4],
          [4, hipX - 12, hipX - 6],
          [5, hipX - 13, hipX - 8],
          [6, hipX - 14, hipX - 10],
          [7, hipX - 15, hipX - 11],
          [8, hipX - 16, hipX - 12],
          [9, hipX - 16, hipX - 13],
          [10, hipX - 16, hipX - 14],
          [11, hipX - 16, hipX - 15],
        ];
      } else if (variant === 1) {
        // High aerodynamic lift flutter
        spans = [
          [-2, hipX - 2, hipX + 1],
          [-1, hipX - 4, hipX + 1],
          [0, hipX - 6, hipX],
          [1, hipX - 9, hipX - 1],
          [2, hipX - 12, hipX - 3],
          [3, hipX - 14, hipX - 6],
          [4, hipX - 15, hipX - 9],
          [5, hipX - 16, hipX - 11],
          [6, hipX - 17, hipX - 13],
          [7, hipX - 17, hipX - 14],
          [8, hipX - 18, hipX - 15],
          [9, hipX - 18, hipX - 16],
        ];
      } else {
        // Low trailing ripple flap
        spans = [
          [-2, hipX - 2, hipX + 1],
          [-1, hipX - 3, hipX + 1],
          [0, hipX - 4, hipX],
          [1, hipX - 5, hipX],
          [2, hipX - 6, hipX - 1],
          [3, hipX - 7, hipX - 2],
          [4, hipX - 8, hipX - 3],
          [5, hipX - 9, hipX - 4],
          [6, hipX - 10, hipX - 6],
          [7, hipX - 11, hipX - 7],
          [8, hipX - 12, hipX - 9],
          [9, hipX - 13, hipX - 10],
          [10, hipX - 14, hipX - 11],
          [11, hipX - 14, hipX - 12],
          [12, hipX - 14, hipX - 13],
        ];
      }

      // Draw tapered flap body
      const tipIndex = spans.length - 2;
      for (let i = 0; i < spans.length; i++) {
        const [dy, x0, x1] = spans[i]!;
        const y = hipY + dy;
        const w = x1 - x0 + 1;
        if (i >= tipIndex) {
          // Gold trim at narrow flap tip
          b.rect(x0, y, w, 1, pal.trim);
          if (detailed) {
            b.rect(x0, y, 1, 1, pal.trimShade);
          }
        } else {
          b.rect(x0, y, w, 1, pal.coat);
          // Upper crest highlight
          b.px(x0, y, pal.coatLight);
          // Lower edge shadow
          if (w > 2) {
            b.px(x1, y, pal.coatShade);
          }
        }
      }

      if (detailed) {
        // Rich 16-bit fold line along the flapping crest
        const [dy0, x00] = spans[1]!;
        const [dyT, x0T] = spans[tipIndex]!;
        b.line16(
          Math.round(x00 * 2),
          Math.round((hipY + dy0) * 2),
          Math.round(x0T * 2),
          Math.round((hipY + dyT) * 2),
          pal.coatLight,
        );
      }
      break;
    }

    case "flare_up": {
      // Tapered wings flaring upward from waist on both sides during jump
      // Left tapered flap
      const lSpans = [
        [0, hipX - 3, hipX],
        [-2, hipX - 6, hipX - 2],
        [-4, hipX - 9, hipX - 4],
        [-6, hipX - 11, hipX - 7],
        [-7, hipX - 12, hipX - 9],
      ];
      for (let i = 0; i < lSpans.length; i++) {
        const [dy, x0, x1] = lSpans[i]!;
        const col = i === lSpans.length - 1 ? pal.trim : pal.coat;
        b.rect(x0, hipY + dy, x1 - x0 + 1, 2, col);
      }

      // Right tapered flap
      const rSpans = [
        [0, hipX + 3, hipX + 6],
        [-2, hipX + 5, hipX + 8],
        [-4, hipX + 7, hipX + 10],
        [-5, hipX + 8, hipX + 10],
      ];
      for (let i = 0; i < rSpans.length; i++) {
        const [dy, x0, x1] = rSpans[i]!;
        const col = i === rSpans.length - 1 ? pal.trim : pal.coat;
        b.rect(x0, hipY + dy, x1 - x0 + 1, 2, col);
      }

      if (detailed) {
        b.rect(hipX - 11, hipY - 6, 2, 2, pal.coatLight);
        b.rect(hipX + 7, hipY - 4, 2, 2, pal.coatShade);
      }
      break;
    }

    case "stream_up": {
      // Tapered upward streams from hips during fall
      const lFall = [
        [0, hipX - 3, hipX],
        [-3, hipX - 6, hipX - 2],
        [-6, hipX - 9, hipX - 5],
        [-9, hipX - 11, hipX - 8],
        [-11, hipX - 11, hipX - 9],
      ];
      for (let i = 0; i < lFall.length; i++) {
        const [dy, x0, x1] = lFall[i]!;
        const col = i === lFall.length - 1 ? pal.trim : pal.coat;
        b.rect(x0, hipY + dy, x1 - x0 + 1, 3, col);
      }

      const rFall = [
        [0, hipX + 3, hipX + 6],
        [-3, hipX + 5, hipX + 8],
        [-6, hipX + 7, hipX + 9],
        [-8, hipX + 7, hipX + 8],
      ];
      for (let i = 0; i < rFall.length; i++) {
        const [dy, x0, x1] = rFall[i]!;
        const col = i === rFall.length - 1 ? pal.trim : pal.coat;
        b.rect(x0, hipY + dy, x1 - x0 + 1, 3, col);
      }

      if (detailed) {
        b.rect(hipX - 9, hipY - 6, 2, 3, pal.coatLight);
        b.rect(hipX + 6, hipY - 4, 2, 3, pal.coatShade);
      }
      break;
    }

    case "rest":
    default: {
      // Elegant split greatcoat tails hanging down to just above floor
      const tailLX = BODY_X8 - 11 + shift + p.lean;
      const tailRX = BODY_X8 - 5 + shift + p.lean;
      const tailH = FLOOR8 - hipY;

      // Left coat tail
      b.rect(tailLX, hipY, 5, tailH, pal.coat);
      b.rect(tailLX - 1, hipY + tailH - 2, 6, 1, pal.trim);

      // Right coat tail
      b.rect(tailRX, hipY, 5, tailH - 1, pal.coatShade);
      b.rect(tailRX - 1, hipY + tailH - 3, 6, 1, pal.trim);

      if (detailed) {
        b.rect(tailLX, hipY, 1, tailH - 2, pal.coatLight);
        b.rect(tailLX - 1, hipY + tailH - 1, 6, 1, pal.trimShade);
        b.rect(tailRX - 1, hipY + tailH - 2, 6, 1, pal.trimShade);
        // Fine fold line between split tails
        b.line16(
          Math.round((tailRX - 1) * 2),
          Math.round(hipY * 2),
          Math.round((tailRX - 1) * 2),
          Math.round((hipY + tailH - 2) * 2),
          pal.coatShade,
        );
      }
      break;
    }
  }
}

// 2. Draw Legs and Boots
export function drawLegs(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hipY = getHipY(p);

  const legs = [
    { pose: p.legL, isBack: true },
    { pose: p.legR, isBack: false },
  ];

  for (const { pose, isBack } of legs) {
    const footY = FLOOR8 - pose.lift;
    const footX = pose.x;
    const kneeX = pose.kneeX;
    const kneeY = Math.round((hipY + footY) / 2);

    const legCol = isBack ? pal.coatShade : pal.coat;
    const legLight = isBack ? pal.coat : pal.coatLight;

    // Thigh: hip to knee (2px wide)
    b.line(BODY_X8 - 2 + (isBack ? -4 : 4) + p.lean, hipY, kneeX, kneeY, legCol);
    b.line(BODY_X8 - 1 + (isBack ? -4 : 4) + p.lean, hipY, kneeX + 1, kneeY, legCol);

    // Shin: knee to ankle (2px wide)
    b.line(kneeX, kneeY, footX, footY - 2, legCol);
    b.line(kneeX + 1, kneeY, footX + 1, footY - 2, legCol);

    if (detailed && !isBack) {
      b.line(BODY_X8 - 1 + 4 + p.lean, hipY, kneeX + 1, kneeY, legLight);
      b.line(kneeX + 1, kneeY, footX + 1, footY - 2, legLight);
      // Subtle trousers crease
      b.px16(Math.round(kneeX * 2), Math.round(kneeY * 2), pal.coatLight);
    }

    // Duelist Boot (2px high, sitting squarely on ground when lift=0)
    b.rect(footX - 1, footY - 1, 5, 2, pal.boot);
    // Gold fold-over cuff at top of boot
    b.rect(footX - 1, footY - 2, 5, 1, pal.trim);

    if (detailed) {
      // Boot heel/sole line & cuff shadow
      b.rect(footX - 1, footY, 5, 1, isBack ? pal.outline : pal.boot);
      b.px(footX + 1, footY - 2, pal.trimShade);
      // Fine 16-bit boot highlight
      b.px16(Math.round(footX * 2), Math.round((footY - 1) * 2), pal.trim);
    }
  }
}

// 3. Draw Torso: Double-Breasted Waistcoat and Tailored Greatcoat
export function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const tX = BODY_X8 - 10 + p.lean;
  const tW = 20;
  const tH = getTorsoHeight(p);

  // Main coat silhouette
  b.rect(tX, tY, tW, tH, pal.coat);

  if (detailed) {
    b.rect(tX, tY, 3, tH, pal.coatLight);
    b.rect(tX + tW - 3, tY, 3, tH, pal.coatShade);
  }

  // Waistcoat center panel
  b.rect(tX + 7, tY + 2, 6, tH - 4, pal.coatLight);
  if (detailed) {
    b.rect(tX + 7, tY + 2, 1, tH - 4, pal.coat);
  }

  // Double-breasted gold buttons
  if (tH < 16) {
    b.px(tX + 8, tY + 3, pal.trim);
    b.px(tX + 11, tY + 3, pal.trim);
    b.px(tX + 8, tY + 6, pal.trim);
    b.px(tX + 11, tY + 6, pal.trim);
    if (detailed) {
      b.px16(Math.round((tX + 8) * 2), Math.round((tY + 3) * 2), pal.solarCore);
      b.px16(Math.round((tX + 11) * 2), Math.round((tY + 3) * 2), pal.solarCore);
      b.px16(Math.round((tX + 8) * 2), Math.round((tY + 6) * 2), pal.solarCore);
      b.px16(Math.round((tX + 11) * 2), Math.round((tY + 6) * 2), pal.solarCore);
    }
  } else {
    const buttonRows = [4, 8, 12, 15];
    for (const row of buttonRows) {
      b.px(tX + 8, tY + row, pal.trim);
      b.px(tX + 11, tY + row, pal.trim);
      if (detailed) {
        b.px16(Math.round((tX + 8) * 2), Math.round((tY + row) * 2), pal.solarCore);
        b.px16(Math.round((tX + 11) * 2), Math.round((tY + row) * 2), pal.solarCore);
      }
    }
  }

  // Leather utility belt
  b.rect(tX + 1, tY + tH - 3, tW - 2, 2, pal.boot);
  // Gold belt buckle
  b.rect(tX + 8, tY + tH - 3, 4, 2, pal.trim);
  if (detailed) {
    b.px(tX + 9, tY + tH - 2, pal.outline);
  }

  // Greatcoat high collar framing neck with gold trim
  b.rect(tX + 4, tY - 2, 2, 3, pal.coat);
  b.rect(tX + 12, tY - 2, 2, 3, pal.coat);
  b.rect(tX + 4, tY - 2, 2, 1, pal.trim);
  b.rect(tX + 12, tY - 2, 2, 1, pal.trim);

  // Greatcoat lapels with gold trim
  b.rect(tX + 1, tY, 3, 6, pal.coatShade);
  b.rect(tX + tW - 4, tY, 3, 6, pal.coatShade);
  b.line(tX + 1, tY, tX + 4, tY + 5, pal.trim);
  b.line(tX + tW - 2, tY, tX + tW - 5, tY + 5, pal.trim);

  // Gold hem on coat lower edge
  b.rect(tX, tY + tH - 1, tW, 1, pal.trim);
  if (detailed) {
    b.rect(tX, tY + tH, tW, 1, pal.trimShade);
    // Shoulder epaulet / seam accents in 16-bit
    b.line16(Math.round(tX * 2), Math.round(tY * 2), Math.round((tX + 4) * 2), Math.round(tY * 2), pal.trim);
    b.line16(Math.round((tX + tW - 4) * 2), Math.round(tY * 2), Math.round((tX + tW) * 2), Math.round(tY * 2), pal.trim);
  }
}

// 4. Draw Head: Chestnut Hair, Face with Visible Eye, Spectacle Glint, and Tapered Jaw/Neck
export function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hY = headTopY(p);
  const hX = BODY_X8 - 5 + p.lean;

  // Chestnut hair crown & silhouette (NO gold trim anywhere on head!)
  // Top rows of hair
  b.rect(hX + 1, hY, 8, 1, pal.hair);
  b.rect(hX, hY + 1, 10, 2, pal.hair);
  b.rect(hX - 1, hY + 2, 11, 2, pal.hair);

  // Rear hair sweeping down to nape with shadow
  b.rect(hX - 1, hY + 4, 3, 5, pal.hairShade);
  b.rect(hX - 1, hY + 4, 1, 5, pal.hair);
  b.rect(hX, hY + 8, 2, 2, pal.hairShade);

  if (detailed) {
    // Rich chestnut hair strands & shading in 16-bit
    b.rect(hX, hY + 1, 4, 2, pal.hairShade);
    b.px(hX + 9, hY + 1, pal.hair);
    b.px(hX + 10, hY + 2, pal.hair);
    b.px16(Math.round((hX + 3) * 2), Math.round(hY * 2), pal.hair);
    b.px16(Math.round((hX + 6) * 2), Math.round(hY * 2), pal.hair);
  }

  // Face (facing right): Forehead, brow, cheek, and nose
  b.rect(hX + 2, hY + 4, 7, 1, pal.skin);
  b.rect(hX + 2, hY + 5, 7, 1, pal.skin);
  b.rect(hX + 2, hY + 6, 7, 1, pal.skin);
  b.rect(hX + 2, hY + 7, 7, 1, pal.skin);
  b.rect(hX + 2, hY + 8, 6, 1, pal.skin);

  // Tapered jaw & chin (head is not a box!)
  b.rect(hX + 2, hY + 9, 5, 1, pal.skin);
  b.rect(hX + 3, hY + 10, 3, 1, pal.skin); // chin tapers forward at x = hX+3..5

  // Visible neck connecting head to coat collar
  b.rect(hX + 3, hY + 11, 3, 3, pal.skin);
  b.rect(hX + 2, hY + 13, 5, 3, pal.skin);

  // Jaw & neck shadow
  b.rect(hX + 2, hY + 9, 2, 1, pal.skinShade);
  b.rect(hX + 3, hY + 11, 1, 4, pal.skinShade);

  if (detailed) {
    // 16-bit subtle shadow under jawline and ear
    b.rect16(Math.round((hX + 2) * 2), Math.round((hY + 7) * 2), 2, 4, pal.skinShade);
    b.line16(
      Math.round((hX + 3) * 2),
      Math.round((hY + 10) * 2),
      Math.round((hX + 5) * 2),
      Math.round((hY + 10) * 2),
      pal.skinShade,
    );
  }

  // Visible duelist eye facing forward/right
  const eyeX = hX + 7;
  const eyeY = hY + 6;
  b.px(eyeX, eyeY, pal.outline);

  // Spectacles as small 1-2 px glint (not a giant gold headphone or rim)
  const specX = eyeX + 1; // x = hX + 8
  const specY = eyeY;
  if (p.spectacleGlint) {
    // Bright 1-2 px glint catching light
    b.px(specX, specY, pal.solarCore);
    if (detailed) {
      b.px16(Math.round(specX * 2), Math.round(specY * 2), pal.solarCore);
      b.px16(Math.round(specX * 2) + 1, Math.round(specY * 2), pal.solarCore);
      b.px16(Math.round(specX * 2), Math.round((specY - 1) * 2), pal.bladeEdge);
    }
  } else {
    // Subtle fine glint / thin steel reflection
    if (detailed) {
      b.px16(Math.round(specX * 2), Math.round(specY * 2), pal.bladeEdge);
    }
  }
}

// 5. Draw Left (Off-hand) Arm
export function drawLeftArm(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const shX = BODY_X8 - 10 + p.lean;
  const shY = tY + 2;

  switch (p.armL) {
    case "cast_raise": {
      // Raised upward in invocation, tracing glyph
      b.rect(shX - 2, shY - 4, 3, 6, pal.coat);
      b.rect(shX - 1, shY - 9, 3, 6, pal.coat);
      b.rect(shX - 1, shY - 9, 3, 1, pal.trim); // gold cuff
      b.rect(shX - 1, shY - 12, 3, 3, pal.skin); // hand
      if (detailed) {
        b.rect(shX - 2, shY - 4, 1, 6, pal.coatLight);
      }
      break;
    }

    case "cast_thrust": {
      // Thrust forward-right projecting magical sigil
      const armEndX = shX + 9;
      const armEndY = shY + 1;
      b.line(shX, shY, armEndX, armEndY, pal.coat);
      b.line(shX, shY + 1, armEndX, armEndY + 1, pal.coat);
      b.rect(armEndX, armEndY - 1, 1, 3, pal.trim); // cuff
      b.rect(armEndX + 1, armEndY - 1, 3, 3, pal.skin); // open palm
      if (detailed) {
        b.line(shX, shY, armEndX, armEndY, pal.coatLight);
      }
      break;
    }

    case "lunge": {
      // Extended rearward for duelist counter-balance
      b.line(shX, shY, shX - 7, shY + 7, pal.coat);
      b.line(shX, shY + 1, shX - 7, shY + 8, pal.coat);
      b.rect(shX - 8, shY + 7, 2, 2, pal.skin);
      break;
    }

    case "parry": {
      // Tucked across chest
      b.line(shX, shY, shX + 5, shY + 5, pal.coat);
      b.line(shX, shY + 1, shX + 5, shY + 6, pal.coat);
      b.rect(shX + 5, shY + 5, 2, 2, pal.skin);
      break;
    }

    case "pump_forward": {
      // Forward swing during run
      b.line(shX, shY, shX + 6, shY + 8, pal.coat);
      b.line(shX, shY + 1, shX + 6, shY + 9, pal.coat);
      b.rect(shX + 6, shY + 8, 2, 2, pal.skin);
      break;
    }

    case "pump_back": {
      // Rearward swing during run
      b.line(shX, shY, shX - 6, shY + 7, pal.coat);
      b.line(shX, shY + 1, shX - 6, shY + 8, pal.coat);
      b.rect(shX - 7, shY + 7, 2, 2, pal.skin);
      break;
    }

    case "crouch": {
      // Resting on front knee
      b.line(shX, shY, shX + 5, shY + 9, pal.coat);
      b.rect(shX + 5, shY + 9, 3, 2, pal.skin);
      break;
    }

    case "rest":
    default: {
      // Resting gracefully at hip / belt
      b.rect(shX - 2, shY, 3, 13, pal.coat);
      b.rect(shX - 2, shY + 12, 3, 1, pal.trim); // gold cuff
      b.rect(shX - 2, shY + 13, 3, 2, pal.skin); // hand
      if (detailed) {
        b.rect(shX - 2, shY, 1, 12, pal.coatLight);
      }
      break;
    }
  }
}

// 6. Draw Bastion Rapier (Right Arm + Slender Weapon)
export function drawRapier(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const shX = BODY_X8 + 5 + p.lean;
  const shY = tY + 2;

  const hx = shX + p.hiltOffset[0];
  const hy = shY + p.hiltOffset[1];

  // Right arm from shoulder to hilt
  b.line(shX, shY, hx, hy, pal.coat);
  b.line(shX + 1, shY, hx + 1, hy, pal.coat);
  b.rect(hx - 1, hy - 1, 2, 2, pal.trim); // gold sleeve cuff

  const tx = p.tipPos[0];
  const ty = p.tipPos[1];

  // Classical Fencer Bell Cup Hilt & Pommel
  b.rect(hx - 1, hy - 2, 3, 5, pal.trim);
  b.rect(hx - 2, hy - 1, 2, 3, pal.trim);
  // Pommel
  b.px(hx - 2, hy, pal.boot);

  if (detailed) {
    b.px(hx, hy - 1, pal.trimShade);
    b.px(hx, hy + 1, pal.trimShade);
    b.px(hx - 1, hy, pal.bladeEdge);
    // 16-bit rounded bell cup highlight
    b.px16(Math.round(hx * 2), Math.round((hy - 2) * 2), pal.trim);
  }

  // Slender tempered rapier blade
  b.line(hx + 1, hy, tx, ty, pal.blade);

  if (detailed) {
    // Razor mirror-steel specular edge highlight
    const shallow = Math.abs(tx - hx) >= Math.abs(ty - hy);
    const ox = shallow ? 0 : 1;
    const oy = shallow ? -1 : 0;
    b.c.line(
      Math.round((hx + 1) * b.s) + ox,
      Math.round(hy * b.s) + oy,
      Math.round(tx * b.s) + ox,
      Math.round(ty * b.s) + oy,
      pal.bladeEdge,
    );
  }
}

// ─── Drawing Helper for Full Standing Pose ──────────────────────────────────

export function drawPose(b: Brush, p: Pose): void {
  drawCoatTails(b, p);
  drawLegs(b, p);
  drawTorso(b, p);
  drawLeftArm(b, p);
  drawHead(b, p);
  drawRapier(b, p);
}
