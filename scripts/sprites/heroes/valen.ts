import { defineHeroSprite, type PixelCanvas } from "../defineHeroSprite";

// ─── Coordinate space ────────────────────────────────────────────────────────
// All base coordinates are defined in hi-8bit pixels for a 63 × 64 cell (s = 1).
// For hi-16bit (126 × 128 cell, s = 2), coordinates scale cleanly with genuine
// redraw detail, richer shading, specular glints, and fine trims.
//
// Origin top-left.
// Feet MUST sit on the bottom row (y = 63 in hi-8bit, y = 127 in hi-16bit)
// in EVERY frame (physics engine handles airborne displacement).
// Body is centered at BODY_X8 = 31 in the first cell; wide frames extend right.

const BODY_X8 = 31;
const FLOOR8 = 63;

// ─── Autumn Palettes ─────────────────────────────────────────────────────────

interface Palette {
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

const HI8: Palette = {
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

const HI16: Palette = {
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

type CoatStyle = "rest" | "billow_back" | "flare_up" | "stream_up" | "crouch_bunch";
type ArmStyle = "rest" | "pump_forward" | "pump_back" | "lunge" | "parry" | "cast_raise" | "cast_thrust" | "crouch";

interface LegPose {
  x: number;      // foot horizontal position
  lift: number;   // raised off floor (0 = planted at FLOOR8)
  kneeX: number;  // knee bend horizontal position
}

interface Pose {
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
  castEffect?: {
    stage:
      | "spark"
      | "gather"
      | "glow_gather"
      | "bolt_fire"
      | "bolt_peak"
      | "bolt_fade"
      | "sparks_fade"
      | "sparks_end"
      | "sigil"
      | "burst"
      | "detonation"
      | "dissipate"
      | "ember"
      | "ripple";
    reachX: number;
  };
}

// ─── Poses Definition ────────────────────────────────────────────────────────

const POSES: Partial<Record<string, Pose[]>> = {
  // ─── Idle (12 frames, FPS 8, loop: true) ──────────────────────────────────
  // Classical fencing rest with subtle breathing rhythm and blade tip bob
  idle: [
    // 0: neutral rest, duelist breath out
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 33],
    },
    // 1: neutral hold
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 32],
    },
    // 2: inhale begins (chest & head rise 1px)
    {
      bob: -1, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 19, 31],
    },
    // 3: inhale expands (blade tip raises smoothly)
    {
      bob: -1, lean: 1,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", coatShift: 1, armL: "rest",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 20, 29],
    },
    // 4: inhale peak (spectacles glint in ambient light)
    {
      bob: -1, lean: 1,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", coatShift: 1, armL: "rest",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 20, 28],
      spectacleGlint: true,
    },
    // 5: breath hold at peak
    {
      bob: -1, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 19, 29],
      spectacleGlint: true,
    },
    // 6: exhale starts (shoulders drop back to neutral)
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 31],
    },
    // 7: exhale continues
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 33],
    },
    // 8: duelist settle (1px downward compression, tip dips)
    {
      bob: 1, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 4 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "rest", coatShift: -1, armL: "rest",
      hiltOffset: [6, 15], tipPos: [BODY_X8 + 18, 35],
    },
    // 9: deep settle rest
    {
      bob: 1, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 4 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 15], tipPos: [BODY_X8 + 18, 35],
    },
    // 10: elastic recovery rising
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 34],
    },
    // 11: recovery to neutral guard
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 33],
      spectacleGlint: true,
    },
  ],

  // ─── Run (12 frames, FPS 12, loop: true) ──────────────────────────────────
  // Dynamic stride cycle: alternating legs, arm swing, flapping coat tails, 1-2px bob
  run: [
    // 0: Right heel strike forward, left leg high rear
    {
      bob: 0, lean: 2,
      legL: { x: BODY_X8 - 10, lift: 8, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "billow_back", coatShift: 3, armL: "pump_back",
      hiltOffset: [5, 13], tipPos: [BODY_X8 + 18, 35],
    },
    // 1: Right leg absorbs weight, left driving through
    {
      bob: 2, lean: 3,
      legL: { x: BODY_X8 - 6, lift: 5, kneeX: BODY_X8 - 3 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
      coat: "billow_back", coatShift: 2, armL: "pump_back",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 38],
    },
    // 2: Right toe push-off, left knee driving forward
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 - 2, lift: 7, kneeX: BODY_X8 + 2 },
      legR: { x: BODY_X8 + 1, lift: 0, kneeX: BODY_X8 + 2 },
      coat: "billow_back", coatShift: 4, armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 36],
    },
    // 3: Flight transition: right toe trailing on floor y=63
    {
      bob: 0, lean: 4,
      legL: { x: BODY_X8 + 4, lift: 5, kneeX: BODY_X8 + 6 },
      legR: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 3 },
      coat: "billow_back", coatShift: 5, armL: "pump_forward",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 19, 34],
    },
    // 4: Left foot reaching to land, right leg trailing
    {
      bob: 0, lean: 3,
      legL: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 4 },
      legR: { x: BODY_X8 - 8, lift: 6, kneeX: BODY_X8 - 6 },
      coat: "billow_back", coatShift: 4, armL: "pump_forward",
      hiltOffset: [5, 13], tipPos: [BODY_X8 + 18, 35],
    },
    // 5: Left foot flat contact, right sweeping forward
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
      legR: { x: BODY_X8 - 5, lift: 4, kneeX: BODY_X8 - 2 },
      coat: "billow_back", coatShift: 3, armL: "pump_forward",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 37],
    },
    // 6: Left push-off initiate, right knee driving high
    {
      bob: 0, lean: 2,
      legL: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 5 },
      legR: { x: BODY_X8 - 10, lift: 8, kneeX: BODY_X8 - 7 },
      coat: "billow_back", coatShift: 2, armL: "pump_back",
      hiltOffset: [5, 13], tipPos: [BODY_X8 + 18, 35],
    },
    // 7: Left leg weight absorption, right passing stance
    {
      bob: 2, lean: 3,
      legL: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
      legR: { x: BODY_X8 - 6, lift: 5, kneeX: BODY_X8 - 3 },
      coat: "billow_back", coatShift: 3, armL: "pump_back",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 38],
    },
    // 8: Left toe push-off, right driving forward
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 + 1, lift: 0, kneeX: BODY_X8 + 2 },
      legR: { x: BODY_X8 - 2, lift: 7, kneeX: BODY_X8 + 2 },
      coat: "billow_back", coatShift: 4, armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 36],
    },
    // 9: Second flight transition: left toe trailing on floor y=63
    {
      bob: 0, lean: 4,
      legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 3 },
      legR: { x: BODY_X8 + 4, lift: 5, kneeX: BODY_X8 + 6 },
      coat: "billow_back", coatShift: 5, armL: "pump_forward",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 19, 34],
    },
    // 10: Right foot reaching to land, left leg trailing
    {
      bob: 0, lean: 3,
      legL: { x: BODY_X8 - 8, lift: 6, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "billow_back", coatShift: 4, armL: "pump_forward",
      hiltOffset: [5, 13], tipPos: [BODY_X8 + 18, 35],
    },
    // 11: Stride reset, weight rolling forward
    {
      bob: 1, lean: 2,
      legL: { x: BODY_X8 - 5, lift: 4, kneeX: BODY_X8 - 2 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "billow_back", coatShift: 3, armL: "pump_forward",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 37],
    },
  ],

  // ─── Jump (3 frames, FPS 6, loop: false) ──────────────────────────────────
  // Launch compression -> tucked knees with coat flaring up -> apex reach
  jump: [
    // 0: Launch compression, knees bent out, toes snapping off floor
    {
      bob: 3, lean: 2,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 8 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 6 },
      coat: "rest", armL: "rest",
      hiltOffset: [5, 16], tipPos: [BODY_X8 + 17, 39],
    },
    // 1: Upward rise: knees tucked high, coat flaring UPWARDS, trailing toe touches floor
    {
      bob: -2, lean: 1,
      legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 6 },  // trailing toe touches y=63
      legR: { x: BODY_X8 + 4, lift: 10, kneeX: BODY_X8 + 5 }, // right knee tucked high
      coat: "flare_up", armL: "parry",
      hiltOffset: [6, 11], tipPos: [BODY_X8 + 19, 26],
    },
    // 2: Apex crest: legs extending downward, blade angled down-forward
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 4, lift: 0, kneeX: BODY_X8 - 4 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "flare_up", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 44],
    },
  ],

  // ─── Fall (1 frame, FPS 6, loop: true) ────────────────────────────────────
  // Controlled descent: legs extended, coat streaming UP
  fall: [
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 5, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "stream_up", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 48],
    },
  ],

  // ─── Attack (7 frames: [1, 2, 2, 2, 2, 3, 2] cells) ──────────────────────
  // Lunge thrusts, parries, slashes.
  // CRITICAL: All span-2 frames (1, 2, 3, 4, 6) keep right edge at x ~ 80..82
  // so body center drift warning does not fire!
  attack: [
    // 0 [1 cell]: chambering; back-weighted, front toe light
    {
      bob: 0, lean: -1,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 8 },
      legR: { x: BODY_X8 + 2, lift: 0, kneeX: BODY_X8 + 2 },
      coat: "rest", armL: "rest",
      hiltOffset: [3, 13], tipPos: [BODY_X8 + 13, 34],
    },
    // 1 [2 cells]: lunge thrust; front leg lunges, blade punches horizontally
    {
      bob: 1, lean: 4,
      legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
      legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 8 },
      coat: "billow_back", coatShift: 2, armL: "lunge",
      hiltOffset: [9, 14], tipPos: [80, 41],
    },
    // 2 [2 cells]: piercing apex lunge; full duelist lunge, blade gleam at tip
    {
      bob: 2, lean: 5,
      legL: { x: BODY_X8 - 11, lift: 0, kneeX: BODY_X8 - 10 },
      legR: { x: BODY_X8 + 10, lift: 0, kneeX: BODY_X8 + 10 },
      coat: "billow_back", coatShift: 4, armL: "lunge",
      hiltOffset: [10, 14], tipPos: [82, 41],
      spectacleGlint: true,
    },
    // 3 [2 cells]: retraction; high parry guard covering upper line
    {
      bob: 0, lean: 1,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "rest", armL: "parry",
      hiltOffset: [5, 12], tipPos: [79, 29],
    },
    // 4 [2 cells]: diagonal slash cut; rapier arcing forward-down
    {
      bob: 2, lean: 4,
      legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
      legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 7 },
      coat: "billow_back", coatShift: 3, armL: "lunge",
      hiltOffset: [8, 14], tipPos: [81, 48],
    },
    // 5 [3 cells]: master lunge extension; horizontal splits lunge + tip sparkle
    {
      bob: 3, lean: 6,
      legL: { x: BODY_X8 - 12, lift: 0, kneeX: BODY_X8 - 11 },
      legR: { x: BODY_X8 + 13, lift: 0, kneeX: BODY_X8 + 12 },
      coat: "billow_back", coatShift: 6, armL: "lunge",
      hiltOffset: [11, 15], tipPos: [145, 42],
      slashArc: true,
      spectacleGlint: true,
    },
    // 6 [2 cells]: flourish recovery; snaps upright into guard
    {
      bob: 0, lean: 1,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [79, 41],
    },
  ],

  // ─── Dash (9 frames: [1, 2, 2, 1, 1, 1, 1, 1, 1] cells) ───────────────────
  // Replaced solid black block with thin afterimage streaks in coat colors.
  // Distinct pose per frame (no identical frames).
  dash: [
    // 0 [1 cell]: compression charge
    {
      bob: 4, lean: 3,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 9 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "crouch_bunch", armL: "rest",
      hiltOffset: [5, 16], tipPos: [BODY_X8 + 19, 44],
    },
    // 1 [2 cells]: temporal launch; streaks behind
    {
      bob: 3, lean: 5,
      legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 8 },
      legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 7 },
      coat: "billow_back", coatShift: 4, armL: "lunge",
      hiltOffset: [9, 14], tipPos: [76, 42],
      dashStreak: 1,
    },
    // 2 [2 cells]: warp transit apex; different streak alignment
    {
      bob: 2, lean: 6,
      legL: { x: BODY_X8 - 10, lift: 0, kneeX: BODY_X8 - 9 },
      legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 8 },
      coat: "billow_back", coatShift: 5, armL: "lunge",
      hiltOffset: [10, 14], tipPos: [78, 42],
      dashStreak: 2,
    },
    // 3 [1 cell]: sustained glide 1
    {
      bob: 2, lean: 4,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "billow_back", coatShift: 3, armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 20, 41],
    },
    // 4 [1 cell]: sustained glide 2 (different flutter)
    {
      bob: 2, lean: 3,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "billow_back", coatShift: 4, armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 19, 41],
    },
    // 5 [1 cell]: sustained glide 3
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 6, lift: 0, kneeX: BODY_X8 + 6 },
      coat: "billow_back", coatShift: 2, armL: "rest",
      hiltOffset: [6, 13], tipPos: [BODY_X8 + 19, 40],
    },
    // 6 [1 cell]: deceleration, front heel drops
    {
      bob: 1, lean: 1,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 5 },
      coat: "billow_back", coatShift: 1, armL: "rest",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 18, 40],
    },
    // 7 [1 cell]: braking plant
    {
      bob: 2, lean: 0,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "rest", armL: "rest",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 41],
    },
    // 8 [1 cell]: slide to upright
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "rest",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 33],
    },
  ],

  // ─── Cast (8 frames: [1, 1, 2, 2, 2, 2, 2, 2] cells) ──────────────────────
  // Hand raised, glow gathers (0-2), solar bolt from palm (3-5), fading sparks (6-7).
  // CRITICAL: All span-2 frames (2..7) reach x ~ 80..82 to eliminate body center drift!
  cast: [
    // 0 [1 cell]: stance drop & hand raised; invocation spark at fingertips
    {
      bob: 1, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "cast_raise",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 46],
      castEffect: { stage: "spark", reachX: BODY_X8 + 10 },
    },
    // 1 [1 cell]: hand raised higher; solar energy gathers into an orb
    {
      bob: 0, lean: 1,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "cast_raise",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 45],
      castEffect: { stage: "gather", reachX: BODY_X8 + 14 },
      spectacleGlint: true,
    },
    // 2 [2 cells]: glow gathers at peak brilliance; radiance expands forward to reachX=80
    {
      bob: 0, lean: 2,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "billow_back", coatShift: 2, armL: "cast_raise",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 47],
      castEffect: { stage: "glow_gather", reachX: 80 },
    },
    // 3 [2 cells]: palm thrusts forward; solar bolt erupts extending right to reachX=82
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "billow_back", coatShift: 3, armL: "cast_thrust",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 47],
      castEffect: { stage: "bolt_fire", reachX: 82 },
      spectacleGlint: true,
    },
    // 4 [2 cells]: peak solar ray sustained from palm to reachX=82
    {
      bob: 1, lean: 3,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 5, lift: 0, kneeX: BODY_X8 + 4 },
      coat: "billow_back", coatShift: 4, armL: "cast_thrust",
      hiltOffset: [5, 15], tipPos: [BODY_X8 + 17, 47],
      castEffect: { stage: "bolt_peak", reachX: 82 },
      spectacleGlint: true,
    },
    // 5 [2 cells]: bolt tail tapering right, still connected to palm, reaches x=81
    {
      bob: 0, lean: 2,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 7 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "billow_back", coatShift: 2, armL: "cast_thrust",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 46],
      castEffect: { stage: "bolt_fade", reachX: 81 },
    },
    // 6 [2 cells]: fading sparks along the bolt path out to reachX=80
    {
      bob: 0, lean: 1,
      legL: { x: BODY_X8 - 7, lift: 0, kneeX: BODY_X8 - 6 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "cast_thrust",
      hiltOffset: [5, 14], tipPos: [BODY_X8 + 17, 45],
      castEffect: { stage: "sparks_fade", reachX: 80 },
    },
    // 7 [2 cells]: final dissolving embers along bolt path to reachX=80 (nothing on floor)
    {
      bob: 0, lean: 0,
      legL: { x: BODY_X8 - 6, lift: 0, kneeX: BODY_X8 - 5 },
      legR: { x: BODY_X8 + 4, lift: 0, kneeX: BODY_X8 + 3 },
      coat: "rest", armL: "cast_raise",
      hiltOffset: [6, 14], tipPos: [BODY_X8 + 18, 33],
      castEffect: { stage: "sparks_end", reachX: 80 },
    },
  ],

  // ─── Crouch (2 frames, FPS 8, loop: true) ─────────────────────────────────
  // Clearly lower (head ~30 % lower than idle), knees bent outward, coat pooling
  crouch: [
    // 0: drop transition (torso dropped 15px, ~28% lower than idle)
    {
      bob: 15, lean: 1,
      legL: { x: BODY_X8 - 8, lift: 0, kneeX: BODY_X8 - 12 },
      legR: { x: BODY_X8 + 7, lift: 0, kneeX: BODY_X8 + 12 },
      coat: "crouch_bunch", armL: "crouch",
      hiltOffset: [4, 15], tipPos: [BODY_X8 + 18, 52],
    },
    // 1: full grounded deep crouch (torso dropped 17px, ~32% lower than idle)
    {
      bob: 17, lean: 0,
      legL: { x: BODY_X8 - 9, lift: 0, kneeX: BODY_X8 - 14 },
      legR: { x: BODY_X8 + 8, lift: 0, kneeX: BODY_X8 + 13 },
      coat: "crouch_bunch", armL: "crouch",
      hiltOffset: [4, 16], tipPos: [BODY_X8 + 19, 54],
      spectacleGlint: true,
    },
  ],
};

// ─── Draw Functions ──────────────────────────────────────────────────────────

function torsoTopY(p: Pose): number {
  return 25 + p.bob;
}

function getTorsoHeight(p: Pose): number {
  return p.coat === "crouch_bunch" ? 11 : 16;
}

function getHipY(p: Pose): number {
  return torsoTopY(p) + getTorsoHeight(p);
}

function headTopY(p: Pose): number {
  return 11 + p.bob;
}

// 1. Draw Greatcoat Tails (behind character)
function drawCoatTails(b: Brush, p: Pose): void {
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
          [8, hipX - 15, hipX - 12],
          [9, hipX - 15, hipX - 13],
          [10, hipX - 15, hipX - 14],
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
          [8, hipX - 17, hipX - 15],
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
          [9, hipX - 12, hipX - 10],
          [10, hipX - 13, hipX - 11],
          [11, hipX - 13, hipX - 12],
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

    case "crouch_bunch": {
      // Greatcoat pooling widely across the floor during crouch
      const poolLeft = BODY_X8 - 15 + p.lean;
      const poolRight = BODY_X8 + 13 + p.lean;
      const poolW = poolRight - poolLeft + 1;
      const waistX = BODY_X8 - 7 + p.lean;
      const waistW = 15;

      // Waist and upper thigh drapery connecting smoothly to compressed hips
      b.rect(waistX, hipY - 2, waistW, 3, pal.coat);
      b.rect(waistX - 2, hipY + 1, waistW + 4, 3, pal.coat);

      // Deep pooled mass expanding across the ground
      b.rect(poolLeft + 2, hipY + 3, poolW - 4, FLOOR8 - (hipY + 3) + 1, pal.coat);
      b.rect(poolLeft, FLOOR8 - 3, poolW, 4, pal.coat);
      b.rect(poolLeft, FLOOR8 - 1, poolW, 2, pal.coatShade);

      // Gold trim on pooled lower edge and fold creases
      b.rect(poolLeft, FLOOR8, poolW, 1, pal.trim);
      b.rect(poolLeft + 2, FLOOR8 - 3, 5, 1, pal.trim);
      b.rect(poolRight - 7, FLOOR8 - 3, 5, 1, pal.trim);

      if (detailed) {
        b.rect(waistX - 1, hipY, 3, 4, pal.coatLight);
        b.line16(
          Math.round(poolLeft * 2),
          Math.round(FLOOR8 * 2),
          Math.round((poolLeft + 7) * 2),
          Math.round((FLOOR8 - 3) * 2),
          pal.coatLight,
        );
        b.line16(
          Math.round((poolRight - 7) * 2),
          Math.round((FLOOR8 - 3) * 2),
          Math.round(poolRight * 2),
          Math.round(FLOOR8 * 2),
          pal.coatLight,
        );
        b.rect(poolLeft, FLOOR8, poolW, 1, pal.trimShade);
      }
      break;
    }

    case "rest":
    default: {
      // Elegant split greatcoat tails hanging down to just above floor
      const tailLX = BODY_X8 - 10 + shift + p.lean;
      const tailRX = BODY_X8 - 4 + shift + p.lean;
      const tailH = FLOOR8 - hipY;

      // Left coat tail
      b.rect(tailLX, hipY, 4, tailH, pal.coat);
      b.rect(tailLX - 1, hipY + tailH - 2, 5, 1, pal.trim);

      // Right coat tail
      b.rect(tailRX, hipY, 4, tailH - 1, pal.coatShade);
      b.rect(tailRX - 1, hipY + tailH - 3, 5, 1, pal.trim);

      if (detailed) {
        b.rect(tailLX, hipY, 1, tailH - 2, pal.coatLight);
        b.rect(tailLX - 1, hipY + tailH - 1, 5, 1, pal.trimShade);
        b.rect(tailRX - 1, hipY + tailH - 2, 5, 1, pal.trimShade);
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
function drawLegs(b: Brush, p: Pose): void {
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
    b.line(BODY_X8 - 2 + (isBack ? -3 : 3) + p.lean, hipY, kneeX, kneeY, legCol);
    b.line(BODY_X8 - 1 + (isBack ? -3 : 3) + p.lean, hipY, kneeX + 1, kneeY, legCol);

    // Shin: knee to ankle (2px wide)
    b.line(kneeX, kneeY, footX, footY - 2, legCol);
    b.line(kneeX + 1, kneeY, footX + 1, footY - 2, legCol);

    if (detailed && !isBack) {
      b.line(BODY_X8 - 1 + 3 + p.lean, hipY, kneeX + 1, kneeY, legLight);
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
function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const tX = BODY_X8 - 9 + p.lean;
  const tW = 18;
  const tH = getTorsoHeight(p);

  // Main coat silhouette
  b.rect(tX, tY, tW, tH, pal.coat);

  if (detailed) {
    b.rect(tX, tY, 3, tH, pal.coatLight);
    b.rect(tX + tW - 3, tY, 3, tH, pal.coatShade);
  }

  // Waistcoat center panel
  b.rect(tX + 6, tY + 2, 6, tH - 4, pal.coatLight);
  if (detailed) {
    b.rect(tX + 6, tY + 2, 1, tH - 4, pal.coat);
  }

  // Double-breasted gold buttons
  if (tH < 14) {
    b.px(tX + 7, tY + 3, pal.trim);
    b.px(tX + 10, tY + 3, pal.trim);
    b.px(tX + 7, tY + 6, pal.trim);
    b.px(tX + 10, tY + 6, pal.trim);
    if (detailed) {
      b.px16(Math.round((tX + 7) * 2), Math.round((tY + 3) * 2), pal.solarCore);
      b.px16(Math.round((tX + 10) * 2), Math.round((tY + 3) * 2), pal.solarCore);
      b.px16(Math.round((tX + 7) * 2), Math.round((tY + 6) * 2), pal.solarCore);
      b.px16(Math.round((tX + 10) * 2), Math.round((tY + 6) * 2), pal.solarCore);
    }
  } else {
    b.px(tX + 7, tY + 4, pal.trim);
    b.px(tX + 10, tY + 4, pal.trim);
    b.px(tX + 7, tY + 8, pal.trim);
    b.px(tX + 10, tY + 8, pal.trim);
    b.px(tX + 7, tY + 11, pal.trim);
    b.px(tX + 10, tY + 11, pal.trim);

    if (detailed) {
      // 16-bit button specular pips
      b.px16(Math.round((tX + 7) * 2), Math.round((tY + 4) * 2), pal.solarCore);
      b.px16(Math.round((tX + 10) * 2), Math.round((tY + 4) * 2), pal.solarCore);
      b.px16(Math.round((tX + 7) * 2), Math.round((tY + 8) * 2), pal.solarCore);
      b.px16(Math.round((tX + 10) * 2), Math.round((tY + 8) * 2), pal.solarCore);
    }
  }

  // Leather utility belt
  b.rect(tX + 1, tY + tH - 3, tW - 2, 2, pal.boot);
  // Gold belt buckle
  b.rect(tX + 7, tY + tH - 3, 4, 2, pal.trim);
  if (detailed) {
    b.px(tX + 8, tY + tH - 2, pal.outline);
  }

  // Greatcoat high collar framing neck with gold trim
  b.rect(tX + 3, tY - 2, 2, 3, pal.coat);
  b.rect(tX + 11, tY - 2, 2, 3, pal.coat);
  b.rect(tX + 3, tY - 2, 2, 1, pal.trim);
  b.rect(tX + 11, tY - 2, 2, 1, pal.trim);

  // Greatcoat lapels with gold trim
  b.rect(tX + 1, tY, 3, 5, pal.coatShade);
  b.rect(tX + tW - 4, tY, 3, 5, pal.coatShade);
  b.line(tX + 1, tY, tX + 4, tY + 4, pal.trim);
  b.line(tX + tW - 2, tY, tX + tW - 5, tY + 4, pal.trim);

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
function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hY = headTopY(p);
  const hX = BODY_X8 - 5 + p.lean;

  // Chestnut hair crown & silhouette (NO gold trim anywhere on head!)
  // Top rows of hair
  b.rect(hX + 1, hY, 8, 1, pal.hair);
  b.rect(hX, hY + 1, 10, 2, pal.hair);
  b.rect(hX - 1, hY + 2, 11, 2, pal.hair);

  // Rear hair sweeping down to nape with shadow
  b.rect(hX - 1, hY + 4, 3, 4, pal.hairShade);
  b.rect(hX - 1, hY + 4, 1, 4, pal.hair);
  b.rect(hX, hY + 7, 2, 2, pal.hairShade);

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
  b.rect(hX + 2, hY + 7, 6, 1, pal.skin);

  // Tapered jaw & chin (head is not a box!)
  b.rect(hX + 2, hY + 8, 5, 1, pal.skin);
  b.rect(hX + 3, hY + 9, 3, 1, pal.skin); // chin tapers forward at x = hX+3..5

  // Visible neck connecting head to coat collar
  b.rect(hX + 3, hY + 10, 3, 3, pal.skin);
  b.rect(hX + 2, hY + 12, 5, 2, pal.skin);

  // Jaw & neck shadow
  b.rect(hX + 2, hY + 8, 2, 1, pal.skinShade);
  b.rect(hX + 3, hY + 10, 1, 4, pal.skinShade);

  if (detailed) {
    // 16-bit subtle shadow under jawline and ear
    b.rect16(Math.round((hX + 2) * 2), Math.round((hY + 6) * 2), 2, 4, pal.skinShade);
    b.line16(
      Math.round((hX + 3) * 2),
      Math.round((hY + 9) * 2),
      Math.round((hX + 5) * 2),
      Math.round((hY + 9) * 2),
      pal.skinShade,
    );
  }

  // Visible duelist eye facing forward/right
  const eyeX = hX + 7;
  const eyeY = hY + 5;
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
function drawLeftArm(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const shX = BODY_X8 - 9 + p.lean;
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
      const armEndX = shX + 8;
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
      b.line(shX, shY, shX - 6, shY + 6, pal.coat);
      b.line(shX, shY + 1, shX - 6, shY + 7, pal.coat);
      b.rect(shX - 6, shY + 6, 2, 2, pal.skin);
      break;
    }

    case "parry": {
      // Tucked across chest
      b.line(shX, shY, shX + 4, shY + 4, pal.coat);
      b.line(shX, shY + 1, shX + 4, shY + 5, pal.coat);
      b.rect(shX + 4, shY + 4, 2, 2, pal.skin);
      break;
    }

    case "pump_forward": {
      // Forward swing during run
      b.line(shX, shY, shX + 5, shY + 6, pal.coat);
      b.line(shX, shY + 1, shX + 5, shY + 7, pal.coat);
      b.rect(shX + 5, shY + 6, 2, 2, pal.skin);
      break;
    }

    case "pump_back": {
      // Rearward swing during run
      b.line(shX, shY, shX - 5, shY + 5, pal.coat);
      b.line(shX, shY + 1, shX - 5, shY + 6, pal.coat);
      b.rect(shX - 6, shY + 5, 2, 2, pal.skin);
      break;
    }

    case "crouch": {
      // Resting on front knee
      b.line(shX, shY, shX + 4, shY + 7, pal.coat);
      b.rect(shX + 4, shY + 7, 3, 2, pal.skin);
      break;
    }

    case "rest":
    default: {
      // Resting gracefully at hip / belt
      b.rect(shX - 2, shY, 3, 9, pal.coat);
      b.rect(shX - 2, shY + 8, 3, 1, pal.trim); // gold cuff
      b.rect(shX - 2, shY + 9, 3, 2, pal.skin); // hand
      if (detailed) {
        b.rect(shX - 2, shY, 1, 8, pal.coatLight);
      }
      break;
    }
  }
}

// 6. Draw Bastion Rapier (Right Arm + Slender Weapon)
function drawRapier(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoTopY(p);
  const shX = BODY_X8 + 4 + p.lean;
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

// 7. Dash Afterimage Trails (2-3 thin streaks in coat colors)
function drawDashAfterimages(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.dashStreak) return;

  const tY = torsoTopY(p);
  const offsets = p.dashStreak === 1 ? [8, 14] : [6, 11, 16];

  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i]!;
    const streakCol = i === 0 ? pal.coatShade : (detailed ? pal.coatLight : pal.coatShade);

    // Sleek horizontal trailing speedlines behind torso and waist (staying within x >= 2)
    b.line(BODY_X8 - off - 5, tY + 4, BODY_X8 - off, tY + 4, streakCol);
    b.line(BODY_X8 - off - 8, tY + 10, BODY_X8 - off - 1, tY + 10, streakCol);
    b.line(BODY_X8 - off - 6, tY + 16, BODY_X8 - off, tY + 16, streakCol);

    // Subtle gold trim afterimage glint
    b.line(BODY_X8 - off - 4, tY + 17, BODY_X8 - off, tY + 17, pal.trimShade);
  }
}

// 8. Attack Special Effects: Short Golden Slash / Sparkle Trail on Attack 5
function drawSlashArc(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.slashArc) return;

  const tx = p.tipPos[0];
  const ty = p.tipPos[1];

  // Crisp golden slash arc at the blade tip (not a long solid bar!)
  b.line(tx - 4, ty - 6, tx + 3, ty, pal.solar);
  b.line(tx + 3, ty, tx - 4, ty + 6, pal.solar);
  b.px(tx + 4, ty, pal.solarCore);

  // Radiant sparkle motes around blade tip
  b.px(tx + 2, ty - 4, pal.solar);
  b.px(tx + 3, ty + 4, pal.solar);
  b.px(tx - 2, ty - 7, pal.solarCore);
  b.px(tx - 2, ty + 7, pal.solar);

  if (detailed) {
    b.px(tx + 4, ty - 1, pal.solarCore);
    b.px(tx + 4, ty + 1, pal.solarCore);
    b.line(tx - 3, ty - 4, tx + 2, ty, pal.solarCore);
    // Extra 16-bit solar embers
    b.px16(Math.round((tx + 5) * 2), Math.round(ty * 2), pal.solar);
    b.px16(Math.round((tx + 1) * 2), Math.round((ty - 5) * 2), pal.solarCore);
  }
}

// 9. Cast Spell Effects: Connected to Hand & Extending Right along Bolt Path
function drawCastEffects(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  if (!p.castEffect) return;

  const { stage, reachX } = p.castEffect;
  const tY = torsoTopY(p);
  const shX = BODY_X8 - 9 + p.lean;
  const shY = tY + 2;

  switch (stage) {
    case "spark": {
      // Small spark gathering at raised fingertips
      const hx = shX;
      const hy = shY - 11;
      b.px(hx + 1, hy - 1, pal.solarCore);
      b.px(hx, hy - 1, pal.solar);
      b.px(hx + 2, hy - 1, pal.solar);
      b.px(hx + 1, hy - 2, pal.solar);
      if (detailed) {
        b.px16(Math.round((hx + 1) * 2), Math.round((hy - 1) * 2), pal.solarCore);
      }
      break;
    }

    case "gather": {
      // Radiant solar glow gathers into an orb above raised palm
      const ox = shX + 1;
      const oy = shY - 14;
      b.rect(ox - 1, oy - 1, 3, 3, pal.solar);
      b.px(ox, oy, pal.solarCore);
      b.px(ox - 2, oy, pal.solar);
      b.px(ox + 2, oy, pal.solar);
      b.px(ox, oy - 2, pal.solar);
      b.px(ox, oy + 2, pal.solar);
      if (detailed) {
        b.line16(Math.round((ox - 1) * 2), Math.round(oy * 2), Math.round((ox + 1) * 2), Math.round(oy * 2), pal.solarCore);
        b.line16(Math.round(ox * 2), Math.round((oy - 1) * 2), Math.round(ox * 2), Math.round((oy + 1) * 2), pal.solarCore);
      }
      break;
    }

    case "glow_gather": {
      // Glow gathers at peak intensity, radiance expanding forward to reachX=80
      const ox = shX + 2;
      const oy = shY - 13;
      b.rect(ox - 2, oy - 2, 5, 5, pal.solar);
      b.rect(ox - 1, oy - 1, 3, 3, pal.solarCore);
      // Direct forward solar rays extending to reachX
      b.line(ox + 3, oy, reachX, oy, pal.solar);
      b.line(ox + 3, oy - 1, reachX - 2, oy - 1, pal.solar);
      b.line(ox + 3, oy + 1, reachX - 2, oy + 1, pal.solar);
      b.line(ox + 2, oy, reachX - 4, oy, pal.solarCore);
      b.px(reachX, oy, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(oy * 2), pal.solarCore);
        b.line16(Math.round((ox - 1) * 2), Math.round(oy * 2), Math.round((ox + 1) * 2), Math.round(oy * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_fire": {
      // Palm thrusts forward; solar bolt erupts from palm to reachX=82
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, reachX - 2, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, reachX - 2, palmY + 1, pal.solar);
      b.line(palmX + 1, palmY, reachX - 3, palmY, pal.solarCore);
      // Arrowhead bolt spear at tip
      b.line(reachX, palmY, reachX - 4, palmY - 3, pal.solar);
      b.line(reachX, palmY, reachX - 4, palmY + 3, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.line16(Math.round((reachX - 3) * 2), Math.round((palmY - 2) * 2), Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.line16(Math.round((reachX - 3) * 2), Math.round((palmY + 2) * 2), Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_peak": {
      // Peak solar discharge beam from palm to reachX=82
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, reachX - 1, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, reachX - 1, palmY + 1, pal.solar);
      b.line(palmX + 2, palmY - 2, reachX - 3, palmY - 2, pal.solar);
      b.line(palmX + 2, palmY + 2, reachX - 3, palmY + 2, pal.solar);
      b.line(palmX + 1, palmY, reachX - 2, palmY, pal.solarCore);
      b.line(palmX + 3, palmY - 1, reachX - 4, palmY - 1, pal.solarCore);
      b.line(palmX + 3, palmY + 1, reachX - 4, palmY + 1, pal.solarCore);
      b.px(reachX, palmY, pal.solarCore);
      b.line(reachX, palmY, reachX - 4, palmY - 4, pal.solar);
      b.line(reachX, palmY, reachX - 4, palmY + 4, pal.solar);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round((reachX - 1) * 2), Math.round((palmY - 1) * 2), pal.solarCore);
        b.px16(Math.round((reachX - 1) * 2), Math.round((palmY + 1) * 2), pal.solarCore);
      }
      break;
    }

    case "bolt_fade": {
      // Tapering beam connected to palm, extending right to reachX=81
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, reachX, palmY, pal.solar);
      b.line(palmX, palmY - 1, palmX + 8, palmY - 1, pal.solar);
      b.line(palmX, palmY + 1, palmX + 8, palmY + 1, pal.solar);
      b.line(palmX + 2, palmY, reachX - 4, palmY, pal.solarCore);
      b.px(56, palmY - 2, pal.solar);
      b.px(65, palmY + 2, pal.solar);
      b.px(74, palmY - 1, pal.solarCore);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round(65 * 2), Math.round((palmY + 2) * 2), pal.solarCore);
      }
      break;
    }

    case "sparks_fade": {
      // Fading sparks close to bolt path out to reachX=80
      const palmX = shX + 11;
      const palmY = shY + 1;
      b.line(palmX, palmY, palmX + 2, palmY, pal.solar);
      b.px(palmX + 6, palmY, pal.solar);
      b.px(52, palmY - 1, pal.solarCore);
      b.px(53, palmY, pal.solar);
      b.px(62, palmY + 1, pal.solar);
      b.px(70, palmY, pal.solarCore);
      b.px(76, palmY - 1, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
        b.px16(Math.round(70 * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }

    case "sparks_end": {
      // Final dissolving embers along bolt path to reachX=80 (nothing on floor)
      const palmY = shY + 1;
      b.px(42, palmY, pal.solar);
      b.px(54, palmY + 1, pal.solar);
      b.px(66, palmY - 1, pal.solar);
      b.px(74, palmY, pal.solar);
      b.px(reachX, palmY, pal.solarCore);
      if (detailed) {
        b.px16(Math.round(reachX * 2), Math.round(palmY * 2), pal.solarCore);
      }
      break;
    }
  }
}

// ─── Main Draw Entry ─────────────────────────────────────────────────────────

function drawValen(
  c: PixelCanvas,
  s: number,
  detailed: boolean,
  anim: string,
  frame: number,
  _span: number,
): void {
  const poseList = POSES[anim] ?? POSES.idle!;
  const p = poseList[frame % poseList.length] ?? poseList[0]!;
  const pal = detailed ? HI16 : HI8;
  const b = new Brush(c, s, detailed, pal);

  // 1. Dash temporal afterimage trails (behind body)
  drawDashAfterimages(b, p);

  // 2. Coat tails (behind body and legs)
  drawCoatTails(b, p);

  // 3. Legs and duelist boots
  drawLegs(b, p);

  // 4. Double-breasted torso & waistcoat
  drawTorso(b, p);

  // 5. Left (off-hand) arm
  drawLeftArm(b, p);

  // 6. Head, hair, spectacles, collar
  drawHead(b, p);

  // 7. Slender Bastion rapier & right arm
  drawRapier(b, p);

  // 8. Special attack slash arc / sparkles
  drawSlashArc(b, p);

  // 9. Cast magic stream & solar effects
  drawCastEffects(b, p);

  // 10. Crisp 1px dark outer boundary
  c.outline(pal.outline);
}

// ─── Export Hero Sprite Definition ───────────────────────────────────────────

export default defineHeroSprite({
  id: "valen",
  description:
    "Valen the Chrono Duelist — a slender rapier-wielding fencer in a tailored graphite greatcoat with autumn gold embroidery, boots, and analytical spectacles.",
  draw: {
    hi8bit: (c, anim, frame, span) => drawValen(c, 1, false, anim, frame, span),
    hi16bit: (c, anim, frame, span) => drawValen(c, 2, true, anim, frame, span),
  },
});
