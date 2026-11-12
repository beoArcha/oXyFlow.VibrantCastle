import { snap12 } from "./colors";
import { spriteError } from "./errors";
import { idleBounds, measure } from "./frameStats";
import { TRANSPARENT, type PixelCanvas } from "./pixelCanvas";
import type { RenderedTier } from "./render";
import { definedAnimations, TIER_LABEL, type AnimationName, type EnemySpriteDefinition } from "./types";

const ASPECT_TOLERANCE = 0.4;
const MIN_BODY_FILL = 0.55;
const MAX_CENTER_DRIFT = 0.1;

function where(tier: RenderedTier, anim: AnimationName, frame: number): string {
  return `${TIER_LABEL[tier.tier]} animation "${anim}" frame ${frame}`;
}

function frameProblems(def: EnemySpriteDefinition, tier: RenderedTier, anim: AnimationName, frame: number): string[] {
  const canvas = tier.frames[anim]?.[frame];
  const bounds = canvas ? measure(canvas) : null;
  const at = where(tier, anim, frame);
  if (!bounds) return [`${at}: frame is empty; draw something visible.`];
  const last = tier.cell - 1;
  const problems: string[] = [];
  if (bounds.minX === 0) problems.push(`${at}: opaque pixels touch the left edge; keep a 1 px transparent margin.`);
  if (bounds.maxX === last) problems.push(`${at}: opaque pixels touch the right edge; keep a 1 px transparent margin.`);
  if (bounds.minY === 0) problems.push(`${at}: opaque pixels touch the top edge; keep a 1 px transparent margin.`);
  if (def.kind !== "aerial" && bounds.maxY !== last) {
    problems.push(`${at}: lowest opaque row is y=${bounds.maxY} but a ${def.kind} sprite must reach the bottom row y=${last} (feet on the floor).`);
  }
  return problems;
}

function bodyBoxProblems(def: EnemySpriteDefinition, tier: RenderedTier): string[] {
  const bounds = idleBounds(tier);
  if (!bounds) return [];
  const w = bounds.maxX - bounds.minX + 1;
  const h = bounds.maxY - bounds.minY + 1;
  const name = TIER_LABEL[tier.tier];
  const problems: string[] = [];
  const bodyAspect = w / h;
  const hitAspect = def.hitbox.width / def.hitbox.height;
  if (Math.abs(bodyAspect - hitAspect) / hitAspect > ASPECT_TOLERANCE) {
    problems.push(
      `${name} idle body is ${w}x${h} px (aspect ${bodyAspect.toFixed(2)}) but the hitbox ${def.hitbox.width}x${def.hitbox.height} has aspect ${hitAspect.toFixed(2)}; ` +
        `the body must match within 40 %. Make the character ${bodyAspect > hitAspect ? "narrower or taller" : "wider or shorter"}.`,
    );
  }
  const tall = def.hitbox.height > def.hitbox.width;
  if (tall && def.kind === "ground" && h < tier.cell * MIN_BODY_FILL) {
    problems.push(`${name} idle body is only ${h} px tall; a tall ground enemy must fill at least ${Math.ceil(tier.cell * MIN_BODY_FILL)} px of the ${tier.cell} px cell height.`);
  }
  if (!tall && w < tier.cell * MIN_BODY_FILL) {
    problems.push(`${name} idle body is only ${w} px wide; a wide enemy must fill at least ${Math.ceil(tier.cell * MIN_BODY_FILL)} px of the ${tier.cell} px cell width.`);
  }
  return problems;
}

function snapped12At(canvas: PixelCanvas, x: number, y: number): number {
  const rgb = canvas.pixelAt(x, y);
  return rgb === TRANSPARENT ? TRANSPARENT : snap12(rgb);
}

function sameAfterScaling(hi8bit: PixelCanvas, hi16bit: PixelCanvas): boolean {
  const factor = hi16bit.width / hi8bit.width;
  for (let y = 0; y < hi16bit.height; y++) {
    for (let x = 0; x < hi16bit.width; x++) {
      const small = snapped12At(hi8bit, Math.floor(x / factor), Math.floor(y / factor));
      if (small !== snapped12At(hi16bit, x, y)) return false;
    }
  }
  return true;
}

function redrawProblems(def: EnemySpriteDefinition, hi8bit: RenderedTier, hi16bit: RenderedTier): string[] {
  const problems: string[] = [];
  for (const anim of definedAnimations(def)) {
    (hi16bit.frames[anim] ?? []).forEach((canvas, frame) => {
      const small = hi8bit.frames[anim]?.[frame];
      if (!small || !measure(canvas) || !sameAfterScaling(small, canvas)) return;
      problems.push(`${where(hi16bit, anim, frame)}: identical to the hi-8bit frame after scaling; hi-16bit must be a real redraw with more detail.`);
    });
  }
  return problems;
}

function centerX(canvas: PixelCanvas): number | null {
  const bounds = measure(canvas);
  return bounds ? (bounds.minX + bounds.maxX + 1) / 2 : null;
}

function samePixels(a: PixelCanvas, b: PixelCanvas): boolean {
  return a.data.every((value, i) => value === b.data[i]);
}

function animationWarnings(tier: RenderedTier, anim: AnimationName): string[] {
  const frames = tier.frames[anim] ?? [];
  const warnings: string[] = [];
  const centers = frames.map(centerX).filter((c): c is number => c !== null);
  const drift = Math.max(...centers) - Math.min(...centers);
  if (centers.length > 1 && drift > tier.cell * MAX_CENTER_DRIFT) {
    warnings.push(`${TIER_LABEL[tier.tier]} animation "${anim}": body centre drifts ${drift.toFixed(1)} px between frames (limit ${(tier.cell * MAX_CENTER_DRIFT).toFixed(1)}); the sprite may jitter.`);
  }
  for (let f = 1; f < frames.length; f++) {
    if (samePixels(frames[f - 1], frames[f])) {
      warnings.push(`${where(tier, anim, f)}: identical to the previous frame; animate something or lower the frame count.`);
    }
  }
  return warnings;
}

/** Throws one error listing every violation; returns non-fatal warnings. */
export function validateSprite(def: EnemySpriteDefinition, hi8bit: RenderedTier, hi16bit: RenderedTier): string[] {
  const problems: string[] = [];
  for (const tier of [hi8bit, hi16bit]) {
    for (const anim of definedAnimations(def)) {
      (tier.frames[anim] ?? []).forEach((_, frame) => problems.push(...frameProblems(def, tier, anim, frame)));
    }
    problems.push(...bodyBoxProblems(def, tier));
  }
  problems.push(...redrawProblems(def, hi8bit, hi16bit));
  if (problems.length > 0) {
    const list = problems.map((p) => `  - ${p}`).join("\n");
    throw spriteError(`Sprite "${def.id}" failed validation:\n${list}`, { id: def.id, problems });
  }
  return [hi8bit, hi16bit].flatMap((tier) => definedAnimations(def).flatMap((anim) => animationWarnings(tier, anim)));
}
