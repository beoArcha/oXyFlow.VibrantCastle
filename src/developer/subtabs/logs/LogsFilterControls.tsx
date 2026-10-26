import React from "react";
import { Cpu } from "lucide-react";
import { Button, Select, SearchInput, SegmentedControl, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { LogLevel } from "@lib/logger";
import { LogsFilterControlsProps, LogFilterLevel } from "./types";

/**
 * Filter and query controls bar for the developer logs terminal.
 */
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

  const levelOptions: Array<{ id: LogFilterLevel; label: string; count: number; color?: string }> = [
    { id: "all", label: "ALL", count: counts.total },
    { id: "error", label: "ERRORS", count: counts.error + counts.fatal, color: "text-rose-400" },
    { id: "warn", label: "WARNS", count: counts.warn, color: "text-amber-400" },
    { id: "info", label: "INFO", count: counts.info, color: "text-cyan-400" },
    { id: "debug", label: "DEBUG", count: counts.debug, color: "text-stone-400" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        <SearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder={t("debugFilterPlaceholder")}
          className="h-7 text-xs bg-black/60 border-stone-800"
          containerClassName="flex-1 min-w-[180px] max-w-sm"
        />

        <div
          role="group"
          aria-label="Filter logs by severity"
          className="flex items-center rounded-lg bg-black/50 p-0.5 border border-stone-800 text-[11px]"
        >
          {levelOptions.map(({ id, label, count, color }) => (
            <Button
              key={id}
              type="button"
              variant={levelFilter === id ? "primary" : "ghost"}
              size="sm"
              onClick={() => onLevelFilterChange(id)}
              aria-pressed={levelFilter === id}
              className={`px-2 py-0.5 min-h-0 h-6 rounded transition-all cursor-pointer flex items-center gap-1 ${levelFilter === id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
                }`}
            >
              <Text as="span" family="mono" weight="bold">{label}</Text>
              <Text as="span" family="mono" size="3xs" className={levelFilter === id ? "text-white/80" : color || "text-stone-500"}>
                ({count})
              </Text>
            </Button>
          ))}
        </div>

        {availableCategories.length > 0 && (
          <Select
            size="sm"
            variant="castle"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            options={[
              { value: "all", label: t("debugAllCategories") },
              ...availableCategories.map((cat) => ({ value: cat, label: cat })),
            ]}
            className="text-xs min-w-32"
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 shrink-0">
        <Cpu size={13} className="text-amber-500" />
        <span className="text-[10px] text-stone-400">{t("debugGlobalLogLevelLabel")}</span>
        <SegmentedControl<LogLevel>
          size="sm"
          value={globalLogLevel}
          onChange={onChangeGlobalLevel}
          options={[
            { value: LogLevel.DEBUG, label: "DEBUG" },
            { value: LogLevel.INFO, label: "INFO" },
            { value: LogLevel.WARN, label: "WARN" },
            { value: LogLevel.ERROR, label: "ERROR" },
          ]}
          className="text-[10px]"
        />
      </div>
    </div>
  );
};

export default LogsFilterControls;
