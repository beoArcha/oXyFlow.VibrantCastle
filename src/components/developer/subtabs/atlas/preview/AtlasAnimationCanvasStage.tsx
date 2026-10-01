import React from "react";
import { useI18n } from "@context/I18nContext";
import { PreviewBackground } from "./types";

export interface AtlasAnimationCanvasStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  bgMode: PreviewBackground;
  setBgMode: (mode: PreviewBackground) => void;
  showPivot: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
}

export const AtlasAnimationCanvasStage: React.FC<AtlasAnimationCanvasStageProps> = React.memo(({
  canvasRef,
  bgMode,
  setBgMode,
  showPivot,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  const { t } = useI18n();

  return (
    <div
      className={`relative min-h-[220px] max-h-[280px] overflow-hidden rounded-xl border border-stone-800 flex items-center justify-center p-4 transition-colors select-none ${
        bgMode === "dark"
          ? "bg-[#0c0a09]"
          : bgMode === "castle"
            ? "bg-[#180a06]"
            : bgMode === "white"
              ? "bg-stone-200"
              : "bg-[#100b08]"
      }`}
      style={
        bgMode === "checker"
          ? {
              backgroundImage:
                "linear-gradient(45deg, #180d08 25%, transparent 25%), linear-gradient(-45deg, #180d08 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #180d08 75%), linear-gradient(-45deg, transparent 75%, #180d08 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className={`shadow-2xl rounded border border-black/40 filter drop-shadow-md select-none ${
          showPivot ? "cursor-crosshair" : ""
        }`}
        title={showPivot ? t("atlasStudioPivotDragTooltip") : undefined}
      />

      {/* Background Switcher Floating Pill */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 p-1 rounded-lg border border-stone-800 text-[10px]">
        {(["checker", "dark", "castle", "white"] as PreviewBackground[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setBgMode(mode)}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              bgMode === mode
                ? "bg-amber-600 text-white font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {mode === "checker"
              ? t("atlasStudioBgChecker")
              : mode === "dark"
                ? t("atlasStudioBgDark")
                : mode === "castle"
                  ? t("atlasStudioBgCastle")
                  : t("atlasStudioBgWhite")}
          </button>
        ))}
      </div>
    </div>
  );
});

AtlasAnimationCanvasStage.displayName = "AtlasAnimationCanvasStage";
