import { describe, it, expect } from "bun:test";
import defaultSettings from "../../data/defaultSettings.json";
import { DEFAULT_SETTINGS } from "../../../context/settingsTypes";
import { ProceduralBackdropCache } from "../proceduralBackdropCache";
import { GameRenderer } from "../renderer";

describe("Hardware GPU Acceleration Pipeline", () => {
  it("defaults hardwareAcceleration to true in defaultSettings.json", () => {
    expect((defaultSettings.display as any).hardwareAcceleration).toBe(true);
  });

  it("defaults hardwareAcceleration to true in DEFAULT_SETTINGS React context", () => {
    expect(DEFAULT_SETTINGS.display.hardwareAcceleration).toBe(true);
  });

  it("instantiates ProceduralBackdropCache without allocating buffers if document is undefined", () => {
    const cache = new ProceduralBackdropCache();
    expect(cache).toBeDefined();
    // Subsequent calls to resize should be safe and idempotent
    cache.resize(1000, 625);
    cache.resize(1000, 625);
  });

  it("allows toggling hardware acceleration on GameRenderer", () => {
    const mockCanvas = {
      getContext: () => ({
        imageSmoothingEnabled: true,
        save: () => {},
        restore: () => {},
        scale: () => {},
        translate: () => {},
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        drawImage: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
      }),
      width: 1000,
      height: 625,
    } as unknown as HTMLCanvasElement;

    const renderer = new GameRenderer(mockCanvas, {}, { hardwareAcceleration: true });
    expect(renderer.isHardwareAccelerated).toBe(true);

    renderer.setHardwareAcceleration(false);
    expect(renderer.isHardwareAccelerated).toBe(false);

    renderer.setHardwareAcceleration(true);
    expect(renderer.isHardwareAccelerated).toBe(true);
  });
});
