import { defineProp, type PixelCanvas } from "../defineProp";

// wall gear decor prop
// heavy clockwork brass cog mounted flush against vertical masonry shafts.
// algorithmic gear with flat-topped square teeth, rim, spokes and central hub boss.
// six frames loop seamlessly as rotation advances by one tooth pitch.

// palette
const COLOR_OUTLINE = "#18120c";
const COLOR_IRON_WINDOW = "#201a17";
const COLOR_BRASS_LIGHT = "#eab308";
const COLOR_BRASS_MID = "#b45309";
const COLOR_BRASS_SHADOW = "#78350f";
const COLOR_GLINT = "#fef08a";

function drawWallGearHi8bit(c: PixelCanvas, frame: number): void {
  const cx = 11.5;
  const cy = 11.5;
  const numTeeth = 10;
  const pitch = (2 * Math.PI) / numTeeth;
  const rot = (frame * pitch) / 6;
  const lightAngle = (135 * Math.PI) / 180;

  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const dx = x - cx;
      const dy = cy - y;
      const rho = Math.hypot(dx, dy);

      // outer boundary preserving 1 px margin for outline
      if (rho > 10.2) continue;

      const theta = Math.atan2(dy, dx);
      const cosLight = Math.cos(theta - lightAngle);
      const brassShade =
        cosLight > 0.3 ? COLOR_BRASS_LIGHT : cosLight < -0.3 ? COLOR_BRASS_SHADOW : COLOR_BRASS_MID;

      // 1. hub boss and dark axle hole (rho <= 3.0)
      if (rho <= 3.0) {
        if (rho <= 1.2) {
          c.px(x, y, COLOR_OUTLINE);
        } else {
          c.px(x, y, brassShade);
        }
        continue;
      }

      // 2. three straight spokes and dark cut-out windows (3.0 < rho < 6.8)
      if (rho < 6.8) {
        let onSpoke = false;
        for (let k = 0; k < 3; k++) {
          const ang = rot + k * ((2 * Math.PI) / 3);
          const along = dx * Math.cos(ang) + dy * Math.sin(ang);
          const across = -dx * Math.sin(ang) + dy * Math.cos(ang);
          if (along > 0 && Math.abs(across) <= 0.8) {
            onSpoke = true;
            break;
          }
        }
        if (onSpoke) {
          c.px(x, y, brassShade);
        } else {
          c.px(x, y, COLOR_OUTLINE);
        }
        continue;
      }

      // 3. rim ring (6.8 <= rho <= 8.2)
      if (rho <= 8.2) {
        c.px(x, y, brassShade);
        continue;
      }

      // 4. flat-topped square teeth (8.2 < rho <= 10.2)
      const toothMod = ((theta + rot) % pitch + pitch) % pitch;
      if (toothMod < 0.45 * pitch) {
        c.px(x, y, brassShade);
      }
    }
  }

  // hub highlight pixel in light brass
  c.px(11, 11, COLOR_BRASS_LIGHT);

  // 1 px dark outline around whole silhouette
  c.outline(COLOR_OUTLINE);
}

function drawWallGearHi16bit(c: PixelCanvas, frame: number): void {
  const cx = 23.5;
  const cy = 23.5;
  const numTeeth = 14;
  const pitch = (2 * Math.PI) / numTeeth;
  const rot = (frame * pitch) / 6;
  const lightAngle = (135 * Math.PI) / 180;

  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const dx = x - cx;
      const dy = cy - y;
      const rho = Math.hypot(dx, dy);

      // outer radius R=22
      if (rho > 22.0) continue;

      const theta = Math.atan2(dy, dx);
      const cosLight = Math.cos(theta - lightAngle);
      const brassShade =
        cosLight > 0.3 ? COLOR_BRASS_LIGHT : cosLight < -0.3 ? COLOR_BRASS_SHADOW : COLOR_BRASS_MID;

      // 1. hub and dark axle hole (rho <= 6)
      if (rho <= 6.0) {
        if (rho <= 2.0) {
          c.px(x, y, COLOR_OUTLINE);
        } else {
          c.px(x, y, brassShade);
        }
        continue;
      }

      // 2. 5 straight spokes 3 px wide with dark cut-out windows (6 < rho < 14)
      if (rho < 14.0) {
        let onSpoke = false;
        let litEdge = false;
        for (let k = 0; k < 5; k++) {
          const ang = rot + k * ((2 * Math.PI) / 5);
          const along = dx * Math.cos(ang) + dy * Math.sin(ang);
          const across = -dx * Math.sin(ang) + dy * Math.cos(ang);
          if (along > 0 && Math.abs(across) <= 1.35) {
            onSpoke = true;
            if (across < -0.3 && cosLight > -0.2) litEdge = true;
            break;
          }
        }
        if (onSpoke) {
          c.px(x, y, litEdge ? COLOR_BRASS_LIGHT : brassShade);
        } else {
          c.px(x, y, COLOR_IRON_WINDOW);
        }
        continue;
      }

      // 3. rim ring (14 <= rho <= 18, mid brass with directional shading)
      if (rho <= 18.0) {
        c.px(x, y, brassShade);
        continue;
      }

      // 4. flat-topped square teeth (18 < rho <= 22)
      const toothMod = ((theta + rot) % pitch + pitch) % pitch;
      if (toothMod < 0.45 * pitch) {
        c.px(x, y, brassShade);
      }
    }
  }

  // highlight pixel on the hub boss
  c.px(22, 21, COLOR_GLINT);

  // 1 px dark outline around whole silhouette
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
