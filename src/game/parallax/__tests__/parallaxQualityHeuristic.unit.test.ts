import { describe, it, expect } from "bun:test";
import {
  detectAutoParallaxQuality,
  downgradeParallaxQualityOnce,
  getParallaxQualityCapabilities,
  ParallaxFrameTimeProbe,
  resolveFrameBudgetMsForFps,
  resolveParallaxQuality,
  type DeviceParallaxSignals,
} from "../parallaxQualityHeuristic";
import { EngineSettingsController } from "@game/loop/engineSettingsController";
import type { GameAudioEngine } from "@game/engine/audioEngine";
import type { INarrationSystem } from "@game/engine/narrationSystem";
import type { ISpriteSourceFactory } from "@game/engine/sprites";
import type { ResolvedParallaxQuality } from "@game/types";

describe("ParallaxQualityHeuristic", () => {
  it("should return simplified when prefersReducedMotion is enabled", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 2,
      hardwareConcurrency: 16,
      deviceMemory: 32,
      screenWidth: 2560,
      screenHeight: 1440,
      prefersReducedMotion: true,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("simplified");
  });

  it("should return simplified for ultra-weak devices (1 core, <=1 GiB, or 2 cores at DPR 2)", () => {
    expect(
      detectAutoParallaxQuality({
        hardwareConcurrency: 1,
        deviceMemory: 8,
        devicePixelRatio: 1,
      })
    ).toBe("simplified");
    expect(
      detectAutoParallaxQuality({
        hardwareConcurrency: 4,
        deviceMemory: 1,
        devicePixelRatio: 1,
      })
    ).toBe("simplified");
    expect(
      detectAutoParallaxQuality({
        hardwareConcurrency: 2,
        deviceMemory: 2,
        devicePixelRatio: 1,
      })
    ).toBe("simplified");
    expect(
      detectAutoParallaxQuality({
        hardwareConcurrency: 2,
        deviceMemory: 4,
        devicePixelRatio: 2,
      })
    ).toBe("simplified");
  });

  it("should return low when deviceMemory is 2 GiB or less on a multi-core device", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 1,
      hardwareConcurrency: 6,
      deviceMemory: 2,
      screenWidth: 1920,
      screenHeight: 1080,
      prefersReducedMotion: false,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("low");
  });

  it("should return low when hardwareConcurrency is 2 cores at DPR 1 with 8 GiB", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 1,
      hardwareConcurrency: 2,
      deviceMemory: 8,
      screenWidth: 1920,
      screenHeight: 1080,
      prefersReducedMotion: false,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("low");
  });

  it("should return low for a 4-core tablet at DPR 2 and a 4-core 4 GiB low-power laptop", () => {
    // Tablet (4 cores, DPR 2)
    expect(
      detectAutoParallaxQuality({
        devicePixelRatio: 2,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        screenWidth: 1024,
        screenHeight: 768,
      })
    ).toBe("low");

    // Low-power laptop (4 cores, 4 GiB, DPR 1)
    expect(
      detectAutoParallaxQuality({
        devicePixelRatio: 1,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        screenWidth: 1280,
        screenHeight: 720,
      })
    ).toBe("low");
  });

  it("should return low when screen is small and CPU cores are below 6", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 2,
      hardwareConcurrency: 4,
      deviceMemory: 4,
      screenWidth: 640,
      screenHeight: 360,
      prefersReducedMotion: false,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("low");
  });

  it("should return mid for a typical mid-range device", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 2,
      hardwareConcurrency: 6,
      deviceMemory: 8,
      screenWidth: 1280,
      screenHeight: 800,
      prefersReducedMotion: false,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("mid");
  });

  it("should return high for a high-spec desktop without deviceMemory", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      devicePixelRatio: 2,
      hardwareConcurrency: 8,
      deviceMemory: undefined,
      screenWidth: 1920,
      screenHeight: 1080,
      prefersReducedMotion: false,
    };

    // Act
    const result = detectAutoParallaxQuality(signals);

    // Assert
    expect(result).toBe("high");
  });

  it("should return explicit mode unchanged when setting is not auto", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      prefersReducedMotion: true,
      hardwareConcurrency: 2,
    };

    // Act
    const resolved = resolveParallaxQuality("off", signals);

    // Assert
    expect(resolved).toBe("off");
  });

  it("should disable atmosphere, fx, boss overlays, and zone crossfade on low and simplified modes", () => {
    expect(getParallaxQualityCapabilities("high")).toEqual({
      renderImages: true,
      farOnly: false,
      renderAtmosphere: true,
      renderFx: true,
      renderBossOverlays: true,
      renderZoneCrossfade: true,
    });
    expect(getParallaxQualityCapabilities("low")).toEqual({
      renderImages: true,
      farOnly: false,
      renderAtmosphere: false,
      renderFx: false,
      renderBossOverlays: false,
      renderZoneCrossfade: false,
    });
    expect(getParallaxQualityCapabilities("simplified")).toEqual({
      renderImages: true,
      farOnly: true,
      renderAtmosphere: false,
      renderFx: false,
      renderBossOverlays: false,
      renderZoneCrossfade: false,
    });
  });

  it("should step quality down once along high -> mid -> low -> simplified", () => {
    expect(downgradeParallaxQualityOnce("high")).toBe("mid");
    expect(downgradeParallaxQualityOnce("mid")).toBe("low");
    expect(downgradeParallaxQualityOnce("low")).toBe("simplified");
    expect(downgradeParallaxQualityOnce("simplified")).toBe("simplified");
    expect(downgradeParallaxQualityOnce("off")).toBe("off");
  });
});

describe("ParallaxFrameTimeProbe", () => {
  it("should ignore warmup frames and not downgrade when p95 is within budget", () => {
    // Arrange
    const probe = new ParallaxFrameTimeProbe({
      budgetMs: resolveFrameBudgetMsForFps(60),
      warmupMs: 500,
      sampleWindowMs: 1000,
      minSamples: 10,
      maxSamples: 60,
    });

    // Act: spikes during warmup should be ignored
    expect(probe.recordFrame(30, 0)).toBe(false);
    expect(probe.recordFrame(30, 400)).toBe(false);

    // Sample window: 12 frames under budget (16.6 ms)
    let triggered = false;
    for (let i = 0; i < 12; i++) {
      const now = 600 + i * 100;
      if (probe.recordFrame(8.0 + (i % 4), now)) {
        triggered = true;
      }
    }

    // Assert
    expect(triggered).toBe(false);
    expect(probe.isFinished()).toBe(true);
    expect(probe.getLastP95Ms()).toBeLessThanOrEqual(16.6);
  });

  it("should trigger exactly one downgrade when post-warmup p95 exceeds budget", () => {
    // Arrange
    const probe = new ParallaxFrameTimeProbe({
      budgetMs: 16.6,
      warmupMs: 500,
      sampleWindowMs: 1000,
      minSamples: 10,
      maxSamples: 60,
    });

    // Act
    probe.recordFrame(5, 0);
    let triggerCount = 0;
    for (let i = 0; i < 15; i++) {
      const now = 600 + i * 100;
      const workMs = i < 8 ? 12 : 22;
      if (probe.recordFrame(workMs, now)) {
        triggerCount++;
      }
    }

    // Assert
    expect(triggerCount).toBe(1);
    expect(probe.isFinished()).toBe(true);
    expect(probe.getLastP95Ms()).toBeGreaterThan(16.6);
  });

  it("should allow re-probing after reset and stay inactive when disabled", () => {
    // Arrange
    const probe = new ParallaxFrameTimeProbe({
      budgetMs: 8.3,
      warmupMs: 100,
      sampleWindowMs: 500,
      minSamples: 5,
      maxSamples: 20,
    });
    probe.setEnabled(false);

    // Act
    for (let i = 0; i < 10; i++) {
      expect(probe.recordFrame(25, i * 100)).toBe(false);
    }
    expect(probe.getSampleCount()).toBe(0);

    probe.setEnabled(true);
    probe.reset();
    let triggered = false;
    for (let i = 0; i < 8; i++) {
      if (probe.recordFrame(15, i * 100)) {
        triggered = true;
      }
    }

    // Assert
    expect(triggered).toBe(true);
  });

  it("should downgrade EngineSettingsController auto quality once when recorded frame p95 exceeds budget", () => {
    // Arrange
    const qualityChanges: ResolvedParallaxQuality[] = [];
    const controller = new EngineSettingsController({
      audio: { setBGMVolume: () => {}, setSFXVolume: () => {} } as unknown as GameAudioEngine,
      narration: { setLanguage: () => {} } as unknown as INarrationSystem,
      spriteSources: { setQuality: () => {} } as unknown as ISpriteSourceFactory,
      onHardwareAccelerationChanged: () => {},
      onTwoPlayerChanged: () => {},
      onParallaxQualityChanged: (q) => qualityChanges.push(q),
      initialDeviceParallaxSignals: {
        hardwareConcurrency: 8,
        deviceMemory: 16,
        devicePixelRatio: 1,
        screenWidth: 1920,
        screenHeight: 1080,
      },
      getPlayerCount: () => 1,
      notifyStateChanged: () => {},
    });
    controller.setTargetFps(120); // budget = 8.3 ms

    // Act: initial auto resolution is high; feed slow frames past warmup (800 ms) + window (1500 ms)
    expect(controller.getResolvedParallaxQuality()).toBe("high");
    controller.recordAutoProbeFrame(12, 0);
    for (let t = 900; t <= 2600; t += 40) {
      controller.recordAutoProbeFrame(12, t);
    }
    // Further slow frames must not trigger a second downgrade
    for (let t = 2700; t <= 5000; t += 40) {
      controller.recordAutoProbeFrame(25, t);
    }

    // Assert
    expect(controller.getResolvedParallaxQuality()).toBe("mid");
    expect(qualityChanges).toEqual(["high", "mid"]);
  });

  it("should preserve a probe downgrade across unchanged settings syncs and re-probe if parallaxQuality is toggled", () => {
    // Arrange
    const signals: DeviceParallaxSignals = {
      hardwareConcurrency: 8,
      deviceMemory: 16,
      devicePixelRatio: 1,
      screenWidth: 1920,
      screenHeight: 1080,
    };
    const qualityChanges: ResolvedParallaxQuality[] = [];
    const controller = new EngineSettingsController({
      audio: { setBGMVolume: () => {}, setSFXVolume: () => {} } as unknown as GameAudioEngine,
      narration: { setLanguage: () => {} } as unknown as INarrationSystem,
      spriteSources: { setQuality: () => {} } as unknown as ISpriteSourceFactory,
      onHardwareAccelerationChanged: () => {},
      onTwoPlayerChanged: () => {},
      onParallaxQualityChanged: (q) => qualityChanges.push(q),
      initialDeviceParallaxSignals: signals,
      getPlayerCount: () => 1,
      notifyStateChanged: () => {},
    });
    controller.setTargetFps(120);

    controller.recordAutoProbeFrame(12, 0);
    for (let t = 900; t <= 2600; t += 40) {
      controller.recordAutoProbeFrame(12, t);
    }
    expect(controller.getResolvedParallaxQuality()).toBe("mid");

    // Act: simulate React useSettingsSync firing on unrelated settings change with identical signals
    controller.setDeviceParallaxSignals({ ...signals });
    controller.applySettings({
      volumeMusic: 0.9,
      display: { ...controller.settings.display, parallaxQuality: "auto" },
    });

    // Assert: downgrade to mid must stick
    expect(controller.getResolvedParallaxQuality()).toBe("mid");

    // Act: explicit mode switch back to auto resets probe and resolves initial high again
    controller.applySettings({ display: { ...controller.settings.display, parallaxQuality: "low" } });
    controller.applySettings({ display: { ...controller.settings.display, parallaxQuality: "auto" } });
    expect(controller.getResolvedParallaxQuality()).toBe("high");
    expect(qualityChanges).toEqual(["high", "mid", "low", "high"]);
  });

  it("should sanitize non-finite or zero device signals cleanly", () => {
    expect(
      detectAutoParallaxQuality({
        hardwareConcurrency: Number.NaN,
        deviceMemory: -4,
        devicePixelRatio: 0,
        screenWidth: 0,
        screenHeight: Number.NaN,
      })
    ).toBe("mid");
  });
});
