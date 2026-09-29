import React from "react";
import { Search, X, Cpu } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { LogLevel } from "@lib/logger";

export interface LogCounts {
  fatal: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
  total: number;
}

export interface LogsFilterControlsProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  levelFilter: string;
  onLevelFilterChange: (lvl: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  counts: LogCounts;
  availableCategories: string[];
  globalLogLevel: LogLevel;
  onChangeGlobalLevel: (lvl: LogLevel) => void;
}

export const LogsFilterControls: React.FC<LogsFilterControlsProps> = ({
  searchQuery,
  onSearchQueryChange,
  levelFilter,
  onLevelFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  counts,
  availableCategories,
  globalLogLevel,
  onChangeGlobalLevel,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={t("debugFilterPlaceholder")}
            className="w-full pl-8 pr-7 py-1 rounded-lg bg-black/60 border border-stone-800 focus:border-amber-500/70 text-xs text-stone-200 placeholder:text-stone-500 font-mono outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
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
              onClick={() => onLevelFilterChange(id)}
              className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${levelFilter === id
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
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="bg-black/60 border border-stone-800 text-stone-300 text-xs rounded-lg px-2 py-1 font-mono outline-none focus:border-amber-500/70 cursor-pointer"
          >
            <option value="all">{t("debugAllCategories")}</option>
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
        <span className="text-[10px] text-stone-400">{t("debugGlobalLogLevelLabel")}</span>
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
              onClick={() => onChangeGlobalLevel(level)}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${globalLogLevel === level
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
  );
};

export default LogsFilterControls;
