import { defineProp, type PixelCanvas } from "../defineProp";

// candelabra decor prop for aether sanctuary
// all comments written in lowercase to conform to trademark guard

// hi-8bit palette (5 colours)
const OUTLINE_8 = "#1c1008";
const BRONZE_8 = "#b45309";
const WAX_8 = "#f5f5f4";
const FLAME_EDGE_8 = "#ea580c";
const FLAME_CORE_8 = "#fef08a";

// hi-16bit palette (9 colours)
const OUTLINE_16 = "#1c1008";
const STEM_SHADE_16 = "#78350f";
const ARM_GOLD_16 = "#b45309";
const BRASS_HI_16 = "#f59e0b";
const WAX_SHADOW_16 = "#a8a29e";
const WAX_BODY_16 = "#f5f5f4";
const FLAME_MANTLE_16 = "#ea580c";
const FLAME_AMBER_16 = "#fbbf24";
const FLAME_CORE_16 = "#fef08a";

/**
 * hi-8bit draw function on a 14x26 canvas.
 * bottom anchor row is y=25. margins at x=0, x=13, y=0.
 */
function drawHi8bit(c: PixelCanvas, frame: number): void {
  // tripod foot on floor row y=25
  // left claw (x=2..3), center foot (x=6..7), right claw (x=10..11)
  c.rect(2, 25, 2, 1, BRONZE_8);
  c.rect(6, 25, 2, 1, BRONZE_8);
  c.rect(10, 25, 2, 1, BRONZE_8);

  // tripod arched legs and base pedestal (y=23..24)
  c.px(3, 24, BRONZE_8);
  c.px(10, 24, BRONZE_8);
  c.rect(5, 24, 4, 1, BRONZE_8);
  c.rect(5, 23, 4, 1, BRONZE_8);

  // slender central stem (x=6..7, y=12..22)
  c.rect(6, 12, 2, 11, BRONZE_8);

  // graceful curved arms (y=15..18)
  // branching from stem at y=17..18
  c.px(5, 17, BRONZE_8);
  c.px(8, 17, BRONZE_8);
  c.px(4, 18, BRONZE_8);
  c.px(9, 18, BRONZE_8);
  // sweeping upward and outward to support side cups
  c.rect(3, 16, 1, 2, BRONZE_8);
  c.rect(10, 16, 1, 2, BRONZE_8);
  c.rect(2, 14, 1, 2, BRONZE_8);
  c.rect(11, 14, 1, 2, BRONZE_8);

  // flared drip pans and cups (y=11..13)
  // left drip pan (x=2..4, y=13) and cup (x=2..3, y=12)
  c.rect(2, 13, 3, 1, BRONZE_8);
  c.rect(2, 12, 2, 1, BRONZE_8);
  // center drip pan (x=5..8, y=10) and cup (x=6..7, y=9)
  c.rect(5, 10, 4, 1, BRONZE_8);
  c.rect(6, 9, 2, 1, BRONZE_8);
  // right drip pan (x=9..11, y=13) and cup (x=10..11, y=12)
  c.rect(9, 13, 3, 1, BRONZE_8);
  c.rect(10, 12, 2, 1, BRONZE_8);

  // 2x4 pixel white tallow candles
  // left candle (x=2..3, y=8..11)
  c.rect(2, 8, 2, 4, WAX_8);
  // center candle (x=6..7, y=5..8)
  c.rect(6, 5, 2, 4, WAX_8);
  // right candle (x=10..11, y=8..11)
  c.rect(10, 8, 2, 4, WAX_8);

  // dark bronze outline on bronze metalwork and candles
  // leaves margins x=0, x=13, y=0 transparent
  c.outline(OUTLINE_8);

  // delicate 1-pixel dark candle wicks drawn on candle top
  c.px(2, 7, OUTLINE_8);
  c.px(6, 4, OUTLINE_8);
  c.px(10, 7, OUTLINE_8);

  // animated candle flames (drawn unoutlined for crisp brilliance)
  // center flame (above candle y=5, centered over x=6..7)
  if (frame === 0) {
    // frame 0: upright 5px teardrop (y=1..4)
    c.px(6, 1, FLAME_EDGE_8);
    c.rect(6, 2, 2, 2, FLAME_EDGE_8);
    c.px(6, 2, FLAME_CORE_8);
    c.px(6, 3, FLAME_CORE_8);
    c.px(7, 3, FLAME_EDGE_8);
    c.rect(6, 4, 2, 1, FLAME_EDGE_8);
  } else if (frame === 1) {
    // frame 1: stretches +1px height with tapering tip (y=1..4)
    c.px(7, 1, FLAME_CORE_8);
    c.rect(6, 2, 2, 2, FLAME_EDGE_8);
    c.rect(6, 2, 2, 1, FLAME_CORE_8);
    c.px(6, 3, FLAME_CORE_8);
    c.rect(6, 4, 2, 1, FLAME_EDGE_8);
  } else if (frame === 2) {
    // frame 2: wavers 1px left (y=2..4, shifts left to x=5)
    c.px(5, 2, FLAME_EDGE_8);
    c.rect(5, 3, 2, 2, FLAME_EDGE_8);
    c.px(6, 3, FLAME_CORE_8);
    c.rect(6, 4, 2, 1, FLAME_EDGE_8);
  } else {
    // frame 3: dips 1px lower (y=2..4, squatter teardrop)
    c.rect(6, 2, 2, 1, FLAME_EDGE_8);
    c.rect(5, 3, 3, 2, FLAME_EDGE_8);
    c.rect(6, 3, 2, 1, FLAME_CORE_8);
  }

  // left flame (above candle y=8, centered over x=2..3)
  if (frame === 0) {
    // frame 0: leans 1px right toward center
    c.px(3, 4, FLAME_EDGE_8);
    c.rect(2, 5, 2, 2, FLAME_EDGE_8);
    c.px(3, 5, FLAME_CORE_8);
    c.rect(2, 7, 2, 1, FLAME_EDGE_8);
  } else if (frame === 1) {
    // frame 1: returns upright
    c.px(2, 4, FLAME_EDGE_8);
    c.rect(2, 5, 2, 2, FLAME_EDGE_8);
    c.px(2, 5, FLAME_CORE_8);
    c.px(3, 6, FLAME_CORE_8);
    c.rect(2, 7, 2, 1, FLAME_EDGE_8);
  } else if (frame === 2) {
    // frame 2: stretches upward (tip reaches y=3)
    c.px(2, 3, FLAME_EDGE_8);
    c.px(3, 4, FLAME_CORE_8);
    c.rect(2, 5, 2, 2, FLAME_EDGE_8);
    c.px(2, 6, FLAME_CORE_8);
    c.rect(2, 7, 2, 1, FLAME_EDGE_8);
  } else {
    // frame 3: curls inward (leans right, tip hooked at x=3, y=4)
    c.px(3, 4, FLAME_CORE_8);
    c.rect(2, 5, 2, 2, FLAME_EDGE_8);
    c.px(3, 5, FLAME_EDGE_8);
    c.px(2, 6, FLAME_CORE_8);
    c.rect(2, 7, 2, 1, FLAME_EDGE_8);
  }

  // right flame (above candle y=8, centered over x=10..11)
  if (frame === 0) {
    // frame 0: leans 1px right (away from center)
    c.px(11, 4, FLAME_EDGE_8);
    c.rect(10, 5, 2, 2, FLAME_EDGE_8);
    c.px(11, 5, FLAME_CORE_8);
    c.rect(10, 7, 2, 1, FLAME_EDGE_8);
  } else if (frame === 1) {
    // frame 1: squashes 1px wider
    c.rect(10, 5, 3, 2, FLAME_EDGE_8);
    c.px(10, 5, FLAME_CORE_8);
    c.px(11, 6, FLAME_CORE_8);
    c.rect(10, 7, 2, 1, FLAME_EDGE_8);
  } else if (frame === 2) {
    // frame 2: tip flickers outward with 1px spark pixel (spark at x=12, y=3)
    c.px(12, 3, FLAME_CORE_8);
    c.px(11, 4, FLAME_EDGE_8);
    c.rect(10, 5, 2, 2, FLAME_EDGE_8);
    c.px(10, 6, FLAME_CORE_8);
    c.rect(10, 7, 2, 1, FLAME_EDGE_8);
  } else {
    // frame 3: returns upright
    c.px(10, 4, FLAME_EDGE_8);
    c.rect(10, 5, 2, 2, FLAME_EDGE_8);
    c.px(11, 5, FLAME_CORE_8);
    c.rect(10, 7, 2, 1, FLAME_EDGE_8);
  }
}

/**
 * hi-16bit draw function on a 28x52 canvas.
 * bottom anchor row is y=51. margins at x=0, x=27, y=0.
 */
function drawHi16bit(c: PixelCanvas, frame: number): void {
  // clawed tripod foot resting on floor row y=51
  // left splayed claw (x=3..5)
  c.rect(3, 50, 3, 2, ARM_GOLD_16);
  c.px(3, 51, BRASS_HI_16);
  c.px(4, 50, BRASS_HI_16);
  c.px(5, 51, STEM_SHADE_16);

  // center claw (x=12..15)
  c.rect(12, 50, 4, 2, ARM_GOLD_16);
  c.rect(13, 50, 2, 1, BRASS_HI_16);
  c.px(12, 51, BRASS_HI_16);
  c.px(15, 51, STEM_SHADE_16);

  // right splayed claw (x=22..24)
  c.rect(22, 50, 3, 2, ARM_GOLD_16);
  c.px(22, 50, BRASS_HI_16);
  c.px(23, 51, BRASS_HI_16);
  c.px(24, 51, STEM_SHADE_16);

  // arched claw legs sweeping inward to pedestal (y=47..49)
  // left claw leg
  c.rect(4, 48, 3, 2, ARM_GOLD_16);
  c.px(4, 48, BRASS_HI_16);
  c.px(6, 49, STEM_SHADE_16);
  c.rect(6, 47, 3, 2, ARM_GOLD_16);
  c.px(6, 47, BRASS_HI_16);
  c.px(8, 48, STEM_SHADE_16);

  // right claw leg
  c.rect(21, 48, 3, 2, ARM_GOLD_16);
  c.px(21, 48, BRASS_HI_16);
  c.px(23, 49, STEM_SHADE_16);
  c.rect(19, 47, 3, 2, ARM_GOLD_16);
  c.px(19, 47, BRASS_HI_16);
  c.px(21, 48, STEM_SHADE_16);

  // bell pedestal base collar (y=44..47)
  c.rect(9, 46, 10, 2, ARM_GOLD_16);
  c.rect(10, 45, 8, 1, ARM_GOLD_16);
  c.rect(11, 44, 6, 1, ARM_GOLD_16);

  // pedestal highlights and shading
  c.px(10, 45, BRASS_HI_16);
  c.px(11, 44, BRASS_HI_16);
  c.rect(11, 45, 4, 1, BRASS_HI_16);
  c.rect(16, 46, 3, 2, STEM_SHADE_16);
  c.px(17, 45, STEM_SHADE_16);

  // lower baluster knop on stem (y=39..41, x=11..16)
  c.rect(11, 39, 6, 3, ARM_GOLD_16);
  c.rect(12, 39, 3, 1, BRASS_HI_16);
  c.px(11, 40, BRASS_HI_16);
  c.rect(15, 39, 2, 3, STEM_SHADE_16);

  // fluted vertical stem (y=26..43, x=12..15)
  c.rect(12, 26, 4, 18, ARM_GOLD_16);
  // fluting highlights on left ridge
  c.rect(12, 26, 1, 18, BRASS_HI_16);
  // fluting core shadow on right ridge
  c.rect(15, 26, 1, 18, STEM_SHADE_16);

  // middle junction knop where arms branch (y=33..35, x=11..16)
  c.rect(11, 33, 6, 3, ARM_GOLD_16);
  c.rect(12, 33, 3, 1, BRASS_HI_16);
  c.px(11, 34, BRASS_HI_16);
  c.rect(15, 33, 2, 3, STEM_SHADE_16);

  // graceful baroque looping arms
  // left arm sweeping downward from knop (y=35..37)
  c.rect(8, 35, 4, 2, ARM_GOLD_16);
  c.px(8, 35, BRASS_HI_16);
  c.px(9, 35, BRASS_HI_16);
  c.px(11, 36, STEM_SHADE_16);

  c.rect(5, 36, 4, 2, ARM_GOLD_16);
  c.px(5, 36, BRASS_HI_16);
  c.px(6, 36, BRASS_HI_16);
  c.px(7, 37, STEM_SHADE_16);
  c.px(8, 37, STEM_SHADE_16);

  // left arm looping upward directly into candle cup base (y=27..35, x=4..7)
  c.rect(4, 32, 2, 4, ARM_GOLD_16);
  c.rect(4, 32, 1, 4, BRASS_HI_16);
  c.rect(5, 33, 1, 3, STEM_SHADE_16);

  c.rect(5, 28, 3, 4, ARM_GOLD_16);
  c.rect(5, 28, 1, 4, BRASS_HI_16);
  c.rect(7, 29, 1, 3, STEM_SHADE_16);

  // right arm sweeping downward from knop (y=35..37)
  c.rect(16, 35, 4, 2, ARM_GOLD_16);
  c.px(18, 35, BRASS_HI_16);
  c.px(19, 35, BRASS_HI_16);
  c.px(16, 36, STEM_SHADE_16);

  c.rect(19, 36, 4, 2, ARM_GOLD_16);
  c.px(21, 36, BRASS_HI_16);
  c.px(22, 36, BRASS_HI_16);
  c.px(19, 37, STEM_SHADE_16);
  c.px(20, 37, STEM_SHADE_16);

  // right arm looping upward directly into candle cup base (y=27..35, x=21..24)
  c.rect(22, 32, 2, 4, ARM_GOLD_16);
  c.rect(22, 32, 1, 4, BRASS_HI_16);
  c.rect(23, 33, 1, 3, STEM_SHADE_16);

  c.rect(20, 28, 3, 4, ARM_GOLD_16);
  c.rect(20, 28, 1, 4, BRASS_HI_16);
  c.rect(22, 29, 1, 3, STEM_SHADE_16);

  // flared drip pans and candle cups
  // left drip pan (y=25..26, x=4..10)
  c.rect(4, 26, 7, 1, ARM_GOLD_16);
  c.rect(5, 25, 5, 1, ARM_GOLD_16);
  c.px(4, 26, BRASS_HI_16);
  c.rect(5, 25, 2, 1, BRASS_HI_16);
  c.px(10, 26, STEM_SHADE_16);
  c.px(9, 25, STEM_SHADE_16);
  // left candle cup (y=24, x=5..9)
  c.rect(5, 24, 5, 1, ARM_GOLD_16);
  c.rect(5, 24, 2, 1, BRASS_HI_16);
  c.px(9, 24, STEM_SHADE_16);

  // right drip pan (y=25..26, x=17..23)
  c.rect(17, 26, 7, 1, ARM_GOLD_16);
  c.rect(18, 25, 5, 1, ARM_GOLD_16);
  c.px(17, 26, BRASS_HI_16);
  c.rect(18, 25, 2, 1, BRASS_HI_16);
  c.px(23, 26, STEM_SHADE_16);
  c.px(22, 25, STEM_SHADE_16);
  // right candle cup (y=24, x=18..22)
  c.rect(18, 24, 5, 1, ARM_GOLD_16);
  c.rect(18, 24, 2, 1, BRASS_HI_16);
  c.px(22, 24, STEM_SHADE_16);

  // center drip pan on central shaft (y=19..20, x=10..17)
  c.rect(10, 20, 8, 1, ARM_GOLD_16);
  c.rect(11, 19, 6, 1, ARM_GOLD_16);
  c.px(10, 20, BRASS_HI_16);
  c.rect(11, 19, 3, 1, BRASS_HI_16);
  c.px(17, 20, STEM_SHADE_16);
  c.px(16, 19, STEM_SHADE_16);
  // center candle cup (y=18, x=11..16)
  c.rect(11, 18, 6, 1, ARM_GOLD_16);
  c.rect(11, 18, 2, 1, BRASS_HI_16);
  c.px(16, 18, STEM_SHADE_16);

  // tall cream tallow candles
  // left candle (x=6..8, y=16..23, 3px wide, 8px tall)
  c.rect(6, 16, 3, 8, WAX_BODY_16);
  c.rect(8, 16, 1, 8, WAX_SHADOW_16);
  // melted tallow drip running down left candle
  c.px(5, 20, WAX_BODY_16);
  c.px(5, 21, WAX_BODY_16);

  // right candle (x=19..21, y=16..23, 3px wide, 8px tall)
  c.rect(19, 16, 3, 8, WAX_BODY_16);
  c.rect(21, 16, 1, 8, WAX_SHADOW_16);
  // melted tallow drip running down right candle
  c.px(22, 21, WAX_BODY_16);
  c.px(22, 22, WAX_SHADOW_16);

  // center candle (x=12..15, y=10..17, 4px wide, 8px tall)
  c.rect(12, 10, 4, 8, WAX_BODY_16);
  c.rect(14, 10, 2, 8, WAX_SHADOW_16);
  // melted tallow drip on center candle
  c.px(11, 14, WAX_BODY_16);
  c.px(11, 15, WAX_BODY_16);

  // dark bronze outline on bronze metalwork and candles
  // leaves margins x=0, x=27, y=0 transparent
  c.outline(OUTLINE_16);

  // crisp 1-pixel dark candle wicks drawn on top of candles
  c.px(7, 15, OUTLINE_16);
  c.px(20, 15, OUTLINE_16);
  c.px(13, 9, OUTLINE_16);
  c.px(14, 9, OUTLINE_16);

  // lively flickering teardrop flames (animated per-frame out of sync)
  // center flame (centered over x=13..14, y=2..8)
  if (frame === 0) {
    // frame 0: center upright (5px teardrop, y=4..8)
    c.px(13, 4, FLAME_MANTLE_16);
    c.px(14, 4, FLAME_MANTLE_16);
    c.rect(12, 5, 4, 4, FLAME_MANTLE_16);
    c.rect(13, 5, 2, 3, FLAME_AMBER_16);
    c.rect(13, 6, 2, 2, FLAME_CORE_16);
  } else if (frame === 1) {
    // frame 1: stretches +1px height with tapering tip (y=3..8)
    c.px(13, 3, FLAME_CORE_16);
    c.px(14, 3, FLAME_MANTLE_16);
    c.rect(12, 4, 4, 5, FLAME_MANTLE_16);
    c.rect(13, 4, 2, 4, FLAME_AMBER_16);
    c.rect(13, 5, 2, 3, FLAME_CORE_16);
  } else if (frame === 2) {
    // frame 2: wavers 1px left (y=4..8, bulging left toward x=11)
    c.px(12, 3, FLAME_MANTLE_16);
    c.px(13, 4, FLAME_CORE_16);
    c.rect(11, 5, 4, 4, FLAME_MANTLE_16);
    c.rect(12, 5, 3, 3, FLAME_AMBER_16);
    c.rect(12, 6, 2, 2, FLAME_CORE_16);
    c.px(11, 6, FLAME_MANTLE_16);
  } else {
    // frame 3: dips 1px lower (y=5..8, squatter 4px wide)
    c.rect(13, 5, 2, 1, FLAME_MANTLE_16);
    c.rect(11, 6, 6, 3, FLAME_MANTLE_16);
    c.rect(12, 6, 4, 2, FLAME_AMBER_16);
    c.rect(13, 6, 2, 2, FLAME_CORE_16);
  }

  // left flame (centered over x=7, y=9..15)
  if (frame === 0) {
    // frame 0: leans 1px right toward center
    c.px(8, 10, FLAME_MANTLE_16);
    c.rect(6, 11, 3, 4, FLAME_MANTLE_16);
    c.px(9, 12, FLAME_MANTLE_16);
    c.rect(7, 11, 2, 3, FLAME_AMBER_16);
    c.px(8, 12, FLAME_CORE_16);
    c.px(7, 13, FLAME_CORE_16);
  } else if (frame === 1) {
    // frame 1: returns upright
    c.px(7, 10, FLAME_MANTLE_16);
    c.rect(6, 11, 3, 4, FLAME_MANTLE_16);
    c.rect(6, 12, 3, 2, FLAME_AMBER_16);
    c.px(7, 11, FLAME_CORE_16);
    c.px(7, 12, FLAME_CORE_16);
  } else if (frame === 2) {
    // frame 2: stretches upward (tip reaches y=9)
    c.px(7, 9, FLAME_CORE_16);
    c.px(8, 10, FLAME_MANTLE_16);
    c.rect(6, 11, 3, 4, FLAME_MANTLE_16);
    c.rect(6, 11, 3, 3, FLAME_AMBER_16);
    c.px(7, 12, FLAME_CORE_16);
    c.px(7, 13, FLAME_CORE_16);
  } else {
    // frame 3: curls inward (leans right, tip hooked at x=8)
    c.px(8, 10, FLAME_CORE_16);
    c.px(9, 11, FLAME_MANTLE_16);
    c.rect(6, 11, 3, 4, FLAME_MANTLE_16);
    c.rect(7, 11, 2, 3, FLAME_AMBER_16);
    c.px(7, 12, FLAME_CORE_16);
  }

  // right flame (centered over x=20, y=9..15)
  if (frame === 0) {
    // frame 0: leans 1px right (away from center)
    c.px(21, 10, FLAME_MANTLE_16);
    c.rect(19, 11, 3, 4, FLAME_MANTLE_16);
    c.px(22, 12, FLAME_MANTLE_16);
    c.rect(20, 11, 2, 3, FLAME_AMBER_16);
    c.px(20, 12, FLAME_CORE_16);
    c.px(21, 13, FLAME_CORE_16);
  } else if (frame === 1) {
    // frame 1: squashes 1px wider
    c.px(20, 10, FLAME_MANTLE_16);
    c.rect(18, 11, 5, 4, FLAME_MANTLE_16);
    c.rect(19, 11, 3, 3, FLAME_AMBER_16);
    c.rect(20, 11, 2, 2, FLAME_CORE_16);
  } else if (frame === 2) {
    // frame 2: tip flickers outward with 1px spark pixel (spark at x=22, y=8)
    c.px(22, 8, FLAME_CORE_16);
    c.px(21, 9, FLAME_MANTLE_16);
    c.rect(19, 10, 3, 5, FLAME_MANTLE_16);
    c.rect(19, 11, 3, 3, FLAME_AMBER_16);
    c.px(20, 12, FLAME_CORE_16);
    c.px(20, 13, FLAME_CORE_16);
  } else {
    // frame 3: returns upright
    c.px(20, 10, FLAME_MANTLE_16);
    c.rect(19, 11, 3, 4, FLAME_MANTLE_16);
    c.rect(19, 12, 3, 2, FLAME_AMBER_16);
    c.px(20, 11, FLAME_CORE_16);
    c.px(20, 12, FLAME_CORE_16);
  }
}

export default defineProp({
  id: "candelabra",
  description: "Standing liturgical altar candelabra cast in antique warm bronze with three flickering candles.",
  size: { width: 28, height: 52 },
  anchor: "bottom",
  frames: 4,
  fps: 8,
  glow: { color: "#f59e0b", radius: 72, x: 14, y: 12, flicker: true },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
