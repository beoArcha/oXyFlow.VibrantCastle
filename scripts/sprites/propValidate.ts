import { snapTo } from "./colors";
import { measure, type Bounds } from "./frameStats";
import { TRANSPARENT, type PixelCanvas } from "./pixelCanvas";
import type { PropAnchor, PropSpriteDefinition } from "./propTypes";
import type { RenderedProp } from "./propRender";
import { TIER_LABEL, type Tier } from "./types";
import { sameAfterScaling } from "./validate";

export interface RenderedProps {
  hi8bit: RenderedProp;
  hi16bit: RenderedProp;
}

export interface PropCheck {
  problems: string[];
  warnings: string[];
}

type Side = "left" | "right" | "top" | "bottom";

/** sides that must keep a 1 px transparent margin: every side except the anchor side. */
function marginSides(anchor: PropAnchor): Side[] {
  if (anchor === "bottom") return ["left", "right", "top"];
  if (anchor === "top") return ["left", "right", "bottom"];
  return ["left", "right", "top", "bottom"];
}

function touches(side: Side, bounds: Bounds, width: number, height: number): boolean {
  if (side === "left") return bounds.minX === 0;
  if (side === "right") return bounds.maxX === width - 1;
  if (side === "top") return bounds.minY === 0;
  return bounds.maxY === height - 1;
}

function anchorProblems(at: string, anchor: PropAnchor, bounds: Bounds, width: number, height: number): string[] {
  if (anchor === "bottom" && bounds.maxY !== height - 1) {
    return [`${at}: bottom props must touch the bottom row (y=${height - 1}); the lowest opaque row is y=${bounds.maxY}.`];
  }
  if (anchor === "top" && bounds.minY !== 0) {
    return [`${at}: top props must touch the top row (y=0); the highest opaque row is y=${bounds.minY}.`];
  }
  return [];
}

function frameProblems(def: PropSpriteDefinition, tier: Tier, frame: number, canvas: PixelCanvas): string[] {
  const at = `${TIER_LABEL[tier]} frame ${frame}`;
  const bounds = measure(canvas);
  if (!bounds) return [`${at} is empty; draw something visible.`];
  const { width, height } = canvas;
  const margins = marginSides(def.anchor)
    .filter((side) => touches(side, bounds, width, height))
    .map((side) => `${at}: opaque pixels touch the ${side} edge; keep a 1 px transparent margin.`);
  return [...anchorProblems(at, def.anchor, bounds, width, height), ...margins];
}

/** snapped colours per pixel, so two frames count as identical exactly when the sheet would show them so. */
function sameSnapped(a: PixelCanvas, b: PixelCanvas, tier: Tier): boolean {
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      const pa = a.pixelAt(x, y);
      const pb = b.pixelAt(x, y);
      const sa = pa === TRANSPARENT ? TRANSPARENT : snapTo(pa, tier);
      const sb = pb === TRANSPARENT ? TRANSPARENT : snapTo(pb, tier);
      if (sa !== sb) return false;
    }
  }
  return true;
}

function consecutiveWarnings(tier: Tier, canvases: readonly PixelCanvas[]): string[] {
  return canvases.flatMap((canvas, frame) => {
    const next = canvases[frame + 1];
    if (!next || !sameSnapped(canvas, next, tier)) return [];
    return [`${TIER_LABEL[tier]} frames ${frame} and ${frame + 1} are identical; animate the frame or drop one of them.`];
  });
}

/** collects every problem (fatal) and consecutive-frame warning (advisory) for both tiers of a prop. */
export function checkProp(def: PropSpriteDefinition, rendered: RenderedProps): PropCheck {
  const tiers: Tier[] = ["hi8bit", "hi16bit"];
  const problems = tiers.flatMap((tier) =>
    rendered[tier].canvases.flatMap((canvas, frame) => frameProblems(def, tier, frame, canvas)),
  );
  rendered.hi8bit.canvases.forEach((small, frame) => {
    const large = rendered.hi16bit.canvases[frame];
    if (measure(small) && sameAfterScaling(small, large)) {
      problems.push(
        `${TIER_LABEL.hi16bit} frame ${frame} is identical to hi-8bit scaled 2x; redraw it with more detail.`,
      );
    }
  });
  const warnings = tiers.flatMap((tier) => consecutiveWarnings(tier, rendered[tier].canvases));
  return { problems, warnings };
}
