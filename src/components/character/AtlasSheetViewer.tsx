import React, { useState, useEffect, useRef } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName } from "@game/engine/spriteTypes";
import { assetLoader } from "@game/engine/assetLoader";
import { cn } from "@lib/utils";
import { Grid, ZoomIn, ZoomOut, Layers, Check, Image as ImageIcon } from "lucide-react";
import { useI18n } from "@hooks/useI18n";

export interface AtlasSheetViewerProps {
  characterId: "valen" | "aurelia";
  quality: AssetQuality;
  activeAnimation?: AnimationName;
  className?: string;
}

const ANIMATION_ROW_MAP: Record<AnimationName, number> = {
  idle: 0,
  run: 1,
  move: 1,
  jump: 2,
  fall: 3,
  attack: 4,
  dash: 5,
  cast: 6,
  crouch: 7,
};

const ROW_ANIMATION_KEYS: Array<{ row: number; name: AnimationName; labelKey: string }> = [
  { row: 0, name: "idle", labelKey: "animIdle" },
  { row: 1, name: "run", labelKey: "animRun" },
  { row: 2, name: "jump", labelKey: "animJump" },
  { row: 3, name: "fall", labelKey: "animFall" },
  { row: 4, name: "attack", labelKey: "animAttack" },
  { row: 5, name: "dash", labelKey: "animDash" },
  { row: 6, name: "cast", labelKey: "animCast" },
  { row: 7, name: "crouch", labelKey: "animCrouch" },
];

export const AtlasSheetViewer: React.FC<AtlasSheetViewerProps> = React.memo(({
  characterId,
  quality,
  activeAnimation = "idle",
  className = "",
}) => {
  const { t } = useI18n();
  const [sheetType, setSheetType] = useState<"spritesheet" | "portraits">("spritesheet");
  const [zoom, setZoom] = useState<number>(0.75); // 0.75x default fits nicely
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resolve texture URL from assetLoader and manifest
  const manifest = assetLoader.getCharacterManifest(characterId);
  const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality);

  const spritesheetUrl = spriteMap?.meta.imageUrl || "";
  const portraitsUrl = manifest?.portraitsGridUrl || "";

  const activeUrl = sheetType === "spritesheet" ? spritesheetUrl : portraitsUrl;

  useEffect(() => {
    if (!activeUrl) return;
    const img = new Image();
    img.src = activeUrl;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [activeUrl]);

  const activeRow = ANIMATION_ROW_MAP[activeAnimation] ?? 0;
  const columns = 12;
  const rows = 8;
  const cellWidth = imageDimensions.width > 0 ? imageDimensions.width / columns : 128;
  const cellHeight = imageDimensions.height > 0 ? imageDimensions.height / rows : 128;

  return (
    <div className={cn("flex flex-col gap-2.5 bg-[#0e0402] p-3 rounded-xl border border-amber-900/40", className)}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
        {/* Sheet Category Toggle */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-stone-800">
          <button
            type="button"
            onClick={() => setSheetType("spritesheet")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              sheetType === "spritesheet"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Layers size={13} />
            <span>{t("atlasSheetTab")}</span>
          </button>
          <button
            type="button"
            onClick={() => setSheetType("portraits")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              sheetType === "portraits"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <ImageIcon size={13} />
            <span>{t("atlasPortraitsTab")}</span>
          </button>
        </div>

        {/* View Controls: Zoom + Grid + Labels */}
        <div className="flex items-center gap-2">
          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className={cn(
              "p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1",
              showGrid
                ? "bg-amber-950/70 border-amber-500 text-amber-300"
                : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
            )}
            title={t("atlasToggleGrid")}
          >
            <Grid size={13} />
            <span className="text-[10px] hidden sm:inline">Grid</span>
          </button>

          {/* Row Labels Toggle (only for spritesheet) */}
          {sheetType === "spritesheet" && (
            <button
              type="button"
              onClick={() => setShowLabels((l) => !l)}
              className={cn(
                "p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1",
                showLabels
                  ? "bg-amber-950/70 border-amber-500 text-amber-300"
                  : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
              )}
              title={t("atlasToggleRows")}
            >
              <span className="text-[10px]">Rows</span>
            </button>
          )}

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-black/60 px-1.5 py-1 rounded-lg border border-stone-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.15))}
              className="text-stone-400 hover:text-stone-200 p-0.5 cursor-pointer"
              title={t("atlasZoomOut")}
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono font-bold text-amber-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
              className="text-stone-400 hover:text-stone-200 p-0.5 cursor-pointer"
              title={t("atlasZoomIn")}
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(0.75)}
              className="px-1 text-[9px] font-mono text-stone-400 hover:text-amber-300 cursor-pointer border-l border-stone-800 ml-0.5"
              title={t("atlasResetZoom")}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Atlas Texture Container with Custom Gothic Scrollbar */}
      <div
        ref={scrollContainerRef}
        className="w-full max-h-[380px] sm:max-h-[440px] overflow-auto custom-scrollbar rounded-lg bg-[#060201] border border-stone-900 relative p-4 flex items-center justify-center min-h-[260px]"
      >
        {activeUrl ? (
          <div
            className="relative transition-all duration-150 select-none"
            style={{
              width: imageDimensions.width > 0 ? `${imageDimensions.width * zoom}px` : "auto",
              height: imageDimensions.height > 0 ? `${imageDimensions.height * zoom}px` : "auto",
            }}
          >
            {/* The Raw Texture Image */}
            <img
              src={activeUrl}
              alt="Character Sprite Atlas"
              className="w-full h-full block image-rendering-pixelated pointer-events-none drop-shadow-md"
              style={{
                imageRendering: "pixelated",
              }}
            />

            {/* Grid Overlay for Spritesheet */}
            {sheetType === "spritesheet" && showGrid && imageDimensions.width > 0 && (
              <div
                className="absolute inset-0 pointer-events-none border border-amber-500/40"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: rows * columns }).map((_, idx) => {
                  const r = Math.floor(idx / columns);
                  const c = idx % columns;
                  const isActiveAnimationRow = r === activeRow;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "border border-amber-500/20 relative transition-colors",
                        isActiveAnimationRow && "bg-amber-500/10 border-amber-400/50"
                      )}
                    >
                      {/* Cell Coordinate stamp on hover */}
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-stone-500/60 leading-none">
                        {r},{c}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Row Highlight Band for active animation */}
            {sheetType === "spritesheet" && imageDimensions.height > 0 && (
              <div
                className="absolute left-0 right-0 border-2 border-amber-400 pointer-events-none transition-all duration-200 shadow-md"
                style={{
                  top: `${activeRow * cellHeight * zoom}px`,
                  height: `${cellHeight * zoom}px`,
                  backgroundColor: "rgba(217, 119, 6, 0.12)",
                }}
              >
                <div className="absolute top-1 left-1.5 bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <Check size={10} />
                  <span>{ROW_ANIMATION_KEYS[activeRow]?.name.toUpperCase()} (ROW {activeRow})</span>
                </div>
              </div>
            )}

            {/* Side Row Labels overlay */}
            {sheetType === "spritesheet" && showLabels && imageDimensions.height > 0 && (
              <div
                className="absolute -left-28 top-0 bottom-0 flex flex-col pointer-events-none"
                style={{ width: "105px" }}
              >
                {ROW_ANIMATION_KEYS.map((item) => (
                  <div
                    key={item.row}
                    className="flex items-center justify-end pr-2"
                    style={{ height: `${cellHeight * zoom}px` }}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded transition-colors whitespace-nowrap",
                        item.row === activeRow
                          ? "bg-amber-600 text-white font-bold shadow-xs"
                          : "text-stone-400 bg-black/70 border border-stone-800"
                      )}
                    >
                      {item.row === activeRow ? "▶ " : ""}
                      {t(item.labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 text-stone-500 text-xs">
            {t("atlasLoading")}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-stone-400 font-mono border-t border-stone-800/80 pt-2">
        <div className="flex items-center gap-3">
          <span>
            {t("atlasDimensions")}{" "}
            <strong className="text-amber-300">
              {imageDimensions.width} × {imageDimensions.height} px
            </strong>
          </span>
          <span>•</span>
          <span>
            {t("atlasCellSize")}{" "}
            <strong className="text-amber-300">
              {Math.round(cellWidth)} × {Math.round(cellHeight)} px
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-500">
            {columns * rows} {t("atlasGridFrames")} (12×8)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
            {quality.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
});

export default AtlasSheetViewer;
