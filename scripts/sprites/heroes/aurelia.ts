import { defineHeroSprite, type PixelCanvas } from "../defineHeroSprite";

// ─────────────────────────────────────────────────────────────────────────────
// AURELIA — The Aetherblade Warden (Autumn Mage)
//
// Cell dimensions:
//   hi-8bit:  62 × 72 px (s = 1)
//   hi-16bit: 124 × 144 px (s = 2)
//
// Rules:
// - Feet sit squarely on the bottom row (y = 71 in hi-8bit, y = 143 in hi-16bit)
//   in EVERY frame (physics engine lifts the body; pose shows air time).
// - Body is centered at CX = 31 in the first cell; wide frames extend right.
// - Standing height is ~132-136 px of the 144 px cell (hi-16bit) / 66-68 px (hi-8bit).
// - 1 px transparent margin at top, left, and right after outline().
// - Clothing in rich autumn tones (wine, amber, deep green, bronze).
// - Vibrant cyan/teal ONLY for magic arcs, sigils, and Aether crystal flame.
// ─────────────────────────────────────────────────────────────────────────────

const CX = 31;      // Body centre in hi-8bit coords (62 / 2)
const FLOOR8 = 71;  // Bottom row in hi-8bit cell (72 - 1)

// ─── Palettes ─────────────────────────────────────────────────────────────────

interface Palette {
  outline:      string;
  skin:         string;
  skinShade:    string;
  hair:         string;
  hairLight:    string;
  hairShade:    string;
  feather:      string;
  featherShade: string;
  robe:         string;
  robeLight:    string;
  robeShade:    string;
  sash:         string;
  sashShade:    string;
  trim:         string;
  trimShade:    string;
  boot:         string;
  bootShade:    string;
  staff:        string;
  staffLight:   string;
  gem:          string;
  magic:        string;
  magicDim:     string;
  magicCore:    string;
}

const HI8: Palette = {
  outline:      "#160f14",
  skin:         "#f3ba9d",
  skinShade:    "#f3ba9d",
  hair:         "#4e2216",
  hairLight:    "#4e2216",
  hairShade:    "#4e2216",
  feather:      "#e59b24",
  featherShade: "#e59b24",
  robe:         "#6a1e36",
  robeLight:    "#6a1e36",
  robeShade:    "#6a1e36",
  sash:         "#2a5c28",
  sashShade:    "#2a5c28",
  trim:         "#c8842a",
  trimShade:    "#c8842a",
  boot:         "#3a2010",
  bootShade:    "#3a2010",
  staff:        "#4e2216",
  staffLight:   "#4e2216",
  gem:          "#4ee2d4",
  magic:        "#4ee2d4",
  magicDim:     "#29a89e",
  magicCore:    "#def",
};

const HI16: Palette = {
  outline:      "#160f14",
  skin:         "#f4c0a0",
  skinShade:    "#b86d52",
  hair:         "#4e2216",
  hairLight:    "#6c3322",
  hairShade:    "#3a1912",
  feather:      "#e8a830",
  featherShade: "#8a4f15",
  robe:         "#51162c",
  robeLight:    "#822646",
  robeShade:    "#2a0918",
  sash:         "#2d5a3f",
  sashShade:    "#173322",
  trim:         "#e59b24",
  trimShade:    "#8a4f15",
  boot:         "#3a2010",
  bootShade:    "#1e0e08",
  staff:        "#5c2a1a",
  staffLight:   "#9b5a2b",
  gem:          "#4ee2d4",
  magic:        "#6efaf0",
  magicDim:     "#198a82",
  magicCore:    "#def",
};

// ─── Drawing Brush ───────────────────────────────────────────────────────────

class Brush {
  constructor(
    readonly c: PixelCanvas,
    readonly s: number,
    readonly detailed: boolean,
    readonly pal: Palette,
  ) {}

  px(x: number, y: number, col: string): void {
    const sx = Math.round(x * this.s);
    const sy = Math.round(y * this.s);
    if (sx >= 2 && sy >= 2 && sx <= this.c.width - 3 && sy <= this.c.height - 1) {
      this.c.px(sx, sy, col);
    }
  }

  px16(sx: number, sy: number, col: string): void {
    if (sx >= 2 && sy >= 2 && sx <= this.c.width - 3 && sy <= this.c.height - 1) {
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
    const cx0 = Math.max(2, sx);
    const cy0 = Math.max(2, sy);
    const cx1 = Math.min(this.c.width - 3, sx + sw - 1);
    const cy1 = Math.min(this.c.height - 1, sy + sh - 1);
    if (cx1 >= cx0 && cy1 >= cy0) {
      this.c.rect(cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1, col);
    }
  }

  rect16(sx: number, sy: number, sw: number, sh: number, col: string): void {
    if (sw <= 0 || sh <= 0) return;
    const cx0 = Math.max(2, sx);
    const cy0 = Math.max(2, sy);
    const cx1 = Math.min(this.c.width - 3, sx + sw - 1);
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
      const lx0 = Math.max(2, Math.min(this.c.width - 3, Math.round(x0 * s) + ox));
      const ly0 = Math.max(2, Math.min(this.c.height - 1, Math.round(y0 * s) + oy));
      const lx1 = Math.max(2, Math.min(this.c.width - 3, Math.round(x1 * s) + ox));
      const ly1 = Math.max(2, Math.min(this.c.height - 1, Math.round(y1 * s) + oy));
      this.c.line(lx0, ly0, lx1, ly1, col);
    }
  }

  line16(sx0: number, sy0: number, sx1: number, sy1: number, col: string): void {
    const lx0 = Math.max(2, Math.min(this.c.width - 3, sx0));
    const ly0 = Math.max(2, Math.min(this.c.height - 1, sy0));
    const lx1 = Math.max(2, Math.min(this.c.width - 3, sx1));
    const ly1 = Math.max(2, Math.min(this.c.height - 1, sy1));
    this.c.line(lx0, ly0, lx1, ly1, col);
  }
}

// ─── Poses and Animation State ───────────────────────────────────────────────

interface LegState {
  x: number;       // Foot x offset from CX
  lift: number;    // 0 = planted on FLOOR8 (y = 71)
  kneeX: number;   // Knee x offset from CX
}

interface StaffPose {
  grip: [number, number]; // [x, y] in hi-8bit coords
  tip:  [number, number]; // [x, y] in hi-8bit coords
}

interface MagicEffect {
  kind: "spark" | "blade" | "arc" | "blast" | "wave" | "sigil" | "shield" | "motes" | "dash_trail";
  minX?: number;
  maxX: number;
  y: number;
  h?: number;
}

interface Pose {
  bob: number;         // Vertical bob (positive = drops lower)
  lean: number;        // Horizontal lean (positive = leans right/forward)
  legL: LegState;      // Left (front/exposed) leg
  legR: LegState;      // Right (back) leg
  robeFlare?: number;  // Extra robe billowing width on left
  hairWind?: number;   // Hair trailing shift
  staff: StaffPose;    // Position of focus staff
  magic?: MagicEffect; // Magical VFX
}

// Standing height target:
// Head top at y = 5 in hi-8bit (10 in hi-16bit). Outline reaches y = 9.
// Floor at y = 143 in hi-16bit.
// Standing height: 143 - 9 + 1 = 135 px! (Requirement: 132-136 px).

const REST_STAFF: StaffPose = {
  grip: [CX + 6, 32],
  tip:  [CX + 13, 14],
};

const REST_POSE: Pose = {
  bob: 0,
  lean: 0,
  legL: { x: -4, lift: 0, kneeX: -3 },
  legR: { x: 3,  lift: 0, kneeX: 3 },
  robeFlare: 0,
  hairWind: 0,
  staff: REST_STAFF,
};

// ─── Pose Tables for All 8 Animations ────────────────────────────────────────

const POSES: Partial<Record<string, Pose[]>> = {
  // ─── Idle (6 frames, 1 cell each) ──────────────────────────────────────────
  idle: [
    // 0: Neutral standing rest
    {
      ...REST_POSE,
      bob: 0, lean: 0,
      staff: { grip: [CX + 6, 32], tip: [CX + 13, 14] },
    },
    // 1: Inhale start (chest rises, staff tip floats up 1px)
    {
      ...REST_POSE,
      bob: -1, lean: 0,
      hairWind: 1,
      staff: { grip: [CX + 6, 31], tip: [CX + 13, 13] },
    },
    // 2: Inhale peak (subtle alert head tilt, spark at crystal)
    {
      ...REST_POSE,
      bob: -1, lean: 1,
      hairWind: 1,
      staff: { grip: [CX + 7, 31], tip: [CX + 14, 13] },
      magic: { kind: "spark", maxX: CX + 15, y: 13 },
    },
    // 3: Hold breath (steady posture)
    {
      ...REST_POSE,
      bob: -1, lean: 1,
      hairWind: 0,
      staff: { grip: [CX + 7, 31], tip: [CX + 14, 14] },
    },
    // 4: Exhale start (shoulders settle)
    {
      ...REST_POSE,
      bob: 0, lean: 1,
      hairWind: 0,
      staff: { grip: [CX + 6, 32], tip: [CX + 13, 14] },
    },
    // 5: Exhale trough (relaxed return)
    {
      ...REST_POSE,
      bob: 0, lean: 0,
      hairWind: -1,
      staff: { grip: [CX + 6, 32], tip: [CX + 13, 15] },
    },
  ],

  // ─── Run (10 frames: [1, 1, 1, 1, 2, 1, 2, 1, 1, 1] cells) ────────────────
  // Stride cycle with flowing robe tails and streaming hair.
  // Wide frames 4 & 6 extend rear robes and forward stride across span 2.
  run: [
    // 0 [1 cell]: Right heel strike; right boot on y=71, left driving back
    {
      bob: 0, lean: 2,
      legL: { x: -7, lift: 0, kneeX: -5 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 3, hairWind: 3,
      staff: { grip: [CX + 4, 33], tip: [CX + 14, 24] },
    },
    // 1 [1 cell]: Weight absorption; knee flexes deeply
    {
      bob: 1, lean: 3,
      legL: { x: -6, lift: 0, kneeX: -4 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 4, hairWind: 4,
      staff: { grip: [CX + 5, 34], tip: [CX + 14, 25] },
    },
    // 2 [1 cell]: Stride push-off; toe snaps off, left swinging through
    {
      bob: 1, lean: 4,
      legL: { x: -4, lift: 0, kneeX: -2 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 4, hairWind: 5,
      staff: { grip: [CX + 6, 33], tip: [CX + 15, 23] },
    },
    // 3 [1 cell]: Flight phase 1; feline sprint elongation
    {
      bob: 0, lean: 5,
      legL: { x: -6, lift: 0, kneeX: -4 },
      legR: { x: 7,  lift: 0, kneeX: 6 },
      robeFlare: 5, hairWind: 6,
      staff: { grip: [CX + 6, 32], tip: [CX + 15, 22] },
    },
    // 4 [2 cells]: Left foot plant & wide flare; robe tails whip out to x:15..88
    {
      bob: 0, lean: 4,
      legL: { x: 8,  lift: 0, kneeX: 6 },
      legR: { x: -9, lift: 0, kneeX: -7 },
      robeFlare: 16, hairWind: 7,
      staff: { grip: [CX + 10, 32], tip: [88, 22] },
    },
    // 5 [1 cell]: Left knee absorption; weight rolls forward
    {
      bob: 1, lean: 3,
      legL: { x: 5,  lift: 0, kneeX: 4 },
      legR: { x: -6, lift: 0, kneeX: -5 },
      robeFlare: 4, hairWind: 5,
      staff: { grip: [CX + 6, 33], tip: [CX + 15, 24] },
    },
    // 6 [2 cells]: Left toe launch & extension; wine robes stream to x:15..88
    {
      bob: 1, lean: 5,
      legL: { x: 7,  lift: 0, kneeX: 6 },
      legR: { x: -8, lift: 0, kneeX: -6 },
      robeFlare: 15, hairWind: 7,
      staff: { grip: [CX + 9, 32], tip: [88, 20] },
    },
    // 7 [1 cell]: Flight phase 2; gliding posture
    {
      bob: 0, lean: 4,
      legL: { x: -5, lift: 0, kneeX: -3 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 4, hairWind: 5,
      staff: { grip: [CX + 5, 32], tip: [CX + 14, 22] },
    },
    // 8 [1 cell]: Right foot descent; reaching toward floor
    {
      bob: 0, lean: 3,
      legL: { x: -6, lift: 0, kneeX: -4 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 3, hairWind: 4,
      staff: { grip: [CX + 5, 33], tip: [CX + 14, 23] },
    },
    // 9 [1 cell]: Stride reset transition; ready to loop
    {
      bob: 0, lean: 2,
      legL: { x: -5, lift: 0, kneeX: -3 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 2, hairWind: 3,
      staff: { grip: [CX + 5, 33], tip: [CX + 14, 24] },
    },
  ],

  // ─── Jump (3 frames, 1 cell each) ──────────────────────────────────────────
  // Rule: Lowest pixel ALWAYS on bottom row (y = 71); pose shows air time!
  jump: [
    // 0: Compression launch coil
    {
      bob: 3, lean: 1,
      legL: { x: -6, lift: 0, kneeX: -7 },
      legR: { x: 5,  lift: 0, kneeX: 6 },
      robeFlare: 2, hairWind: 1,
      staff: { grip: [CX + 5, 33], tip: [CX + 12, 16] },
    },
    // 1: Upward ascension; legs tucked in mid-air coil, toe touches y=71
    {
      bob: -1, lean: 2,
      legL: { x: -3, lift: 0, kneeX: -5 },
      legR: { x: 4,  lift: 0, kneeX: 2 },
      robeFlare: 3, hairWind: -2,
      staff: { grip: [CX + 6, 30], tip: [CX + 13, 8] },
    },
    // 2: Aerial apex; graceful straighten, hair flaring up, staff 45 deg down
    {
      bob: 0, lean: 1,
      legL: { x: -4, lift: 0, kneeX: -3 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 4, hairWind: -3,
      staff: { grip: [CX + 7, 31], tip: [CX + 15, 26] },
    },
  ],

  // ─── Fall (3 frames: [1, 2, 1] cells) ──────────────────────────────────────
  // Rule: Lowest pixel on y = 71; aerodynamic robes and hair billowing up.
  fall: [
    // 0 [1 cell]: Descent initiation; toes pointed down
    {
      bob: 0, lean: 1,
      legL: { x: -4, lift: 0, kneeX: -3 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 3, hairWind: -3,
      staff: { grip: [CX + 6, 31], tip: [CX + 13, 10] },
    },
    // 1 [2 cells]: Aerodynamic terminal drop; wide arms and billowing robes to x:16..86
    {
      bob: -1, lean: 2,
      legL: { x: -6, lift: 0, kneeX: -4 },
      legR: { x: 7,  lift: 0, kneeX: 5 },
      robeFlare: 14, hairWind: -4,
      staff: { grip: [CX + 8, 30], tip: [86, 12] },
    },
    // 2 [1 cell]: Pre-landing flare; knees bending to absorb impact
    {
      bob: 2, lean: 1,
      legL: { x: -5, lift: 0, kneeX: -6 },
      legR: { x: 5,  lift: 0, kneeX: 6 },
      robeFlare: 3, hairWind: 0,
      staff: { grip: [CX + 6, 33], tip: [CX + 14, 20] },
    },
  ],

  // ─── Attack (7 frames: [2, 2, 2, 2, 2, 2, 3] cells) ───────────────────────
  // CRITICAL: All span-2 frames (0..5) reach x ~ 95..96 to eliminate drift!
  attack: [
    // 0 [2 cells]: Arc windup coil; cyan sparks gather forward to x=95
    {
      bob: 1, lean: -2,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 2, hairWind: -1,
      staff: { grip: [CX + 2, 32], tip: [CX - 8, 14] },
      magic: { kind: "spark", minX: CX + 8, maxX: 95, y: 28, h: 4 },
    },
    // 1 [2 cells]: Step lunge & low crescent arc igniting forward to x=95
    {
      bob: 1, lean: 3,
      legL: { x: -8, lift: 0, kneeX: -6 },
      legR: { x: 7,  lift: 0, kneeX: 6 },
      robeFlare: 4, hairWind: 3,
      staff: { grip: [CX + 12, 33], tip: [74, 36] },
      magic: { kind: "arc", minX: 72, maxX: 95, y: 34, h: 6 },
    },
    // 2 [2 cells]: Crescent sweep slash; vibrant Aether blade manifests to x=96
    {
      bob: 1, lean: 5,
      legL: { x: -8, lift: 0, kneeX: -6 },
      legR: { x: 8,  lift: 0, kneeX: 7 },
      robeFlare: 6, hairWind: 5,
      staff: { grip: [CX + 14, 33], tip: [82, 30] },
      magic: { kind: "blade", minX: 78, maxX: 96, y: 28, h: 8 },
    },
    // 3 [2 cells]: Rising arc cleave; luminous cyan energy erupts to x=96
    {
      bob: 0, lean: 5,
      legL: { x: -8, lift: 0, kneeX: -6 },
      legR: { x: 8,  lift: 0, kneeX: 7 },
      robeFlare: 6, hairWind: 6,
      staff: { grip: [CX + 14, 31], tip: [80, 16] },
      magic: { kind: "wave", minX: 76, maxX: 96, y: 14, h: 16 },
    },
    // 4 [2 cells]: Overhead slash release; crescent cuts forward to x=96
    {
      bob: 1, lean: 4,
      legL: { x: -7, lift: 0, kneeX: -5 },
      legR: { x: 7,  lift: 0, kneeX: 6 },
      robeFlare: 5, hairWind: 4,
      staff: { grip: [CX + 12, 32], tip: [84, 26] },
      magic: { kind: "blade", minX: 78, maxX: 96, y: 24, h: 10 },
    },
    // 5 [2 cells]: Follow-through & energy rip; lingering ember motes to x=95
    {
      bob: 1, lean: 3,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 3, hairWind: 3,
      staff: { grip: [CX + 10, 33], tip: [78, 30] },
      magic: { kind: "motes", minX: 74, maxX: 95, y: 26, h: 8 },
    },
    // 6 [3 cells]: Master Aether wave; colossal shockwave surges to x=155
    {
      bob: 0, lean: 2,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 3, hairWind: 2,
      staff: { grip: [CX + 7, 32], tip: [CX + 14, 12] },
      magic: { kind: "wave", minX: CX + 16, maxX: 155, y: 20, h: 28 },
    },
  ],

  // ─── Dash (5 frames, 2 cells each) ─────────────────────────────────────────
  // Spectral wine and teal slipstream trailing behind, staff leading to x=96.
  // Consistent span-2 bounds (minX ~ 16, maxX ~ 96) for zero drift!
  dash: [
    // 0 [2 cells]: Phase charge crouch; cyan glyphs shimmer to x=95
    {
      bob: 5, lean: 4,
      legL: { x: -7, lift: 0, kneeX: -8 },
      legR: { x: 7,  lift: 0, kneeX: 8 },
      robeFlare: 4, hairWind: 4,
      staff: { grip: [CX + 10, 42], tip: [80, 44] },
      magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 48, h: 12 },
    },
    // 1 [2 cells]: Phase shift launch; spectral afterimages stretch back to x=16
    {
      bob: 4, lean: 6,
      legL: { x: -9, lift: 0, kneeX: -9 },
      legR: { x: 9,  lift: 0, kneeX: 9 },
      robeFlare: 8, hairWind: 7,
      staff: { grip: [CX + 12, 40], tip: [96, 38] },
      magic: { kind: "dash_trail", minX: 16, maxX: 96, y: 44, h: 14 },
    },
    // 2 [2 cells]: Spectral transit apex; arrow glide
    {
      bob: 3, lean: 6,
      legL: { x: -9, lift: 0, kneeX: -9 },
      legR: { x: 9,  lift: 0, kneeX: 9 },
      robeFlare: 8, hairWind: 8,
      staff: { grip: [CX + 13, 39], tip: [96, 36] },
      magic: { kind: "dash_trail", minX: 16, maxX: 96, y: 42, h: 14 },
    },
    // 3 [2 cells]: Phase deceleration; staff brakes outward
    {
      bob: 4, lean: 4,
      legL: { x: -8, lift: 0, kneeX: -8 },
      legR: { x: 8,  lift: 0, kneeX: 8 },
      robeFlare: 6, hairWind: 5,
      staff: { grip: [CX + 11, 40], tip: [90, 40] },
      magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 46, h: 12 },
    },
    // 4 [2 cells]: Ground skid & upright transition; friction embers
    {
      bob: 3, lean: 2,
      legL: { x: -6, lift: 0, kneeX: -6 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 4, hairWind: 3,
      staff: { grip: [CX + 8, 38], tip: [82, 34] },
      magic: { kind: "dash_trail", minX: 16, maxX: 95, y: 52, h: 10 },
    },
  ],

  // ─── Cast (7 frames: [2, 1, 2, 2, 2, 2, 2] cells) ──────────────────────────
  // All span-2 frames (0, 2, 3, 4, 5, 6) reach x ~ 94..96 to eliminate drift!
  cast: [
    // 0 [2 cells]: Incantation drop & focus; staff planted, cyan spark to x=94
    {
      bob: 1, lean: 0,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 2, hairWind: 0,
      staff: { grip: [CX + 7, 33], tip: [CX + 7, FLOOR8 - 2] },
      magic: { kind: "spark", minX: CX + 8, maxX: 94, y: 30, h: 4 },
    },
    // 1 [1 cell]: Harmonic resonance; both hands channel energy
    {
      bob: 0, lean: 1,
      legL: { x: -5, lift: 0, kneeX: -4 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 1, hairWind: 1,
      staff: { grip: [CX + 6, 32], tip: [CX + 12, 12] },
      magic: { kind: "spark", minX: CX + 8, maxX: CX + 14, y: 24, h: 4 },
    },
    // 2 [2 cells]: Sigil manifestation; circular Aether glyph to x=95
    {
      bob: 0, lean: 2,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 3, hairWind: 2,
      staff: { grip: [CX + 8, 32], tip: [72, 26] },
      magic: { kind: "sigil", minX: 64, maxX: 95, y: 20, h: 22 },
    },
    // 3 [2 cells]: Arcane barrier ignition; rotating shield disc to x=96
    {
      bob: 1, lean: 3,
      legL: { x: -7, lift: 0, kneeX: -6 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 4, hairWind: 3,
      staff: { grip: [CX + 9, 32], tip: [74, 26] },
      magic: { kind: "shield", minX: 66, maxX: 96, y: 16, h: 26 },
    },
    // 4 [2 cells]: Spell detonation pulse; celestial disc shockwave rays to x=96
    {
      bob: 1, lean: 3,
      legL: { x: -7, lift: 0, kneeX: -6 },
      legR: { x: 6,  lift: 0, kneeX: 5 },
      robeFlare: 5, hairWind: 4,
      staff: { grip: [CX + 10, 32], tip: [76, 26] },
      magic: { kind: "blast", minX: 64, maxX: 96, y: 14, h: 30 },
    },
    // 5 [2 cells]: Energy sustain & discharge; pulsing concentric rings to x=95
    {
      bob: 0, lean: 2,
      legL: { x: -6, lift: 0, kneeX: -5 },
      legR: { x: 5,  lift: 0, kneeX: 4 },
      robeFlare: 3, hairWind: 2,
      staff: { grip: [CX + 8, 32], tip: [74, 26] },
      magic: { kind: "sigil", minX: 66, maxX: 95, y: 18, h: 24 },
    },
    // 6 [2 cells]: Arcane dissipation & rest; barrier shatters into motes to x=94
    {
      bob: 0, lean: 1,
      legL: { x: -5, lift: 0, kneeX: -4 },
      legR: { x: 4,  lift: 0, kneeX: 3 },
      robeFlare: 2, hairWind: 1,
      staff: { grip: [CX + 6, 33], tip: [CX + 13, 16] },
      magic: { kind: "motes", minX: 60, maxX: 94, y: 22, h: 16 },
    },
  ],

  // ─── Crouch (2 frames, 2 cells each) ───────────────────────────────────────
  // Clearly lower (~70% standing height: 48 px / 96 px in hi-16bit).
  // Staff horizontal across knees extending into cell 2 to x=86.
  // Both frames span 2: consistent minX ~ 18, maxX ~ 86 for zero drift!
  crouch: [
    // 0 [2 cells]: Low drop transition
    {
      bob: 8, lean: 2,
      legL: { x: -7, lift: 0, kneeX: -9 },
      legR: { x: 6,  lift: 0, kneeX: 8 },
      robeFlare: 5, hairWind: 1,
      staff: { grip: [CX + 6, 44], tip: [86, 46] },
    },
    // 1 [2 cells]: Grounded predatory coil; compact feline squat
    {
      bob: 11, lean: 1,
      legL: { x: -8, lift: 0, kneeX: -10 },
      legR: { x: 7,  lift: 0, kneeX: 9 },
      robeFlare: 6, hairWind: 0,
      staff: { grip: [CX + 5, 47], tip: [86, 49] },
    },
  ],
};

// ─── Drawing Functions for Parts ─────────────────────────────────────────────

function torsoY(p: Pose): number {
  return 20 + p.bob;
}

function headY(p: Pose): number {
  return 7 + p.bob;
}

// 1. Draw Boots (sitting on FLOOR8)
function drawBoots(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const legs = [
    { state: p.legL, isExposed: true },
    { state: p.legR, isExposed: false },
  ];

  for (const { state, isExposed } of legs) {
    const footX = CX + state.x + p.lean;
    const footY = FLOOR8 - state.lift; // y = 71 when lift = 0

    // Traveling Boot (3 px high: y=69..71)
    b.rect(footX - 2, footY - 2, 5, 3, pal.boot);

    // Bronze buckle / cuff at top of boot
    b.rect(footX - 2, footY - 3, 5, 1, pal.trim);

    if (detailed) {
      b.rect(footX - 2, footY - 1, 2, 2, pal.bootShade);
      b.px(footX, footY - 3, pal.trimShade);
      if (isExposed) {
        b.px16(Math.round((footX + 1) * 2), Math.round((footY - 2) * 2), pal.trim);
      }
    }
  }
}

// 2. Draw Legs (Slender legs; left exposed through robe slit)
function drawLegs(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const hipY = tY + 13;

  // Back (right) leg under shadows
  const rFootX = CX + p.legR.x + p.lean;
  const rFootY = FLOOR8 - p.legR.lift;
  const rKneeX = CX + p.legR.kneeX + p.lean;
  const rKneeY = Math.round((hipY + rFootY) / 2);
  b.line(CX + 2 + p.lean, hipY, rKneeX, rKneeY, pal.robeShade);
  b.line(rKneeX, rKneeY, rFootX, rFootY - 3, pal.robeShade);

  // Front (left) leg — exposed through robe slit (warm skin!)
  const lFootX = CX + p.legL.x + p.lean;
  const lFootY = FLOOR8 - p.legL.lift;
  const lKneeX = CX + p.legL.kneeX + p.lean;
  const lKneeY = Math.round((hipY + lFootY) / 2);

  // Thigh & Shin in skin color
  b.line(CX - 2 + p.lean, hipY, lKneeX, lKneeY, pal.skin);
  b.line(CX - 1 + p.lean, hipY, lKneeX + 1, lKneeY, pal.skin);
  b.line(lKneeX, lKneeY, lFootX, lFootY - 3, pal.skin);
  b.line(lKneeX + 1, lKneeY, lFootX + 1, lFootY - 3, pal.skin);

  if (detailed) {
    b.line(CX - 2 + p.lean, hipY, lKneeX, lKneeY, pal.skinShade);
    b.line(lKneeX, lKneeY, lFootX, lFootY - 3, pal.skinShade);
  }
}

// 3. Draw Robe (Asymmetrical flowing gothic skirt with side slit)
function drawRobe(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const hipY = tY + 12;
  const flare = p.robeFlare ?? 0;

  // Rear billow / cascade on the left
  const skirtLeft = CX - 9 - flare + p.lean;
  const skirtWidth = 14 + flare;
  const skirtHeight = Math.max(8, FLOOR8 - hipY - 6);

  // Deep wine fabric
  b.rect(skirtLeft, hipY, skirtWidth, skirtHeight, pal.robe);

  // Under-fabric dark pine lining peek on left edge
  b.rect(skirtLeft, hipY + 2, 2, skirtHeight - 2, pal.sashShade);

  // Bronze filigree trim on bottom hem
  b.rect(skirtLeft, hipY + skirtHeight - 1, skirtWidth, 1, pal.trim);

  if (detailed) {
    b.rect(skirtLeft + 2, hipY, 3, skirtHeight, pal.robeLight);
    b.rect(skirtLeft + skirtWidth - 3, hipY, 3, skirtHeight, pal.robeShade);
    b.rect(skirtLeft, hipY + skirtHeight, skirtWidth, 1, pal.trimShade);
    // 16-bit fold highlight
    b.line16(
      Math.round((skirtLeft + 4) * 2),
      Math.round((hipY + 1) * 2),
      Math.round((skirtLeft + 2) * 2),
      Math.round((hipY + skirtHeight - 2) * 2),
      pal.robeLight,
    );
  }
}

// 4. Draw Sash & Belt (Forest green sash tied at hip with bronze buckle)
function drawSash(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const beltY = tY + 11;
  const beltX = CX - 7 + p.lean;
  const beltW = 14;

  // Forest green angled sash
  b.rect(beltX, beltY, beltW, 2, pal.sash);

  // Trailing ribbons on hip
  b.rect(CX - 6 + p.lean, beltY + 2, 2, 5, pal.sash);
  b.rect(CX - 5 + p.lean, beltY + 4, 2, 4, pal.sashShade);

  // Antique bronze filigree buckle
  b.rect(CX - 1 + p.lean, beltY, 3, 2, pal.trim);

  if (detailed) {
    b.rect(beltX, beltY, beltW, 1, pal.sash);
    b.rect(beltX, beltY + 1, beltW, 1, pal.sashShade);
    b.px(CX + p.lean, beltY + 1, pal.trimShade);
  }
}

// 5. Draw Torso (Autumn wine fitted bodice with bronze filigree)
function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const tX = CX - 6 + p.lean;
  const tW = 13;
  const tH = 12;

  // Bodice body
  b.rect(tX, tY, tW, tH, pal.robe);

  // Dark cowl neckline hugging collar
  b.rect(tX + 1, tY, tW - 2, 3, pal.robeShade);
  b.rect(CX - 1 + p.lean, tY - 2, 3, 2, pal.skin); // Throat

  // Antique bronze filigree fasteners down front
  b.px(CX + p.lean, tY + 4, pal.trim);
  b.px(CX + p.lean, tY + 7, pal.trim);
  b.px(CX + p.lean, tY + 9, pal.trim);

  // Slender arms
  // Left arm (trailing / balance)
  b.rect(tX - 2, tY + 1, 2, 8, pal.robe);
  b.rect(tX - 2, tY + 8, 2, 2, pal.skin); // Left hand

  // Right arm (holding staff at grip)
  const armX = CX + 3 + p.lean;
  b.rect(armX, tY + 2, 3, 6, pal.robe);
  b.rect(armX + 1, tY + 7, 3, 3, pal.skin); // Right hand

  if (detailed) {
    b.rect(tX, tY, 2, tH, pal.robeLight);
    b.rect(tX + tW - 2, tY, 2, tH, pal.robeShade);
    b.px16(Math.round((CX + p.lean) * 2), Math.round((tY + 4) * 2), pal.trim);
    b.px16(Math.round((CX + p.lean) * 2), Math.round((tY + 7) * 2), pal.trim);
  }
}

// 6. Draw Head (Face, Chestnut Hair Cascade, Amber Feather Crest)
function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hY = headY(p);
  const hX = CX - 4 + p.lean;
  const wind = p.hairWind ?? 0;

  // --- Voluminous Wild Chestnut Hair ---
  // Large billowing mass behind head on left
  const hairLeft = CX - 12 - wind + p.lean;
  const hairWidth = 9 + wind;
  b.rect(hairLeft, hY + 1, hairWidth, 12, pal.hair);
  b.rect(hairLeft + 1, hY + 12, hairWidth - 2, 7, pal.hair); // Cascade down back

  // Hair crown on top of head
  b.rect(hX - 2, hY, 11, 4, pal.hair);

  if (detailed) {
    b.rect(hairLeft, hY + 1, 3, 12, pal.hairShade);
    b.rect(hairLeft + 3, hY + 1, 3, 10, pal.hairLight);
    b.rect(hX - 2, hY, 8, 2, pal.hairLight);
  }

  // --- Face ---
  // Sharp jawline & pale complexion
  b.rect(hX, hY + 3, 8, 7, pal.skin);
  b.rect(hX + 1, hY + 9, 6, 2, pal.skin);

  // Alert amber eye
  b.px(hX + 4, hY + 5, pal.trim);
  b.px(hX + 5, hY + 5, pal.outline);

  if (detailed) {
    b.rect(hX, hY + 8, 2, 3, pal.skinShade); // Jaw shadow
    b.px16(Math.round((hX + 4) * 2), Math.round((hY + 5) * 2), pal.feather);
  }

  // --- Amber Crest Feather (Signature Silhouette Accent) ---
  // Tucked behind left ear at crown, pointing up-left.
  // Kept safely at y >= 4 in hi-8bit (y >= 8 in hi-16bit) so row 0 stays clear!
  const featherX = CX - 5 + p.lean;
  const featherY = Math.max(4, hY - 3);
  b.rect(featherX, featherY, 3, 3, pal.feather);
  b.rect(featherX - 1, featherY + 1, 2, 2, pal.feather);

  if (detailed) {
    b.px(featherX + 1, featherY + 1, pal.featherShade); // Central rachis
    b.px16(Math.round((featherX) * 2), Math.round((featherY) * 2), pal.feather);
  }
}

// 7. Draw Arcane Focus Staff & Crescent Tip
function drawStaff(b: Brush, p: Pose, cellW8: number): void {
  const { pal, detailed } = b;
  const gx = p.staff.grip[0];
  const gy = p.staff.grip[1];
  const tx = Math.max(3, Math.min(cellW8 - 4, p.staff.tip[0]));
  const ty = Math.max(3, Math.min(FLOOR8 - 1, p.staff.tip[1]));

  // Buttend reaches opposite direction through grip
  const bx = Math.max(3, Math.min(cellW8 - 4, Math.round(gx - (tx - gx) * 0.35)));
  const by = Math.max(3, Math.min(FLOOR8 - 1, Math.round(gy - (ty - gy) * 0.35)));

  // Polished cedar shaft
  b.line(bx, by, tx, ty, pal.staff);

  // Bronze ferrule at butt
  b.px(bx, by, pal.trim);

  // Bronze Crescent Cage at crown tip
  b.rect(tx - 1, ty - 1, 3, 3, pal.trim);
  b.px(tx, ty, pal.gem); // Glowing cyan Aether crystal

  if (detailed) {
    b.line(gx, gy, tx, ty, pal.staffLight);
    b.px(tx - 1, ty - 1, pal.trimShade);
    b.px16(Math.round(tx * 2), Math.round(ty * 2), pal.magicCore);
    // Subtle arcane radiance around gem
    b.px(tx + 1, ty, pal.magic);
    b.px(tx, ty - 1, pal.magicDim);
  }
}

// 8. Draw Magic Effects (Cyan / Teal Arcane Aether VFX)
function drawMagic(b: Brush, p: Pose, cellW8: number): void {
  if (!p.magic) return;
  const { pal, detailed } = b;
  const { kind, minX = CX + 10, maxX, y, h = 6 } = p.magic;

  const x0 = Math.max(2, minX);
  const x1 = Math.min(cellW8 - 3, maxX);
  if (x1 <= x0) return;

  const w = x1 - x0 + 1;
  const cy = Math.max(3, Math.min(FLOOR8 - h, y));

  switch (kind) {
    case "spark": {
      b.rect(x0, cy, w, 2, pal.magic);
      b.px(x1, cy, pal.gem);
      if (detailed) {
        b.rect(x0, cy, w, 1, pal.magicCore);
      }
      break;
    }

    case "blade":
    case "arc": {
      // Sweeping crescent blade
      b.rect(x0, cy, w, h, pal.magicDim);
      b.rect(x0 + 2, cy + 1, w - 2, h - 2, pal.magic);
      b.line(x0 + 4, cy + Math.round(h / 2), x1, cy + Math.round(h / 2), pal.magicCore);
      if (detailed) {
        b.px16(Math.round(x1 * 2), Math.round((cy + Math.round(h / 2)) * 2), pal.magicCore);
      }
      break;
    }

    case "wave":
    case "blast": {
      // Colossal shockwave / vertical celestial disc eruption
      b.rect(x0, cy, w, h, pal.magicDim);
      b.rect(x0 + 3, cy + 2, w - 4, h - 4, pal.magic);
      b.rect(x0 + 6, cy + 4, w - 8, h - 8, pal.magicCore);
      if (detailed) {
        // Shockwave rings
        b.line(x0 + 2, cy, x1, cy + Math.round(h / 2), pal.magic);
        b.line(x0 + 2, cy + h - 1, x1, cy + Math.round(h / 2), pal.magic);
      }
      break;
    }

    case "sigil":
    case "shield": {
      // Rotating celestial barrier disc
      b.rect(x0, cy, w, h, pal.magicDim);
      b.rect(x0 + 2, cy + 2, w - 4, h - 4, pal.magic);
      // Amber runes on outer ring
      b.px(x0 + 1, cy + 1, pal.trim);
      b.px(x1 - 1, cy + 1, pal.trim);
      b.px(x0 + 1, cy + h - 2, pal.trim);
      b.px(x1 - 1, cy + h - 2, pal.trim);
      // Glowing core
      b.rect(x0 + Math.round(w / 3), cy + Math.round(h / 3), Math.round(w / 3), Math.round(h / 3), pal.magicCore);
      break;
    }

    case "motes": {
      // Dissipating teal sparkling particles
      for (let mx = x0; mx <= x1; mx += 4) {
        const my = cy + ((mx * 7) % Math.max(1, h));
        b.px(mx, my, pal.magic);
        if (detailed && mx % 8 === 0) b.px(mx + 1, my, pal.magicCore);
      }
      break;
    }

    case "dash_trail": {
      // Spectral wine and teal slipstream
      b.rect(x0, cy, w, 2, pal.robeShade);
      b.rect(x0 + 4, cy + 2, w - 4, 2, pal.magicDim);
      b.rect(x0 + 8, cy + 4, w - 8, 2, pal.magic);
      if (detailed) {
        b.line(x0 + 12, cy + 3, x1, cy + 3, pal.magicCore);
      }
      break;
    }
  }
}

// ─── Master Draw Routine ──────────────────────────────────────────────────────

function drawAurelia(
  c: PixelCanvas,
  s: number,
  detailed: boolean,
  anim: string,
  frame: number,
  span: number,
): void {
  const p = POSES[anim]?.[frame] ?? POSES.idle![0]!;
  const pal = detailed ? HI16 : HI8;
  const b = new Brush(c, s, detailed, pal);
  const cellW8 = Math.round(c.width / s);

  // Background layers first
  drawRobe(b, p);
  drawLegs(b, p);
  drawBoots(b, p);
  drawSash(b, p);
  drawTorso(b, p);
  drawHead(b, p);

  // Foreground armament & magic
  drawStaff(b, p, cellW8);
  drawMagic(b, p, cellW8);

  // Final outline pass
  c.outline(pal.outline);
}

// ─── Export Hero Sprite Definition ───────────────────────────────────────────

export default defineHeroSprite({
  id: "aurelia",
  description: "Autumn mage with voluminous chestnut hair, wine robe, and a crescent staff that channels cyan Aether energy.",
  draw: {
    hi8bit:  (c, anim, frame, span) => drawAurelia(c, 1, false, anim, frame, span),
    hi16bit: (c, anim, frame, span) => drawAurelia(c, 2, true,  anim, frame, span),
  },
});
