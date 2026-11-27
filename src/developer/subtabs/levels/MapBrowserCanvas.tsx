import React, { useEffect, useRef, useState } from "react";
import { LocationDefinition } from "@game/locations/types";
import {
  hitTestMapEntity,
  type LeverGateLink,
  type MapEntityCategory,
  type MapEntityItem,
} from "./mapEntities";
import {
  renderMapBrowserCanvas,
  type MapCaptionOverlay,
} from "./mapCanvasRenderer";
import {
  normalizeDragRect,
  panViewport,
  screenToWorld,
  zoomAroundPoint,
  type Point2D,
  type Rect2D,
  type ViewportTransform,
} from "./mapViewport";

export type MapToolMode = "inspect" | "pan" | "text";

export interface MapBrowserCanvasProps {
  readonly location: LocationDefinition;
  readonly viewport: ViewportTransform;
  readonly onViewportChange: (next: ViewportTransform) => void;
  readonly toolMode: MapToolMode;
  readonly entities: readonly MapEntityItem[];
  readonly leverGateLinks: readonly LeverGateLink[];
  readonly visibleCategories: ReadonlySet<MapEntityCategory>;
  readonly selectedUid: string | null;
  readonly captions: readonly MapCaptionOverlay[];
  readonly showCaptions: boolean;
  readonly canvasSize: { readonly width: number; readonly height: number };
  readonly onSelectEntity: (entity: MapEntityItem | null) => void;
  readonly onCreateTriggerArea: (rect: Rect2D) => void;
  readonly onCursorWorldMove?: (point: Point2D | null) => void;
}

type PointerDragState =
  | { readonly kind: "pan"; readonly lastX: number; readonly lastY: number }
  | {
      readonly kind: "maybe-pan";
      readonly startX: number;
      readonly startY: number;
      readonly lastX: number;
      readonly lastY: number;
    }
  | {
      readonly kind: "text-drag";
      readonly startWorld: Point2D;
      readonly currentWorld: Point2D;
    };

export const MapBrowserCanvas: React.FC<MapBrowserCanvasProps> = ({
  location,
  viewport,
  onViewportChange,
  toolMode,
  entities,
  leverGateLinks,
  visibleCategories,
  selectedUid,
  captions,
  showCaptions,
  canvasSize,
  onSelectEntity,
  onCreateTriggerArea,
  onCursorWorldMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [dragState, setDragState] = useState<PointerDragState | null>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const getLocalCoords = (clientX: number, clientY: number): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvasSize.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvasSize.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? canvasSize.width / rect.width : 1;
      const scaleY = rect.height > 0 ? canvasSize.height / rect.height : 1;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const current = viewportRef.current;
      onViewportChange(zoomAroundPoint(current, current.zoom * factor, sx, sy));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasSize.width, canvasSize.height, onViewportChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dragRect =
      dragState?.kind === "text-drag"
        ? normalizeDragRect(dragState.startWorld, dragState.currentWorld)
        : null;

    renderMapBrowserCanvas(ctx, {
      location,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      viewport,
      entities,
      leverGateLinks,
      visibleCategories,
      selectedUid,
      hoveredUid,
      dragRect,
      captions,
      showCaptions,
    });
  }, [
    location,
    canvasSize.width,
    canvasSize.height,
    viewport,
    entities,
    leverGateLinks,
    visibleCategories,
    selectedUid,
    hoveredUid,
    dragState,
    captions,
    showCaptions,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const local = getLocalCoords(e.clientX, e.clientY);
    if (toolMode === "pan" || e.button === 1 || e.altKey) {
      setDragState({ kind: "pan", lastX: local.x, lastY: local.y });
      return;
    }
    if (toolMode === "inspect") {
      setDragState({
        kind: "maybe-pan",
        startX: local.x,
        startY: local.y,
        lastX: local.x,
        lastY: local.y,
      });
      return;
    }
    const world = screenToWorld(local.x, local.y, viewport);
    setDragState({ kind: "text-drag", startWorld: world, currentWorld: world });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const local = getLocalCoords(e.clientX, e.clientY);
    const world = screenToWorld(local.x, local.y, viewport);
    onCursorWorldMove?.({ x: Math.round(world.x), y: Math.round(world.y) });

    if (!dragState) {
      const hit = hitTestMapEntity(entities, world.x, world.y, visibleCategories);
      setHoveredUid(hit ? hit.uid : null);
      return;
    }

    if (dragState.kind === "pan") {
      onViewportChange(panViewport(viewport, local.x - dragState.lastX, local.y - dragState.lastY));
      setDragState({ kind: "pan", lastX: local.x, lastY: local.y });
      return;
    }

    if (dragState.kind === "maybe-pan") {
      const moved = Math.hypot(local.x - dragState.startX, local.y - dragState.startY);
      if (moved > 4) {
        onViewportChange(panViewport(viewport, local.x - dragState.lastX, local.y - dragState.lastY));
        setDragState({ kind: "pan", lastX: local.x, lastY: local.y });
      }
      return;
    }

    setDragState({ ...dragState, currentWorld: world });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState) return;
    const local = getLocalCoords(e.clientX, e.clientY);
    const world = screenToWorld(local.x, local.y, viewport);

    if (dragState.kind === "maybe-pan") {
      const hit = hitTestMapEntity(entities, world.x, world.y, visibleCategories);
      onSelectEntity(hit);
    } else if (dragState.kind === "text-drag") {
      const dx = Math.abs(world.x - dragState.startWorld.x);
      const dy = Math.abs(world.y - dragState.startWorld.y);
      if (dx < 8 && dy < 8) {
        const hit = hitTestMapEntity(entities, world.x, world.y, visibleCategories);
        if (hit && (hit.category === "trigger" || hit.category === "portal" || Boolean(hit.textKey))) {
          onSelectEntity(hit);
          setDragState(null);
          return;
        }
      }
      onCreateTriggerArea(normalizeDragRect(dragState.startWorld, world));
    }
    setDragState(null);
  };

  const cursorClass =
    toolMode === "pan" || dragState?.kind === "pan"
      ? "cursor-grab active:cursor-grabbing"
      : toolMode === "text"
        ? "cursor-crosshair"
        : "cursor-pointer";

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-stone-800 bg-black">
      <canvas
        ref={canvasRef}
        data-testid="map-browser-canvas"
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredUid(null);
          onCursorWorldMove?.(null);
          if (dragState && dragState.kind !== "text-drag") setDragState(null);
        }}
        className={`w-full h-auto block select-none ${cursorClass}`}
      />
    </div>
  );
};

MapBrowserCanvas.displayName = "MapBrowserCanvas";
export default MapBrowserCanvas;
