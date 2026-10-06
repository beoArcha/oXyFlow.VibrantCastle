import React, { useMemo } from "react";
import { Filter, ArrowUpDown } from "lucide-react";
import { SearchInput, Select, Switch, Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import {
  BestiaryFilterState,
  BestiarySortKey,
  BestiarySortOrder,
} from "../../types/bestiaryTypes";

export interface BestiaryFiltersProps {
  filters: BestiaryFilterState;
  onFilterChange: <K extends keyof BestiaryFilterState>(
    key: K,
    value: BestiaryFilterState[K]
  ) => void;
  availableCategories: string[];
}

export const BestiaryFilters: React.FC<BestiaryFiltersProps> = React.memo(
  ({ filters, onFilterChange, availableCategories }) => {
    const { t } = useI18n();

    const categoryOptions = useMemo(() => {
      const opts = [
        { value: "all", label: `${t("dataStudioBestiaryFilterCategoryAll")} (All)` },
      ];
      availableCategories.forEach((cat) => {
        opts.push({
          value: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
        });
      });
      return opts;
    }, [availableCategories, t]);

    const sortOptions = useMemo(
      () => [
        { value: "name", label: t("dataStudioEnemyDefaultName") },
        { value: "hp", label: t("dataStudioEnemyHealth") },
        { value: "attack", label: t("dataStudioEnemyAttackPower") },
        { value: "speed", label: t("dataStudioEnemySpeed") },
      ],
      [t]
    );

    return (
      <div className="flex flex-col gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              id="bestiary-search-input"
              value={filters.searchQuery}
              onChange={(val) => onFilterChange("searchQuery", val)}
              placeholder={t("dataStudioBestiarySearchPlaceholder")}
              clearAriaLabel="Clear filter query"
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              id="bestiary-category-select"
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
              options={categoryOptions}
              variant="castle"
              leftIcon={<Filter className="w-3.5 h-3.5 text-stone-400" />}
            />
          </div>

          <div className="w-full md:w-44">
            <Select
              id="bestiary-sort-select"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange("sortBy", e.target.value as BestiarySortKey)
              }
              options={sortOptions}
              variant="castle"
              leftIcon={<ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onFilterChange(
                "sortOrder",
                filters.sortOrder === "asc" ? "desc" : "asc"
              )
            }
            className="shrink-0"
            title={`Toggle sort order (Current: ${filters.sortOrder.toUpperCase()})`}
          >
            {filters.sortOrder === "asc" ? "▲ ASC" : "▼ DESC"}
          </Button>
        </div>

        <div className="flex items-center gap-4 pt-1 border-t border-stone-800/50">
          <Switch
            id="bestiary-aerial-filter"
            size="sm"
            checked={filters.aerialOnly}
            onCheckedChange={(checked) => onFilterChange("aerialOnly", checked)}
            label={
              <span className="text-xs text-stone-300">
                {t("dataStudioBestiaryFilterAerialOnly")}
              </span>
            }
          />
        </div>
      </div>
    );
  }
);
BestiaryFilters.displayName = "BestiaryFilters";
