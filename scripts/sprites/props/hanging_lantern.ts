import { defineProp, type PixelCanvas } from "../defineProp";

// palette for hi-16bit (9 colours per spec)
const OUTLINE_16 = "#140c08";
const IRON_DARK_16 = "#3a2820";
const IRON_MID_16 = "#624a3e";
const IRON_HI_16 = "#9a7c6e";
const GLASS_TINT_16 = "#1c3834";
const FLAME_HALO_16 = "#ffedd5";
const FLAME_CORE_16 = "#fef08a";
const FLAME_MID_16 = "#f97316";
const FLAME_EDGE_16 = "#c2410c";

// palette for hi-8bit (5 colours per spec)
const OUTLINE_8 = "#180e0a";
const IRON_8 = "#523a30";
const GLASS_8 = "#162a26";
const FLAME_MID_8 = "#ea580c";
const FLAME_CORE_8 = "#fef08a";

function drawHi8bit(c: PixelCanvas, frame: number): void {
  // top mounting bracket touching y=0
  c.rect(7, 0, 2, 2, IRON_8);

  // single-pixel alternating link chain (y=2..7)
  c.px(7, 2, IRON_8);
  c.px(8, 3, IRON_8);
  c.px(7, 4, IRON_8);
  c.px(8, 5, IRON_8);
  c.px(7, 6, IRON_8);
  c.px(8, 7, IRON_8);

  // canopy collar and gothic bell-roof (y=8..13)
  c.rect(7, 8, 2, 1, IRON_8);
  c.rect(6, 9, 4, 1, IRON_8);
  c.rect(6, 10, 4, 1, IRON_8);
  c.rect(5, 11, 6, 1, IRON_8);
  c.rect(4, 12, 8, 1, IRON_8);
  c.rect(2, 13, 12, 1, IRON_8);

  // upper chamber cornice with gothic arch tops (y=14)
  c.rect(3, 14, 10, 1, IRON_8);

  // glass panes across chamber (y=15..23)
  c.rect(4, 15, 8, 9, GLASS_8);

  // gothic corner ribs
  c.rect(3, 15, 1, 9, IRON_8);
  c.rect(5, 15, 1, 9, IRON_8);
  c.rect(10, 15, 1, 9, IRON_8);
  c.rect(12, 15, 1, 9, IRON_8);

  // gothic arched tracery headers (y=15)
  c.px(4, 15, IRON_8);
  c.px(7, 15, IRON_8);
  c.px(8, 15, IRON_8);
  c.px(11, 15, IRON_8);

  // candle holder and stub inside center pane (y=22..23)
  c.rect(6, 23, 4, 1, IRON_8);
  c.rect(7, 22, 2, 1, IRON_8);

  // candle flame per frame (y=15..21)
  if (frame === 0) {
    // frame 0: base rest state centered
    c.px(7, 17, FLAME_MID_8);
    c.rect(7, 18, 2, 1, FLAME_MID_8);
    c.rect(6, 19, 4, 2, FLAME_MID_8);
    c.rect(7, 19, 2, 2, FLAME_CORE_8);
    c.rect(7, 21, 2, 1, FLAME_MID_8);
  } else if (frame === 1) {
    // frame 1: tip extends 1 px up, tilts right
    c.px(8, 16, FLAME_MID_8);
    c.px(8, 17, FLAME_MID_8);
    c.rect(7, 18, 3, 1, FLAME_MID_8);
    c.rect(7, 19, 3, 2, FLAME_MID_8);
    c.rect(8, 19, 2, 2, FLAME_CORE_8);
    c.rect(7, 21, 2, 1, FLAME_MID_8);
  } else if (frame === 2) {
    // frame 2: tip curls inward, 1-pixel ember detaches 2 px above
    c.px(8, 15, FLAME_CORE_8);
    c.px(7, 17, FLAME_MID_8);
    c.rect(7, 18, 2, 1, FLAME_MID_8);
    c.rect(6, 19, 4, 2, FLAME_MID_8);
    c.rect(7, 19, 2, 2, FLAME_CORE_8);
    c.rect(7, 21, 2, 1, FLAME_MID_8);
  } else {
    // frame 3: flame contracts 1 px leftward, loops to frame 0
    c.px(6, 17, FLAME_MID_8);
    c.rect(6, 18, 2, 1, FLAME_MID_8);
    c.rect(6, 19, 3, 2, FLAME_MID_8);
    c.rect(6, 19, 2, 2, FLAME_CORE_8);
    c.rect(7, 21, 2, 1, FLAME_MID_8);
  }

  // lower base and basin (y=24..28)
  c.rect(2, 24, 12, 1, IRON_8);
  c.rect(3, 25, 10, 1, IRON_8);
  c.rect(4, 26, 8, 1, IRON_8);
  c.rect(5, 27, 6, 1, IRON_8);
  c.rect(6, 28, 4, 1, IRON_8);

  // acorn finial (y=29)
  c.rect(7, 29, 2, 1, IRON_8);

  // dark exterior outline
  c.outline(OUTLINE_8);
}

function drawHi16bit(c: PixelCanvas, frame: number): void {
  // top mounting plate touching y=0
  c.rect(14, 0, 4, 1, IRON_DARK_16);
  c.rect(15, 0, 2, 1, IRON_MID_16);

  // top mounting eyelet ring (y=1..3)
  c.rect(14, 1, 4, 1, IRON_HI_16);
  c.rect(13, 2, 2, 1, IRON_HI_16);
  c.rect(17, 2, 2, 1, IRON_DARK_16);
  c.rect(14, 3, 4, 1, IRON_MID_16);

  // interlocking suspended chain links (y=4..15)
  // link 1 (facing ring): y=4..6
  c.rect(14, 4, 4, 1, IRON_HI_16);
  c.px(14, 5, IRON_HI_16);
  c.px(17, 5, IRON_DARK_16);
  c.rect(14, 6, 4, 1, IRON_MID_16);

  // link 2 (side profile, interlocking): y=6..9
  c.rect(15, 6, 2, 4, IRON_MID_16);
  c.px(15, 7, IRON_HI_16);
  c.px(15, 8, IRON_HI_16);
  c.px(16, 7, IRON_DARK_16);
  c.px(16, 8, IRON_DARK_16);

  // link 3 (facing ring): y=9..12
  c.rect(14, 9, 4, 1, IRON_HI_16);
  c.px(14, 10, IRON_HI_16);
  c.px(14, 11, IRON_HI_16);
  c.px(17, 10, IRON_DARK_16);
  c.px(17, 11, IRON_DARK_16);
  c.rect(14, 12, 4, 1, IRON_MID_16);

  // link 4 (side profile into canopy collar): y=12..15
  c.rect(15, 12, 2, 4, IRON_MID_16);
  c.px(15, 13, IRON_HI_16);
  c.px(15, 14, IRON_HI_16);
  c.px(16, 13, IRON_DARK_16);
  c.px(16, 14, IRON_DARK_16);

  // canopy top collar loop (y=15..16)
  c.rect(14, 16, 4, 1, IRON_MID_16);
  c.px(14, 16, IRON_HI_16);
  c.px(17, 16, IRON_DARK_16);

  // gothic concave bell-canopy roof slopes (y=17..26)
  const roofRows = [
    { y: 17, x0: 13, x1: 18 },
    { y: 18, x0: 13, x1: 18 },
    { y: 19, x0: 12, x1: 19 },
    { y: 20, x0: 11, x1: 20 },
    { y: 21, x0: 10, x1: 21 },
    { y: 22, x0: 9, x1: 22 },
    { y: 23, x0: 8, x1: 23 },
    { y: 24, x0: 6, x1: 25 },
    { y: 25, x0: 5, x1: 26 },
    { y: 26, x0: 4, x1: 27 },
  ];

  for (const row of roofRows) {
    const w = row.x1 - row.x0 + 1;
    c.rect(row.x0, row.y, w, 1, IRON_MID_16);
    // bevel highlight along left crest
    c.px(row.x0, row.y, IRON_HI_16);
    if (row.x0 + 1 <= 15) c.px(row.x0 + 1, row.y, IRON_HI_16);
    // center hip ridge
    c.px(15, row.y, IRON_HI_16);
    // shadow on right-facing slope
    c.px(row.x1, row.y, IRON_DARK_16);
    if (row.x1 - 1 > 16) c.px(row.x1 - 1, row.y, IRON_DARK_16);
  }

  // gothic crocket corner points on roof eaves
  c.px(4, 25, IRON_HI_16);
  c.px(27, 25, IRON_DARK_16);

  // flared gothic eaves with ornamental dentils (y=27..28)
  c.rect(4, 27, 24, 1, IRON_DARK_16);
  c.rect(4, 27, 14, 1, IRON_MID_16);
  c.rect(4, 27, 3, 1, IRON_HI_16);

  // cornice molding (y=28)
  c.rect(5, 28, 22, 1, IRON_MID_16);
  c.rect(5, 28, 3, 1, IRON_HI_16);
  c.rect(24, 28, 3, 1, IRON_DARK_16);

  // glass chamber panes (y=29..49)
  // left facet: dark angled glass
  c.rect(6, 29, 4, 21, GLASS_TINT_16);
  // center facet: illuminated glass chamber
  c.rect(12, 29, 8, 21, GLASS_TINT_16);
  // right facet: dark angled glass
  c.rect(22, 29, 4, 21, GLASS_TINT_16);

  // gothic arched tracery headers (y=29..30)
  c.rect(6, 29, 4, 1, IRON_MID_16);
  c.rect(12, 29, 8, 1, IRON_MID_16);
  c.rect(22, 29, 4, 1, IRON_DARK_16);
  c.px(7, 30, IRON_MID_16);
  c.px(8, 30, IRON_MID_16);
  c.px(14, 30, IRON_HI_16);
  c.px(15, 30, IRON_HI_16);
  c.px(16, 30, IRON_MID_16);
  c.px(17, 30, IRON_MID_16);
  c.px(23, 30, IRON_DARK_16);
  c.px(24, 30, IRON_DARK_16);

  // vertical corner ribs with bevel shading (y=29..49)
  // outer left rib (x=4..5)
  c.rect(4, 29, 1, 21, IRON_HI_16);
  c.rect(5, 29, 1, 21, IRON_MID_16);

  // inner left rib (x=10..11)
  c.rect(10, 29, 1, 21, IRON_HI_16);
  c.rect(11, 29, 1, 21, IRON_MID_16);

  // inner right rib (x=20..21)
  c.rect(20, 29, 1, 21, IRON_MID_16);
  c.rect(21, 29, 1, 21, IRON_DARK_16);

  // outer right rib (x=26..27)
  c.rect(26, 29, 1, 21, IRON_MID_16);
  c.rect(27, 29, 1, 21, IRON_DARK_16);

  // diagonal glints on left facet glass
  c.px(7, 33, IRON_HI_16);
  c.px(8, 34, IRON_HI_16);
  c.px(7, 39, IRON_HI_16);
  c.px(8, 40, IRON_HI_16);

  // subtle glint on right facet glass
  c.px(23, 35, IRON_MID_16);
  c.px(24, 36, IRON_MID_16);

  // candle pricket tray and wax column (y=44..50)
  c.rect(12, 49, 8, 2, IRON_DARK_16);
  c.rect(13, 49, 6, 1, IRON_MID_16);
  c.px(13, 49, IRON_HI_16);
  // candle wax column (y=45..48)
  c.rect(14, 45, 4, 4, FLAME_HALO_16);
  c.rect(16, 45, 2, 4, FLAME_MID_16);
  // candle dripping wax drop on left flank
  c.px(13, 46, FLAME_HALO_16);
  // wick
  c.px(15, 44, IRON_DARK_16);
  c.px(16, 44, IRON_DARK_16);

  // organic teardrop candle flame with natural heat gradient and halo aura
  if (frame === 0) {
    // frame 0: calm rest state, centered flame
    // ambient halo glow flecks on surrounding glass
    c.px(15, 34, FLAME_HALO_16);
    c.px(16, 34, FLAME_HALO_16);
    c.px(12, 38, FLAME_HALO_16);
    c.px(19, 38, FLAME_HALO_16);

    // outer flame envelope (teardrop)
    c.rect(15, 35, 2, 1, FLAME_EDGE_16);
    c.rect(14, 36, 4, 1, FLAME_EDGE_16);
    c.rect(13, 37, 6, 2, FLAME_EDGE_16);
    c.rect(12, 39, 8, 4, FLAME_EDGE_16);
    c.rect(13, 43, 6, 1, FLAME_EDGE_16);

    // mid flame body
    c.rect(15, 36, 2, 1, FLAME_MID_16);
    c.rect(14, 37, 4, 2, FLAME_MID_16);
    c.rect(13, 39, 6, 4, FLAME_MID_16);

    // flame core (4x6 px per spec: x=14..17, y=38..43)
    c.rect(14, 38, 4, 6, FLAME_CORE_16);
    // white-hot inner core
    c.rect(15, 39, 2, 4, FLAME_HALO_16);
  } else if (frame === 1) {
    // frame 1: tip extends 1 px upward (y=34), tilts 1 px right, core expands to 5x6 px
    // brighter flickering halo flecks
    c.px(17, 33, FLAME_HALO_16);
    c.px(18, 34, FLAME_HALO_16);
    c.px(12, 37, FLAME_HALO_16);
    c.px(20, 37, FLAME_HALO_16);
    c.px(12, 38, FLAME_HALO_16);

    // flame tip tilted right
    c.px(17, 34, FLAME_EDGE_16);
    c.rect(16, 35, 2, 1, FLAME_EDGE_16);
    c.rect(15, 36, 4, 1, FLAME_EDGE_16);
    c.rect(13, 37, 7, 2, FLAME_EDGE_16);
    c.rect(12, 39, 8, 4, FLAME_EDGE_16);
    c.rect(13, 43, 6, 1, FLAME_EDGE_16);

    // mid flame
    c.px(16, 35, FLAME_MID_16);
    c.rect(15, 36, 3, 1, FLAME_MID_16);
    c.rect(14, 37, 5, 2, FLAME_MID_16);
    c.rect(13, 39, 7, 4, FLAME_MID_16);

    // core expands to 5x6 px (x=14..18, y=37..42)
    c.rect(14, 37, 5, 6, FLAME_CORE_16);
    // white-hot inner core tilted right
    c.rect(15, 38, 3, 4, FLAME_HALO_16);
  } else if (frame === 2) {
    // frame 2: tip curls inward, core stabilizes at 4x5 px, 1-pixel ember detaches 2 px above tip
    c.px(13, 37, FLAME_HALO_16);
    c.px(19, 37, FLAME_HALO_16);

    // detached ember 2 px above tip (tip at y=35 -> ember at y=33)
    c.px(16, 33, FLAME_CORE_16);

    // curled tip
    c.px(15, 35, FLAME_EDGE_16);
    c.rect(14, 36, 3, 1, FLAME_EDGE_16);
    c.rect(13, 37, 6, 2, FLAME_EDGE_16);
    c.rect(12, 39, 8, 4, FLAME_EDGE_16);
    c.rect(13, 43, 6, 1, FLAME_EDGE_16);

    // mid flame
    c.px(15, 36, FLAME_MID_16);
    c.rect(14, 37, 4, 2, FLAME_MID_16);
    c.rect(13, 39, 6, 4, FLAME_MID_16);

    // core stabilizes at 4x5 px (x=14..17, y=38..42)
    c.rect(14, 38, 4, 5, FLAME_CORE_16);
    // white-hot inner core
    c.rect(15, 39, 2, 3, FLAME_HALO_16);
  } else {
    // frame 3: flame contracts 1 px leftward, ember dissipates, contour settles
    c.px(13, 34, FLAME_HALO_16);
    c.px(11, 38, FLAME_HALO_16);
    c.px(18, 38, FLAME_HALO_16);

    // tip tilted left
    c.px(14, 35, FLAME_EDGE_16);
    c.rect(13, 36, 3, 1, FLAME_EDGE_16);
    c.rect(12, 37, 6, 2, FLAME_EDGE_16);
    c.rect(12, 39, 7, 4, FLAME_EDGE_16);
    c.rect(13, 43, 6, 1, FLAME_EDGE_16);

    // mid flame
    c.px(14, 36, FLAME_MID_16);
    c.rect(13, 37, 4, 2, FLAME_MID_16);
    c.rect(13, 39, 5, 4, FLAME_MID_16);

    // core 4x6 px shifted left (x=13..16, y=38..43)
    c.rect(13, 38, 4, 6, FLAME_CORE_16);
    // white-hot inner core shifted left
    c.rect(14, 39, 2, 4, FLAME_HALO_16);
  }

  // lower basin rail and tiered base (y=50..56)
  c.rect(4, 50, 24, 1, IRON_MID_16);
  c.rect(4, 50, 3, 1, IRON_HI_16);
  c.rect(25, 50, 3, 1, IRON_DARK_16);

  c.rect(5, 51, 22, 1, IRON_DARK_16);
  c.rect(5, 51, 11, 1, IRON_MID_16);
  c.px(5, 51, IRON_HI_16);

  c.rect(6, 52, 20, 1, IRON_MID_16);
  c.px(6, 52, IRON_HI_16);
  c.rect(24, 52, 2, 1, IRON_DARK_16);

  c.rect(8, 53, 16, 1, IRON_MID_16);
  c.px(8, 53, IRON_HI_16);
  c.rect(21, 53, 3, 1, IRON_DARK_16);

  c.rect(10, 54, 12, 1, IRON_MID_16);
  c.px(10, 54, IRON_HI_16);
  c.rect(19, 54, 3, 1, IRON_DARK_16);

  c.rect(12, 55, 8, 1, IRON_MID_16);
  c.px(12, 55, IRON_HI_16);
  c.rect(17, 55, 3, 1, IRON_DARK_16);

  c.rect(13, 56, 6, 1, IRON_DARK_16);
  c.rect(13, 56, 3, 1, IRON_MID_16);

  // ornamental acorn finial (y=57..61)
  // acorn cupule textured cap (y=57)
  c.rect(13, 57, 6, 1, IRON_DARK_16);
  c.px(13, 57, IRON_MID_16);
  c.px(15, 57, IRON_HI_16);
  c.px(17, 57, IRON_MID_16);

  // acorn nut body (y=58..59)
  c.rect(14, 58, 4, 1, IRON_MID_16);
  c.px(14, 58, IRON_HI_16);
  c.px(15, 58, IRON_HI_16);
  c.px(17, 58, IRON_DARK_16);

  c.rect(14, 59, 4, 1, IRON_MID_16);
  c.px(14, 59, IRON_HI_16);
  c.px(17, 59, IRON_DARK_16);

  // acorn tapered bottom (y=60)
  c.rect(15, 60, 2, 1, IRON_MID_16);
  c.px(15, 60, IRON_HI_16);
  c.px(16, 60, IRON_DARK_16);

  // acorn pointed drop nipple (y=61)
  c.px(15, 61, IRON_HI_16);
  c.px(16, 61, IRON_DARK_16);

  // 1 px dark outline around whole lantern
  c.outline(OUTLINE_16);
}

export default defineProp({
  id: "hanging_lantern",
  description: "a suspended gothic wrought-iron cage lantern with a flickering warm candle flame behind dark faceted glass.",
  size: { width: 32, height: 64 },
  anchor: "top",
  frames: 4,
  fps: 8,
  glow: { color: "#ffb347", radius: 72, x: 16, y: 44, flicker: true },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
