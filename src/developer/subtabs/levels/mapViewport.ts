export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Rect2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ViewportTransform {
  readonly panX: number;
  readonly panY: number;
  readonly zoom: number;
}

export const MIN_MAP_ZOOM = 0.08;
export const MAX_MAP_ZOOM = 3.0;
export const DEFAULT_FIT_PADDING = 28;
export const DEFAULT_CLICK_TRIGGER_SIZE = { width: 120, height: 140 } as const;
const DRAG_CLICK_THRESHOLD = 8;

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom <= 0) return MIN_MAP_ZOOM;
  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, zoom));
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: ViewportTransform
): Point2D {
  return {
    x: worldX * viewport.zoom + viewport.panX,
    y: worldY * viewport.zoom + viewport.panY,
  };
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportTransform
): Point2D {
  const safeZoom = clampZoom(viewport.zoom);
  return {
    x: (screenX - viewport.panX) / safeZoom,
    y: (screenY - viewport.panY) / safeZoom,
  };
}

export function fitViewportToMap(
  mapWidth: number,
  mapHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = DEFAULT_FIT_PADDING
): ViewportTransform {
  const safeMapW = Math.max(1, mapWidth);
  const safeMapH = Math.max(1, mapHeight);
  const availW = Math.max(16, canvasWidth - padding * 2);
  const availH = Math.max(16, canvasHeight - padding * 2);
  const zoom = clampZoom(Math.min(availW / safeMapW, availH / safeMapH));
  return {
    zoom,
    panX: (canvasWidth - safeMapW * zoom) / 2,
    panY: (canvasHeight - safeMapH * zoom) / 2,
  };
}

export function panViewport(
  viewport: ViewportTransform,
  deltaScreenX: number,
  deltaScreenY: number
): ViewportTransform {
  return {
    ...viewport,
    panX: viewport.panX + deltaScreenX,
    panY: viewport.panY + deltaScreenY,
  };
}

export function zoomAroundPoint(
  viewport: ViewportTransform,
  nextZoom: number,
  anchorScreenX: number,
  anchorScreenY: number
): ViewportTransform {
  const clamped = clampZoom(nextZoom);
  const worldAnchor = screenToWorld(anchorScreenX, anchorScreenY, viewport);
  return {
    zoom: clamped,
    panX: anchorScreenX - worldAnchor.x * clamped,
    panY: anchorScreenY - worldAnchor.y * clamped,
  };
}

/**
 * Converts a pointer drag in world coordinates to a trigger rectangle.
 * Short clicks fall back to a centered default trigger footprint.
 */
export function normalizeDragRect(
  startWorld: Point2D,
  endWorld: Point2D,
  defaultSize: { readonly width: number; readonly height: number } = DEFAULT_CLICK_TRIGGER_SIZE
): Rect2D {
  const dx = Math.abs(endWorld.x - startWorld.x);
  const dy = Math.abs(endWorld.y - startWorld.y);

  if (dx < DRAG_CLICK_THRESHOLD && dy < DRAG_CLICK_THRESHOLD) {
    return {
      x: Math.round(startWorld.x - defaultSize.width / 2),
      y: Math.round(startWorld.y - defaultSize.height / 2),
      width: defaultSize.width,
      height: defaultSize.height,
    };
  }

  return {
    x: Math.round(Math.min(startWorld.x, endWorld.x)),
    y: Math.round(Math.min(startWorld.y, endWorld.y)),
    width: Math.max(16, Math.round(dx)),
    height: Math.max(16, Math.round(dy)),
  };
}
