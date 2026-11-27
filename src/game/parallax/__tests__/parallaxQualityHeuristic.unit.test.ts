import { describe, it, expect } from "bun:test";
import {
  detectAutoParallaxQuality,
  resolveParallaxQuality,
  type DeviceParallaxSignals,
} from "../parallaxQualityHeuristic";

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

  it("should return low when deviceMemory is 2 GiB or less", () => {
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

  it("should return low when hardwareConcurrency is 2 cores or fewer", () => {
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
      hardwareConcurrency: 4,
      deviceMemory: 4,
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
});
