import React from "react";
import { Activity, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import { Badge, Text } from "@ui";
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
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-700/80 text-rose-300 animate-pulse">
          <AlertCircle size={13} className="text-red-400" />
          <Text as="span" weight="semibold">{t("atlasStudioStatusError") || "Error"}</Text>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <Text as="span" weight="semibold">{t("atlasStudioStatusReady") || "Ready"}</Text>
        </div>
      )}

      {/* Asset Info */}
      <div className="flex items-center gap-1.5 text-stone-300">
        <Text as="span" weight="bold" className="text-amber-200">{assetName}</Text>
        <Text as="span" family="mono" size="3xs" className="text-stone-500">[{assetId}]</Text>
        <Badge variant="stone" className="text-[9px] px-1 py-0 uppercase">
          {category}
        </Badge>
      </div>

      <span className="text-stone-700">|</span>

      {/* Slicing Metrics */}
      <div className="flex items-center gap-2">
        <Text as="span" family="mono" size="2xs" className="flex items-center gap-1 text-stone-400">
          <Layers size={11} className="text-amber-400" />
          <strong className="text-amber-300">{slicingMethod}</strong>
        </Text>

        <span className="text-[11px] text-stone-400">
          <strong className="text-emerald-400">{frameCount}</strong>{" "}
          {t("atlasStudioFrameInfo") || "frames"}
        </span>

        {textureWidth && textureHeight && (
          <Text as="span" family="mono" size="2xs" className="text-stone-500">
            ({textureWidth}×{textureHeight}px)
          </Text>
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
