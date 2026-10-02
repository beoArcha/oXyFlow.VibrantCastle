import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useThrottledLogs } from "../hooks/useThrottledLogs";
import { LogLevel } from "@lib/logger";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogsTerminalList,
  useLogFilters,
  safeStringify,
} from "./logs";

/**
 * LogsSubTab Orchestrator Component.
 */
export const LogsSubTab: React.FC = () => {
  // Throttled ring buffer reactive subscription with full facade
  const {
    logs,
    lastUpdated,
    clearLogs,
    globalLogLevel,
    setGlobalLogLevel,
    exportJson,
  } = useThrottledLogs({ throttleMs: 150 });

  // Filtering and interaction states managed by dedicated hook
  const {
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    categoryFilter,
    setCategoryFilter,
    counts,
    availableCategories,
    filteredLogs,
  } = useLogFilters(logs);

  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smart auto-scroll: only scrolls to bottom if user is already near bottom
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current) return;

    const el = scrollContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastUpdated, autoScroll]);

  const handleToggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => {
      const next = !prev;
      if (next && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      return next;
    });
  }, []);

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

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((item) => {
        const contextStr = item.context ? ` | Context: ${safeStringify(item.context)}` : "";
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
      const jsonStr = exportJson();
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
          onToggleAutoScroll={handleToggleAutoScroll}
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
          onChangeGlobalLevel={setGlobalLogLevel}
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
