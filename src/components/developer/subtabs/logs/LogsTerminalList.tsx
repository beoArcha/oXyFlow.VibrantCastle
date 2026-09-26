import React from "react";
import { ListFilter, ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "../../../../hooks/useI18n";
import { LogRecord, LogLevel } from "../../../../lib/logger";
import { LogItemDrawer } from "./LogItemDrawer";

export interface LogsTerminalListProps {
  logs: LogRecord[];
  expandedLogIds: Set<string>;
  onToggleExpand: (id: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  hasSearchQuery: boolean;
}

const getLevelBadgeClass = (level: LogLevel) => {
  switch (level) {
    case LogLevel.FATAL:
      return "bg-red-600 text-white border-red-400 font-black animate-pulse shadow-red-900/50 shadow-sm";
    case LogLevel.ERROR:
      return "bg-rose-950/90 text-rose-300 border-rose-700 font-bold";
    case LogLevel.WARN:
      return "bg-amber-950/90 text-amber-300 border-amber-700 font-semibold";
    case LogLevel.INFO:
      return "bg-cyan-950/90 text-cyan-300 border-cyan-800";
    case LogLevel.DEBUG:
    default:
      return "bg-stone-900/90 text-stone-400 border-stone-800";
  }
};

export const LogsTerminalList: React.FC<LogsTerminalListProps> = ({
  logs,
  expandedLogIds,
  onToggleExpand,
  scrollContainerRef,
  hasSearchQuery,
}) => {
  const { t } = useI18n();

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 bg-[#0e0402]/95 border border-amber-500/30 rounded-xl p-3 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 font-mono text-xs shadow-inner shadow-black/80"
    >
      {logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 font-mono gap-2">
          <ListFilter size={28} className="text-stone-600" />
          <p className="text-sm font-semibold">{t("debugEmptyLog")}</p>
          {hasSearchQuery && (
            <p className="text-xs text-stone-600">
              {t("debugNoFilterResults")}
            </p>
          )}
        </div>
      ) : (
        logs.map((entry) => {
          const hasDetails = !!entry.context || !!entry.error;
          const isExpanded = expandedLogIds.has(entry.id);

          return (
            <div
              key={entry.id}
              className="flex flex-col rounded-lg border border-stone-900 bg-black/40 hover:bg-stone-900/40 transition-colors overflow-hidden"
            >
              {/* Main line */}
              <div
                onClick={() => hasDetails && onToggleExpand(entry.id)}
                className={`flex items-start gap-2.5 p-2 select-text ${
                  hasDetails ? "cursor-pointer" : ""
                }`}
              >
                {/* Expand toggle icon */}
                {hasDetails ? (
                  <button
                    type="button"
                    className="mt-0.5 text-stone-500 hover:text-amber-400 transition-colors"
                    title={isExpanded ? t("debugCollapseDetails") : t("debugExpandDetails")}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="w-3.5" />
                )}

                {/* Timestamp */}
                <span className="text-stone-500 text-[10px] shrink-0 font-mono pt-0.5">
                  {entry.timeFormatted}
                </span>

                {/* Level Badge */}
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border shrink-0 ${getLevelBadgeClass(
                    entry.level
                  )}`}
                >
                  {entry.levelName}
                </span>

                {/* Category Badge */}
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold border border-stone-800 bg-stone-900/80 text-stone-300 shrink-0">
                  {entry.category}
                </span>

                {/* Message */}
                <span
                  className={`flex-1 break-words leading-tight ${
                    entry.level >= LogLevel.ERROR
                      ? "text-rose-300 font-semibold"
                      : entry.level === LogLevel.WARN
                      ? "text-amber-200"
                      : entry.level === LogLevel.INFO
                      ? "text-cyan-100"
                      : "text-stone-300"
                  }`}
                >
                  {entry.message}
                </span>

                {/* Has details pill */}
                {hasDetails && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                    {entry.error ? "error" : "context"}
                  </span>
                )}
              </div>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <LogItemDrawer context={entry.context} error={entry.error} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default LogsTerminalList;
