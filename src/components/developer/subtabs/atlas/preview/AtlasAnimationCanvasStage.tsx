import React from "react";
import { SegmentedControl } from "@components/ui";
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
      className={`relative min-h-[240px] max-h-[300px] overflow-hidden rounded-xl border border-stone-800 flex items-center justify-center p-2 transition-colors select-none ${
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
        style={{ imageRendering: "pixelated" }}
        className={`shadow-2xl rounded border border-black/40 filter drop-shadow-md select-none max-w-full max-h-full ${
          showPivot ? "cursor-crosshair" : ""
        }`}
        title={showPivot ? t("atlasStudioPivotDragTooltip") : undefined}
      />

      {/* Background Switcher Floating Pill */}
      <div className="absolute top-2 right-2">
        <SegmentedControl<PreviewBackground>
          options={[
            { value: "checker", label: t("atlasStudioBgChecker") },
            { value: "dark", label: t("atlasStudioBgDark") },
            { value: "castle", label: t("atlasStudioBgCastle") },
            { value: "white", label: t("atlasStudioBgWhite") },
          ]}
          value={bgMode}
          onChange={setBgMode}
          size="sm"
        />
      </div>
    </div>
  );
});

AtlasAnimationCanvasStage.displayName = "AtlasAnimationCanvasStage";
