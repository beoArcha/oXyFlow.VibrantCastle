import { describe, it, expect } from "bun:test";
import { StructureRenderer, defaultStructureRenderer } from "../structureRenderer";
import { Entity, CollisionType } from "../../types";
import { createMockContext2D as createMockContext } from "../../../test-utils";

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

  it("skips lifted/deactivated entities (y === -1000)", () => {
    const renderer = defaultStructureRenderer;
    const ctx = createMockContext();

    const lifted: Entity = {
      id: "lifted_gate",
      type: CollisionType.Goal,
      x: 100,
      y: -1000,
      width: 64,
      height: 96,
    } as Entity;

    renderer.render(ctx, [lifted], "en", 60);
    expect(ctx.getFillRectCalls().length).toBe(0);
  });
});
