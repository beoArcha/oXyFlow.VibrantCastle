import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderSpritePreviewFrame, RenderSpritePreviewOptions } from "../renderSpritePreviewFrame";
import { SpriteFrame } from "@game/engine/spriteTypes";

describe("renderSpritePreviewFrame - Stateless Canvas 2D Renderer", () => {
  let mockCtx: any;
  let mockCanvas: any;
  let drawCalls: string[];

  beforeEach(() => {
    drawCalls = [];
    mockCanvas = {
      width: 400,
      height: 300,
    };
    mockCtx = {
      save: mock(() => drawCalls.push("save")),
      restore: mock(() => drawCalls.push("restore")),
      clearRect: mock((x, y, w, h) => drawCalls.push(`clearRect(${x},${y},${w},${h})`)),
      fillRect: mock((x, y, w, h) => drawCalls.push(`fillRect(${x},${y},${w},${h})`)),
      beginPath: mock(() => drawCalls.push("beginPath")),
      arc: mock((x, y, r, sa, ea) => drawCalls.push(`arc(${x},${y},${r},${sa},${ea})`)),
      ellipse: mock((x, y, rx, ry, rot, sa, ea) => drawCalls.push(`ellipse(${x},${y},${rx},${ry})`)),
      fill: mock(() => drawCalls.push("fill")),
      stroke: mock(() => drawCalls.push("stroke")),
      moveTo: mock((x, y) => drawCalls.push(`moveTo(${x},${y})`)),
      lineTo: mock((x, y) => drawCalls.push(`lineTo(${x},${y})`)),
      translate: mock((x, y) => drawCalls.push(`translate(${x},${y})`)),
      scale: mock((sx, sy) => drawCalls.push(`scale(${sx},${sy})`)),
      drawImage: mock((...args: any[]) => drawCalls.push(`drawImage(${args.length})`)),
      createRadialGradient: mock(() => ({
        addColorStop: mock(() => {}),
      })),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      imageSmoothingEnabled: true,
    };
  });

  const createParams = (overrides?: Partial<RenderSpritePreviewOptions>): RenderSpritePreviewOptions => ({
    canvas: mockCanvas as HTMLCanvasElement,
    ctx: mockCtx as CanvasRenderingContext2D,
    frame: {
      x: 0,
      y: 0,
      w: 128,
      h: 128,
      originX: 64,
      originY: 100,
    } as SpriteFrame,
    texture: {
      complete: true,
      naturalWidth: 1024,
      naturalHeight: 1024,
    } as unknown as HTMLImageElement,
    scale: 1.5,
    flipHorizontal: false,
    ...overrides,
  });

  it("does not throw and clears rect when rendered", () => {
    const params = createParams();
    renderSpritePreviewFrame(params);

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it("draws radial spotlight and ground guide line", () => {
    const params = createParams();
    renderSpritePreviewFrame(params);

    expect(mockCtx.createRadialGradient).toHaveBeenCalled();
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.ellipse).toHaveBeenCalled(); // Floor shadow
  });

  it("draws sprite with drawImage when texture is loaded and complete", () => {
    const params = createParams();
    renderSpritePreviewFrame(params);

    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it("applies horizontal flipping transform when flipHorizontal is true", () => {
    const params = createParams({ flipHorizontal: true });
    renderSpritePreviewFrame(params);

    expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
  });

  it("handles missing frame gracefully without drawing image", () => {
    const params = createParams({ frame: null });
    renderSpritePreviewFrame(params);

    expect(mockCtx.drawImage).not.toHaveBeenCalled();
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it("handles incomplete texture gracefully without drawing image", () => {
    const params = createParams({
      texture: { complete: false, naturalWidth: 0 } as any,
    });
    renderSpritePreviewFrame(params);

    expect(mockCtx.drawImage).not.toHaveBeenCalled();
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it("handles zero dimensions gracefully", () => {
    const params = createParams({
      canvas: { width: 0, height: 0 } as HTMLCanvasElement,
    });
    renderSpritePreviewFrame(params);

    expect(mockCtx.clearRect).not.toHaveBeenCalled();
  });

  it("adjusts clearance if sprite frame is large relative to canvas", () => {
    const params = createParams({
      canvas: { width: 400, height: 200 } as HTMLCanvasElement,
      frame: {
        x: 0,
        y: 0,
        w: 128,
        h: 200,
        originX: 64,
        originY: 180,
      } as SpriteFrame,
      scale: 1.0,
    });

    renderSpritePreviewFrame(params);
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });
});
