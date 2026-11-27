import { defineProp, type PixelCanvas } from "../defineProp";

// palette for hi-16bit (8 colors)
const C16_OUTLINE = "#181210";
const C16_ROCK_WARM = "#583e28";
const C16_SAPPHIRE = "#0c4a6e";
const C16_SHADOW = "#0284c7";
const C16_BODY = "#0ea5e9";
const C16_LIT = "#38bdf8";
const C16_SHIMMER = "#7dd3fc";
const C16_GLINT = "#e0f2fe";

// palette for hi-8bit (4 colors)
const C8_OUTLINE = "#181210";
const C8_SHADOW = "#0284c7";
const C8_BODY = "#38bdf8";
const C8_GLINT = "#e0f2fe";

function drawHi8bit(c: PixelCanvas, frame: number): void {
  // hi-8bit canvas is 16 x 24.
  // left shard column (apex at 4, 11)
  c.polygon(
    [
      [4, 11],
      [2, 13],
      [2, 20],
      [3, 20],
      [4, 13],
    ],
    C8_SHADOW,
  );
  c.polygon(
    [
      [4, 11],
      [4, 13],
      [4, 20],
      [5, 20],
      [5, 13],
    ],
    C8_BODY,
  );

  // right shard column (apex at 12, 9)
  c.polygon(
    [
      [12, 9],
      [10, 11],
      [10, 20],
      [11, 20],
      [12, 11],
    ],
    C8_SHADOW,
  );
  c.polygon(
    [
      [12, 9],
      [12, 11],
      [12, 20],
      [13, 20],
      [13, 11],
    ],
    C8_BODY,
  );

  // central dominant spire (apex at 8, 3)
  c.polygon(
    [
      [8, 3],
      [6, 5],
      [6, 20],
      [7, 20],
      [7, 6],
    ],
    C8_SHADOW,
  );
  c.polygon(
    [
      [8, 3],
      [7, 6],
      [8, 20],
      [9, 20],
      [9, 5],
    ],
    C8_BODY,
  );

  // 1px dark outline around crystal blocks
  c.outline(C8_OUTLINE);

  // 2px basal geode crust (y=21..23, touching bottom row y=23)
  c.line(2, 21, 13, 21, C8_OUTLINE);
  c.line(2, 22, 13, 22, C8_OUTLINE);
  c.line(3, 23, 12, 23, C8_OUTLINE); // floor contact
  c.px(3, 20, C8_OUTLINE);
  c.px(6, 20, C8_OUTLINE);
  c.px(10, 20, C8_OUTLINE);

  // per-frame animation (4-frame cyclic sparkle loop)
  if (frame === 0) {
    // baseline: glint on main spire apex
    c.px(8, 3, C8_GLINT);
  } else if (frame === 1) {
    // core flare: glint on right shard crest
    c.px(12, 9, C8_GLINT);
    c.px(8, 6, C8_GLINT);
  } else if (frame === 2) {
    // peak radiance: left shard crest sparks, central facet sparkles
    c.px(4, 11, C8_GLINT);
    c.px(8, 9, C8_GLINT);
    c.px(12, 13, C8_GLINT);
  } else {
    // relaxation: pulse recedes down central ridge
    c.px(8, 14, C8_GLINT);
  }
}

function drawHi16bit(c: PixelCanvas, frame: number): void {
  // hi-16bit canvas is 32 x 48.
  // 1. left angled shard column (apex at 8, 22)
  // faceted crystal cap
  c.polygon(
    [
      [8, 22],
      [5, 25],
      [7, 26],
    ],
    C16_SHADOW,
  );
  c.polygon(
    [
      [8, 22],
      [7, 26],
      [10, 24],
    ],
    C16_BODY,
  );
  // column body (shadow flank)
  c.polygon(
    [
      [5, 25],
      [7, 26],
      [7, 41],
      [5, 41],
    ],
    C16_SHADOW,
  );
  // internal sapphire core in shadow
  c.line(5, 28, 6, 39, C16_SAPPHIRE);
  c.line(6, 28, 6, 39, C16_SAPPHIRE);

  // column body (lit flank)
  c.polygon(
    [
      [7, 26],
      [10, 24],
      [10, 41],
      [7, 41],
    ],
    C16_BODY,
  );
  // lit edge and facet line
  c.line(10, 24, 10, 41, C16_LIT);
  c.line(7, 26, 7, 41, C16_LIT);

  // 2. right angled shard column (apex at 24, 18)
  // faceted crystal cap
  c.polygon(
    [
      [24, 18],
      [21, 22],
      [23, 23],
    ],
    C16_SHADOW,
  );
  c.polygon(
    [
      [24, 18],
      [23, 23],
      [27, 21],
    ],
    C16_LIT,
  );
  // column body (shadow flank)
  c.polygon(
    [
      [21, 22],
      [23, 23],
      [23, 40],
      [21, 40],
    ],
    C16_SHADOW,
  );
  c.line(22, 24, 22, 38, C16_SAPPHIRE);

  // column body (lit flank)
  c.polygon(
    [
      [23, 23],
      [27, 21],
      [27, 40],
      [23, 40],
    ],
    C16_LIT,
  );
  c.line(24, 23, 24, 40, C16_BODY);
  c.line(27, 21, 27, 40, C16_SHIMMER);

  // 3. central dominant hexagonal spire (apex at 16, 6)
  // hexagonal pyramidal termination cap
  // left cap facet (in shadow)
  c.polygon(
    [
      [16, 6],
      [12, 13],
      [14, 15],
    ],
    C16_SHADOW,
  );
  // center-left cap facet
  c.polygon(
    [
      [16, 6],
      [14, 15],
      [16, 16],
    ],
    C16_BODY,
  );
  // center-right cap facet
  c.polygon(
    [
      [16, 6],
      [16, 16],
      [18, 15],
    ],
    C16_LIT,
  );
  // right cap facet
  c.polygon(
    [
      [16, 6],
      [18, 15],
      [20, 13],
    ],
    C16_SHIMMER,
  );

  // column prism below cap
  // left flank (shadow)
  c.polygon(
    [
      [12, 13],
      [14, 15],
      [14, 40],
      [12, 40],
    ],
    C16_SHADOW,
  );
  // deep sapphire core in left flank
  c.rect(12, 16, 2, 24, C16_SAPPHIRE);

  // center facet (translucent radiant body)
  c.polygon(
    [
      [14, 15],
      [18, 15],
      [18, 40],
      [14, 40],
    ],
    C16_BODY,
  );
  // deep central sapphire core
  c.rect(15, 17, 2, 23, C16_SAPPHIRE);

  // right flank (illuminated)
  c.polygon(
    [
      [18, 15],
      [20, 13],
      [20, 40],
      [18, 40],
    ],
    C16_LIT,
  );
  // lit facet ridge lines
  c.line(14, 15, 14, 40, C16_SHADOW);
  c.line(18, 15, 18, 40, C16_SHIMMER);
  c.line(20, 13, 20, 40, C16_SHIMMER);

  // 4. secondary front crystal shards for natural geode clustering
  // left front shard (apex at 11, 33)
  c.polygon(
    [
      [11, 33],
      [9, 36],
      [9, 42],
      [11, 42],
    ],
    C16_SHADOW,
  );
  c.polygon(
    [
      [11, 33],
      [11, 42],
      [13, 42],
      [13, 36],
    ],
    C16_BODY,
  );
  c.line(13, 36, 13, 42, C16_LIT);

  // right front shard (apex at 20, 31)
  c.polygon(
    [
      [20, 31],
      [18, 35],
      [18, 42],
      [20, 42],
    ],
    C16_SHADOW,
  );
  c.polygon(
    [
      [20, 31],
      [20, 42],
      [22, 42],
      [22, 35],
    ],
    C16_LIT,
  );
  c.line(22, 35, 22, 42, C16_SHIMMER);

  // tiny accent shard at right
  c.polygon(
    [
      [25, 36],
      [24, 38],
      [24, 42],
      [26, 42],
      [26, 38],
    ],
    C16_LIT,
  );

  // dark 1px outline around all crystals
  c.outline(C16_OUTLINE);

  // 5. warm umber matrix stone & obsidian geode base (y=40..47)
  // geode rocky crust silhouette with jagged crags
  c.polygon(
    [
      [4, 42],
      [2, 45],
      [5, 47],
      [27, 47],
      [29, 45],
      [28, 41],
      [25, 40],
      [23, 42],
      [17, 41],
      [14, 42],
      [10, 41],
      [4, 40],
    ],
    C16_OUTLINE,
  );

  // warm umber matrix stone facets nestled inside crust (no teal on stone!)
  c.polygon(
    [
      [5, 43],
      [10, 42],
      [10, 45],
      [5, 45],
    ],
    C16_ROCK_WARM,
  );
  c.polygon(
    [
      [11, 43],
      [17, 42],
      [17, 46],
      [11, 45],
    ],
    C16_ROCK_WARM,
  );
  c.polygon(
    [
      [18, 43],
      [23, 43],
      [23, 46],
      [18, 46],
    ],
    C16_ROCK_WARM,
  );
  c.polygon(
    [
      [24, 42],
      [28, 42],
      [27, 45],
      [24, 45],
    ],
    C16_ROCK_WARM,
  );
  c.line(6, 46, 25, 46, C16_ROCK_WARM);

  // dark rock crevices and floor row
  c.line(5, 47, 27, 47, C16_OUTLINE); // floor contact row
  c.line(3, 45, 9, 45, C16_OUTLINE);
  c.line(13, 44, 18, 44, C16_OUTLINE);
  c.line(22, 45, 28, 45, C16_OUTLINE);
  c.line(10, 41, 10, 45, C16_OUTLINE);
  c.line(17, 42, 17, 46, C16_OUTLINE);
  c.line(23, 42, 23, 46, C16_OUTLINE);
  c.px(4, 41, C16_OUTLINE);
  c.px(25, 41, C16_OUTLINE);

  // 6. per-frame celestial energy pulsation & glints
  if (frame === 0) {
    // baseline state: soft internal glow, 1px apex glint on main spire
    c.px(16, 6, C16_GLINT);
    c.px(16, 7, C16_SHIMMER);
    c.line(15, 20, 16, 20, C16_LIT);
    c.line(15, 26, 16, 26, C16_LIT);
    c.px(17, 10, C16_SHIMMER);
    c.px(19, 14, C16_SHIMMER);
    c.px(24, 20, C16_LIT);
  } else if (frame === 1) {
    // core energy flares: light tone expands into inner facets; glint shifts to right shard crest
    c.px(16, 6, C16_SHIMMER);
    c.px(24, 18, C16_GLINT);
    c.rect(15, 17, 2, 9, C16_LIT);
    c.rect(15, 20, 2, 3, C16_SHIMMER);
    c.px(20, 31, C16_SHIMMER);
    c.line(18, 19, 18, 26, C16_SHIMMER);
  } else if (frame === 2) {
    // peak radiance: central core highlights flash glint white; left shard crest sparks
    c.px(8, 22, C16_GLINT);
    c.px(24, 18, C16_SHIMMER);
    c.rect(15, 16, 2, 11, C16_SHIMMER);
    c.rect(15, 19, 2, 4, C16_GLINT);
    c.px(16, 9, C16_SHIMMER);
    c.px(16, 10, C16_GLINT);
    c.px(11, 33, C16_GLINT);
    c.line(7, 29, 7, 34, C16_SHIMMER);
  } else {
    // relaxation state: core radiance dims toward baseline, pulse recedes down central ridge
    c.px(16, 11, C16_SHIMMER);
    c.rect(15, 24, 2, 8, C16_LIT);
    c.rect(15, 27, 2, 4, C16_SHIMMER);
    c.px(20, 31, C16_GLINT);
    c.px(8, 22, C16_BODY);
  }
}

export default defineProp({
  id: "aether_crystal_cluster",
  description: "Prismatic celestial mineral cluster sprouting from an obsidian and warm stone geode crust.",
  size: { width: 32, height: 48 },
  anchor: "bottom",
  frames: 4,
  fps: 6,
  glow: { color: "#38bdf8", radius: 80, x: 16, y: 20, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawHi8bit(c, frame),
    hi16bit: (c, frame) => drawHi16bit(c, frame),
  },
});
