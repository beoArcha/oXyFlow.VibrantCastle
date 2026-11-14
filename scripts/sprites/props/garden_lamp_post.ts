import { defineProp, type PixelCanvas } from "../defineProp";

// palette for hi-16bit (9 colours)
const OUTLINE_16 = "#140c08";
const IRON_DARK_16 = "#28201a";
const IRON_MID_16 = "#4e4036";
const IRON_LIGHT_16 = "#7c6a5a";
const BRASS_16 = "#b47b2c";
const GLASS_16 = "#1a2624";
const FLAME_CORE_16 = "#fffbeb";
const FLAME_MID_16 = "#fb923c";
const FLAME_EDGE_16 = "#c2410c";

// palette for hi-8bit (5 colours)
const OUTLINE_8 = "#180e0a";
const IRON_8 = "#44362c";
const BRASS_8 = "#b47b2c";
const FLAME_MID_8 = "#ea580c";
const FLAME_CORE_8 = "#fef08a";

function drawHi8bit(c: PixelCanvas, frame: number): void {
  // needle spire - slender gothic point
  c.px(7, 2, IRON_8);
  c.px(7, 3, IRON_8);
  c.px(8, 3, IRON_8);
  c.rect(7, 4, 2, 1, IRON_8);
  c.rect(6, 5, 4, 1, BRASS_8);

  // gothic arched canopy roof with flared eaves
  c.rect(6, 6, 4, 1, IRON_8);
  c.rect(5, 7, 6, 1, IRON_8);
  c.rect(4, 8, 8, 1, IRON_8);
  c.rect(3, 9, 10, 1, IRON_8);
  c.px(3, 9, BRASS_8);
  c.px(12, 9, BRASS_8);

  // luminaire chamber struts and frame
  c.rect(4, 10, 8, 1, IRON_8);
  c.rect(4, 11, 1, 4, IRON_8);
  c.rect(11, 11, 1, 4, IRON_8);
  c.rect(4, 15, 8, 1, IRON_8);
  c.rect(6, 14, 4, 1, BRASS_8);

  // decorative collar and acanthus brackets
  c.rect(5, 16, 6, 1, IRON_8);
  c.px(4, 16, BRASS_8);
  c.px(11, 16, BRASS_8);
  c.px(5, 17, IRON_8);
  c.px(10, 17, IRON_8);
  c.rect(7, 17, 2, 1, IRON_8);

  // fluted column shaft collapsed to 2-pixel wide solid dark iron bar
  c.rect(7, 18, 2, 18, IRON_8);
  // middle brass ring
  c.rect(6, 26, 4, 1, BRASS_8);

  // stepped octagonal pedestal base with brass trim
  c.rect(6, 36, 4, 1, BRASS_8);
  c.rect(5, 37, 6, 2, IRON_8);
  c.rect(4, 39, 8, 1, BRASS_8);
  c.rect(4, 40, 8, 2, IRON_8);
  c.rect(3, 42, 10, 2, IRON_8);
  c.rect(2, 44, 12, 4, IRON_8); // touches bottom row y=47

  // outline iron and brass structure before flame is drawn
  c.outline(OUTLINE_8);

  // flame animation across 3 frames
  if (frame === 0) {
    // rest teardrop flame centered in lantern
    c.rect(7, 11, 2, 1, FLAME_MID_8);
    c.rect(6, 12, 4, 1, FLAME_MID_8);
    c.rect(7, 13, 2, 1, FLAME_MID_8);
    c.px(7, 12, FLAME_CORE_8);
    c.px(8, 12, FLAME_CORE_8);
  } else if (frame === 1) {
    // flame stretches 1 px taller, waist narrows, core rises
    c.px(7, 10, FLAME_MID_8);
    c.rect(7, 11, 2, 1, FLAME_MID_8);
    c.rect(6, 12, 4, 1, FLAME_MID_8);
    c.rect(7, 13, 2, 1, FLAME_MID_8);
    c.px(7, 11, FLAME_CORE_8);
  } else {
    // flame settles, waist broadens at base, tip bows 1 px eastward
    c.px(8, 11, FLAME_MID_8);
    c.rect(7, 12, 3, 1, FLAME_MID_8);
    c.rect(5, 13, 6, 1, FLAME_MID_8);
    c.px(8, 12, FLAME_CORE_8);
  }
}

function drawHi16bit(c: PixelCanvas, frame: number): void {
  // needle spire with gothic finial: fine tapered needle
  c.px(15, 2, IRON_LIGHT_16);
  c.px(15, 3, IRON_LIGHT_16);
  c.rect(15, 4, 2, 3, IRON_MID_16);
  c.px(15, 4, IRON_LIGHT_16);
  c.px(15, 5, IRON_LIGHT_16);
  c.px(15, 6, IRON_LIGHT_16);
  // finial ring and gothic ornament
  c.rect(14, 7, 4, 1, BRASS_16);
  c.rect(15, 8, 2, 2, BRASS_16);
  c.rect(14, 9, 4, 1, IRON_MID_16);

  // gothic arched canopy roof with steep bell/ogive curve
  // apex
  c.rect(14, 10, 4, 1, IRON_MID_16);
  c.rect(14, 10, 2, 1, IRON_LIGHT_16);
  c.rect(16, 10, 2, 1, IRON_DARK_16);

  c.rect(13, 11, 6, 1, IRON_MID_16);
  c.rect(13, 11, 2, 1, IRON_LIGHT_16);
  c.rect(17, 11, 2, 1, IRON_DARK_16);

  c.rect(12, 12, 8, 1, IRON_MID_16);
  c.rect(12, 12, 3, 1, IRON_LIGHT_16);
  c.rect(17, 12, 3, 1, IRON_DARK_16);

  c.rect(10, 13, 12, 1, IRON_MID_16);
  c.rect(10, 13, 4, 1, IRON_LIGHT_16);
  c.rect(18, 13, 4, 1, IRON_DARK_16);

  c.rect(8, 14, 16, 1, IRON_MID_16);
  c.rect(8, 14, 5, 1, IRON_LIGHT_16);
  c.rect(19, 14, 5, 1, IRON_DARK_16);

  c.rect(7, 15, 18, 1, IRON_MID_16);
  c.rect(7, 15, 6, 1, IRON_LIGHT_16);
  c.rect(19, 15, 6, 1, IRON_DARK_16);

  // flared gothic eaves rim with downward drop finials
  c.rect(6, 16, 20, 1, IRON_MID_16);
  c.rect(6, 16, 7, 1, IRON_LIGHT_16);
  c.rect(19, 16, 7, 1, IRON_DARK_16);
  c.px(6, 16, BRASS_16);
  c.px(25, 16, BRASS_16);
  c.px(6, 17, BRASS_16);
  c.px(25, 17, BRASS_16);

  // luminaire chamber
  // top lintel frame
  c.rect(7, 17, 18, 1, IRON_MID_16);
  c.rect(7, 17, 5, 1, IRON_LIGHT_16);
  c.rect(20, 17, 5, 1, IRON_DARK_16);

  // dark tinted faceted glass panes with subtle warm glow transmission
  c.rect(9, 18, 14, 11, GLASS_16);
  // corner bevels of the glass housing
  c.px(9, 18, IRON_DARK_16);
  c.px(22, 18, IRON_DARK_16);
  c.px(9, 28, IRON_DARK_16);
  c.px(22, 28, IRON_DARK_16);

  // subtle glass reflection gleam
  c.px(10, 19, IRON_LIGHT_16);
  c.px(11, 20, IRON_LIGHT_16);
  c.px(10, 25, IRON_LIGHT_16);

  // outer corner iron ribs
  c.rect(7, 18, 2, 11, IRON_MID_16);
  c.rect(7, 18, 1, 11, IRON_LIGHT_16);
  c.rect(23, 18, 2, 11, IRON_DARK_16);
  c.rect(24, 18, 1, 11, IRON_DARK_16);

  // brass burner nozzle and pedestal with warm light reflection
  c.rect(14, 27, 4, 1, BRASS_16);
  c.px(15, 27, FLAME_MID_16);
  c.px(16, 27, FLAME_MID_16);
  c.rect(13, 28, 6, 1, BRASS_16);

  // bottom sill of luminaire
  c.rect(7, 29, 18, 1, IRON_MID_16);
  c.rect(7, 29, 5, 1, IRON_LIGHT_16);
  c.rect(20, 29, 5, 1, IRON_DARK_16);
  c.rect(8, 30, 16, 1, BRASS_16);

  // ornate acanthus scroll brackets supporting luminaire
  c.rect(10, 31, 12, 1, IRON_MID_16);
  c.rect(10, 31, 4, 1, IRON_LIGHT_16);
  c.rect(18, 31, 4, 1, IRON_DARK_16);

  // curved scrollwork brackets flaring outward with brass highlights
  c.px(8, 31, BRASS_16);
  c.px(23, 31, BRASS_16);
  c.px(7, 31, BRASS_16);
  c.px(24, 31, BRASS_16);
  c.px(7, 32, BRASS_16);
  c.px(24, 32, BRASS_16);
  c.px(8, 33, IRON_LIGHT_16);
  c.px(23, 33, IRON_DARK_16);
  c.px(9, 34, IRON_LIGHT_16);
  c.px(22, 34, IRON_DARK_16);
  c.px(10, 35, IRON_LIGHT_16);
  c.px(21, 35, IRON_DARK_16);

  // column capital / collar
  c.rect(11, 32, 10, 1, IRON_MID_16);
  c.rect(12, 33, 8, 3, IRON_MID_16);
  c.rect(12, 33, 3, 3, IRON_LIGHT_16);
  c.rect(17, 33, 3, 3, IRON_DARK_16);
  c.rect(11, 36, 10, 1, BRASS_16);

  // fluted column shaft (y=37..70)
  for (let y = 37; y <= 70; y++) {
    c.px(12, y, IRON_LIGHT_16);
    c.px(13, y, IRON_DARK_16);
    c.px(14, y, IRON_LIGHT_16);
    c.px(15, y, IRON_MID_16);
    c.px(16, y, IRON_DARK_16);
    c.px(17, y, IRON_MID_16);
    c.px(18, y, IRON_DARK_16);
    c.px(19, y, IRON_DARK_16);
  }

  // decorative middle brass ring (y=52..54)
  c.rect(11, 52, 10, 1, IRON_MID_16);
  c.rect(10, 53, 12, 1, BRASS_16);
  c.rect(11, 53, 4, 1, FLAME_CORE_16); // glint on brass ring
  c.rect(11, 54, 10, 1, IRON_DARK_16); // ring drop shadow

  // lower column collar (y=71..72)
  c.rect(11, 71, 10, 1, BRASS_16);
  c.rect(10, 72, 12, 1, IRON_MID_16);
  c.rect(10, 72, 4, 1, IRON_LIGHT_16);
  c.rect(18, 72, 4, 1, IRON_DARK_16);

  // lower pedestal transition and brackets (y=73..77)
  c.rect(10, 73, 12, 1, IRON_MID_16);
  c.px(9, 73, BRASS_16);
  c.px(22, 73, BRASS_16);

  c.rect(9, 74, 14, 1, IRON_MID_16);
  c.rect(9, 74, 4, 1, IRON_LIGHT_16);
  c.rect(19, 74, 4, 1, IRON_DARK_16);

  c.rect(8, 75, 16, 1, IRON_MID_16);
  c.rect(8, 75, 5, 1, IRON_LIGHT_16);
  c.rect(19, 75, 5, 1, IRON_DARK_16);

  c.rect(8, 76, 16, 1, BRASS_16);
  c.rect(9, 77, 14, 1, IRON_MID_16);

  // stepped octagonal pedestal base (y=78..95)
  // upper tier with beveled chamfers
  for (let y = 78; y <= 81; y++) {
    c.rect(9, y, 14, 1, IRON_MID_16);
    c.rect(9, y, 4, 1, IRON_LIGHT_16);
    c.rect(19, y, 4, 1, IRON_DARK_16);
  }

  // middle pedestal block with recessed panel effect and brass medallion
  c.rect(8, 82, 16, 1, BRASS_16);
  c.rect(7, 83, 18, 1, IRON_MID_16);
  c.rect(7, 83, 5, 1, IRON_LIGHT_16);
  c.rect(20, 83, 5, 1, IRON_DARK_16);

  for (let y = 84; y <= 88; y++) {
    c.rect(6, y, 20, 1, IRON_MID_16);
    c.rect(6, y, 4, 1, IRON_LIGHT_16);
    c.rect(22, y, 4, 1, IRON_DARK_16);
    // recessed inner panel shading
    c.px(10, y, IRON_DARK_16);
    c.px(21, y, IRON_DARK_16);
  }
  // central brass crest / medallion on pedestal face
  c.rect(15, 85, 2, 3, BRASS_16);
  c.px(14, 86, BRASS_16);
  c.px(17, 86, BRASS_16);
  // corner brass studs
  c.px(8, 86, BRASS_16);
  c.px(23, 86, BRASS_16);

  // lower plinth steps
  c.rect(5, 89, 22, 1, BRASS_16);
  for (let y = 90; y <= 91; y++) {
    c.rect(5, y, 22, 1, IRON_MID_16);
    c.rect(5, y, 6, 1, IRON_LIGHT_16);
    c.rect(21, y, 6, 1, IRON_DARK_16);
  }

  // bottom plinth touching row y=95
  for (let y = 92; y <= 95; y++) {
    c.rect(4, y, 24, 1, IRON_MID_16);
    c.rect(4, y, 6, 1, IRON_LIGHT_16);
    c.rect(22, y, 6, 1, IRON_DARK_16);
  }

  // outline metal/stone structure
  c.outline(OUTLINE_16);

  // animated teardrop flame in luminaire
  if (frame === 0) {
    // stable teardrop flame centered in lantern housing (4x7 px), core (2x3 px)
    // flame edge
    c.rect(15, 19, 2, 1, FLAME_EDGE_16);
    c.rect(14, 20, 4, 1, FLAME_EDGE_16);
    c.rect(14, 21, 4, 1, FLAME_EDGE_16);
    c.rect(13, 22, 6, 1, FLAME_EDGE_16);
    c.rect(13, 23, 6, 1, FLAME_EDGE_16);
    c.rect(14, 24, 4, 1, FLAME_EDGE_16);
    c.rect(14, 25, 4, 1, FLAME_EDGE_16);
    c.rect(15, 26, 2, 1, FLAME_EDGE_16);

    // flame mid
    c.rect(15, 20, 2, 1, FLAME_MID_16);
    c.rect(14, 21, 4, 1, FLAME_MID_16);
    c.rect(14, 22, 4, 1, FLAME_MID_16);
    c.rect(14, 23, 4, 1, FLAME_MID_16);
    c.rect(15, 24, 2, 1, FLAME_MID_16);

    // white-hot flame core (2x3 px)
    c.rect(15, 21, 2, 3, FLAME_CORE_16);
  } else if (frame === 1) {
    // flame stretches 1 px taller, column waist narrows, core rises
    // flame edge
    c.rect(15, 18, 2, 1, FLAME_EDGE_16);
    c.rect(15, 19, 2, 1, FLAME_EDGE_16);
    c.rect(14, 20, 4, 1, FLAME_EDGE_16);
    c.rect(15, 21, 2, 1, FLAME_EDGE_16); // narrowed waist
    c.rect(14, 22, 4, 1, FLAME_EDGE_16);
    c.rect(13, 23, 6, 1, FLAME_EDGE_16);
    c.rect(14, 24, 4, 1, FLAME_EDGE_16);
    c.rect(14, 25, 4, 1, FLAME_EDGE_16);
    c.rect(15, 26, 2, 1, FLAME_EDGE_16);

    // flame mid
    c.rect(15, 19, 2, 1, FLAME_MID_16);
    c.rect(14, 20, 4, 1, FLAME_MID_16);
    c.rect(15, 21, 2, 1, FLAME_MID_16);
    c.rect(14, 22, 4, 1, FLAME_MID_16);
    c.rect(14, 23, 4, 1, FLAME_MID_16);
    c.rect(15, 24, 2, 1, FLAME_MID_16);

    // rising core with slight flicker expansion
    c.rect(15, 20, 2, 3, FLAME_CORE_16);
    c.px(14, 21, FLAME_CORE_16);
    c.px(17, 21, FLAME_CORE_16);
  } else {
    // flame settles, waist broadens at base, tip bows 1 px eastward
    // flame edge
    c.px(16, 19, FLAME_EDGE_16);
    c.rect(15, 20, 3, 1, FLAME_EDGE_16);
    c.rect(14, 21, 5, 1, FLAME_EDGE_16);
    c.rect(13, 22, 7, 1, FLAME_EDGE_16);
    c.rect(13, 23, 7, 1, FLAME_EDGE_16);
    c.rect(13, 24, 6, 1, FLAME_EDGE_16);
    c.rect(14, 25, 4, 1, FLAME_EDGE_16);
    c.rect(15, 26, 2, 1, FLAME_EDGE_16);

    // flame mid
    c.px(16, 20, FLAME_MID_16);
    c.rect(15, 21, 3, 1, FLAME_MID_16);
    c.rect(14, 22, 5, 1, FLAME_MID_16);
    c.rect(14, 23, 5, 1, FLAME_MID_16);
    c.rect(14, 24, 4, 1, FLAME_MID_16);

    // core shifted slightly eastward matching tip
    c.rect(16, 21, 2, 3, FLAME_CORE_16);
  }
}

export default defineProp({
  id: "garden_lamp_post",
  description: "victorian-gothic freestanding courtyard lamp post with fluted column and lantern luminaire.",
  size: { width: 32, height: 96 },
  anchor: "bottom",
  frames: 3,
  fps: 6,
  glow: { color: "#f59e0b", radius: 84, x: 16, y: 22, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawHi8bit(c, frame),
    hi16bit: (c, frame) => drawHi16bit(c, frame),
  },
});
