import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useThrottledLogs } from "../../../hooks/useThrottledLogs";
import { LogRecord, LogLevel, LoggerManager } from "../../../lib/logger";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogsTerminalList,
  LogCounts,
} from "./logs";

export interface DisplayLogItem extends LogRecord {
  id: string;
}

/**
 * LogsSubTab Orchestrator Component.
 *
 * Responsibilities:
 * - Subscribes to throttled RingBuffer events (AGENT.md § 3.3 & § 12.1).
 * - Manages filter and expansion states.
 * - Orchestrates LogsHeaderToolbar, LogsFilterControls, and LogsTerminalList.
 * - Conforms to Single Responsibility Principle (SRP) (<150 lines).
 */
export const LogsSubTab: React.FC = () => {
  // Throttled ring buffer reactive subscription
  const { logs, lastUpdated, clearLogs } = useThrottledLogs({ throttleMs: 150 });

  // Filtering and interaction states
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
  }, [lastUpdated, autoScroll]);

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
    clearLogs();
    setExpandedLogIds(new Set());
  }, [clearLogs]);

  const handleChangeGlobalLevel = (level: LogLevel) => {
    LoggerManager.getInstance().setDefaultLevel(level);
    setGlobalLogLevel(level);
  };

  // Metrics summary
  const counts: LogCounts = useMemo(() => {
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
      if (levelFilter === "fatal" && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "error" && log.level !== LogLevel.ERROR && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "warn" && log.level !== LogLevel.WARN && log.level !== LogLevel.ERROR && log.level !== LogLevel.FATAL) return false;
      if (levelFilter === "info" && log.level < LogLevel.INFO) return false;
      if (levelFilter === "debug" && log.level !== LogLevel.DEBUG) return false;

      if (categoryFilter !== "all" && log.category !== categoryFilter) {
        return false;
      }

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

  return (
    <div
      id="subtab-content-logs"
      className="flex flex-col gap-3 h-[calc(88vh-180px)] min-h-[500px] max-h-[720px] animate-in fade-in duration-150"
    >
      {/* 1. Header Toolbar & Filters */}
      <div className="bg-[#140703]/90 border border-amber-500/40 rounded-xl p-3 flex flex-col gap-3 shadow-lg shadow-black/60 shrink-0">
        <LogsHeaderToolbar
          filteredCount={filteredLogs.length}
          totalCount={counts.total}
          autoScroll={autoScroll}
          copied={copied}
          onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
          onCopyLogs={handleCopyLogs}
          onDownloadLogs={handleDownloadLogs}
          onClearLogs={handleClearLogs}
        />
        <LogsFilterControls
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          counts={counts}
          availableCategories={availableCategories}
          globalLogLevel={globalLogLevel}
          onChangeGlobalLevel={handleChangeGlobalLevel}
        />
      </div>

      {/* 2. Expanded Terminal List Area */}
      <LogsTerminalList
        logs={filteredLogs}
        expandedLogIds={expandedLogIds}
        onToggleExpand={toggleExpand}
        scrollContainerRef={scrollContainerRef}
        hasSearchQuery={!!searchQuery}
      />
    </div>
  );
};

export default LogsSubTab;
