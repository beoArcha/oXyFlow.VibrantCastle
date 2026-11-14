import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Palette {
  outline: string;
  mortar: string;
  shadowDeep: string;
  faceShadow: string;
  faceMid: string;
  faceLight: string;
  topShadow: string;
  topFace: string;
  topHighlight: string;
  accentGold: string;
}

const HI8BIT: Palette = {
  outline: "#211",
  mortar: "#211",
  shadowDeep: "#211",
  faceShadow: "#521",
  faceMid: "#743",
  faceLight: "#743",
  topShadow: "#521",
  topFace: "#a61",
  topHighlight: "#fc6",
  accentGold: "#a61",
};

const HI16BIT: Palette = {
  outline: "#160c08",
  mortar: "#26140e",
  shadowDeep: "#381c14",
  faceShadow: "#52281b",
  faceMid: "#783c28",
  faceLight: "#9c5237",
  topShadow: "#54320c",
  topFace: "#9e6216",
  topHighlight: "#fcd36a",
  accentGold: "#c8821e",
};

function drawHi8bit(c: PixelCanvas, tile: string): void {
  const p = HI8BIT;
  // weathered dark terracotta fortress stone face
  c.rect(0, 0, 16, 16, p.faceMid);

  const isTop = tile.startsWith("top");
  const isBottom = tile.startsWith("bottom");
  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // walkable top coping rim: y=0 highlight, y=1 bronze coping face
    c.rect(0, 0, 16, 1, p.topHighlight);
    c.rect(0, 1, 16, 1, p.topFace);
    // 1 px overhang shadow under coping
    c.rect(0, 2, 16, 1, p.faceShadow);

    // heavy stone block face y=3..7 with dark bottom edge at y=6..7
    c.rect(0, 3, 16, 3, p.faceMid);
    c.rect(0, 6, 16, 2, p.faceShadow);
    // thin vertical joint at x=7
    c.rect(7, 3, 1, 5, p.mortar);

    // finished lower molding enclosing platform at y=8..9
    c.rect(0, 8, 16, 1, p.faceShadow);
    c.rect(0, 9, 16, 1, p.outline);

    // recessed backdrop for corbels below y=9
    c.rect(0, 10, 16, 6, p.mortar);
    // fortress corbel brackets at x=2..4 and x=11..13
    c.rect(2, 10, 3, 3, p.faceMid);
    c.rect(3, 13, 1, 1, p.faceShadow);
    c.rect(11, 10, 3, 3, p.faceMid);
    c.rect(12, 13, 1, 1, p.faceShadow);
    c.rect(0, 15, 16, 1, p.outline);

    if (tile === "ledge_2") {
      // central decorative bracket at x=7..8 y=8..9
      c.rect(7, 8, 2, 2, p.topFace);
      c.px(7, 9, p.topHighlight);
    } else if (tile === "ledge_left") {
      // terminal bullnose cap on left
      c.rect(0, 0, 1, 10, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(1, 1, p.topFace);
      c.px(1, 2, p.faceShadow);
      c.rect(0, 10, 2, 6, p.outline);
    } else if (tile === "ledge_right") {
      // terminal bullnose cap on right
      c.rect(15, 0, 1, 10, p.outline);
      c.px(14, 0, p.topHighlight);
      c.px(14, 1, p.topFace);
      c.px(14, 2, p.faceShadow);
      c.rect(14, 10, 2, 6, p.outline);
    }
    return;
  }

  // ashlar courses with thin 1 px mortar:
  // course 0: y=0..6, dark bottom edge at y=5..6, mortar at y=7
  // course 1: y=8..14, dark bottom edge at y=13..14, mortar at y=15
  c.rect(0, 5, 16, 2, p.faceShadow);
  c.rect(0, 7, 16, 1, p.mortar);
  c.rect(0, 13, 16, 2, p.faceShadow);
  c.rect(0, 15, 16, 1, p.mortar);

  // vertical joints staggered per course
  const isLeftQuoin = tile === "left" || tile === "top_left" || tile === "bottom_left";
  const isRightQuoin = tile === "right" || tile === "top_right" || tile === "bottom_right";

  if (isLeftQuoin) {
    // course 0 header joint at x=4
    c.rect(4, 0, 1, 7, p.mortar);
    // course 1 stretcher extends to right joint at x=15
    c.rect(15, 8, 1, 7, p.mortar);
  } else if (isRightQuoin) {
    // course 0 joint at x=7, header to right edge
    c.rect(7, 0, 1, 7, p.mortar);
    // course 1 stretcher extends to right edge without joint
  } else {
    // standard ashlar running bond: course 0 joint at x=7, course 1 joint at x=15
    c.rect(7, 0, 1, 7, p.mortar);
    c.rect(15, 8, 1, 7, p.mortar);
  }

  if (isTop) {
    // thick coping: y=0 highlight, y=1 bronze face, y=2 shadow under coping
    c.rect(0, 0, 16, 1, p.topHighlight);
    c.rect(0, 1, 16, 1, p.topFace);
    c.rect(0, 2, 16, 1, p.faceShadow);

    if (tile === "top_2") {
      // chipped coping nick at x=9 y=1
      c.px(9, 1, p.faceShadow);
    } else if (tile === "top_left") {
      // left quoin edge with 1 px coping overhang
      c.rect(0, 0, 1, 16, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(1, 1, p.topFace);
      c.px(1, 2, p.faceShadow);
    } else if (tile === "top_right") {
      // right quoin edge with 1 px coping overhang
      c.rect(15, 0, 1, 16, p.outline);
      c.px(14, 0, p.topHighlight);
      c.px(14, 1, p.topFace);
      c.px(14, 2, p.faceShadow);
    }
  } else if (isBottom) {
    // heavy foundation plinth at y=14, outline at y=15
    c.rect(0, 14, 16, 1, p.topFace);
    c.rect(0, 15, 16, 1, p.outline);

    if (tile === "bottom_left") {
      c.rect(0, 0, 1, 16, p.outline);
      c.rect(0, 13, 2, 3, p.outline);
      c.px(1, 13, p.topFace);
    } else if (tile === "bottom_right") {
      c.rect(15, 0, 1, 16, p.outline);
      c.rect(14, 13, 2, 3, p.outline);
      c.px(14, 13, p.topFace);
    }
  } else if (tile === "left") {
    c.rect(0, 0, 1, 16, p.outline);
  } else if (tile === "right") {
    c.rect(15, 0, 1, 16, p.outline);
  } else if (tile === "fill_2") {
    // chisel marks and chipped corner
    c.px(3, 4, p.faceShadow);
    c.px(4, 4, p.faceShadow);
    c.px(6, 6, p.faceShadow);
    c.px(11, 11, p.faceShadow);
    c.px(12, 11, p.faceShadow);
  }
}

function drawHi16bit(c: PixelCanvas, tile: string): void {
  const p = HI16BIT;
  // weathered dark terracotta fortress stone face
  c.rect(0, 0, 32, 32, p.faceMid);

  const isTop = tile.startsWith("top");
  const isBottom = tile.startsWith("bottom");
  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // thick 4-5 px dressed coping stone:
    // y=0: bronze/amber highlight line on top (walkable rim)
    // y=1: bronze/amber upper face
    // y=2: dressed coping stone mid
    // y=3: coping bottom chamfer
    // y=4: 1 px overhang shadow under coping
    c.rect(0, 0, 32, 1, p.topHighlight);
    c.rect(0, 1, 32, 1, p.accentGold);
    c.rect(0, 2, 32, 1, p.topFace);
    c.rect(0, 3, 32, 1, p.topShadow);
    c.rect(0, 4, 32, 1, p.shadowDeep);

    // ashlar stone face y=5..14 with sunlit upper bevel at y=5
    c.rect(0, 5, 32, 1, p.faceLight);
    // darker bottom edge for weight at y=13..14
    c.rect(0, 13, 32, 1, p.faceShadow);
    c.rect(0, 14, 32, 1, p.shadowDeep);

    // thin vertical joint at x=15 flanked by shadow and highlight
    c.rect(14, 5, 1, 10, p.faceShadow);
    c.rect(15, 5, 1, 10, p.mortar);
    c.rect(16, 5, 1, 10, p.faceLight);

    // weathered chisel marks on ledge block
    c.line(4, 8, 6, 8, p.faceShadow);
    c.line(22, 10, 24, 10, p.faceShadow);

    // finished lower chamfer molding enclosing 22px platform (y=15..17)
    c.rect(0, 15, 32, 1, p.topShadow);
    c.rect(0, 16, 32, 1, p.faceShadow);
    c.rect(0, 17, 32, 1, p.outline);

    // recessed corbel backdrop below y=17
    c.rect(0, 18, 32, 14, p.mortar);

    // left heavy stepped fortress corbel (x=4..9)
    c.rect(4, 18, 6, 3, p.faceMid);
    c.rect(4, 18, 1, 3, p.faceLight);
    c.rect(9, 18, 1, 3, p.faceShadow);
    c.rect(5, 21, 4, 4, p.faceMid);
    c.rect(5, 21, 1, 4, p.faceLight);
    c.rect(8, 21, 1, 4, p.faceShadow);
    c.rect(6, 25, 2, 3, p.faceShadow);
    c.rect(6, 28, 2, 1, p.shadowDeep);

    // right heavy stepped fortress corbel (x=20..25)
    c.rect(20, 18, 6, 3, p.faceMid);
    c.rect(20, 18, 1, 3, p.faceLight);
    c.rect(25, 18, 1, 3, p.faceShadow);
    c.rect(21, 21, 4, 4, p.faceMid);
    c.rect(21, 21, 1, 4, p.faceLight);
    c.rect(24, 21, 1, 4, p.faceShadow);
    c.rect(22, 25, 2, 3, p.faceShadow);
    c.rect(22, 28, 2, 1, p.shadowDeep);

    // bottom outline
    c.rect(0, 31, 32, 1, p.outline);

    if (tile === "ledge_2") {
      // central decorative bronze bracket at x=13..18 y=15..20
      c.rect(13, 15, 6, 1, p.accentGold);
      c.rect(13, 16, 6, 1, p.topFace);
      c.px(15, 16, p.topHighlight);
      c.px(16, 16, p.topHighlight);
      c.rect(14, 17, 4, 1, p.topShadow);
      c.rect(14, 18, 4, 2, p.faceMid);
      c.rect(14, 18, 1, 2, p.faceLight);
      c.rect(17, 18, 1, 2, p.faceShadow);
      c.rect(15, 20, 2, 2, p.shadowDeep);
    } else if (tile === "ledge_left") {
      // heavy rounded quoin bullnose rim on left with 1 px overhang
      c.rect(0, 0, 2, 18, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(2, 0, p.topHighlight);
      c.rect(1, 1, 2, 1, p.accentGold);
      c.rect(1, 2, 2, 1, p.topFace);
      c.rect(1, 3, 2, 1, p.topShadow);
      c.rect(1, 4, 1, 1, p.shadowDeep);
      c.rect(0, 18, 5, 14, p.outline);
      c.rect(2, 18, 2, 10, p.faceShadow);
    } else if (tile === "ledge_right") {
      // heavy rounded quoin bullnose rim on right with 1 px overhang
      c.rect(30, 0, 2, 18, p.outline);
      c.px(30, 0, p.topHighlight);
      c.px(29, 0, p.topHighlight);
      c.rect(29, 1, 2, 1, p.accentGold);
      c.rect(29, 2, 2, 1, p.topFace);
      c.rect(29, 3, 2, 1, p.topShadow);
      c.rect(30, 4, 1, 1, p.shadowDeep);
      c.rect(27, 18, 5, 14, p.outline);
      c.rect(28, 18, 2, 10, p.faceShadow);
    }
    return;
  }

  // ashlar courses with thin 1 px mortar:
  // course 0: y=0..14, dark bottom edge at y=13..14, thin 1 px mortar at y=15
  // course 1: y=16..30, dark bottom edge at y=29..30, thin 1 px mortar at y=31
  c.rect(0, 0, 32, 1, p.faceLight);
  c.rect(0, 13, 32, 1, p.faceShadow);
  c.rect(0, 14, 32, 1, p.shadowDeep);
  c.rect(0, 15, 32, 1, p.mortar);

  c.rect(0, 16, 32, 1, p.faceLight);
  c.rect(0, 29, 32, 1, p.faceShadow);
  c.rect(0, 30, 32, 1, p.shadowDeep);
  c.rect(0, 31, 32, 1, p.mortar);

  const isLeftQuoin = tile === "left" || tile === "top_left" || tile === "bottom_left";
  const isRightQuoin = tile === "right" || tile === "top_right" || tile === "bottom_right";

  if (isLeftQuoin) {
    // left outer wall corner
    c.rect(0, 0, 2, 32, p.outline);
    c.rect(2, 0, 1, 32, p.shadowDeep);

    // course 0 header joint at x=15
    c.rect(14, 1, 1, 12, p.faceShadow);
    c.rect(15, 1, 1, 12, p.mortar);
    c.rect(16, 1, 1, 12, p.faceLight);

    // course 1 stretcher extends to right edge joint at x=31
    c.rect(30, 17, 1, 12, p.faceShadow);
    c.rect(31, 17, 1, 12, p.mortar);
  } else if (isRightQuoin) {
    // right outer wall corner
    c.rect(30, 0, 2, 32, p.outline);
    c.rect(29, 0, 1, 32, p.shadowDeep);

    // course 0 joint at x=15, header continues to right corner
    c.rect(14, 1, 1, 12, p.faceShadow);
    c.rect(15, 1, 1, 12, p.mortar);
    c.rect(16, 1, 1, 12, p.faceLight);

    // course 1 stretcher begins at x=0 (highlight from joint at x=31) and runs to right corner
    c.rect(0, 17, 1, 12, p.faceLight);
  } else {
    // standard running bond ashlar:
    // course 0: joint at x=15
    c.rect(14, 1, 1, 12, p.faceShadow);
    c.rect(15, 1, 1, 12, p.mortar);
    c.rect(16, 1, 1, 12, p.faceLight);

    // course 1: joint at x=31 (mortar) and highlight at x=0
    c.rect(0, 17, 1, 12, p.faceLight);
    c.rect(30, 17, 1, 12, p.faceShadow);
    c.rect(31, 17, 1, 12, p.mortar);
  }

  // chisel marks and weathered granite texture
  c.line(4, 7, 7, 7, p.faceShadow);
  c.px(8, 10, p.shadowDeep);
  c.line(20, 23, 24, 23, p.faceShadow);
  c.px(10, 25, p.faceLight);
  c.px(26, 26, p.shadowDeep);

  if (isTop) {
    // thick 4-5 px dressed coping stone:
    // y=0: bronze/amber highlight line on top (walkable rim)
    // y=1: bronze/amber upper body
    // y=2: dressed coping stone face
    // y=3: coping bottom chamfer
    // y=4: 1 px overhang shadow under coping
    c.rect(0, 0, 32, 1, p.topHighlight);
    c.rect(0, 1, 32, 1, p.accentGold);
    c.rect(0, 2, 32, 1, p.topFace);
    c.rect(0, 3, 32, 1, p.topShadow);
    c.rect(0, 4, 32, 1, p.shadowDeep);
    // highlight bevel under coping shadow
    c.rect(0, 5, 32, 1, p.faceLight);

    if (tile === "top_2") {
      // chipped stone fracture at x=18..21 y=2..4
      c.px(18, 2, p.faceLight);
      c.rect(19, 2, 2, 1, p.faceShadow);
      c.px(21, 2, p.faceLight);
      c.rect(18, 3, 4, 1, p.shadowDeep);
      c.rect(19, 4, 2, 1, p.faceShadow);
    } else if (tile === "top_left") {
      // 1 px coping overhang at left quoin corner
      c.rect(0, 0, 2, 32, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(2, 0, p.topHighlight);
      c.rect(1, 1, 2, 1, p.accentGold);
      c.rect(1, 2, 2, 1, p.topFace);
      c.rect(1, 3, 2, 1, p.topShadow);
      c.rect(1, 4, 1, 1, p.shadowDeep);
      c.rect(2, 4, 1, 4, p.faceLight);
    } else if (tile === "top_right") {
      // 1 px coping overhang at right quoin corner
      c.rect(30, 0, 2, 32, p.outline);
      c.px(30, 0, p.topHighlight);
      c.px(29, 0, p.topHighlight);
      c.rect(29, 1, 2, 1, p.accentGold);
      c.rect(29, 2, 2, 1, p.topFace);
      c.rect(29, 3, 2, 1, p.topShadow);
      c.rect(30, 4, 1, 1, p.shadowDeep);
      c.rect(29, 4, 1, 4, p.faceLight);
    }
  } else if (isBottom) {
    // projecting foundation plinth footer at y=27..30, outline at y=31
    c.rect(0, 27, 32, 1, p.topShadow);
    c.rect(0, 28, 32, 1, p.accentGold);
    c.rect(0, 29, 32, 1, p.topFace);
    c.rect(0, 30, 32, 1, p.shadowDeep);
    c.rect(0, 31, 32, 1, p.outline);

    if (tile === "bottom_left") {
      c.rect(0, 0, 2, 32, p.outline);
      // heavy corner corbel plinth
      c.rect(0, 24, 6, 8, p.outline);
      c.rect(2, 25, 4, 3, p.topFace);
      c.rect(2, 25, 4, 1, p.accentGold);
      c.rect(2, 28, 3, 2, p.faceShadow);
    } else if (tile === "bottom_right") {
      c.rect(30, 0, 2, 32, p.outline);
      // heavy corner corbel plinth
      c.rect(26, 24, 6, 8, p.outline);
      c.rect(26, 25, 4, 3, p.topFace);
      c.rect(26, 25, 4, 1, p.accentGold);
      c.rect(27, 28, 3, 2, p.faceShadow);
    }
  } else if (tile === "left") {
    c.rect(0, 0, 2, 32, p.outline);
    c.rect(2, 0, 1, 32, p.shadowDeep);
  } else if (tile === "right") {
    c.rect(30, 0, 2, 32, p.outline);
    c.rect(29, 0, 1, 32, p.shadowDeep);
  } else if (tile === "fill_2") {
    // chipped block corner at Course 0 joint (x=13..15 y=13..14)
    c.rect(13, 13, 2, 2, p.shadowDeep);
    c.px(12, 13, p.faceLight);
    c.px(13, 12, p.faceLight);

    // mason fortress mark at x=7..11 y=6..9
    c.rect(8, 6, 2, 1, p.shadowDeep);
    c.rect(7, 7, 4, 2, p.shadowDeep);
    c.px(8, 7, p.accentGold);
    c.px(9, 7, p.accentGold);
    c.rect(8, 9, 2, 1, p.shadowDeep);
    c.rect(7, 10, 4, 1, p.faceLight);

    // additional chisel grooves on Course 1
    c.line(5, 21, 9, 21, p.faceShadow);
    c.line(6, 22, 10, 22, p.faceLight);
    c.line(22, 25, 26, 25, p.faceShadow);
  }
}

export default defineTileset({
  id: "bastion_stone",
  kind: "solid",
  description: "Heavy fortress ashlar masonry of weathered, warm rust-terracotta granite blocks bound by recessed umber mortar.",
  tiles: [
    "top_left", "top", "top_2", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_2", "ledge_right",
  ],
  draw: {
    hi8bit: (c, tile) => drawHi8bit(c, tile),
    hi16bit: (c, tile) => drawHi16bit(c, tile),
  },
});
