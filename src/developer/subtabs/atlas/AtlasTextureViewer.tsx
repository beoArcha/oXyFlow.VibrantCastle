import React from "react";
import {
  MousePointer,
  Hand,
  Pipette,
  ListOrdered,
  Grid3X3,
  Layers,
  Frame,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Card, CardHeader, CardContent, Button, Badge, Text, Code } from "@ui";
import type { ResolvedFrameRect } from "@game/engine/meta/types";
import type { CursorCoords, ToolMode } from "./types";

export interface AtlasTextureViewerProps {
  readonly sheetCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly toolMode: ToolMode;
  readonly onToolModeChange: (mode: ToolMode) => void;
  readonly inspectorOpen: boolean;
  readonly onToggleInspector: () => void;
  readonly showGrid: boolean;
  readonly onToggleGrid: () => void;
  readonly showTracks: boolean;
  readonly onToggleTracks: () => void;
  readonly showMargins: boolean;
  readonly onToggleMargins: () => void;
  readonly showFrames: boolean;
  readonly onToggleFrames: () => void;
  readonly showChromaPreview: boolean;
  readonly onToggleChromaPreview: () => void;
  readonly frameCount: number;
  readonly zoom: number;
  readonly onFitCanvas: () => void;
  readonly onResetZoom: () => void;
  readonly onZoomOut: () => void;
  readonly onZoomIn: () => void;
  readonly onCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  readonly onCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  readonly onStopPanning: () => void;
  readonly textureW: number;
  readonly textureH: number;
  readonly cursorCoords: CursorCoords | null;
  readonly selectedFrameObj: ResolvedFrameRect | null;
}

/**
 * Interactive spritesheet canvas viewport with tool modes, overlay toggles, zoom controls, and telemetry.
 */
export const AtlasTextureViewer: React.FC<AtlasTextureViewerProps> = ({
  sheetCanvasRef,
  toolMode,
  onToolModeChange,
  inspectorOpen,
  onToggleInspector,
  showGrid,
  onToggleGrid,
  showTracks,
  onToggleTracks,
  showMargins,
  onToggleMargins,
  showFrames,
  onToggleFrames,
  showChromaPreview,
  onToggleChromaPreview,
  frameCount,
  zoom,
  onFitCanvas,
  onResetZoom,
  onZoomOut,
  onZoomIn,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onStopPanning,
  textureW,
  textureH,
  cursorCoords,
  selectedFrameObj,
}) => (
  <Card
    variant="subtle"
    className={inspectorOpen ? "xl:col-span-7 flex flex-col" : "xl:col-span-12 flex flex-col"}
  >
    <CardHeader className="pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={toolMode === "select" ? "primary" : "secondary"}
            icon={<MousePointer size={13} />}
            onClick={() => onToolModeChange("select")}
            className="whitespace-nowrap shrink-0 px-3"
          >
            Wybierz
          </Button>
          <Button
            size="sm"
            variant={toolMode === "pan" ? "primary" : "secondary"}
            icon={<Hand size={13} />}
            onClick={() => onToolModeChange("pan")}
            className="whitespace-nowrap shrink-0 px-3"
          >
            Przesuń
          </Button>
          <Button
            size="sm"
            variant={toolMode === "eyedropper" ? "primary" : "secondary"}
            icon={<Pipette size={13} />}
            onClick={() => onToolModeChange("eyedropper")}
            className="whitespace-nowrap shrink-0 px-3"
          >
            Pipeta
          </Button>
          <Button
            size="sm"
            variant={toolMode === "sequence" ? "primary" : "secondary"}
            icon={<ListOrdered size={13} />}
            onClick={() => onToolModeChange("sequence")}
            className="whitespace-nowrap shrink-0 px-3"
          >
            Sekwencja
          </Button>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={
            inspectorOpen ? (
              <PanelRightClose size={13} />
            ) : (
              <PanelRightOpen size={13} />
            )
          }
          onClick={onToggleInspector}
          className="whitespace-nowrap shrink-0 px-3"
        >
          {inspectorOpen ? "Ukryj Inspektor" : "Pokaż Inspektor"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={showGrid ? "primary" : "ghost"}
            icon={<Grid3X3 size={12} />}
            onClick={onToggleGrid}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Siatka
          </Button>
          <Button
            size="sm"
            variant={showTracks ? "primary" : "ghost"}
            icon={<Layers size={12} />}
            onClick={onToggleTracks}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Ścieżki
          </Button>
          <Button
            size="sm"
            variant={showMargins ? "primary" : "ghost"}
            icon={<Frame size={12} />}
            onClick={onToggleMargins}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Marginesy
          </Button>
          <Button
            size="sm"
            variant={showFrames ? "primary" : "ghost"}
            onClick={onToggleFrames}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Ramki ({frameCount})
          </Button>
          <Button
            size="sm"
            variant={showChromaPreview ? "primary" : "ghost"}
            icon={<Sparkles size={12} />}
            onClick={onToggleChromaPreview}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Chroma
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Maximize2 size={12} />}
            onClick={onFitCanvas}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            Dopasuj
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetZoom}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            1×
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<ZoomOut size={12} />}
            onClick={onZoomOut}
            className="whitespace-nowrap shrink-0 px-2"
            aria-label="Oddal"
          />
          <Code size="xs" className="tabular-nums">
            {Math.round(zoom * 100)}%
          </Code>
          <Button
            size="sm"
            variant="ghost"
            icon={<ZoomIn size={12} />}
            onClick={onZoomIn}
            className="whitespace-nowrap shrink-0 px-2"
            aria-label="Przybliż"
          />
        </div>
      </div>
    </CardHeader>

    <CardContent className="flex flex-col gap-2">
      <div className="rounded-xl border border-stone-800 bg-black/70 overflow-hidden relative">
        <canvas
          ref={sheetCanvasRef}
          width={760}
          height={420}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onStopPanning}
          onMouseLeave={onStopPanning}
          className="w-full h-[380px] block cursor-crosshair select-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <Text size="2xs" variant="muted">
            Tekstura: {textureW}×{textureH}px
          </Text>
          {cursorCoords && (
            <Text size="2xs" variant="muted">
              Kursor: ({cursorCoords.x}, {cursorCoords.y}) • Kol {cursorCoords.col}, Wiersz{" "}
              {cursorCoords.row}
            </Text>
          )}
        </div>
        {selectedFrameObj && (
          <Badge variant="amber">
            {selectedFrameObj.id}: {Math.round(selectedFrameObj.x)},
            {Math.round(selectedFrameObj.y)} ({Math.round(selectedFrameObj.width)}×
            {Math.round(selectedFrameObj.height)})
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);
