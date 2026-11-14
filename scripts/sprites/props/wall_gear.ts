import { defineProp, type PixelCanvas } from "../defineProp";

// wall gear decor prop
// heavy industrial clockwork cog mounted flush against vertical masonry shafts.
// circular 6-toothed silhouette with six chiseled iron spokes radiating from a reinforced
// rim to a raised brass central boss with a hexagonal axle pin.
// 6 frames form one smooth 60-degree rotation step cycle (10 degrees per frame).

// hi-16bit palette (8 colours)
const COLOR_OUTLINE = "#18120c";
const COLOR_IRON_SHADOW = "#2a2421";
const COLOR_IRON_MID = "#48423e";
const COLOR_IRON_LIGHT = "#726c66";
const COLOR_BRASS_SHADE = "#78350f";
const COLOR_BRASS_MID = "#b45309";
const COLOR_BRASS_CREST = "#d97706";
const COLOR_GLINT = "#fef08a";

function drawWallGearHi8bit(c: PixelCanvas, frame: number): void {
  const cx = 11.5;
  const cy = 11.5;
  // rotation angle: 10 degrees clockwise per frame
  const rot = frame * (Math.PI / 18);

  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      if (r > 9.8) continue;

      // central brass hub and pin
      if (r <= 2.8) {
        if (r <= 0.8) {
          c.px(x, y, COLOR_GLINT);
        } else {
          c.px(x, y, COLOR_BRASS_MID);
        }
        continue;
      }

      // spokes and recessed pockets (2.8 < r < 5.2)
      if (r < 5.2) {
        let onSpoke = false;
        for (let k = 0; k < 6; k++) {
          const ang = rot + k * (Math.PI / 3);
          const uX = Math.sin(ang);
          const uY = -Math.cos(ang);
          const vX = Math.cos(ang);
          const vY = Math.sin(ang);
          const along = dx * uX + dy * uY;
          const across = dx * vX + dy * vY;
          if (along > 0 && Math.abs(across) <= 0.6) {
            onSpoke = true;
            break;
          }
        }
        if (onSpoke) {
          c.px(x, y, COLOR_IRON_MID);
        } else {
          // dark recessed pocket background for solid silhouette
          c.px(x, y, COLOR_OUTLINE);
        }
        continue;
      }

      // reinforced iron rim (5.2 <= r <= 7.2)
      if (r <= 7.2) {
        c.px(x, y, COLOR_IRON_MID);
        continue;
      }

      // brass gear teeth (7.2 < r <= 9.8)
      for (let k = 0; k < 6; k++) {
        const ang = rot + k * (Math.PI / 3);
        const uX = Math.sin(ang);
        const uY = -Math.cos(ang);
        const vX = Math.cos(ang);
        const vY = Math.sin(ang);
        const along = dx * uX + dy * uY;
        const across = dx * vX + dy * vY;
        if (along >= 7.0 && along <= 9.8) {
          const t = (along - 7.0) / (9.8 - 7.0);
          const halfW = 1.7 * (1 - t) + 1.0 * t;
          if (Math.abs(across) <= halfW) {
            c.px(x, y, COLOR_BRASS_MID);
            break;
          }
        }
      }
    }
  }

  // top-left specular glint on tooth crest
  if (frame === 0) c.px(11, 2, COLOR_GLINT);
  else if (frame === 1) c.px(13, 2, COLOR_GLINT);
  else if (frame === 2) c.px(14, 3, COLOR_GLINT);
  else if (frame === 3) c.px(8, 3, COLOR_GLINT);
  else if (frame === 4) c.px(16, 5, COLOR_GLINT);
  else if (frame === 5) c.px(10, 2, COLOR_GLINT);

  c.outline(COLOR_OUTLINE);
}

function drawWallGearHi16bit(c: PixelCanvas, frame: number): void {
  const cx = 23.5;
  const cy = 23.5;
  // rotation angle: 10 degrees clockwise per frame
  const rot = frame * (Math.PI / 18);

  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      if (r > 20.8) continue;

      const isTopLeft = (dx <= 0 && dy <= 0) || (dx + dy < -4);

      // 1. Central hexagonal axle pin (r <= 2.8)
      if (r <= 2.8) {
        let maxHex = 0;
        for (let k = 0; k < 3; k++) {
          const ang = rot + k * (Math.PI / 3);
          const d = Math.abs(dx * Math.cos(ang) + dy * Math.sin(ang));
          if (d > maxHex) maxHex = d;
        }
        if (maxHex <= 2.5) {
          if (r <= 0.9) {
            c.px(x, y, COLOR_GLINT);
          } else if (dx + dy < -0.5) {
            c.px(x, y, COLOR_IRON_LIGHT);
          } else if (dx + dy > 0.5) {
            c.px(x, y, COLOR_IRON_SHADOW);
          } else {
            c.px(x, y, COLOR_IRON_MID);
          }
          continue;
        }
      }

      // 2. Raised brass central boss (r <= 6.5)
      if (r <= 6.5) {
        if (r >= 5.5) {
          // boss bevel rim
          if (dx + dy < -2) {
            c.px(x, y, COLOR_BRASS_CREST);
          } else if (dx + dy > 2) {
            c.px(x, y, COLOR_BRASS_SHADE);
          } else {
            c.px(x, y, COLOR_BRASS_MID);
          }
        } else {
          // boss body
          if (dx + dy < -1) {
            c.px(x, y, COLOR_BRASS_CREST);
          } else if (dx + dy > 1.5) {
            c.px(x, y, COLOR_BRASS_SHADE);
          } else {
            c.px(x, y, COLOR_BRASS_MID);
          }
        }
        continue;
      }

      // 3. Chiseled iron spokes and recessed pockets (6.5 < r < 11.5)
      if (r < 11.5) {
        let onSpoke = false;
        let spokeHighlight = false;
        let spokeShade = false;
        for (let k = 0; k < 6; k++) {
          const ang = rot + k * (Math.PI / 3);
          const uX = Math.sin(ang);
          const uY = -Math.cos(ang);
          const vX = Math.cos(ang);
          const vY = Math.sin(ang);
          const along = dx * uX + dy * uY;
          const across = dx * vX + dy * vY;
          if (along > 0 && Math.abs(across) <= 1.25) {
            onSpoke = true;
            if (across < -0.2) spokeHighlight = true;
            else if (across > 0.2) spokeShade = true;
            break;
          }
        }
        if (onSpoke) {
          if (spokeHighlight && isTopLeft) {
            c.px(x, y, COLOR_IRON_LIGHT);
          } else if (spokeShade && !isTopLeft) {
            c.px(x, y, COLOR_IRON_SHADOW);
          } else {
            c.px(x, y, COLOR_IRON_MID);
          }
        } else {
          // recessed shadow pocket giving mechanical depth
          c.px(x, y, COLOR_IRON_SHADOW);
        }
        continue;
      }

      // 4. Reinforced iron rim with directional bevels (11.5 <= r <= 15.5)
      if (r <= 15.5) {
        if (r >= 14.5) {
          // outer rim bevel
          c.px(x, y, isTopLeft ? COLOR_IRON_LIGHT : COLOR_IRON_SHADOW);
        } else if (r <= 12.5) {
          // inner rim bevel casting shadow down-right
          c.px(x, y, isTopLeft ? COLOR_IRON_SHADOW : COLOR_IRON_LIGHT);
        } else {
          c.px(x, y, COLOR_IRON_MID);
        }
        continue;
      }

      // 5. Brass gear teeth with machined crests and volumetric bevels (15.5 < r <= 20.8)
      for (let k = 0; k < 6; k++) {
        const ang = rot + k * (Math.PI / 3);
        const uX = Math.sin(ang);
        const uY = -Math.cos(ang);
        const vX = Math.cos(ang);
        const vY = Math.sin(ang);
        const along = dx * uX + dy * uY;
        const across = dx * vX + dy * vY;
        if (along >= 15.2 && along <= 20.8) {
          const t = (along - 15.2) / (20.8 - 15.2);
          const halfW = 3.6 * (1 - t) + 2.0 * t;
          if (Math.abs(across) <= halfW) {
            if (along >= 19.4) {
              // machined bright brass crest
              c.px(x, y, COLOR_BRASS_CREST);
            } else if (across < -0.6) {
              // leading tooth face
              c.px(x, y, isTopLeft ? COLOR_BRASS_CREST : COLOR_BRASS_MID);
            } else if (across > 0.6) {
              // trailing tooth face in shadow
              c.px(x, y, COLOR_BRASS_SHADE);
            } else {
              c.px(x, y, COLOR_BRASS_MID);
            }
            break;
          }
        }
      }
    }
  }

  // per-frame specular crest highlights and catchlights
  if (frame === 0) {
    c.px(23, 4, COLOR_GLINT);
    c.px(24, 4, COLOR_GLINT);
  } else if (frame === 1) {
    c.px(26, 4, COLOR_GLINT);
    c.px(27, 5, COLOR_GLINT);
  } else if (frame === 2) {
    c.px(29, 6, COLOR_GLINT);
    c.px(30, 7, COLOR_GLINT);
  } else if (frame === 3) {
    c.px(16, 7, COLOR_GLINT);
    c.px(17, 6, COLOR_GLINT);
  } else if (frame === 4) {
    c.px(33, 10, COLOR_GLINT);
    c.px(34, 11, COLOR_GLINT);
  } else if (frame === 5) {
    c.px(21, 4, COLOR_GLINT);
    c.px(22, 4, COLOR_GLINT);
  }

  c.outline(COLOR_OUTLINE);
}

export default defineProp({
  id: "wall_gear",
  description: "Heavy industrial clockwork cog mounted flush against vertical masonry shafts.",
  size: { width: 48, height: 48 },
  anchor: "center",
  frames: 6,
  fps: 6,
  draw: {
    hi8bit: drawWallGearHi8bit,
    hi16bit: drawWallGearHi16bit,
  },
});
