import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ScrollText,
  ListFilter,
  Trash2,
  Copy,
  Check,
  Download,
  Cpu,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ArrowDownCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Bug,
} from "lucide-react";
import { Button } from "../../ui";
import { useI18n } from "../../../hooks/useI18n";
import { LogRecord, LogLevel, LoggerManager } from "../../../lib/logger";

export interface DisplayLogItem extends LogRecord {
  id: string;
}

export const LogsSubTab: React.FC = () => {
  const { t } = useI18n();

  // Ring buffer reactive subscription
  const [logs, setLogs] = useState<LogRecord[]>(() => [
    ...LoggerManager.getInstance().ringBuffer.getLogs(),
  ]);

  useEffect(() => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    setLogs([...ringBuffer.getLogs()]);

    return ringBuffer.subscribe(() => {
      setLogs([...ringBuffer.getLogs()]);
    });
  }, []);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [globalLogLevel, setGlobalLogLevel] = useState<LogLevel>(
    () => LoggerManager.getInstance().defaultLevel
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs if enabled
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    LoggerManager.getInstance().ringBuffer.clear();
    setLogs([]);
    setExpandedLogIds(new Set());
  }, []);

  const handleChangeGlobalLevel = (level: LogLevel) => {
    LoggerManager.getInstance().setDefaultLevel(level);
    setGlobalLogLevel(level);
  };

  // Metrics summary
  const counts = useMemo(() => {
    let fatal = 0;
    let error = 0;
    let warn = 0;
    let info = 0;
    let debug = 0;

    logs.forEach((l) => {
      switch (l.level) {
        case LogLevel.FATAL:
          fatal++;
          break;
        case LogLevel.ERROR:
          error++;
          break;
        case LogLevel.WARN:
          warn++;
          break;
        case LogLevel.INFO:
          info++;
          break;
        case LogLevel.DEBUG:
          debug++;
          break;
      }
    });

    return { fatal, error, warn, info, debug, total: logs.length };
  }, [logs]);

  // Distinct categories available in current logs
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered log list
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      // Level filter
      if (levelFilter === "fatal" && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "error" && log.level !== LogLevel.ERROR && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "warn" && log.level !== LogLevel.WARN && log.level !== LogLevel.ERROR && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "info" && log.level < LogLevel.INFO) return false;
      if (levelFilter === "debug" && log.level !== LogLevel.DEBUG) return false;

      // Category filter
      if (categoryFilter !== "all" && log.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (q) {
        const msg = (log.message || "").toLowerCase();
        const cat = (log.category || "").toLowerCase();
        const ctx = log.context ? JSON.stringify(log.context).toLowerCase() : "";
        const err = log.error?.message ? log.error.message.toLowerCase() : "";
        if (!msg.includes(q) && !cat.includes(q) && !ctx.includes(q) && !err.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, levelFilter, categoryFilter, searchQuery]);

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((item) => {
        const contextStr = item.context ? ` | Context: ${JSON.stringify(item.context)}` : "";
        const errStr = item.error ? ` | Error: ${item.error.message}\nStack: ${item.error.stack}` : "";
        return `[${item.timeFormatted}] [${item.levelName}] [${item.category}] ${item.message}${contextStr}${errStr}`;
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
      a.download = `vibrant_castle_engine_logs_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download errors
    }
  };

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

  return (
    <div
      id="subtab-content-logs"
      className="flex flex-col gap-3 h-[calc(88vh-180px)] min-h-[500px] max-h-[720px] animate-in fade-in duration-150"
    >
      {/* 1. Header Toolbar */}
      <div className="bg-[#140703]/90 border border-amber-500/40 rounded-xl p-3 flex flex-col gap-3 shadow-lg shadow-black/60 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title and live badge */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ScrollText size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-amber-300 tracking-wide font-serif">
                  {t("debugEventLogTitle")}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredLogs.length} / {counts.total}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Pełny podgląd strumienia zdarzeń RingBuffer, diagnostyka błędów oraz kontekstów operacji
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                autoScroll
                  ? "bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm"
                  : "bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200"
              }`}
              title="Przełącz automatyczne przewijanie do najnowszych logów"
            >
              <ArrowDownCircle size={13} className={autoScroll ? "text-amber-400" : "text-stone-500"} />
              <span>Auto-scroll</span>
            </button>

            <Button
              size="sm"
              variant="outline"
              icon={copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              onClick={handleCopyLogs}
              title="Kopiuj widoczne logi do schowka"
              className="text-xs text-stone-300 hover:text-white"
            >
              Kopiuj
            </Button>

            <Button
              size="sm"
              variant="outline"
              icon={<Download size={13} />}
              onClick={handleDownloadLogs}
              title="Pobierz pełny zrzut logów JSON"
              className="text-xs text-stone-300 hover:text-white"
            >
              JSON
            </Button>

            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={13} className="text-rose-400" />}
              onClick={handleClearLogs}
              title={t("debugClearLog")}
              className="text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 border border-rose-900/50"
            >
              Wyczyść
            </Button>
          </div>
        </div>

        {/* Filters and search row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtruj treść, kategorię, kod błędu..."
                className="w-full pl-8 pr-7 py-1 rounded-lg bg-black/60 border border-stone-800 focus:border-amber-500/70 text-xs text-stone-200 placeholder:text-stone-500 font-mono outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Level Quick Filters */}
            <div className="flex items-center rounded-lg bg-black/50 p-0.5 border border-stone-800 text-[11px]">
              {[
                { id: "all", label: "ALL", count: counts.total },
                { id: "error", label: "ERRORS", count: counts.error + counts.fatal, color: "text-rose-400" },
                { id: "warn", label: "WARNS", count: counts.warn, color: "text-amber-400" },
                { id: "info", label: "INFO", count: counts.info, color: "text-cyan-400" },
                { id: "debug", label: "DEBUG", count: counts.debug, color: "text-stone-400" },
              ].map(({ id, label, count, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLevelFilter(id)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    levelFilter === id
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[9px] ${levelFilter === id ? "text-white/80" : color || "text-stone-500"}`}>
                    ({count})
                  </span>
                </button>
              ))}
            </div>

            {/* Category Dropdown Filter */}
            {availableCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-black/60 border border-stone-800 text-stone-300 text-xs rounded-lg px-2 py-1 font-mono outline-none focus:border-amber-500/70 cursor-pointer"
              >
                <option value="all">Wszystkie kategorie</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Engine Global Log Level Switch */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-400 shrink-0">
            <Cpu size={13} className="text-amber-500" />
            <span className="text-[10px] text-stone-400">Poziom rejestrowania:</span>
            <div className="flex items-center rounded bg-black/60 border border-stone-800 p-0.5">
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
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${
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
        </div>
      </div>

      {/* 2. Expanded Terminal List Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 bg-[#0e0402]/95 border border-amber-500/30 rounded-xl p-3 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 font-mono text-xs shadow-inner shadow-black/80"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 font-mono gap-2">
            <ListFilter size={28} className="text-stone-600" />
            <p className="text-sm font-semibold">{t("debugEmptyLog")}</p>
            {searchQuery && (
              <p className="text-xs text-stone-600">
                Brak wyników dla zapytania &quot;{searchQuery}&quot;. Spróbuj zresetować filtry.
              </p>
            )}
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const hasDetails = !!entry.context || !!entry.error;
            const isExpanded = expandedLogIds.has(entry.id);

            return (
              <div
                key={entry.id}
                className="flex flex-col rounded-lg border border-stone-900 bg-black/40 hover:bg-stone-900/40 transition-colors overflow-hidden"
              >
                {/* Main line */}
                <div
                  onClick={() => hasDetails && toggleExpand(entry.id)}
                  className={`flex items-start gap-2.5 p-2 select-text ${
                    hasDetails ? "cursor-pointer" : ""
                  }`}
                >
                  {/* Expand toggle icon */}
                  {hasDetails ? (
                    <button
                      type="button"
                      className="mt-0.5 text-stone-500 hover:text-amber-400 transition-colors"
                      title={isExpanded ? "Zwiń szczegóły" : "Rozwiń kontekst diagnostyczny"}
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
                  <div className="border-t border-stone-800/80 bg-black/80 p-3 flex flex-col gap-2 text-[11px] animate-in slide-in-from-top-1 duration-100">
                    {/* Structured Context */}
                    {entry.context && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                          Structured Log Context:
                        </span>
                        <pre className="p-2 rounded bg-stone-950 border border-stone-800 text-amber-200/90 overflow-x-auto text-[10px] font-mono leading-relaxed">
                          {JSON.stringify(entry.context, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error Stack Trace */}
                    {entry.error && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>
                              {entry.error.name}: {entry.error.message}
                            </span>
                          </span>
                          {entry.error.stack && (
                            <button
                              type="button"
                              onClick={() => {
                                if (entry.error?.stack && navigator.clipboard) {
                                  navigator.clipboard.writeText(entry.error.stack);
                                }
                              }}
                              className="text-[9px] text-stone-400 hover:text-stone-200 font-mono underline cursor-pointer"
                            >
                              Kopiuj Stack Trace
                            </button>
                          )}
                        </div>
                        {entry.error.stack && (
                          <pre className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-200 overflow-x-auto text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                            {entry.error.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LogsSubTab;
