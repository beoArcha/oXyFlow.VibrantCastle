import { defineHeroSprite, type PixelCanvas } from "../defineHeroSprite";
import { Brush, HI8, HI16 } from "./valen/kit";
import { drawAttack } from "./valen/attack";
import { drawCast } from "./valen/cast";
import { drawCrouch } from "./valen/crouch";
import { drawDash } from "./valen/dash";
import { drawFall } from "./valen/fall";
import { drawIdle } from "./valen/idle";
import { drawJump } from "./valen/jump";
import { drawRun } from "./valen/run";

type DrawAnimFn = (b: Brush, frame: number, span: number) => void;

const ANIM_DRAWS: Record<string, DrawAnimFn> = {
  idle: drawIdle,
  run: drawRun,
  jump: drawJump,
  fall: drawFall,
  attack: drawAttack,
  dash: drawDash,
  cast: drawCast,
  crouch: drawCrouch,
};

function drawValen(
  c: PixelCanvas,
  s: number,
  detailed: boolean,
  anim: string,
  frame: number,
  span: number,
): void {
  const pal = detailed ? HI16 : HI8;
  const b = new Brush(c, s, detailed, pal);
  const draw = ANIM_DRAWS[anim] ?? drawIdle;
  draw(b, frame, span);
  c.outline(pal.outline);
}

const description =
  "Valen the Chrono Duelist — a slender rapier-wielding fencer in a tailored graphite greatcoat with autumn gold embroidery, boots, and analytical spectacles.";

export default defineHeroSprite({
  id: "valen",
  description,
  draw: {
    hi8bit: (c, anim, frame, span) => drawValen(c, 1, false, anim, frame, span),
    hi16bit: (c, anim, frame, span) => drawValen(c, 2, true, anim, frame, span),
  },
});
