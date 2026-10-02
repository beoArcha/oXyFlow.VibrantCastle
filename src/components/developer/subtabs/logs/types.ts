import { LogRecord, LogLevel, SerializedError } from "@lib/logger";

/**
 * Filter levels available in the logs terminal quick filter.
 */
export type LogFilterLevel = "all" | "error" | "warn" | "info" | "debug";

/**
 * Aggregated metrics summary for log occurrences by severity.
 */
export interface LogCounts {
  fatal: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
  total: number;
}

export interface LogsHeaderToolbarProps {
  filteredCount: number;
  totalCount: number;
  autoScroll: boolean;
  copied: boolean;
  onToggleAutoScroll: () => void;
  onCopyLogs: () => void;
  onDownloadLogs: () => void;
  onClearLogs: () => void;
}

export interface LogsFilterControlsProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  levelFilter: LogFilterLevel;
  onLevelFilterChange: (lvl: LogFilterLevel) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  counts: LogCounts;
  availableCategories: string[];
  globalLogLevel: LogLevel;
  onChangeGlobalLevel: (lvl: LogLevel) => void;
}

export interface LogsTerminalListProps {
  logs: LogRecord[];
  expandedLogIds: Set<string>;
  onToggleExpand: (id: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  hasSearchQuery: boolean;
}

export interface LogItemDrawerProps {
  context?: Record<string, unknown>;
  error?: SerializedError;
}
