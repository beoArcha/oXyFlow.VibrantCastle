import { describe, it, expect } from "bun:test";
import { StructureRenderer, defaultStructureRenderer } from "../structureRenderer";
import { Entity, CollisionType } from "@game/types";
import { createMockContext2D as createMockContext } from "@test-utils";

describe("StructureRenderer", () => {
  it("renders goal portal via atlas when atlas is present", () => {
    let atlasCalled = false;
    const mockAtlasRenderer = {
      hasAtlas: (id: string) => id === "aether_gate",
      render: () => {
        atlasCalled = true;
        return true;
      },
    };

    const renderer = new StructureRenderer(mockAtlasRenderer as any);
    const ctx = createMockContext();

    const portal: Entity = {
      id: "gate_1",
      type: CollisionType.Goal,
      x: 100,
      y: 200,
      width: 64,
      height: 96,
      structureId: "aether_gate",
      label: "To Bastion",
    } as Entity;

    renderer.render(ctx, [portal], "en", 60);

    expect(atlasCalled).toBe(true);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders procedural goal portal fallback and destination badge when atlas is absent", () => {
    const mockAtlasRenderer = {
      hasAtlas: () => false,
      render: () => false,
    };

    const renderer = new StructureRenderer(mockAtlasRenderer as any);
    const ctx = createMockContext();

    const portal: Entity = {
      id: "gate_proc",
      type: CollisionType.Goal,
      x: 100,
      y: 200,
      width: 64,
      height: 96,
      portalColors: {
        inner: "#ffffff",
        outer: "#38bdf8",
        border: "#f59e0b",
      },
      label: "Next Zone",
    } as Entity;

    renderer.render(ctx, [portal], "en", 60);

    expect(ctx.getRadialGradientCount()).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders solid platform and one-way platform with correct brick lines and slats", () => {
    const renderer = defaultStructureRenderer;
    const ctx = createMockContext();

    const solid: Entity = {
      id: "solid_plat",
      type: CollisionType.Solid,
      x: 50,
      y: 300,
      width: 120,
      height: 24,
      color: "#b35a38",
    } as Entity;

    const oneWay: Entity = {
      id: "oneway_plat",
      type: CollisionType.OneWay,
      x: 200,
      y: 250,
      width: 100,
      height: 16,
      color: "#d98a55",
      borderColor: "#fde047",
    } as Entity;

    renderer.render(ctx, [solid, oneWay], "en", 60);

    expect(ctx.getFillRectCalls().length).toBeGreaterThan(5);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders interactive lever in both activated and unactivated states", () => {
    const renderer = defaultStructureRenderer;
    const ctx = createMockContext();

    const leverOff: Entity = {
      id: "lever_1",
      type: CollisionType.Lever,
      x: 100,
      y: 400,
      width: 20,
      height: 20,
      isActivated: false,
    } as Entity;

    const leverOn: Entity = {
      id: "lever_2",
      type: CollisionType.Lever,
      x: 150,
      y: 400,
      width: 20,
      height: 20,
      isActivated: true,
    } as Entity;

    renderer.render(ctx, [leverOff, leverOn], "en", 60);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders hazard spikes correctly", () => {
    const renderer = defaultStructureRenderer;
    const ctx = createMockContext();

    const spikes: Entity = {
      id: "spikes_1",
      type: CollisionType.Hazard,
      x: 100,
      y: 500,
      width: 80,
      height: 20,
    } as Entity;

    renderer.render(ctx, [spikes], "en", 60);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("skips fully opened gates", () => {
    const renderer = defaultStructureRenderer;
    const ctx = createMockContext();

    const lifted: Entity = {
      id: "lifted_gate",
      type: CollisionType.Solid,
      x: 100,
      y: 400,
      width: 64,
      height: 0,
      gateBaseHeight: 96,
      animationState: "open",
    } as Entity;

    renderer.render(ctx, [lifted], "en", 60);
    expect(ctx.getFillRectCalls().length).toBe(0);
  });
});

describe("StructureRenderer animation clock", () => {
  const capture = () => {
    const calls: Array<{ atlasId: string; animationName: string; ticks?: number }> = [];
    const atlas = {
      hasAtlas: () => true,
      render: (_ctx: unknown, o: { atlasId: string; animationName: string; ticks?: number }) => {
        calls.push(o);
        return true;
      },
    };
    return { calls, renderer: new StructureRenderer(atlas as never) };
  };

  it("uses per-entity animationTicks instead of the global tick count", () => {
    const { calls, renderer } = capture();
    const portal = {
      id: "p",
      type: CollisionType.Goal,
      x: 0,
      y: 0,
      width: 32,
      height: 64,
      animationState: "active",
      animationTicks: 7,
    } as Entity;
    renderer.render(createMockContext(), [portal], "en", 5000);
    expect(calls[0].ticks).toBe(7);
    expect(calls[0].animationName).toBe("active");
  });

  it("falls back to the global tick count when animationTicks is undefined", () => {
    const { calls, renderer } = capture();
    const portal = { id: "p", type: CollisionType.Goal, x: 0, y: 0, width: 32, height: 64 } as Entity;
    renderer.render(createMockContext(), [portal], "en", 123);
    expect(calls[0].ticks).toBe(123);
  });

  it("renders a lever atlas animation from its own clock", () => {
    const { calls, renderer } = capture();
    const lever = {
      id: "l",
      type: CollisionType.Lever,
      structureId: "chrono_lever",
      x: 0,
      y: 0,
      width: 25,
      height: 45,
      isActivated: true,
      animationState: "active",
      animationTicks: 3,
    } as Entity;
    renderer.render(createMockContext(), [lever], "en", 999);
    expect(calls[0].atlasId).toBe("chrono_lever");
    expect(calls[0].ticks).toBe(3);
  });
});

describe("StructureRenderer structure atlases", () => {
  interface Spy {
    renders: Array<{ atlasId: string; animationName: string; x: number; width: number; height: number }>;
    regions: Array<{ atlasId: string; y: number; height: number; regionY: number }>;
    renderer: StructureRenderer;
  }

  const makeRenderer = (atlases: Record<string, number>): Spy => {
    const renders: Spy["renders"] = [];
    const regions: Spy["regions"] = [];
    const atlas = {
      hasAtlas: (id: string) => id in atlases,
      hasAnimation: () => true,
      getBodyAspect: (id: string) => atlases[id] ?? 0,
      render: (_c: unknown, o: Spy["renders"][number]) => {
        renders.push({ atlasId: o.atlasId, animationName: o.animationName, x: o.x, width: o.width, height: o.height });
        return true;
      },
      renderRegion: (_c: unknown, o: Spy["regions"][number]) => {
        regions.push({ atlasId: o.atlasId, y: o.y, height: o.height, regionY: o.regionY });
        return true;
      },
    };
    return { renders, regions, renderer: new StructureRenderer(atlas as never) };
  };

  const gate = (extra: Partial<Entity> = {}): Entity =>
    ({
      id: "g",
      type: CollisionType.Solid,
      structureId: "grand_portcullis",
      x: 100,
      y: 300,
      width: 36,
      height: 200,
      ...extra,
    }) as Entity;

  it("draws a closed gate from the portcullis sheet instead of the grey rectangle", () => {
    const { regions, renderer } = makeRenderer({ grand_portcullis: 0.456 });
    const ctx = createMockContext();

    renderer.render(ctx, [gate()], "en", 0);

    expect(regions.length).toBeGreaterThan(4);
    expect(regions.every((r) => r.atlasId === "grand_portcullis")).toBe(true);
    expect(ctx.getFillRectCalls().length).toBe(0);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("slides the iron grid up while opening", () => {
    const closed = makeRenderer({ grand_portcullis: 0.456 });
    const opening = makeRenderer({ grand_portcullis: 0.456 });

    closed.renderer.render(createMockContext(), [gate()], "en", 0);
    opening.renderer.render(
      createMockContext(),
      [gate({ gateBaseHeight: 200, height: 100, animationState: "opening", animationTicks: 36 })],
      "en",
      0
    );

    const spikesY = (spy: Spy) => spy.regions.find((r) => r.regionY >= 0.9)?.y ?? Infinity;
    expect(spikesY(opening)).toBeLessThan(spikesY(closed));
  });

  it("keeps drawing the lintel and posts of an open gate but no grid", () => {
    const { regions, renderer } = makeRenderer({ grand_portcullis: 0.456 });

    renderer.render(
      createMockContext(),
      [gate({ gateBaseHeight: 200, height: 0, animationState: "open", animationTicks: 99 })],
      "en",
      0
    );

    expect(regions.length).toBeGreaterThan(0);
    expect(regions.some((r) => r.regionY === 0)).toBe(true);
  });

  it("falls back to the procedural gate when the portcullis atlas is missing", () => {
    const { regions, renderer } = makeRenderer({});
    const ctx = createMockContext();

    renderer.render(ctx, [gate()], "en", 0);

    expect(regions.length).toBe(0);
    expect(ctx.getFillRectCalls().length).toBeGreaterThan(0);
  });

  it("does not draw an open gate procedurally", () => {
    const { renderer } = makeRenderer({});
    const ctx = createMockContext();

    renderer.render(ctx, [gate({ gateBaseHeight: 200, height: 0, animationState: "open" })], "en", 0);

    expect(ctx.getFillRectCalls().length).toBe(0);
  });

  it("tiles the thorn strip along the hazard width", () => {
    const { renders, renderer } = makeRenderer({ hazard_thorns: 3.68 });
    const hazard = { id: "h", type: CollisionType.Hazard, x: 50, y: 400, width: 368, height: 50 } as Entity;

    renderer.render(createMockContext(), [hazard], "en", 0);

    expect(renders.length).toBe(2);
    expect(renders.every((r) => r.atlasId === "hazard_thorns" && r.animationName === "idle")).toBe(true);
    expect(renders[0].x).toBe(50);
    expect(renders[1].x).toBe(50 + renders[0].width);
    expect(renders[0].width * 2).toBeCloseTo(368, 6);
  });

  it("draws procedural spikes when the thorn atlas is missing", () => {
    const { renders, renderer } = makeRenderer({});
    const hazard = { id: "h", type: CollisionType.Hazard, x: 50, y: 400, width: 100, height: 40 } as Entity;
    const ctx = createMockContext();

    renderer.render(ctx, [hazard], "en", 0);

    expect(renders.length).toBe(0);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("renders a pulled lever through the activating animation of chrono_lever", () => {
    const { renders, renderer } = makeRenderer({ chrono_lever: 1 });
    const lever = {
      id: "l",
      type: CollisionType.Lever,
      structureId: "chrono_lever",
      x: 0,
      y: 0,
      width: 25,
      height: 45,
      isActivated: true,
      animationState: "activating",
      animationTicks: 4,
    } as Entity;

    renderer.render(createMockContext(), [lever], "en", 0);

    expect(renders[0].atlasId).toBe("chrono_lever");
    expect(renders[0].animationName).toBe("activating");
  });
});
