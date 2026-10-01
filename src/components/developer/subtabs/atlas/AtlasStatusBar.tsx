import React, { useState } from "react";
import { ScrollText, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useThrottledLogs } from "../../hooks/useThrottledLogs";
import { GameBaseError } from "@lib/errors";
import {
  AtlasStatusBarMetrics,
  AtlasStatusBarErrorBanner,
  AtlasStatusBarLogDrawer,
} from "./status";

const ATLAS_LOG_CATEGORIES = ["AtlasStudio", "AtlasSlicing"];

export interface AtlasStatusBarProps {
  assetId: string;
  assetName: string;
  category: string;
  slicingMethod: string;
  frameCount: number;
  textureWidth?: number;
  textureHeight?: number;
  durationMs?: number;
  error: GameBaseError | null;
  onClearError?: () => void;
  onNavigateToLogs?: () => void;
}

/**
 * AtlasStatusBar Component.
 * Displays studio health, asset metadata, slicing metrics, error banners, and event logs.
 * Decomposed into focused presentational components under status/.
 */
export const AtlasStatusBar: React.FC<AtlasStatusBarProps> = ({
  assetId,
  assetName,
  category,
  slicingMethod,
  frameCount,
  textureWidth,
  textureHeight,
  durationMs,
  error,
  onClearError,
  onNavigateToLogs,
}) => {
  const { t } = useI18n();
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Throttled log subscription filtered for AtlasStudio & AtlasSlicing (AGENT.md § 3.3)
  const { logs: atlasLogs } = useThrottledLogs({
    throttleMs: 200,
    categories: ATLAS_LOG_CATEGORIES,
  });

  return (
    <div className="flex flex-col border border-stone-800 bg-[#0d0705] rounded-xl overflow-hidden shadow-lg shadow-black/60 transition-all select-none">
      {/* 1. Main Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs bg-[#120704]">
        {/* Left: System Status & Metrics */}
        <AtlasStatusBarMetrics
          assetId={assetId}
          assetName={assetName}
          category={category}
          slicingMethod={slicingMethod}
          frameCount={frameCount}
          textureWidth={textureWidth}
          textureHeight={textureHeight}
          durationMs={durationMs}
          error={error}
        />

        {/* Right: Error Dismissal & Logs Drawer Button */}
        <div className="flex items-center gap-2">
          {error && onClearError && (
            <button
              onClick={onClearError}
              className="text-[11px] text-red-400 hover:text-red-200 underline cursor-pointer"
            >
              {t("atlasStudioDismissError") || "Dismiss error"}
            </button>
          )}

          <Button
            size="sm"
            variant={isLogsOpen ? "primary" : "secondary"}
            onClick={() => setIsLogsOpen((prev) => !prev)}
            className="h-6 px-2 text-[11px] flex items-center gap-1.5"
            title={t("atlasStudioToggleLogs") || "Slicer event log"}
          >
            <ScrollText size={12} />
            <span>{t("atlasStudioLogs") || "Logs"}</span>
            <span className="px-1 py-0 bg-black/60 rounded text-[9px] text-amber-300 font-mono">
              {atlasLogs.length}
            </span>
            {isLogsOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </Button>
        </div>
      </div>

      {/* 2. Error Message Banner (if error present) */}
      {error && (
        <AtlasStatusBarErrorBanner error={error} onClearError={onClearError} />
      )}

      {/* 3. Expandable Mini Log Drawer */}
      {isLogsOpen && (
        <AtlasStatusBarLogDrawer
          logs={atlasLogs}
          onNavigateToLogs={onNavigateToLogs}
        />
      )}
    </div>
  );
};

export default AtlasStatusBar;
