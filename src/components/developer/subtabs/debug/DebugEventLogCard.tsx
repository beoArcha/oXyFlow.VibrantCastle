import React, { useState } from "react";
import { ListFilter, Trash2, Copy, Check, Download, ShieldAlert, Cpu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import { LogRecord, LogLevelName, LogLevel, LoggerManager } from "../../../../lib/logger";

export interface LogEntry {
  id: string;
  time: string;
  type?: string;
  category?: string;
  levelName?: LogLevelName | string;
  message: string;
}

export type DisplayLogItem = LogRecord | LogEntry;

export interface DebugEventLogProps {
  logs: DisplayLogItem[];
  onClearLogs?: () => void;
}

export const DebugEventLogCard: React.FC<DebugEventLogProps> = ({ logs, onClearLogs }) => {
  const { t } = useI18n();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [copied, setCopied] = useState<boolean>(false);
  const [globalLogLevel, setGlobalLogLevel] = useState<LogLevel>(
    () => LoggerManager.getInstance().defaultLevel
  );

  const getRecordLevel = (item: DisplayLogItem): string => {
    if ("levelName" in item && item.levelName) {
      return item.levelName;
    }
    return "INFO";
  };

  const getRecordCategory = (item: DisplayLogItem): string => {
    if ("category" in item && item.category) {
      return item.category;
    }
    if ("type" in item && item.type) {
      return item.type;
    }
    return "system";
  };

  const getRecordTime = (item: DisplayLogItem): string => {
    if ("timeFormatted" in item && item.timeFormatted) {
      return item.timeFormatted;
    }
    if ("time" in item && item.time) {
      return item.time;
    }
    return "";
  };

  const filteredLogs = logs.filter((l) => {
    const cat = getRecordCategory(l).toLowerCase();
    const lvl = getRecordLevel(l);

    // Category filter
    if (categoryFilter !== "all") {
      if (!cat.includes(categoryFilter)) {
        return false;
      }
    }

    // Level filter
    if (levelFilter === "error") {
      return lvl === "ERROR" || lvl === "FATAL";
    }
    if (levelFilter === "warn") {
      return lvl === "WARN" || lvl === "ERROR" || lvl === "FATAL";
    }
    if (levelFilter === "info") {
      return lvl !== "DEBUG";
    }

    return true;
  });

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "FATAL":
        return "bg-red-600 text-white border-red-400 font-black animate-pulse";
      case "ERROR":
        return "bg-rose-950/80 text-rose-300 border-rose-700";
      case "WARN":
        return "bg-amber-950/80 text-amber-300 border-amber-700";
      case "INFO":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
      case "DEBUG":
      default:
        return "bg-stone-900 text-stone-400 border-stone-800";
    }
  };

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((item) => {
        const time = getRecordTime(item);
        const lvl = getRecordLevel(item);
        const cat = getRecordCategory(item);
        return `[${time}] [${lvl}] [${cat}] ${item.message}`;
      })
      .join("\n");

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleDownloadLogs = () => {
    try {
      const jsonStr = LoggerManager.getInstance().ringBuffer.exportAsJson();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibrant_castle_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download errors
    }
  };

  const handleChangeGlobalLevel = (level: LogLevel) => {
    LoggerManager.getInstance().setDefaultLevel(level);
    setGlobalLogLevel(level);
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <CardTitle icon={<ListFilter className="w-4 h-4 text-amber-400" />}>
              {t("debugEventLogTitle")} ({filteredLogs.length})
            </CardTitle>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Level Filter */}
              <div className="flex items-center rounded bg-black/50 p-0.5 border border-stone-800 text-[10px]">
                {["all", "info", "warn", "error"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                      levelFilter === lvl
                        ? "bg-amber-600 text-white"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center rounded bg-black/50 p-0.5 border border-stone-800 text-[10px]">
                {["all", "game", "combat", "audio", "system", "component"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-cyan-600 text-white"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Copy button */}
              <Button
                size="sm"
                variant="ghost"
                icon={copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                onClick={handleCopyLogs}
                title="Copy visible logs to clipboard"
                className="h-6 text-[10px] px-2 py-0 text-stone-400 hover:text-stone-200"
              />

              {/* Download button */}
              <Button
                size="sm"
                variant="ghost"
                icon={<Download size={12} />}
                onClick={handleDownloadLogs}
                title="Download JSON log dump"
                className="h-6 text-[10px] px-2 py-0 text-stone-400 hover:text-stone-200"
              />

              {/* Clear button */}
              {onClearLogs && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={12} />}
                  onClick={onClearLogs}
                  title={t("debugClearLog")}
                  className="h-6 text-[10px] px-2 py-0 text-stone-400 hover:text-rose-400"
                />
              )}
            </div>
          </div>

          {/* Runtime Global Engine Log Level Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800/80 text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <Cpu size={12} className="text-amber-500" />
              <span>Engine Log Level:</span>
              <div className="flex items-center rounded bg-stone-900 border border-stone-800 p-0.5">
                {[
                  { level: LogLevel.DEBUG, name: "DEBUG" },
                  { level: LogLevel.INFO, name: "INFO" },
                  { level: LogLevel.WARN, name: "WARN" },
                  { level: LogLevel.ERROR, name: "ERROR" },
                ].map(({ level, name }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleChangeGlobalLevel(level)}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      globalLogLevel === level
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-mono text-stone-500">
              Capacity: {LoggerManager.getInstance().ringBuffer.capacity} entries
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-2 bg-[#120502] rounded-xl border border-stone-800 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500 font-mono">
              {t("debugEmptyLog")}
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const lvl = getRecordLevel(entry);
              const cat = getRecordCategory(entry);
              const time = getRecordTime(entry);

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 p-1.5 rounded hover:bg-white/5 transition-colors text-[11px] leading-tight"
                >
                  <span className="text-stone-500 text-[10px] shrink-0 font-mono pt-0.5">
                    {time}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border shrink-0 ${getLevelBadgeClass(
                      lvl
                    )}`}
                  >
                    {lvl}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border border-stone-800 bg-stone-900/60 text-stone-400 shrink-0">
                    {cat}
                  </span>
                  <span
                    className={`truncate ${
                      lvl === "ERROR" || lvl === "FATAL"
                        ? "text-rose-300 font-semibold"
                        : lvl === "WARN"
                        ? "text-amber-200"
                        : "text-stone-300"
                    }`}
                  >
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugEventLogCard;
