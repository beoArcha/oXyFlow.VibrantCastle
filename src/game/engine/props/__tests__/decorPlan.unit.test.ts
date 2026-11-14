import { describe, it, expect } from "bun:test";
import type { DecorPlacementSchema } from "../../../locations/schema/locationSchema";
import { buildDecorPlan, decorFlicker, decorFrame, anchoredTop } from "../decorPlan";
import type { IPropProvider } from "../propManager";
import { parsePropMeta } from "../propMeta";
import { createPropMetaJson } from "./propFixtures";

function provider(...metas: Record<string, unknown>[]): IPropProvider {
  const byId = new Map(metas.map((m) => [m.propId as string, parsePropMeta(m)]));
  return { getMeta: (id) => byId.get(id) ?? null, resolve: () => null };
}

const place = (over: Partial<DecorPlacementSchema> = {}): DecorPlacementSchema => ({
  id: "d1",
  propId: "test_lantern",
  x: 500,
  y: 300,
  ...over,
});

describe("anchor rectangles", () => {
  it("puts a bottom anchor on the floor, a top anchor below the ceiling point, a centre anchor around the point", () => {
    expect(anchoredTop("bottom", 300, 64)).toBe(236);
    expect(anchoredTop("top", 300, 64)).toBe(300);
    expect(anchoredTop("center", 300, 64)).toBe(268);
  });

  it("derives the draw rectangle from the meta anchor", () => {
    const props = provider(
      createPropMetaJson("top_p", "top"),
      createPropMetaJson("bottom_p", "bottom"),
      createPropMetaJson("center_p", "center")
    );

    const plan = buildDecorPlan(
      [place({ propId: "top_p" }), place({ id: "d2", propId: "bottom_p" }), place({ id: "d3", propId: "center_p" })],
      props
    );

    expect(plan.back.map((d) => [d.x, d.y, d.width, d.height])).toEqual([
      [484, 300, 32, 64],
      [484, 236, 32, 64],
      [484, 268, 32, 64],
    ]);
  });
});

describe("decorFrame", () => {
  it("advances with the simulation tick and the phase offset", () => {
    expect(decorFrame(0, 8, 0, 4)).toBe(0);
    expect(decorFrame(8, 8, 0, 4)).toBe(1);
    expect(decorFrame(60, 8, 0, 4)).toBe(0);
    expect(decorFrame(0, 8, 2, 4)).toBe(2);
    expect(decorFrame(8, 8, 3, 4)).toBe(0);
  });

  it("stays frozen while the tick does not advance (paused)", () => {
    const first = decorFrame(123, 8, 1, 4);

    expect(decorFrame(123, 8, 1, 4)).toBe(first);
  });

  it("is always 0 for a single frame prop and never negative", () => {
    expect(decorFrame(999, 8, 3, 1)).toBe(0);
    expect(decorFrame(0, 8, -1, 4)).toBe(3);
  });
});

describe("decorFlicker", () => {
  it("stays within 0.75..1.0 and is deterministic", () => {
    for (let tick = 0; tick < 500; tick++) {
      const a = decorFlicker(tick, 2);
      expect(a).toBeGreaterThanOrEqual(0.75);
      expect(a).toBeLessThanOrEqual(1);
      expect(decorFlicker(tick, 2)).toBe(a);
    }
  });

  it("differs between neighbouring decor indexes", () => {
    const samples = new Set<number>();
    for (let index = 0; index < 8; index++) samples.add(decorFlicker(30, index));

    expect(samples.size).toBeGreaterThan(1);
  });
});

describe("buildDecorPlan", () => {
  it("splits layers, mirrors the glow with flipX and includes the glow radius in the culling box", () => {
    const props = provider(createPropMetaJson("test_lantern", "top"));

    const plan = buildDecorPlan([place({ flipX: true }), place({ id: "f", layer: "front" })], props);

    expect(plan.back).toHaveLength(1);
    expect(plan.front).toHaveLength(1);
    const back = plan.back[0];
    expect(back.glowX).toBe(484 + (32 - 16));
    expect(back.glowY).toBe(300 + 44);
    expect(back.cullX).toBe(back.glowX - 72);
    expect(back.cullY).toBe(344 - 72);
    expect(back.cullX + back.cullW).toBe(back.glowX + 72);
    expect(back.cullY + back.cullH).toBe(back.glowY + 72);
  });

  it("skips an unknown propId and keeps the rest", () => {
    const plan = buildDecorPlan([place({ propId: "ghost" }), place({ id: "ok" })], provider(createPropMetaJson()));

    expect(plan.back.map((d) => d.propId)).toEqual(["test_lantern"]);
    expect(plan.back[0].index).toBe(1);
  });

  it("returns an empty plan without placements", () => {
    const plan = buildDecorPlan(undefined, provider());

    expect(plan.back).toHaveLength(0);
    expect(plan.front).toHaveLength(0);
  });
});
