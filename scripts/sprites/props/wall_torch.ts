import { defineProp, type PixelCanvas } from "../defineProp";

// palette definitions from the spec
// hi-16bit (8 colors)
const OUTLINE_16 = "#140905";
const SCONCE_16 = "#381c10";
const WOOD_16 = "#63331b";
const PITCH_16 = "#26160e";
const FLAME_CRIMSON_16 = "#c2410c";
const FLAME_AMBER_16 = "#f97316";
const FLAME_LEMON_16 = "#fef08a";
const SMOKE_16 = "#4d2719";

// hi-8bit (4 colors)
const SCONCE_8 = "#221108";
const WOOD_8 = "#6b3318";
const FLAME_ORANGE_8 = "#e65100";
const FLAME_YELLOW_8 = "#fde047";

function drawWallTorchHi8bit(c: PixelCanvas, frame: number): void {
  // iron wall bracket mounted on the left, touching bottom row y = 23
  c.rect(2, 13, 2, 11, SCONCE_8); // vertical wall plate reaching bottom row
  c.rect(3, 13, 3, 2, SCONCE_8); // horizontal arm connecting to collar
  c.line(2, 20, 4, 15, SCONCE_8); // diagonal forged iron brace

  // iron collar socket holding the torch
  c.rect(4, 12, 4, 2, SCONCE_8); // collar ring

  // wooden torch stave
  c.rect(5, 9, 2, 9, WOOD_8); // timber shaft
  c.px(5, 18, WOOD_8); // tapered bottom end

  // pitch soaked head wrapping under the flame
  c.rect(4, 8, 4, 2, SCONCE_8);

  // dark outline around metal and wood fixture
  c.outline(SCONCE_8);

  // 4-frame animated flame
  if (frame === 0) {
    // resting flame: symmetrical teardrop
    c.px(6, 3, FLAME_ORANGE_8);
    c.rect(5, 4, 3, 1, FLAME_ORANGE_8);
    c.rect(4, 5, 5, 3, FLAME_ORANGE_8);
    c.rect(5, 8, 3, 1, FLAME_ORANGE_8);
    c.rect(5, 9, 2, 1, FLAME_ORANGE_8);

    // bright yellow core at x: 6, y: 7
    c.px(6, 5, FLAME_YELLOW_8);
    c.rect(5, 6, 3, 2, FLAME_YELLOW_8);
    c.px(6, 8, FLAME_YELLOW_8);
  } else if (frame === 1) {
    // upward lick: extends higher to y = 2, curls right, core shifts up
    c.px(7, 2, FLAME_ORANGE_8);
    c.rect(6, 3, 2, 1, FLAME_ORANGE_8);
    c.rect(5, 4, 3, 1, FLAME_ORANGE_8);
    c.rect(5, 5, 4, 1, FLAME_ORANGE_8);
    c.rect(4, 6, 5, 2, FLAME_ORANGE_8);
    c.rect(5, 8, 3, 1, FLAME_ORANGE_8);
    c.rect(5, 9, 2, 1, FLAME_ORANGE_8);

    // yellow core shifted up
    c.px(7, 3, FLAME_YELLOW_8);
    c.rect(6, 4, 2, 2, FLAME_YELLOW_8);
    c.rect(5, 6, 3, 1, FLAME_YELLOW_8);
    c.px(6, 7, FLAME_YELLOW_8);
  } else if (frame === 2) {
    // flame widening: plume broadens on left and right
    c.rect(5, 3, 3, 1, FLAME_ORANGE_8);
    c.rect(4, 4, 5, 1, FLAME_ORANGE_8);
    c.rect(3, 5, 7, 2, FLAME_ORANGE_8);
    c.rect(4, 7, 5, 1, FLAME_ORANGE_8);
    c.rect(5, 8, 3, 1, FLAME_ORANGE_8);
    c.rect(5, 9, 2, 1, FLAME_ORANGE_8);

    // broadened yellow core
    c.rect(5, 5, 3, 3, FLAME_YELLOW_8);
    c.px(6, 8, FLAME_YELLOW_8);
  } else {
    // frame 3: downward curl, curves left against wall draft
    c.px(5, 4, FLAME_ORANGE_8);
    c.rect(4, 5, 3, 1, FLAME_ORANGE_8);
    c.rect(4, 6, 4, 1, FLAME_ORANGE_8);
    c.rect(4, 7, 5, 1, FLAME_ORANGE_8);
    c.rect(5, 8, 3, 1, FLAME_ORANGE_8);
    c.rect(5, 9, 2, 1, FLAME_ORANGE_8);

    // core curling left
    c.px(5, 5, FLAME_YELLOW_8);
    c.rect(5, 6, 2, 1, FLAME_YELLOW_8);
    c.rect(5, 7, 3, 1, FLAME_YELLOW_8);
    c.px(6, 8, FLAME_YELLOW_8);
  }
}

function drawWallTorchHi16bit(c: PixelCanvas, frame: number): void {
  // iron wall mounting plate along x = 3..5, touching bottom row y = 47
  c.rect(3, 24, 3, 24, SCONCE_16);
  // plate chamfers at top and bottom foot
  c.px(3, 24, OUTLINE_16);
  c.px(5, 24, OUTLINE_16);
  c.px(3, 47, OUTLINE_16);
  // deep shadow line on the wall-facing left edge
  c.rect(3, 25, 1, 22, OUTLINE_16);

  // forged iron mounting bolts
  c.rect(4, 27, 2, 2, OUTLINE_16);
  c.px(4, 27, SCONCE_16);
  c.rect(4, 43, 2, 2, OUTLINE_16);
  c.px(4, 43, SCONCE_16);

  // horizontal bracket arm extending to the torch cradle
  c.rect(5, 27, 6, 3, SCONCE_16);
  c.rect(5, 29, 6, 1, OUTLINE_16); // underside shadow

  // diagonal forged iron brace leaving visible negative space
  c.line(4, 38, 9, 30, SCONCE_16);
  c.line(5, 39, 10, 31, SCONCE_16);
  c.line(5, 40, 10, 32, OUTLINE_16); // brace shadow

  // iron collar socket and cradle basket
  c.rect(8, 25, 8, 4, SCONCE_16);
  c.rect(8, 28, 8, 1, OUTLINE_16); // collar bottom rim shadow
  c.px(8, 24, SCONCE_16); // left basket tine
  c.px(15, 24, SCONCE_16); // right basket tine
  c.rect(9, 25, 6, 1, WOOD_16); // warm specular firelight glint on upper rim

  // timber torch stave
  c.rect(10, 18, 4, 19, WOOD_16);
  c.rect(11, 37, 2, 2, WOOD_16); // bottom rounded stave tip
  c.px(11, 38, OUTLINE_16);
  c.rect(10, 21, 1, 15, PITCH_16); // shadow side of wood
  c.rect(12, 21, 1, 15, PITCH_16); // wood grain vertical furrow

  // tarred pitch bindings (charred wraps soaked in resin)
  c.rect(9, 16, 6, 4, PITCH_16); // head collar
  c.line(10, 21, 13, 23, PITCH_16); // cross band 1
  c.line(10, 24, 13, 22, PITCH_16); // cross band 2
  c.line(10, 31, 13, 33, PITCH_16); // lower wrap

  // dark outline around metal and wood assembly
  c.outline(OUTLINE_16);

  // 4-frame animated flame
  if (frame === 0) {
    // resting flame: symmetrical 16px teardrop centered over torch head; core at x: 12, y: 14
    // crimson outer envelope
    c.px(12, 5, FLAME_CRIMSON_16); // pointed tip
    c.rect(12, 6, 2, 1, FLAME_CRIMSON_16);
    c.rect(11, 7, 4, 1, FLAME_CRIMSON_16);
    c.rect(10, 8, 6, 2, FLAME_CRIMSON_16);
    c.rect(9, 10, 8, 3, FLAME_CRIMSON_16);
    c.rect(8, 13, 10, 4, FLAME_CRIMSON_16);
    c.rect(9, 17, 8, 2, FLAME_CRIMSON_16);
    c.rect(10, 19, 6, 1, FLAME_CRIMSON_16);

    // vibrant amber midtone
    c.px(12, 7, FLAME_AMBER_16);
    c.rect(11, 8, 3, 1, FLAME_AMBER_16);
    c.rect(11, 9, 4, 2, FLAME_AMBER_16);
    c.rect(10, 11, 6, 3, FLAME_AMBER_16);
    c.rect(9, 14, 8, 3, FLAME_AMBER_16);
    c.rect(10, 17, 6, 2, FLAME_AMBER_16);

    // bright lemon core centered at x: 12, y: 14
    c.px(12, 11, FLAME_LEMON_16);
    c.rect(11, 12, 3, 1, FLAME_LEMON_16);
    c.rect(11, 13, 4, 2, FLAME_LEMON_16);
    c.rect(11, 15, 3, 1, FLAME_LEMON_16);
    c.px(12, 16, FLAME_LEMON_16);
  } else if (frame === 1) {
    // upward lick: extends higher (+2px higher to y = 3), curls 1px right, core shifts up 1px
    c.px(13, 3, FLAME_CRIMSON_16); // curling tip
    c.rect(13, 4, 2, 1, FLAME_CRIMSON_16);
    c.rect(12, 5, 3, 1, FLAME_CRIMSON_16);
    c.rect(11, 6, 4, 1, FLAME_CRIMSON_16);
    c.rect(11, 7, 5, 1, FLAME_CRIMSON_16);
    c.rect(10, 8, 6, 2, FLAME_CRIMSON_16);
    c.rect(9, 10, 8, 3, FLAME_CRIMSON_16);
    c.rect(8, 13, 9, 3, FLAME_CRIMSON_16);
    c.rect(9, 16, 8, 3, FLAME_CRIMSON_16);
    c.rect(10, 19, 6, 1, FLAME_CRIMSON_16);

    // amber midtone reaching into the licking tongue
    c.px(13, 5, FLAME_AMBER_16);
    c.rect(12, 6, 2, 1, FLAME_AMBER_16);
    c.rect(12, 7, 3, 1, FLAME_AMBER_16);
    c.rect(11, 8, 4, 2, FLAME_AMBER_16);
    c.rect(10, 10, 6, 3, FLAME_AMBER_16);
    c.rect(9, 13, 7, 3, FLAME_AMBER_16);
    c.rect(10, 16, 6, 3, FLAME_AMBER_16);

    // bright lemon core shifted up 1px to y = 13
    c.px(13, 9, FLAME_LEMON_16);
    c.px(13, 10, FLAME_LEMON_16);
    c.rect(12, 11, 2, 1, FLAME_LEMON_16);
    c.rect(11, 12, 4, 3, FLAME_LEMON_16);
    c.rect(12, 15, 2, 1, FLAME_LEMON_16);
  } else if (frame === 2) {
    // flame widening: plume broadens by 1px on left and right, cinder spark separates 2px above tip
    c.px(13, 2, SMOKE_16); // smoke particle
    c.px(11, 3, SMOKE_16);
    c.rect(12, 3, 2, 2, FLAME_AMBER_16); // floating ember cinder
    c.px(12, 3, FLAME_LEMON_16);
    c.px(12, 4, FLAME_LEMON_16);

    // broadened crimson plume
    c.rect(11, 6, 4, 1, FLAME_CRIMSON_16);
    c.rect(9, 7, 8, 2, FLAME_CRIMSON_16);
    c.rect(8, 9, 10, 3, FLAME_CRIMSON_16);
    c.rect(7, 12, 12, 5, FLAME_CRIMSON_16); // broadened belly (+1px left and right)
    c.rect(8, 17, 10, 2, FLAME_CRIMSON_16);
    c.rect(10, 19, 6, 1, FLAME_CRIMSON_16);

    // amber midtone
    c.rect(11, 8, 4, 1, FLAME_AMBER_16);
    c.rect(10, 9, 6, 3, FLAME_AMBER_16);
    c.rect(9, 12, 8, 4, FLAME_AMBER_16);
    c.rect(9, 16, 8, 2, FLAME_AMBER_16);

    // bright lemon core flared wider
    c.rect(11, 12, 4, 1, FLAME_LEMON_16);
    c.rect(10, 13, 6, 3, FLAME_LEMON_16);
    c.rect(11, 16, 4, 1, FLAME_LEMON_16);
  } else {
    // frame 3: downward curl, curves left against wall draft
    c.px(10, 5, SMOKE_16); // smoke wisp drifting left
    c.px(10, 6, SMOKE_16);
    c.rect(10, 7, 2, 1, FLAME_CRIMSON_16); // tip curling left
    c.rect(9, 8, 4, 1, FLAME_CRIMSON_16);
    c.rect(9, 9, 6, 1, FLAME_CRIMSON_16);
    c.rect(8, 10, 8, 3, FLAME_CRIMSON_16);
    c.rect(8, 13, 9, 4, FLAME_CRIMSON_16);
    c.rect(9, 17, 8, 2, FLAME_CRIMSON_16);
    c.rect(10, 19, 6, 1, FLAME_CRIMSON_16);

    // amber midtone curving left
    c.px(10, 8, FLAME_AMBER_16);
    c.rect(10, 9, 3, 1, FLAME_AMBER_16);
    c.rect(9, 10, 6, 3, FLAME_AMBER_16);
    c.rect(9, 13, 7, 3, FLAME_AMBER_16);
    c.rect(9, 16, 7, 2, FLAME_AMBER_16);

    // bright lemon core curving left
    c.px(11, 11, FLAME_LEMON_16);
    c.rect(10, 12, 3, 1, FLAME_LEMON_16);
    c.rect(10, 13, 4, 2, FLAME_LEMON_16);
    c.rect(10, 15, 3, 1, FLAME_LEMON_16);
    c.px(11, 16, FLAME_LEMON_16);
  }
}

export default defineProp({
  id: "wall_torch",
  description: "An angular blackened-iron sconce holding a pitch-wrapped wooden torch with an animated flickering flame.",
  size: { width: 24, height: 48 },
  anchor: "bottom",
  frames: 4,
  fps: 8,
  glow: { color: "#ffb347", radius: 72, x: 12, y: 14, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawWallTorchHi8bit(c, frame),
    hi16bit: (c, frame) => drawWallTorchHi16bit(c, frame),
  },
});
