import { defineProp, type PixelCanvas } from "../defineProp";

// palette for hi-16bit tier (7 colors matching thorn chasm spec)
const C16_OUTLINE = "#140906";
const C16_DARK = "#2a2b30";
const C16_MID = "#4a4e58";
const C16_LIGHT = "#787f8d";
const C16_GLINT = "#b8c0cc";
const C16_RUST_DARK = "#3d1b0d";
const C16_RUST = "#8d4325";

// palette for hi-8bit tier (4 colors)
const C8_OUTLINE = "#140906";
const C8_SHADOW = "#2a2b30";
const C8_MID = "#4a4e58";
const C8_LIGHT = "#787f8d";

function drawChain8(c: PixelCanvas): void {
  // top mounting bracket (y=0..3) touching ceiling row y=0
  // ceiling mounting plate
  c.rect(1, 0, 6, 1, C8_OUTLINE);
  c.px(2, 0, C8_LIGHT);
  c.rect(3, 0, 2, 1, C8_MID);
  c.px(5, 0, C8_SHADOW);

  // flared bracket body
  c.rect(1, 1, 6, 1, C8_OUTLINE);
  c.px(2, 1, C8_LIGHT);
  c.rect(3, 1, 2, 1, C8_MID);
  c.px(5, 1, C8_SHADOW);

  // bracket collar tapering down
  c.rect(2, 2, 4, 1, C8_OUTLINE);
  c.px(3, 2, C8_LIGHT);
  c.px(4, 2, C8_SHADOW);

  c.rect(2, 3, 4, 1, C8_OUTLINE);
  c.px(3, 3, C8_MID);
  c.px(4, 3, C8_SHADOW);

  // helper to draw a 5x7 face-on oval ring with a 1 px hole at x=3
  const drawRing8 = (y0: number) => {
    // top rounded curve
    c.px(2, y0, C8_OUTLINE);
    c.px(3, y0, C8_LIGHT);
    c.px(4, y0, C8_OUTLINE);

    // top shoulder
    c.px(1, y0 + 1, C8_OUTLINE);
    c.px(2, y0 + 1, C8_LIGHT);
    c.px(3, y0 + 1, C8_MID);
    c.px(4, y0 + 1, C8_SHADOW);
    c.px(5, y0 + 1, C8_OUTLINE);

    // middle rails with 1 px transparent hole at x=3
    for (let dy = 2; dy <= 4; dy++) {
      c.px(1, y0 + dy, C8_OUTLINE);
      c.px(2, y0 + dy, C8_LIGHT);
      c.clear(3, y0 + dy, 1, 1);
      c.px(4, y0 + dy, C8_SHADOW);
      c.px(5, y0 + dy, C8_OUTLINE);
    }

    // bottom shoulder
    c.px(1, y0 + 5, C8_OUTLINE);
    c.px(2, y0 + 5, C8_MID);
    c.px(3, y0 + 5, C8_SHADOW);
    c.px(4, y0 + 5, C8_SHADOW);
    c.px(5, y0 + 5, C8_OUTLINE);

    // bottom rounded curve
    c.px(2, y0 + 6, C8_OUTLINE);
    c.px(3, y0 + 6, C8_SHADOW);
    c.px(4, y0 + 6, C8_OUTLINE);
  };

  // helper to draw an edge-on link seen from side (narrow 3 px bar)
  const drawSideLink8 = (y0: number, isLast: boolean) => {
    // loop entering from above into the ring top bar
    c.px(2, y0, C8_OUTLINE);
    c.px(3, y0, C8_LIGHT);
    c.px(4, y0, C8_OUTLINE);

    // vertical narrow bar waist in open air
    for (let dy = 1; dy <= 4; dy++) {
      c.px(2, y0 + dy, C8_OUTLINE);
      c.px(3, y0 + dy, C8_LIGHT);
      c.px(4, y0 + dy, C8_SHADOW);
    }

    if (!isLast) {
      // bottom loop entering next ring
      c.px(2, y0 + 5, C8_OUTLINE);
      c.px(3, y0 + 5, C8_LIGHT);
      c.px(4, y0 + 5, C8_SHADOW);

      c.px(3, y0 + 6, C8_MID);
    }
  };

  // three alternating rings and edge-on links
  drawRing8(3);              // ring 1 (y=3..9)
  drawSideLink8(8, false);   // link 1 (y=8..14)
  drawRing8(14);             // ring 2 (y=14..20)
  drawSideLink8(19, false);  // link 2 (y=19..25)
  drawRing8(25);             // ring 3 (y=25..31)
  drawSideLink8(30, true);   // link 3 (y=30..35)

  // gothic hook assembly at bottom (y=35..45)
  // hook eyelet collar connecting to link 3
  c.rect(2, 35, 4, 1, C8_OUTLINE);
  c.px(3, 35, C8_LIGHT);
  c.px(4, 35, C8_SHADOW);

  c.rect(2, 36, 4, 1, C8_OUTLINE);
  c.px(3, 36, C8_MID);
  c.px(4, 36, C8_SHADOW);

  // hook shank on right (x=4..5)
  for (let dy = 37; dy <= 41; dy++) {
    c.px(4, dy, C8_LIGHT);
    c.px(5, dy, C8_SHADOW);
  }

  // open throat gap at x=3
  c.clear(3, 37, 1, 5);

  // curved split barb on left (x=1..2, y=38..41)
  c.px(2, 38, C8_LIGHT);
  c.px(1, 38, C8_OUTLINE);

  c.px(2, 39, C8_LIGHT);
  c.px(1, 39, C8_OUTLINE);

  c.px(2, 40, C8_MID);
  c.px(1, 40, C8_OUTLINE);

  c.px(2, 41, C8_MID);
  c.px(1, 41, C8_OUTLINE);

  // hook bowl bottom curve sweeping under (y=42..45)
  c.rect(1, 42, 5, 1, C8_OUTLINE);
  c.px(2, 42, C8_LIGHT);
  c.px(3, 42, C8_MID);
  c.px(4, 42, C8_SHADOW);

  c.rect(2, 43, 4, 1, C8_OUTLINE);
  c.px(3, 43, C8_MID);
  c.px(4, 43, C8_SHADOW);

  c.rect(2, 44, 3, 1, C8_OUTLINE);
  c.px(3, 44, C8_SHADOW);

  c.rect(3, 45, 2, 1, C8_OUTLINE);
  // rows 46..47 remain transparent for margin
}

function drawChain16(c: PixelCanvas): void {
  // top mounting bracket (y=0..8) touching ceiling at y=0
  // ceiling mounting plate (x=2..13) touching ceiling at y=0
  c.rect(2, 0, 12, 1, C16_OUTLINE);
  c.px(3, 0, C16_LIGHT);
  c.rect(4, 0, 2, 1, C16_GLINT); // left bolt
  c.rect(6, 0, 4, 1, C16_MID);
  c.rect(10, 0, 2, 1, C16_GLINT); // right bolt
  c.px(12, 0, C16_DARK);

  // upper plate bevel
  c.rect(2, 1, 12, 1, C16_OUTLINE);
  c.px(3, 1, C16_LIGHT);
  c.rect(4, 1, 2, 1, C16_GLINT);
  c.rect(6, 1, 4, 1, C16_MID);
  c.rect(10, 1, 2, 1, C16_GLINT);
  c.px(12, 1, C16_DARK);

  // flared gothic bracket flange with side spurs
  c.rect(1, 2, 14, 1, C16_OUTLINE);
  c.rect(2, 2, 2, 1, C16_LIGHT);
  c.px(3, 2, C16_GLINT);
  c.rect(4, 2, 8, 1, C16_MID);
  c.px(7, 2, C16_RUST_DARK);
  c.px(8, 2, C16_RUST);
  c.rect(12, 2, 2, 1, C16_DARK);

  // downward gothic spike tips on bracket sides
  c.px(1, 3, C16_OUTLINE);
  c.px(14, 3, C16_OUTLINE);
  c.rect(3, 3, 10, 1, C16_OUTLINE);
  c.rect(4, 3, 2, 1, C16_LIGHT);
  c.rect(6, 3, 4, 1, C16_MID);
  c.rect(10, 3, 2, 1, C16_DARK);

  // bracket collar tapering down
  c.rect(4, 4, 8, 1, C16_OUTLINE);
  c.rect(5, 4, 2, 1, C16_LIGHT);
  c.px(5, 4, C16_GLINT);
  c.rect(7, 4, 3, 1, C16_MID);
  c.px(10, 4, C16_DARK);

  // staple eyelet loop holding ring 1 (y=5..8)
  c.rect(4, 5, 8, 1, C16_OUTLINE);
  c.rect(5, 5, 2, 1, C16_LIGHT);
  c.clear(7, 5, 2, 1);
  c.rect(9, 5, 2, 1, C16_DARK);

  for (let dy = 6; dy <= 8; dy++) {
    c.rect(5, dy, 2, 1, C16_OUTLINE);
    c.px(6, dy, C16_LIGHT);
    c.clear(7, dy, 2, 1);
    c.rect(9, dy, 2, 1, C16_OUTLINE);
    c.px(9, dy, C16_DARK);
  }

  // helper to draw a face-on oval ring (10 px wide x 14 px tall)
  const drawRing16 = (y0: number, rustVariant: number) => {
    // top outer curve (y0)
    c.px(5, y0, C16_OUTLINE);
    c.rect(6, y0, 2, 1, C16_LIGHT);
    c.px(6, y0, C16_GLINT);
    c.rect(8, y0, 2, 1, C16_MID);
    c.px(10, y0, C16_OUTLINE);

    // top shoulder (y0+1)
    c.px(4, y0 + 1, C16_OUTLINE);
    c.rect(5, y0 + 1, 2, 1, C16_LIGHT);
    c.px(5, y0 + 1, C16_GLINT);
    c.rect(7, y0 + 1, 2, 1, C16_MID);
    c.rect(9, y0 + 1, 2, 1, C16_DARK);
    c.px(11, y0 + 1, C16_OUTLINE);

    // top of hole curve (y0+2)
    c.px(3, y0 + 2, C16_OUTLINE);
    c.rect(4, y0 + 2, 2, 1, C16_LIGHT);
    c.px(4, y0 + 2, C16_GLINT);
    c.px(6, y0 + 2, C16_DARK);
    c.clear(7, y0 + 2, 2, 1);
    c.px(9, y0 + 2, C16_DARK);
    c.rect(10, y0 + 2, 2, 1, C16_DARK);
    c.px(12, y0 + 2, C16_OUTLINE);

    // middle rails with 4 px wide transparent hole at x=6..9 (y0+3..y0+10)
    for (let dy = 3; dy <= 10; dy++) {
      // left rail (x=3..5): outline, highlight, mid
      c.px(3, y0 + dy, C16_OUTLINE);
      c.px(4, y0 + dy, C16_LIGHT);
      c.px(5, y0 + dy, C16_MID);

      // clear open hole in the middle (x=6..9)
      c.clear(6, y0 + dy, 4, 1);

      // right rail (x=10..12): mid, dark, outline
      c.px(10, y0 + dy, C16_MID);
      c.px(11, y0 + dy, C16_DARK);
      c.px(12, y0 + dy, C16_OUTLINE);
    }

    // upper-left highlight glints on ring left rail
    c.px(4, y0 + 3, C16_GLINT);
    c.px(4, y0 + 4, C16_GLINT);
    c.px(5, y0 + 3, C16_GLINT);

    // rust detailing on links
    if (rustVariant === 1) {
      c.px(11, y0 + 7, C16_RUST);
      c.px(11, y0 + 8, C16_RUST_DARK);
      c.px(10, y0 + 8, C16_RUST_DARK);
    } else if (rustVariant === 2) {
      c.px(5, y0 + 8, C16_RUST);
      c.px(11, y0 + 5, C16_RUST);
      c.px(10, y0 + 6, C16_RUST_DARK);
    } else {
      c.px(10, y0 + 9, C16_RUST);
      c.px(11, y0 + 9, C16_RUST_DARK);
      c.px(5, y0 + 9, C16_RUST_DARK);
    }

    // bottom of hole curve (y0+11)
    c.px(3, y0 + 11, C16_OUTLINE);
    c.rect(4, y0 + 11, 2, 1, C16_MID);
    c.px(6, y0 + 11, C16_DARK);
    c.clear(7, y0 + 11, 2, 1);
    c.px(9, y0 + 11, C16_DARK);
    c.rect(10, y0 + 11, 2, 1, C16_DARK);
    c.px(12, y0 + 11, C16_OUTLINE);

    // bottom shoulder (y0+12)
    c.px(4, y0 + 12, C16_OUTLINE);
    c.rect(5, y0 + 12, 2, 1, C16_MID);
    c.rect(7, y0 + 12, 2, 1, C16_DARK);
    c.rect(9, y0 + 12, 2, 1, C16_DARK);
    c.px(11, y0 + 12, C16_OUTLINE);

    // bottom outer curve (y0+13)
    c.px(5, y0 + 13, C16_OUTLINE);
    c.rect(6, y0 + 13, 2, 1, C16_MID);
    c.rect(8, y0 + 13, 2, 1, C16_DARK);
    c.px(10, y0 + 13, C16_OUTLINE);
  };

  // helper to draw an edge-on link (narrow vertical bar x=6..9, 14 px tall)
  const drawSideLink16 = (y0: number, rustVariant: number, isLast: boolean) => {
    // top hook knuckle looping through previous ring's bottom (y0..y0+2)
    c.px(6, y0, C16_OUTLINE);
    c.px(7, y0, C16_GLINT);
    c.px(8, y0, C16_LIGHT);
    c.px(9, y0, C16_OUTLINE);

    c.px(6, y0 + 1, C16_OUTLINE);
    c.px(7, y0 + 1, C16_LIGHT);
    c.px(8, y0 + 1, C16_MID);
    c.px(9, y0 + 1, C16_OUTLINE);

    c.px(6, y0 + 2, C16_OUTLINE);
    c.px(7, y0 + 2, C16_LIGHT);
    c.px(8, y0 + 2, C16_MID);
    c.px(9, y0 + 2, C16_OUTLINE);

    // contoured central rod in open air (y0+3..y0+10)
    c.px(6, y0 + 3, C16_OUTLINE);
    c.px(7, y0 + 3, C16_LIGHT);
    c.px(8, y0 + 3, C16_MID);
    c.px(9, y0 + 3, C16_OUTLINE);

    // narrow waist at y0+4
    c.px(7, y0 + 4, C16_LIGHT);
    c.px(8, y0 + 4, C16_MID);

    // prominent forged knuckle with glint at y0+5..y0+7
    c.px(6, y0 + 5, C16_OUTLINE);
    c.px(7, y0 + 5, C16_GLINT);
    c.px(8, y0 + 5, C16_MID);
    c.px(9, y0 + 5, C16_OUTLINE);

    c.px(6, y0 + 6, C16_OUTLINE);
    c.px(7, y0 + 6, C16_GLINT);
    c.px(8, y0 + 6, C16_MID);
    c.px(9, y0 + 6, C16_OUTLINE);

    c.px(6, y0 + 7, C16_OUTLINE);
    c.px(7, y0 + 7, C16_LIGHT);
    c.px(8, y0 + 7, rustVariant === 1 ? C16_RUST : C16_MID);
    c.px(9, y0 + 7, C16_OUTLINE);

    c.px(6, y0 + 8, C16_OUTLINE);
    c.px(7, y0 + 8, C16_LIGHT);
    c.px(8, y0 + 8, rustVariant === 1 ? C16_RUST_DARK : C16_DARK);
    c.px(9, y0 + 8, C16_OUTLINE);

    // narrow waist at y0+9
    c.px(7, y0 + 9, C16_MID);
    c.px(8, y0 + 9, C16_DARK);

    c.px(6, y0 + 10, C16_OUTLINE);
    c.px(7, y0 + 10, C16_LIGHT);
    c.px(8, y0 + 10, C16_MID);
    c.px(9, y0 + 10, C16_OUTLINE);

    // bottom hook knuckle entering next ring (y0+11..y0+13)
    if (!isLast) {
      c.px(6, y0 + 11, C16_OUTLINE);
      c.px(7, y0 + 11, C16_LIGHT);
      c.px(8, y0 + 11, C16_MID);
      c.px(9, y0 + 11, C16_OUTLINE);

      c.px(6, y0 + 12, C16_OUTLINE);
      c.px(7, y0 + 12, C16_MID);
      c.px(8, y0 + 12, C16_DARK);
      c.px(9, y0 + 12, C16_OUTLINE);

      // loop tip inside next ring's hole
      c.px(7, y0 + 13, C16_MID);
      c.px(8, y0 + 13, C16_DARK);
    }
  };

  // draw chain sets:
  // ring 1 (y=7..20)
  drawRing16(7, 1);
  // link 1 loops through ring 1 bottom and down to ring 2 (y=18..31)
  drawSideLink16(18, 1, false);
  // ring 2 (y=29..42)
  drawRing16(29, 2);
  // re-assert link 1 top overlap into ring 2's top bar so they interlock
  c.px(6, 29, C16_OUTLINE);
  c.px(7, 29, C16_GLINT);
  c.px(8, 29, C16_LIGHT);
  c.px(9, 29, C16_OUTLINE);
  c.px(6, 30, C16_OUTLINE);
  c.px(7, 30, C16_LIGHT);
  c.px(8, 30, C16_MID);
  c.px(9, 30, C16_OUTLINE);
  c.px(7, 31, C16_MID);
  c.px(8, 31, C16_DARK);

  // link 2 loops through ring 2 bottom and down to ring 3 (y=40..53)
  drawSideLink16(40, 2, false);
  // ring 3 (y=51..64)
  drawRing16(51, 3);
  // re-assert link 2 top overlap into ring 3's top bar
  c.px(6, 51, C16_OUTLINE);
  c.px(7, 51, C16_GLINT);
  c.px(8, 51, C16_LIGHT);
  c.px(9, 51, C16_OUTLINE);
  c.px(6, 52, C16_OUTLINE);
  c.px(7, 52, C16_LIGHT);
  c.px(8, 52, C16_MID);
  c.px(9, 52, C16_OUTLINE);
  c.px(7, 53, C16_MID);
  c.px(8, 53, C16_DARK);

  // link 3 loops through ring 3 bottom and connects to hook (y=62..75)
  drawSideLink16(62, 1, true);

  // gothic hook assembly at bottom (y=73..93)
  // hook eyelet and swivel collar connecting with link 3
  c.rect(5, 73, 6, 1, C16_OUTLINE);
  c.rect(6, 73, 2, 1, C16_LIGHT);
  c.px(6, 73, C16_GLINT);
  c.rect(8, 73, 2, 1, C16_DARK);

  for (let dy = 74; dy <= 75; dy++) {
    c.rect(5, dy, 2, 1, C16_OUTLINE);
    c.px(6, dy, C16_LIGHT);
    c.clear(7, dy, 2, 1); // eyelet hole
    c.rect(9, dy, 2, 1, C16_OUTLINE);
    c.px(9, dy, C16_DARK);
  }

  // heavy cast-iron swivel collar (y=76)
  c.rect(4, 76, 8, 1, C16_OUTLINE);
  c.rect(5, 76, 2, 1, C16_LIGHT);
  c.px(5, 76, C16_GLINT);
  c.rect(7, 76, 3, 1, C16_MID);
  c.px(8, 76, C16_RUST);
  c.px(10, 76, C16_DARK);

  // hook shank descending on right (x=8..11, y=77..85)
  for (let dy = 77; dy <= 85; dy++) {
    c.px(8, dy, C16_OUTLINE);
    c.px(9, dy, C16_LIGHT);
    c.px(10, dy, C16_MID);
    c.px(11, dy, C16_OUTLINE);
  }
  // glints down shank
  c.px(9, 78, C16_GLINT);
  c.px(9, 79, C16_GLINT);
  c.px(10, 82, C16_RUST);
  c.px(10, 83, C16_RUST_DARK);

  // open throat gap between barb and shank (x=5..7, y=77..85)
  c.clear(5, 77, 3, 9);

  // hook split barb on left (x=2..5, y=77..85)
  // sharp pointed barb tip (y=77..78)
  c.px(2, 77, C16_OUTLINE);
  c.px(3, 77, C16_GLINT);

  c.px(2, 78, C16_OUTLINE);
  c.px(3, 78, C16_GLINT);
  c.px(4, 78, C16_OUTLINE);

  c.px(2, 79, C16_OUTLINE);
  c.px(3, 79, C16_LIGHT);
  c.px(4, 79, C16_OUTLINE);

  // split barb tooth projecting inward (y=80)
  c.px(2, 80, C16_OUTLINE);
  c.px(3, 80, C16_LIGHT);
  c.px(4, 80, C16_MID);
  c.px(5, 80, C16_OUTLINE);

  // barb blade descending (y=81..85)
  for (let dy = 81; dy <= 85; dy++) {
    c.px(2, dy, C16_OUTLINE);
    c.px(3, dy, dy <= 83 ? C16_LIGHT : C16_MID);
    c.px(4, dy, C16_OUTLINE);
  }
  c.px(3, 82, C16_GLINT);

  // hook bowl bottom curve sweeping under (y=86..93)
  c.rect(2, 86, 10, 1, C16_OUTLINE);
  c.rect(3, 86, 2, 1, C16_LIGHT);
  c.rect(5, 86, 3, 1, C16_OUTLINE);
  c.rect(8, 86, 3, 1, C16_MID);
  c.px(11, 86, C16_OUTLINE);

  c.rect(2, 87, 10, 1, C16_OUTLINE);
  c.rect(3, 87, 3, 1, C16_LIGHT);
  c.px(4, 87, C16_GLINT);
  c.rect(6, 87, 4, 1, C16_MID);
  c.px(10, 87, C16_DARK);
  c.px(11, 87, C16_OUTLINE);

  c.rect(2, 88, 10, 1, C16_OUTLINE);
  c.rect(3, 88, 3, 1, C16_LIGHT);
  c.rect(6, 88, 4, 1, C16_MID);
  c.px(10, 88, C16_DARK);
  c.px(11, 88, C16_OUTLINE);

  c.rect(3, 89, 9, 1, C16_OUTLINE);
  c.rect(4, 89, 2, 1, C16_LIGHT);
  c.rect(6, 89, 4, 1, C16_MID);
  c.px(10, 89, C16_DARK);
  c.px(11, 89, C16_OUTLINE);

  c.rect(3, 90, 8, 1, C16_OUTLINE);
  c.rect(4, 90, 2, 1, C16_MID);
  c.rect(6, 90, 3, 1, C16_DARK);
  c.px(9, 90, C16_OUTLINE);

  c.rect(4, 91, 6, 1, C16_OUTLINE);
  c.rect(5, 91, 2, 1, C16_MID);
  c.rect(7, 91, 2, 1, C16_DARK);
  c.px(9, 91, C16_OUTLINE);

  c.rect(5, 92, 5, 1, C16_OUTLINE);
  c.rect(6, 92, 2, 1, C16_DARK);
  c.px(8, 92, C16_DARK);
  c.px(9, 92, C16_OUTLINE);

  c.rect(6, 93, 3, 1, C16_OUTLINE);
  c.px(7, 93, C16_DARK);
  // rows 94..95 remain transparent for margin
}

export default defineProp({
  id: "iron_chain",
  description: "heavy wrought-iron hanging chain forged from interlocking gothic links with ceiling bracket and split hook.",
  size: { width: 16, height: 96 },
  anchor: "top",
  frames: 1,
  fps: 8,
  draw: {
    hi8bit: (c) => drawChain8(c),
    hi16bit: (c) => drawChain16(c),
  },
});
