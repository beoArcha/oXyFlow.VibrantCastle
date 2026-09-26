import React, { useState, useEffect } from "react";
import {
  Activity,
  ScrollText,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Trash2,
  ExternalLink,
  Layers,
  X,
} from "lucide-react";
import { Badge, Button } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import { LoggerManager, LogRecord, LogLevel } from "../../../../lib/logger";
import { GameBaseError } from "../../../../lib/errors";

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
  const [atlasLogs, setAtlasLogs] = useState<LogRecord[]>([]);

  // Update logs from RingBuffer filtered for AtlasStudio & AtlasSlicing
  useEffect(() => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;

    const filterAtlasLogs = () => {
      const all = ringBuffer.getLogs();
      const filtered = all.filter(
        (r) => r.category === "AtlasStudio" || r.category === "AtlasSlicing"
      );
      setAtlasLogs(filtered);
    };

    filterAtlasLogs();
    return ringBuffer.subscribe(filterAtlasLogs);
  }, []);

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return <Badge variant="red" className="text-[9px] px-1 py-0">ERROR</Badge>;
      case LogLevel.WARN:
        return <Badge variant="amber" className="text-[9px] px-1 py-0">WARN</Badge>;
      case LogLevel.INFO:
        return <Badge variant="cyan" className="text-[9px] px-1 py-0">INFO</Badge>;
      default:
        return <Badge variant="stone" className="text-[9px] px-1 py-0">DEBUG</Badge>;
    }
  };

  return (
    <div className="flex flex-col border border-stone-800 bg-[#0d0705] rounded-xl overflow-hidden shadow-lg shadow-black/60 transition-all select-none">
      {/* 1. Main Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs bg-[#120704]">
        {/* Left: System Status & Metrics */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Health Status Indicator */}
          {error ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-700/80 text-rose-300 font-semibold animate-pulse">
              <AlertCircle size={13} className="text-red-400" />
              <span>{t("atlasStudioStatusError") || "Błąd"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-semibold">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>{t("atlasStudioStatusReady") || "Gotowy"}</span>
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
              {t("atlasStudioFrameInfo") || "klatek"}
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

        {/* Right: Error Dismissal & Logs Drawer Button */}
        <div className="flex items-center gap-2">
          {error && onClearError && (
            <button
              onClick={onClearError}
              className="text-[11px] text-red-400 hover:text-red-200 underline cursor-pointer"
            >
              {t("atlasStudioDismissError") || "Zamknij błąd"}
            </button>
          )}

          <Button
            size="sm"
            variant={isLogsOpen ? "primary" : "secondary"}
            onClick={() => setIsLogsOpen((prev) => !prev)}
            className="h-6 px-2 text-[11px] flex items-center gap-1.5"
            title={t("atlasStudioToggleLogs") || "Podgląd logów slicera"}
          >
            <ScrollText size={12} />
            <span>{t("atlasStudioLogs") || "Dziennik"}</span>
            <span className="px-1 py-0 bg-black/60 rounded text-[9px] text-amber-300 font-mono">
              {atlasLogs.length}
            </span>
            {isLogsOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </Button>
        </div>
      </div>

      {/* 2. Error Message Banner (if error present) */}
      {error && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/80 border-t border-red-800 text-xs text-rose-200">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="red" className="text-[9px] uppercase font-mono">
              {error.code}
            </Badge>
            <span className="truncate font-semibold">{error.message}</span>
            {error.details && (
              <span className="text-[10px] text-rose-400/80 font-mono truncate">
                {JSON.stringify(error.details)}
              </span>
            )}
          </div>
          {onClearError && (
            <button onClick={onClearError} className="text-rose-400 hover:text-rose-100 p-0.5">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* 3. Expandable Mini Log Drawer */}
      {isLogsOpen && (
        <div className="flex flex-col border-t border-stone-800 bg-black/90 p-2.5 max-h-[160px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800/80 text-[11px]">
            <span className="text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} className="text-amber-400" />
              {t("atlasStudioRecentLogs") || "Ostatnie zdarzenia slicera"}
            </span>

            <div className="flex items-center gap-2">
              {onNavigateToLogs && (
                <button
                  onClick={onNavigateToLogs}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
                >
                  <ExternalLink size={10} />
                  <span>{t("atlasStudioOpenLogsTab") || "Pełny podgląd (Logs)"}</span>
                </button>
              )}
            </div>
          </div>

          {atlasLogs.length === 0 ? (
            <div className="py-4 text-center text-xs text-stone-600">
              {t("atlasStudioNoLogsYet") || "Brak zarejestrowanych zdarzeń slicera."}
            </div>
          ) : (
            <div className="flex flex-col gap-1 font-mono text-[10px]">
              {atlasLogs.slice(-10).reverse().map((entry, idx) => (
                <div
                  key={`${entry.timestamp}_${idx}`}
                  className="flex items-center justify-between p-1 rounded bg-[#100705] border border-stone-900 hover:border-stone-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-stone-600">{entry.timeFormatted}</span>
                    {getLevelBadge(entry.level)}
                    <span className="text-amber-400/90 font-bold">[{entry.category}]</span>
                    <span className="text-stone-300 truncate">{entry.message}</span>
                  </div>
                  {entry.context && (
                    <span className="text-[9px] text-stone-500 truncate max-w-[150px] ml-2">
                      {JSON.stringify(entry.context)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
