import React from "react";
import { Activity, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import { Badge } from "@ui";
import { useI18n } from "@context/I18nContext";
import { GameBaseError } from "@lib/errors";

export interface AtlasStatusBarMetricsProps {
  assetId: string;
  assetName: string;
  category: string;
  slicingMethod: string;
  frameCount: number;
  textureWidth?: number;
  textureHeight?: number;
  durationMs?: number;
  error: GameBaseError | null;
}

export const AtlasStatusBarMetrics: React.FC<AtlasStatusBarMetricsProps> = ({
  assetId,
  assetName,
  category,
  slicingMethod,
  frameCount,
  textureWidth,
  textureHeight,
  durationMs,
  error,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Health Status Indicator */}
      {error ? (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-700/80 text-rose-300 font-semibold animate-pulse">
          <AlertCircle size={13} className="text-red-400" />
          <span>{t("atlasStudioStatusError") || "Error"}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-semibold">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>{t("atlasStudioStatusReady") || "Ready"}</span>
        </div>
      )}

      {/* Asset Info */}
      <div className="flex items-center gap-1.5 text-stone-300">
        <span className="font-bold text-amber-200">{assetName}</span>
        <span className="text-[10px] font-mono text-stone-500">[{assetId}]</span>
        <Badge variant="stone" className="text-[9px] px-1 py-0 uppercase">
          {category}
        </Badge>
      </div>

      <span className="text-stone-700">|</span>

      {/* Slicing Metrics */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
          <Layers size={11} className="text-amber-400" />
          <strong className="text-amber-300">{slicingMethod}</strong>
        </span>

        <span className="text-[11px] text-stone-400">
          <strong className="text-emerald-400">{frameCount}</strong>{" "}
          {t("atlasStudioFrameInfo") || "frames"}
        </span>

        {textureWidth && textureHeight && (
          <span className="text-[11px] text-stone-500 font-mono">
            ({textureWidth}×{textureHeight}px)
          </span>
        )}

        {durationMs !== undefined && (
          <span className="text-[10px] text-stone-500 flex items-center gap-1">
            <Activity size={10} className="text-cyan-400" />
            {durationMs.toFixed(2)}ms
          </span>
        )}
      </div>
    </div>
  );
};
