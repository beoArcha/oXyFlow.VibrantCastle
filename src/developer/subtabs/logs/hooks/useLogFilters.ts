import { useState, useMemo, useCallback } from "react";
import { LogRecord, LogLevel } from "@lib/logger";
import { LogCounts, LogFilterLevel } from "../types";
import { safeStringify } from "../utils";

export interface UseLogFiltersResult {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  levelFilter: LogFilterLevel;
  setLevelFilter: (lvl: LogFilterLevel) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  counts: LogCounts;
  availableCategories: string[];
  filteredLogs: LogRecord[];
  resetFilters: () => void;
}

/**
 * Custom React hook managing search query, level filters, category filters,
 * and aggregating metrics summary for the logs terminal.
 */
export function useLogFilters(logs: LogRecord[]): UseLogFiltersResult {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<LogFilterLevel>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setLevelFilter("all");
    setCategoryFilter("all");
  }, []);

  // Aggregated summary metrics for severity counters
  const counts: LogCounts = useMemo(() => {
    let fatal = 0;
    let error = 0;
    let warn = 0;
    let info = 0;
    let debug = 0;

    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
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
    }

    return { fatal, error, warn, info, debug, total: logs.length };
  }, [logs]);

  // Distinct sorted categories present in current log buffer
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      if (l.category) set.add(l.category);
    }
    return Array.from(set).sort();
  }, [logs]);

  // Filtered log entries based on unified filter criteria
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      // 1. Level filtering (consistent with badge counters)
      if (levelFilter === "error") {
        if (log.level !== LogLevel.ERROR && log.level !== LogLevel.FATAL) {
          return false;
        }
      } else if (levelFilter === "warn") {
        if (log.level !== LogLevel.WARN) {
          return false;
        }
      } else if (levelFilter === "info") {
        if (log.level !== LogLevel.INFO) {
          return false;
        }
      } else if (levelFilter === "debug") {
        if (log.level !== LogLevel.DEBUG) {
          return false;
        }
      }

      // 2. Category filtering
      if (categoryFilter !== "all" && log.category !== categoryFilter) {
        return false;
      }

      // 3. Full-text search
      if (q) {
        const msg = (log.message || "").toLowerCase();
        const cat = (log.category || "").toLowerCase();
        const ctx = log.context ? safeStringify(log.context).toLowerCase() : "";
        const err = log.error?.message ? log.error.message.toLowerCase() : "";
        if (!msg.includes(q) && !cat.includes(q) && !ctx.includes(q) && !err.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, levelFilter, categoryFilter, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    categoryFilter,
    setCategoryFilter,
    counts,
    availableCategories,
    filteredLogs,
    resetFilters,
  };
}
