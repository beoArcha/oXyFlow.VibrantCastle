import React from "react";
import { useI18n } from "@context/I18nContext";
import { AtlasGridConfig } from "../types";

export interface AtlasViewerStatusBarProps {
  hoverInfo: {
    x: number;
    y: number;
    col: number;
    row: number;
    hex?: string;
  } | null;
  gridConfig?: AtlasGridConfig;
  frameCount: number;
}

export const AtlasViewerStatusBar: React.FC<AtlasViewerStatusBarProps> = ({
  hoverInfo,
  gridConfig,
  frameCount,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#120603] rounded border border-stone-800 text-[11px] font-mono text-stone-400">
      <div className="flex items-center gap-4">
        {hoverInfo ? (
          <span className="flex items-center gap-2">
            <span>
              {t("atlasStudioCursorX")} <strong className="text-amber-300">{hoverInfo.x}</strong> {t("atlasStudioCursorY")}{" "}
              <strong className="text-amber-300">{hoverInfo.y}</strong> | {t("atlasStudioCursorCol")}{" "}
              <strong className="text-cyan-300">{hoverInfo.col}</strong> {t("atlasStudioCursorRow")}{" "}
              <strong className="text-cyan-300">{hoverInfo.row}</strong>
            </span>
            {hoverInfo.hex && (
              <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/60 border border-stone-800">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/40"
                  style={{ backgroundColor: hoverInfo.hex }}
                />
                <strong className="text-stone-200">{hoverInfo.hex}</strong>
              </span>
            )}
          </span>
        ) : (
          <span>{t("atlasStudioHoverCoords")}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {gridConfig && (
          <>
            <span>
              {t("atlasStudioCellPrefix")}{" "}
              <strong className="text-amber-300">{gridConfig.cellWidth}</strong> ×{" "}
              <strong className="text-amber-300">{gridConfig.cellHeight}</strong>px
            </span>
            <span>
              {t("atlasStudioSafeMargin")}:{" "}
              <strong className="text-sky-300">{gridConfig.safeMargin}</strong>px
            </span>
          </>
        )}
        {frameCount > 0 && (
          <span>
            {t("atlasStudioFrameInfo")}: <strong className="text-emerald-400">{frameCount}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default AtlasViewerStatusBar;
