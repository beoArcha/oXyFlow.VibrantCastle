import { defineHeroSprite, type PixelCanvas } from "../defineHeroSprite";
import { Brush, HI8, HI16 } from "./aurelia/kit";
import { drawAttack } from "./aurelia/attack";
import { drawCast } from "./aurelia/cast";
import { drawCrouch } from "./aurelia/crouch";
import { drawDash } from "./aurelia/dash";
import { drawFall } from "./aurelia/fall";
import { drawIdle } from "./aurelia/idle";
import { drawJump } from "./aurelia/jump";
import { drawRun } from "./aurelia/run";

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

function drawAurelia(
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
  "Autumn mage with voluminous chestnut hair, wine robe, and a crescent staff that channels cyan Aether energy.";

export default defineHeroSprite({
  id: "aurelia",
  description,
  draw: {
    hi8bit: (c, anim, frame, span) => drawAurelia(c, 1, false, anim, frame, span),
    hi16bit: (c, anim, frame, span) => drawAurelia(c, 2, true, anim, frame, span),
  },
});
