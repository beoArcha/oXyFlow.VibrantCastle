import { describe, it, expect } from "bun:test";
import type { LocationDefinition } from "../../locations/types";
import type { DecorPlacementSchema } from "../../locations/schema/locationSchema";
import type { IPropProvider, ResolvedProp } from "../../engine/props/propManager";
import { parsePropMeta } from "../../engine/props/propMeta";
import { createPropMetaJson } from "../../engine/props/__tests__/propFixtures";
import { DecorRenderer } from "../decorRenderer";
import { ViewCuller } from "../viewCulling";

const meta = parsePropMeta(createPropMetaJson());
const sheet = { sheet: true } as unknown as CanvasImageSource;
const glowImage = { glow: true } as unknown as CanvasImageSource;

const props: IPropProvider = {
  getMeta: (id) => (id === "test_lantern" ? meta : null),
  resolve: (id): ResolvedProp | null =>
    id === "test_lantern" ? { meta, tier: "mid", image: sheet, frameWidth: 32, frameHeight: 64 } : null,
};

interface Call {
  op: string;
  args: unknown[];
}

function fakeCtx() {
  const calls: Call[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    drawImage: (...args: unknown[]) => calls.push({ op: `draw:${args[0] === glowImage ? "glow" : "sheet"}`, args }),
    save: () => calls.push({ op: "save", args: [] }),
    restore: () => calls.push({ op: "restore", args: [] }),
    translate: (...args: unknown[]) => calls.push({ op: "translate", args }),
    scale: (...args: unknown[]) => calls.push({ op: "scale", args }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, raw: ctx };
}

const location = (decor: DecorPlacementSchema[] | undefined) => ({ id: "t", decor }) as unknown as LocationDefinition;
const place = (over: Partial<DecorPlacementSchema> = {}): DecorPlacementSchema => ({
  id: "d",
  propId: "test_lantern",
  x: 500,
  y: 300,
  ...over,
});

function makeRenderer() {
  const gradients: unknown[] = [];
  const renderer = new DecorRenderer(props, (size) => ({
    image: glowImage,
    ctx: {
      createRadialGradient: (...args: unknown[]) => {
        gradients.push(args);
        return { addColorStop: () => undefined };
      },
      fillRect: () => undefined,
      fillStyle: "",
      size,
    } as unknown as CanvasRenderingContext2D,
  }));
  return { renderer, gradients };
}

function view(x: number, y: number, w = 1000, h = 600) {
  const culler = new ViewCuller();
  culler.setView(x, y, w, h);
  return culler;
}

describe("DecorRenderer", () => {
  it("draws nothing without decor or with an unknown prop", () => {
    const { renderer } = makeRenderer();
    const { ctx, calls } = fakeCtx();

    renderer.render(ctx, location(undefined), "back", 0, view(0, 0));
    renderer.render(ctx, location([place({ propId: "ghost" })]), "back", 0, view(0, 0));

    expect(calls).toHaveLength(0);
  });

  it("selects the animation frame from the tick and phase", () => {
    const { renderer } = makeRenderer();
    const loc = location([place({ phase: 1 })]);
    const a = fakeCtx();
    const b = fakeCtx();

    renderer.render(a.ctx, loc, "back", 0, view(0, 0));
    renderer.render(b.ctx, loc, "back", 8, view(0, 0));

    expect(a.calls.find((c) => c.op === "draw:sheet")?.args[1]).toBe(32);
    expect(b.calls.find((c) => c.op === "draw:sheet")?.args[1]).toBe(64);
  });

  it("freezes the frame when the tick does not advance", () => {
    const { renderer } = makeRenderer();
    const loc = location([place()]);
    const a = fakeCtx();
    const b = fakeCtx();

    renderer.render(a.ctx, loc, "back", 77, view(0, 0));
    renderer.render(b.ctx, loc, "back", 77, view(0, 0));

    expect(a.calls).toEqual(b.calls);
  });

  it("draws the layers separately", () => {
    const { renderer } = makeRenderer();
    const loc = location([place(), place({ id: "f", layer: "front" })]);
    const back = fakeCtx();
    const front = fakeCtx();

    renderer.render(back.ctx, loc, "back", 0, view(0, 0));
    renderer.render(front.ctx, loc, "front", 0, view(0, 0));

    expect(back.calls.filter((c) => c.op === "draw:sheet")).toHaveLength(1);
    expect(front.calls.filter((c) => c.op === "draw:sheet")).toHaveLength(1);
  });

  it("draws the glow additively and restores the blend state", () => {
    const { renderer, gradients } = makeRenderer();
    const { ctx, calls, raw } = fakeCtx();
    let blendDuringGlow = "";
    raw.drawImage = (...args: unknown[]) => {
      if (args[0] === glowImage) blendDuringGlow = raw.globalCompositeOperation;
      calls.push({ op: `draw:${args[0] === glowImage ? "glow" : "sheet"}`, args });
    };

    renderer.render(ctx, location([place(), place({ id: "e", x: 700 })]), "back", 5, view(0, 0));

    expect(blendDuringGlow).toBe("lighter");
    expect(raw.globalCompositeOperation).toBe("source-over");
    expect(raw.globalAlpha).toBe(1);
    expect(gradients).toHaveLength(1);
    const glowDraw = calls.find((c) => c.op === "draw:glow");
    expect(glowDraw?.args.slice(1)).toEqual([500 - 16 + 16 - 72, 300 + 44 - 72, 144, 144]);
  });

  it("mirrors the sprite with flipX", () => {
    const { renderer } = makeRenderer();
    const { ctx, calls } = fakeCtx();

    renderer.render(ctx, location([place({ flipX: true })]), "back", 0, view(0, 0));

    expect(calls.map((c) => c.op).slice(0, 4)).toEqual(["save", "translate", "scale", "draw:sheet"]);
    expect(calls[2].args).toEqual([-1, 1]);
  });

  it("culls a sprite whose glow is out of view but keeps one whose glow reaches in", () => {
    const { renderer } = makeRenderer();
    const loc = location([place({ x: 5000, y: 300 })]);
    const far = fakeCtx();
    const near = fakeCtx();

    renderer.render(far.ctx, loc, "back", 0, view(0, 0));
    // view right edge incl. margin is 4983: the sprite box (left 4984) is outside, the glow disc (left 4928) is inside
    renderer.render(near.ctx, loc, "back", 0, view(3783, 0, 1000, 600));

    expect(far.calls).toHaveLength(0);
    expect(near.calls.some((c) => c.op === "draw:sheet")).toBe(true);
  });
});
