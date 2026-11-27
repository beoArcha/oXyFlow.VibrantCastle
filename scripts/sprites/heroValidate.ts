import { spriteError } from "./errors";
import { measure, unionBounds } from "./frameStats";
import type { RenderedHeroTier } from "./heroRender";
import { AIRBORNE_ANIMATIONS, type HeroGrid, type HeroSpriteDefinition } from "./heroTypes";
import { centerX, marginProblems, sameAfterScaling, samePixels } from "./validate";
import { TIER_LABEL } from "./types";

const MIN_IDLE_HEIGHT_FILL = 0.55;
const MAX_CENTER_DRIFT = 0.1;

function where(tier: RenderedHeroTier, anim: string, frame: number): string {
  return `${TIER_LABEL[tier.tier]} animation "${anim}" frame ${frame}`;
}

function frameProblems(tier: RenderedHeroTier, anim: string, frame: number): string[] {
  const canvas = tier.frames[anim][frame];
  const bounds = measure(canvas);
  const at = where(tier, anim, frame);
  if (!bounds) return [`${at}: frame is empty; draw something visible.`];
  const problems = marginProblems(at, bounds, canvas.width);
  const last = canvas.height - 1;
  if (!AIRBORNE_ANIMATIONS.includes(anim) && bounds.maxY !== last) {
    problems.push(`${at}: lowest opaque row is y=${bounds.maxY} but a grounded animation must reach the bottom row y=${last} (feet on the floor).`);
  }
  return problems;
}

function idleProblems(tier: RenderedHeroTier): string[] {
  const bounds = unionBounds((tier.frames.idle ?? []).map(measure));
  if (!bounds) return [];
  const height = bounds.maxY - bounds.minY + 1;
  const needed = Math.ceil(tier.cell.height * MIN_IDLE_HEIGHT_FILL);
  if (height >= needed) return [];
  return [`${TIER_LABEL[tier.tier]} idle body is only ${height} px tall; it must fill at least ${needed} px of the ${tier.cell.height} px cell height.`];
}

function redrawProblems(grid: HeroGrid, hi8bit: RenderedHeroTier, hi16bit: RenderedHeroTier): string[] {
  return grid.ordering.flatMap((anim) =>
    hi16bit.frames[anim].flatMap((canvas, frame) => {
      if (!measure(canvas) || !sameAfterScaling(hi8bit.frames[anim][frame], canvas)) return [];
      return [`${where(hi16bit, anim, frame)}: identical to the hi-8bit frame after scaling; hi-16bit must be a real redraw with more detail.`];
    }),
  );
}

function driftWarning(tier: RenderedHeroTier, anim: string, span: number, centers: number[]): string[] {
  const limit = tier.cell.width * MAX_CENTER_DRIFT;
  const drift = Math.max(...centers) - Math.min(...centers);
  if (centers.length < 2 || drift <= limit) return [];
  return [`${TIER_LABEL[tier.tier]} animation "${anim}": body centre drifts ${drift.toFixed(1)} px between frames of span ${span} (limit ${limit.toFixed(1)}); the sprite may jitter.`];
}

function animationWarnings(tier: RenderedHeroTier, grid: HeroGrid, anim: string, checkDrift: boolean): string[] {
  const frames = tier.frames[anim];
  const warnings: string[] = [];
  const spans = new Set(grid.animations[anim].cells);
  for (const span of checkDrift ? spans : []) {
    const centers = frames
      .filter((_, frame) => grid.animations[anim].cells[frame] === span)
      .map(centerX)
      .filter((c): c is number => c !== null);
    warnings.push(...driftWarning(tier, anim, span, centers));
  }
  for (let f = 1; f < frames.length; f++) {
    if (samePixels(frames[f - 1], frames[f])) {
      warnings.push(`${where(tier, anim, f)}: identical to the previous frame; animate something or lower the frame count.`);
    }
  }
  return warnings;
}

/** Throws one error listing every violation; returns non-fatal warnings. */
export function validateHero(
  def: HeroSpriteDefinition,
  grid: HeroGrid,
  hi8bit: RenderedHeroTier,
  hi16bit: RenderedHeroTier,
): string[] {
  const problems: string[] = [];
  for (const tier of [hi8bit, hi16bit]) {
    for (const anim of grid.ordering) {
      tier.frames[anim].forEach((_, frame) => problems.push(...frameProblems(tier, anim, frame)));
    }
    problems.push(...idleProblems(tier));
  }
  problems.push(...redrawProblems(grid, hi8bit, hi16bit));
  if (problems.length > 0) {
    const list = problems.map((p) => `  - ${p}`).join("\n");
    throw spriteError(`Hero "${def.id}" failed validation:\n${list}`, { id: def.id, problems });
  }
  return [hi8bit, hi16bit].flatMap((tier) => grid.ordering.flatMap((anim) => animationWarnings(tier, grid, anim, !def.source)));
}
