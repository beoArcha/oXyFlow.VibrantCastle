import { describe, expect, it } from "bun:test";
import {
  DEFAULT_CLICK_TRIGGER_SIZE,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  clampZoom,
  fitViewportToMap,
  normalizeDragRect,
  panViewport,
  screenToWorld,
  worldToScreen,
  zoomAroundPoint,
} from "../mapViewport";

describe("mapViewport - Coordinate Transforms", () => {
  it("should round-trip world to screen and back under arbitrary pan and zoom", () => {
    // Arrange
    const viewport = { panX: 120, panY: -45, zoom: 0.75 };
    const worldX = 1640;
    const worldY = 520;

    // Act
    const screen = worldToScreen(worldX, worldY, viewport);
    const roundTrip = screenToWorld(screen.x, screen.y, viewport);

    // Assert
    expect(screen.x).toBeCloseTo(1350, 6);
    expect(screen.y).toBeCloseTo(345, 6);
    expect(roundTrip.x).toBeCloseTo(worldX, 6);
    expect(roundTrip.y).toBeCloseTo(worldY, 6);
  });

  it("should shift pan offsets by the exact screen delta when panning", () => {
    // Arrange
    const viewport = { panX: 40, panY: 80, zoom: 1.25 };

    // Act
    const panned = panViewport(viewport, -65, 32);

    // Assert
    expect(panned.panX).toBe(-25);
    expect(panned.panY).toBe(112);
    expect(panned.zoom).toBe(1.25);
  });

  it("should preserve the world point under the anchor when zooming around a point", () => {
    // Arrange
    const viewport = { panX: 50, panY: 20, zoom: 0.5 };
    const anchorScreenX = 480;
    const anchorScreenY = 260;
    const worldBefore = screenToWorld(anchorScreenX, anchorScreenY, viewport);

    // Act
    const zoomed = zoomAroundPoint(viewport, 1.5, anchorScreenX, anchorScreenY);
    const worldAfter = screenToWorld(anchorScreenX, anchorScreenY, zoomed);

    // Assert
    expect(zoomed.zoom).toBe(1.5);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);
  });

  it("should clamp zoom within minimum and maximum bounds", () => {
    // Arrange
    const viewport = { panX: 0, panY: 0, zoom: 1 };

    // Act
    const tooSmall = zoomAroundPoint(viewport, 0.001, 100, 100);
    const tooLarge = zoomAroundPoint(viewport, 99, 100, 100);

    // Assert
    expect(tooSmall.zoom).toBe(MIN_MAP_ZOOM);
    expect(tooLarge.zoom).toBe(MAX_MAP_ZOOM);
    expect(clampZoom(Number.NaN)).toBe(MIN_MAP_ZOOM);
  });

  it("should scale and center the map inside the canvas with padding when fitting", () => {
    // Arrange
    const mapWidth = 4800;
    const mapHeight = 1040;
    const canvasWidth = 960;
    const canvasHeight = 520;
    const padding = 20;

    // Act
    const fitted = fitViewportToMap(mapWidth, mapHeight, canvasWidth, canvasHeight, padding);
    const topLeft = worldToScreen(0, 0, fitted);
    const bottomRight = worldToScreen(mapWidth, mapHeight, fitted);

    // Assert
    expect(fitted.zoom).toBeCloseTo((960 - 40) / 4800, 6);
    expect(topLeft.x).toBeCloseTo(padding, 6);
    expect(bottomRight.x).toBeCloseTo(canvasWidth - padding, 6);
    expect(topLeft.y).toBeGreaterThan(padding);
    expect(topLeft.y + bottomRight.y).toBeCloseTo(canvasHeight, 6);
  });

  it("should produce a centered default footprint when drag distance is below click threshold", () => {
    // Arrange
    const start = { x: 500, y: 300 };
    const end = { x: 503, y: 298 };

    // Act
    const rect = normalizeDragRect(start, end);

    // Assert
    expect(rect).toEqual({
      x: 500 - DEFAULT_CLICK_TRIGGER_SIZE.width / 2,
      y: 300 - DEFAULT_CLICK_TRIGGER_SIZE.height / 2,
      width: DEFAULT_CLICK_TRIGGER_SIZE.width,
      height: DEFAULT_CLICK_TRIGGER_SIZE.height,
    });
  });

  it("should normalize dragged bounds regardless of drag direction", () => {
    // Arrange
    const start = { x: 920, y: 480 };
    const end = { x: 740, y: 320 };

    // Act
    const rect = normalizeDragRect(start, end);

    // Assert
    expect(rect).toEqual({ x: 740, y: 320, width: 180, height: 160 });
  });
});
