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
  outline: "#210",
  mortar: "#210",
  shadowDeep: "#210",
  faceShadow: "#721",
  faceMid: "#b52",
  faceLight: "#b52",
  topShadow: "#721",
  topFace: "#d70",
  topHighlight: "#fd8",
  accentGold: "#d70",
};

const HI16BIT: Palette = {
  outline: "#1c0d06",
  mortar: "#2e140b",
  shadowDeep: "#4d1d0c",
  faceShadow: "#7c2d12",
  faceMid: "#a8431b",
  faceLight: "#c85a28",
  topShadow: "#a16207",
  topFace: "#d97706",
  topHighlight: "#fde68a",
  accentGold: "#f59e0b",
};

function drawHi8bit(c: PixelCanvas, tile: string): void {
  const p = HI8BIT;
  // Base terracotta fortress stone face
  c.rect(0, 0, 16, 16, p.faceMid);

  const isTop = tile.startsWith("top");
  const isBottom = tile.startsWith("bottom");
  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // Walkable top coping rim: y=0 highlight, y=1 coping face
    c.rect(0, 0, 16, 1, p.topHighlight);
    c.rect(0, 1, 16, 1, p.topFace);

    // Stone face y=2..8
    c.rect(0, 2, 16, 7, p.faceMid);
    // Vertical joint in stone face
    c.rect(7, 2, 1, 7, p.mortar);

    // Finished underside chamfer (y=9..10) enclosing 22px platform (height 11 in 8bit)
    c.rect(0, 9, 16, 1, p.faceShadow);
    c.rect(0, 10, 16, 1, p.outline);

    // Hanging stone corbels below y=10
    c.rect(0, 11, 16, 5, p.mortar);
    // Bracket corbels at x=3..5 and x=11..13
    c.rect(3, 11, 3, 3, p.faceMid);
    c.rect(4, 14, 1, 1, p.faceShadow);
    c.rect(11, 11, 3, 3, p.faceMid);
    c.rect(12, 14, 1, 1, p.faceShadow);
    c.rect(0, 15, 16, 1, p.outline);

    if (tile === "ledge_2") {
      // Decorative corbel bracket at x=7..8 y=9..10
      c.rect(7, 9, 2, 2, p.topFace);
      c.px(7, 10, p.topHighlight);
    } else if (tile === "ledge_left") {
      // Bullnose left end cap
      c.rect(0, 0, 1, 11, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(1, 1, p.topFace);
      c.px(1, 10, p.outline);
      c.rect(0, 11, 3, 5, p.outline);
      c.rect(3, 11, 2, 3, p.faceMid);
    } else if (tile === "ledge_right") {
      // Bullnose right end cap
      c.rect(15, 0, 1, 11, p.outline);
      c.px(14, 0, p.topHighlight);
      c.px(14, 1, p.topFace);
      c.px(14, 10, p.outline);
      c.rect(13, 11, 3, 5, p.outline);
      c.rect(11, 11, 2, 3, p.faceMid);
    }
    return;
  }

  // Bed mortar inside the block at y=7
  c.rect(0, 7, 16, 1, p.mortar);
  // Bottom bed seam mortar at y=15
  c.rect(0, 15, 16, 1, p.mortar);

  // Course A vertical joint
  if (tile === "left" || tile === "top_left" || tile === "bottom_left") {
    // Quoin header ends at x=5
    c.rect(5, 0, 1, 7, p.mortar);
  } else if (tile === "right" || tile === "top_right" || tile === "bottom_right") {
    // Course A is a continuous stretcher in right quoin: no vertical joint
  } else {
    // Standard Course A joint at x=7
    c.rect(7, 0, 1, 7, p.mortar);
  }

  // Course B vertical joint
  if (tile === "right" || tile === "top_right" || tile === "bottom_right") {
    // Quoin header ends at x=10
    c.rect(10, 8, 1, 7, p.mortar);
    c.rect(0, 8, 1, 7, p.mortar);
  } else if (tile === "left" || tile === "top_left" || tile === "bottom_left") {
    // Course B is a stretcher in left quoin extending to right edge joint at x=15
    c.rect(15, 8, 1, 7, p.mortar);
  } else {
    // Standard Course B joint at tile boundary x=15
    c.rect(15, 8, 1, 7, p.mortar);
  }

  if (isTop) {
    // Coping rim: y=0 highlight, y=1 top face
    c.rect(0, 0, 16, 1, p.topHighlight);
    c.rect(0, 1, 16, 1, p.topFace);

    if (tile === "top_2") {
      // 1px notched indent at x=9 y=1
      c.px(9, 1, p.faceShadow);
    } else if (tile === "top_left") {
      // Quoin top-left corner
      c.rect(0, 0, 1, 16, p.outline);
      c.px(0, 0, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(1, 1, p.topFace);
    } else if (tile === "top_right") {
      // Quoin top-right corner
      c.rect(15, 0, 1, 16, p.outline);
      c.px(15, 0, p.outline);
      c.px(14, 0, p.topHighlight);
      c.px(14, 1, p.topFace);
    }
  } else if (isBottom) {
    // Foundation plinth at y=14, outline at y=15
    c.rect(0, 14, 16, 1, p.topFace);
    c.rect(0, 15, 16, 1, p.outline);

    if (tile === "bottom_left") {
      c.rect(0, 0, 1, 16, p.outline);
      c.rect(0, 13, 3, 3, p.outline);
      c.px(1, 13, p.topFace);
    } else if (tile === "bottom_right") {
      c.rect(15, 0, 1, 16, p.outline);
      c.rect(13, 13, 3, 3, p.outline);
      c.px(14, 13, p.topFace);
    }
  } else if (tile === "left") {
    c.rect(0, 0, 1, 16, p.outline);
  } else if (tile === "right") {
    c.rect(15, 0, 1, 16, p.outline);
  } else if (tile === "fill_2") {
    // Builder's mason rune 2x2 dot at x=3..4 y=3..4
    c.rect(3, 3, 2, 2, p.mortar);
  }
}

function drawHi16bit(c: PixelCanvas, tile: string): void {
  const p = HI16BIT;
  // Base terracotta fortress stone
  c.rect(0, 0, 32, 32, p.faceMid);

  const isTop = tile.startsWith("top");
  const isBottom = tile.startsWith("bottom");
  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // Walkable coping rim: 1px highlight, 2px amber slab, 1px chamfer
    c.rect(0, 0, 32, 1, p.topHighlight);
    c.rect(0, 1, 32, 1, p.accentGold);
    c.rect(0, 2, 32, 1, p.topFace);
    c.rect(0, 3, 32, 1, p.topShadow);

    // Stone face y=4..17 with sunlit bevel at y=4
    c.rect(0, 4, 32, 1, p.faceLight);
    // Vertical joint in stone face at x=15..16
    c.rect(15, 5, 2, 12, p.mortar);
    c.rect(14, 5, 1, 12, p.faceShadow);
    c.rect(17, 5, 1, 12, p.faceLight);

    // Granite texture flecks
    c.px(5, 7, p.faceLight);
    c.px(8, 12, p.shadowDeep);
    c.px(22, 8, p.faceLight);
    c.px(26, 11, p.shadowDeep);

    // Finished underside chamfer (y=18..21) enclosing 22px platform
    c.rect(0, 17, 32, 1, p.faceShadow);
    c.rect(0, 18, 32, 1, p.faceShadow);
    c.rect(0, 19, 32, 1, p.shadowDeep);
    c.rect(0, 20, 32, 1, p.mortar);
    c.rect(0, 21, 32, 1, p.outline);

    // Hanging stone corbels below y=21
    c.rect(0, 22, 32, 10, p.mortar);
    // Left stepped architectural corbel (x=4..9)
    c.rect(4, 22, 6, 3, p.faceMid);
    c.rect(4, 22, 1, 3, p.faceLight);
    c.rect(9, 22, 1, 3, p.faceShadow);
    c.rect(5, 25, 4, 3, p.faceMid);
    c.rect(5, 25, 1, 3, p.faceLight);
    c.rect(8, 25, 1, 3, p.faceShadow);
    c.rect(6, 28, 2, 2, p.faceShadow);

    // Right stepped architectural corbel (x=20..25)
    c.rect(20, 22, 6, 3, p.faceMid);
    c.rect(20, 22, 1, 3, p.faceLight);
    c.rect(25, 22, 1, 3, p.faceShadow);
    c.rect(21, 25, 4, 3, p.faceMid);
    c.rect(21, 25, 1, 3, p.faceLight);
    c.rect(24, 25, 1, 3, p.faceShadow);
    c.rect(22, 28, 2, 2, p.faceShadow);

    // Bottom outline
    c.rect(0, 31, 32, 1, p.outline);

    if (tile === "ledge_2") {
      // Central decorative corbel bracket at x=13..18 y=18..21
      c.rect(13, 18, 6, 1, p.accentGold);
      c.rect(13, 19, 6, 1, p.topFace);
      c.px(15, 19, p.topHighlight);
      c.px(16, 19, p.topHighlight);
      c.rect(14, 20, 4, 1, p.topShadow);
      c.rect(14, 21, 4, 1, p.faceShadow);
      c.rect(15, 22, 2, 2, p.faceMid);
      c.rect(15, 22, 1, 2, p.faceLight);
      c.rect(16, 24, 1, 1, p.shadowDeep);
    } else if (tile === "ledge_left") {
      // Rounded 3px bullnose rim at x=0..3 y=0..21
      c.rect(0, 0, 2, 22, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(2, 0, p.topHighlight);
      c.rect(1, 1, 2, 1, p.accentGold);
      c.rect(1, 2, 2, 1, p.topFace);
      c.rect(1, 3, 2, 1, p.topShadow);
      c.rect(0, 18, 2, 3, p.shadowDeep);
      c.rect(0, 21, 3, 1, p.outline);
      // Heavy corbel foundation on left
      c.rect(0, 22, 5, 10, p.outline);
      c.rect(2, 22, 2, 7, p.faceShadow);
    } else if (tile === "ledge_right") {
      // Rounded 3px bullnose rim at x=28..31 y=0..21
      c.rect(30, 0, 2, 22, p.outline);
      c.px(30, 0, p.topHighlight);
      c.px(29, 0, p.topHighlight);
      c.rect(29, 1, 2, 1, p.accentGold);
      c.rect(29, 2, 2, 1, p.topFace);
      c.rect(29, 3, 2, 1, p.topShadow);
      c.rect(30, 18, 2, 3, p.shadowDeep);
      c.rect(29, 21, 3, 1, p.outline);
      // Heavy corbel foundation on right
      c.rect(27, 22, 5, 10, p.outline);
      c.rect(28, 22, 2, 7, p.faceShadow);
    }
    return;
  }

  // Bed mortar at y=15..16
  c.rect(0, 15, 32, 1, p.mortar);
  c.rect(0, 16, 32, 1, p.shadowDeep);

  // Seam bed mortar
  c.rect(0, 0, 32, 1, p.mortar);
  c.rect(0, 31, 32, 1, p.mortar);

  // Ashlar course joints
  const isLeftQuoin = tile === "left" || tile === "top_left" || tile === "bottom_left";
  const isRightQuoin = tile === "right" || tile === "top_right" || tile === "bottom_right";

  if (isLeftQuoin) {
    // Course A header ends at x=12
    c.rect(12, 1, 2, 14, p.mortar);
    c.rect(11, 1, 1, 14, p.faceShadow);
    c.rect(14, 1, 1, 14, p.faceLight);

    // Bevels for Course A header (x=3..10) and right stretcher (x=15..31)
    c.rect(3, 1, 8, 1, p.faceLight);
    c.rect(15, 1, 16, 1, p.faceLight);
    c.rect(3, 14, 8, 1, p.faceShadow);
    c.rect(15, 14, 16, 1, p.faceShadow);

    // Course B stretcher (x=3..30)
    c.rect(3, 17, 27, 1, p.faceLight);
    c.rect(3, 30, 27, 1, p.faceShadow);
    c.rect(30, 17, 1, 14, p.faceShadow);
    c.rect(31, 17, 1, 14, p.mortar);
  } else if (isRightQuoin) {
    // Course A stretcher (x=0..28) - continuous stretcher with NO joint
    c.rect(0, 1, 28, 1, p.faceLight);
    c.rect(0, 14, 28, 1, p.faceShadow);

    // Course B: joint at x=0, stone to x=18, joint at x=19..20, header to x=28
    c.rect(0, 17, 1, 14, p.mortar);
    c.rect(1, 17, 1, 14, p.faceLight);
    c.rect(1, 17, 17, 1, p.faceLight);
    c.rect(1, 30, 17, 1, p.faceShadow);
    c.rect(18, 17, 1, 14, p.faceShadow);

    c.rect(19, 17, 2, 14, p.mortar);
    c.rect(21, 17, 1, 14, p.faceLight);
    c.rect(21, 17, 7, 1, p.faceLight);
    c.rect(21, 30, 7, 1, p.faceShadow);
    c.rect(28, 17, 1, 14, p.faceShadow);
  } else {
    // Standard running bond: Course A joint at x=15..16
    c.rect(15, 1, 2, 14, p.mortar);
    c.rect(14, 1, 1, 14, p.faceShadow);
    c.rect(17, 1, 1, 14, p.faceLight);

    // Course A bevels
    c.rect(0, 1, 14, 1, p.faceLight);
    c.rect(18, 1, 14, 1, p.faceLight);
    c.rect(0, 14, 14, 1, p.faceShadow);
    c.rect(18, 14, 14, 1, p.faceShadow);

    // Course B: joint at x=0 and x=31
    c.rect(0, 17, 1, 14, p.mortar);
    c.rect(1, 17, 1, 14, p.faceLight);
    c.rect(2, 17, 28, 1, p.faceLight);
    c.rect(2, 30, 28, 1, p.faceShadow);
    c.rect(30, 17, 1, 14, p.faceShadow);
    c.rect(31, 17, 1, 14, p.mortar);
  }

  // Granite texture specks inside block faces
  c.px(4, 5, p.faceLight);
  c.px(8, 9, p.shadowDeep);
  c.px(21, 4, p.faceLight);
  c.px(26, 8, p.shadowDeep);
  c.px(8, 22, p.faceLight);
  c.px(13, 27, p.shadowDeep);
  c.px(23, 23, p.faceLight);

  if (isTop) {
    // Coping rim: 1px highlight, 2px amber slab, 1px chamfer
    c.rect(0, 0, 32, 1, p.topHighlight);
    c.rect(0, 1, 32, 1, p.accentGold);
    c.rect(0, 2, 32, 1, p.topFace);
    c.rect(0, 3, 32, 1, p.topShadow);

    if (tile === "top_2") {
      // 4px chipped fracture at x=18..21 y=2..4 showing darker faceShadow under-stone
      c.px(18, 2, p.faceLight);
      c.rect(19, 2, 2, 1, p.faceShadow);
      c.px(21, 2, p.faceLight);
      c.rect(18, 3, 4, 1, p.shadowDeep);
      c.rect(19, 4, 2, 1, p.faceShadow);
    } else if (tile === "top_left") {
      // Rounded coping quoin turning 90 degrees down left edge
      c.rect(0, 0, 2, 32, p.outline);
      c.px(1, 0, p.topHighlight);
      c.px(2, 0, p.topHighlight);
      c.rect(1, 1, 2, 1, p.accentGold);
      c.rect(1, 2, 2, 1, p.topFace);
      c.rect(1, 3, 2, 1, p.topShadow);
      c.rect(1, 4, 1, 4, p.topFace);
      c.rect(2, 4, 1, 4, p.faceLight);
    } else if (tile === "top_right") {
      // Rounded coping quoin turning 90 degrees down right edge
      c.rect(30, 0, 2, 32, p.outline);
      c.px(30, 0, p.topHighlight);
      c.px(29, 0, p.topHighlight);
      c.rect(29, 1, 2, 1, p.accentGold);
      c.rect(29, 2, 2, 1, p.topFace);
      c.rect(29, 3, 2, 1, p.topShadow);
      c.rect(30, 4, 1, 4, p.topFace);
      c.rect(29, 4, 1, 4, p.faceLight);
    }
  } else if (isBottom) {
    // Projecting plinth footer at y=28..30, outline at y=31
    c.rect(0, 28, 32, 1, p.accentGold);
    c.rect(0, 29, 32, 1, p.topFace);
    c.rect(0, 30, 32, 1, p.faceShadow);
    c.rect(0, 31, 32, 1, p.outline);

    if (tile === "bottom_left") {
      c.rect(0, 0, 2, 32, p.outline);
      // Heavy corner corbel plinth
      c.rect(0, 24, 6, 8, p.outline);
      c.rect(2, 25, 4, 3, p.topFace);
      c.rect(2, 25, 4, 1, p.accentGold);
      c.rect(2, 28, 3, 2, p.faceShadow);
    } else if (tile === "bottom_right") {
      c.rect(30, 0, 2, 32, p.outline);
      // Heavy corner corbel plinth
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
    // Inset carved 6x6 builder's mason rune at x=7..12 y=6..11 in shadowDeep
    c.rect(9, 6, 2, 1, p.shadowDeep);
    c.rect(8, 7, 4, 1, p.shadowDeep);
    c.px(9, 7, p.faceShadow);
    c.px(10, 7, p.faceShadow);
    c.rect(7, 8, 6, 2, p.shadowDeep);
    c.px(9, 8, p.accentGold);
    c.px(10, 8, p.accentGold);
    c.px(9, 9, p.faceLight);
    c.px(10, 9, p.faceLight);
    c.rect(8, 10, 4, 1, p.shadowDeep);
    c.px(9, 10, p.faceShadow);
    c.px(10, 10, p.faceShadow);
    c.rect(9, 11, 2, 1, p.shadowDeep);
    // Groove highlight on bottom
    c.rect(8, 12, 4, 1, p.faceLight);
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
