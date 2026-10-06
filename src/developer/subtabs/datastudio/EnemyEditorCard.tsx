import React, { useState, useMemo, useCallback } from "react";
import { Skull, BookOpen, Edit3 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Switch,
  ColorPickerInput,
  CompactNumberStepper,
  SegmentedControl,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import enemiesJson from "@data/enemies/enemies.json";
import {
  validateEnemy,
  SOUL_TYPES,
  SoulType,
  EnemyJsonSchema,
  EnemyStatsSchema,
} from "@lib/schemas/enemySchema";
import { PresetSelectorHeader } from "./components/PresetSelectorHeader";
import { SchemaValidationAlert } from "./components/SchemaValidationAlert";
import { SchemaValidationBadge } from "./components/SchemaValidationBadge";
import { ExportToolbar } from "./components/ExportToolbar";
import { BestiaryFilters } from "./components/bestiary/BestiaryFilters";
import { BestiaryGalleryView } from "./components/bestiary/BestiaryGalleryView";
import { BestiaryEntryInspector } from "./components/bestiary/BestiaryEntryInspector";
import { useEntityDraft } from "./hooks/useEntityDraft";
import { createDefaultEnemyDraft } from "./services/entityDraftFactory";
import {
  BestiaryFilterState,
  DEFAULT_BESTIARY_FILTERS,
  filterAndSortBestiaryEntries,
} from "./types/bestiaryTypes";

export type EnemyCardMode = "catalog" | "editor";

export interface EnemyEditorCardProps {
  initialMode?: EnemyCardMode;
}

export const EnemyEditorCard: React.FC<EnemyEditorCardProps> = ({
  initialMode = "catalog",
}) => {
  const { t } = useI18n();
  const [activeMode, setActiveMode] = useState<EnemyCardMode>(initialMode);
  const [bestiaryFilters, setBestiaryFilters] =
    useState<BestiaryFilterState>(DEFAULT_BESTIARY_FILTERS);

  const existingEnemies = useMemo(
    () => Object.values(enemiesJson.enemies as Record<string, EnemyJsonSchema>),
    []
  );

  const [inspectedEnemy, setInspectedEnemy] = useState<EnemyJsonSchema | null>(
    () => existingEnemies[0] ?? null
  );

  const {
    selectedId: selectedEnemyId,
    draft,
    setDraft,
    updateField,
    validationResult,
    validationErrors,
    handleSelectPreset: handleSelectEnemy,
    handleCreateNew,
  } = useEntityDraft<EnemyJsonSchema>({
    initialItems: existingEnemies,
    createDefaultDraft: createDefaultEnemyDraft,
    validate: validateEnemy,
  });

  const availableCategories = useMemo(() => {
    return Array.from(new Set(existingEnemies.map((e) => e.category)));
  }, [existingEnemies]);

  const filteredEnemies = useMemo(() => {
    return filterAndSortBestiaryEntries(existingEnemies, bestiaryFilters);
  }, [existingEnemies, bestiaryFilters]);

  const handleFilterChange = useCallback(
    <K extends keyof BestiaryFilterState>(
      key: K,
      value: BestiaryFilterState[K]
    ) => {
      setBestiaryFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleOpenEnemyInEditor = useCallback(
    (enemy: EnemyJsonSchema) => {
      handleSelectEnemy(enemy.id);
      setActiveMode("editor");
    },
    [handleSelectEnemy]
  );

  const updateStat = (statName: keyof EnemyStatsSchema, value: number) => {
    setDraft((prev: Partial<EnemyJsonSchema>) => ({
      ...prev,
      stats: {
        health: 100,
        maxHealth: 100,
        speed: 1,
        attackPower: 10,
        scoreReward: 20,
        ...(prev.stats ?? {}),
        [statName]: value,
      },
    }));
  };

  const soulOptions = useMemo(
    () => SOUL_TYPES.map((type) => ({ value: type, label: type })),
    []
  );

  const presetOptions = useMemo(
    () =>
      existingEnemies.map((e) => ({
        value: e.id,
        label: `${e.defaultName} (${e.id})`,
      })),
    [existingEnemies]
  );

  const modeOptions = useMemo(
    () => [
      {
        value: "catalog" as const,
        label: t("dataStudioBestiaryTabCatalog"),
        icon: <BookOpen className="w-3.5 h-3.5" />,
      },
      {
        value: "editor" as const,
        label: t("dataStudioBestiaryTabEditor"),
        icon: <Edit3 className="w-3.5 h-3.5" />,
      },
    ],
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle icon={<Skull className="w-4 h-4 text-rose-400" />}>
            {t("dataStudioEnemyCardTitle")}
          </CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            <SegmentedControl
              options={modeOptions}
              value={activeMode}
              onChange={(mode) => setActiveMode(mode)}
              size="sm"
            />

            {activeMode === "catalog" ? (
              <ExportToolbar
                data={filteredEnemies}
                filename="bestiary_catalog.json"
                modalTitle={t("dataStudioBestiaryExportCatalog")}
                buttonLabel={t("dataStudioBestiaryExportCatalog")}
                isValid={true}
              />
            ) : (
              <>
                <ExportToolbar
                  data={draft}
                  filename={`${draft.id || "enemy"}.json`}
                  modalTitle={`${t("dataStudioExportModalTitle")}: ${draft.id || "enemy"}`}
                  isValid={validationResult.success}
                />
                <SchemaValidationBadge
                  isValid={validationResult.success}
                  errorCount={validationErrors.length}
                />
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {activeMode === "catalog" ? (
          <div className="flex flex-col gap-4">
            <BestiaryFilters
              filters={bestiaryFilters}
              onFilterChange={handleFilterChange}
              availableCategories={availableCategories}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 xl:col-span-8">
                <BestiaryGalleryView
                  enemies={filteredEnemies}
                  selectedEnemyId={inspectedEnemy?.id}
                  onSelectEnemy={setInspectedEnemy}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
                <BestiaryEntryInspector
                  enemy={inspectedEnemy}
                  onOpenInEditor={handleOpenEnemyInEditor}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <PresetSelectorHeader
              selectedValue={selectedEnemyId}
              onSelect={handleSelectEnemy}
              options={presetOptions}
              createButtonLabel={t("dataStudioEnemyCreateNew")}
              onCreateNew={handleCreateNew}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <Input
                id="enemy-field-id"
                label={t("dataStudioEnemyId")}
                value={draft.id ?? ""}
                onChange={(e) => updateField("id", e.target.value)}
              />

              <Input
                id="enemy-field-name"
                label={t("dataStudioEnemyDefaultName")}
                value={draft.defaultName ?? ""}
                onChange={(e) => updateField("defaultName", e.target.value)}
              />

              <Input
                id="enemy-field-category"
                label={t("dataStudioEnemyCategory")}
                value={draft.category ?? "standard"}
                onChange={(e) => updateField("category", e.target.value)}
              />

              <CompactNumberStepper
                id="enemy-field-health"
                label={t("dataStudioEnemyHealth")}
                value={draft.stats?.health ?? 100}
                min={1}
                max={99999}
                onChange={(val) => {
                  updateStat("health", val);
                  updateStat("maxHealth", val);
                }}
              />

              <CompactNumberStepper
                id="enemy-field-attack"
                label={t("dataStudioEnemyAttackPower")}
                value={draft.stats?.attackPower ?? 10}
                min={0}
                max={9999}
                onChange={(val) => updateStat("attackPower", val)}
              />

              <CompactNumberStepper
                id="enemy-field-speed"
                label={t("dataStudioEnemySpeed")}
                value={draft.stats?.speed ?? 1}
                min={0}
                max={50}
                step={0.1}
                onChange={(val) => updateStat("speed", val)}
              />

              <CompactNumberStepper
                id="enemy-field-width"
                label={t("dataStudioEnemyWidth")}
                value={draft.dimensions?.width ?? 32}
                min={8}
                max={512}
                onChange={(val) =>
                  updateField("dimensions", {
                    width: val,
                    height: draft.dimensions?.height ?? 32,
                  })
                }
              />

              <CompactNumberStepper
                id="enemy-field-height"
                label={t("dataStudioEnemyHeight")}
                value={draft.dimensions?.height ?? 32}
                min={8}
                max={512}
                onChange={(val) =>
                  updateField("dimensions", {
                    width: draft.dimensions?.width ?? 32,
                    height: val,
                  })
                }
              />

              <div className="flex flex-col gap-1 text-left">
                <label
                  htmlFor="enemy-field-color"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
                >
                  {t("dataStudioEnemyColor")}
                </label>
                <ColorPickerInput
                  id="enemy-field-color"
                  ariaLabel={t("dataStudioEnemyColor")}
                  value={draft.proceduralFallback?.bodyColor ?? ""}
                  onChange={(hex) =>
                    updateField("proceduralFallback", {
                      bodyColor: hex,
                    })
                  }
                />
              </div>

              <Select
                id="enemy-field-soul-type"
                label={t("dataStudioEnemySoulType")}
                value={draft.soulDrop?.type ?? "bullet"}
                onChange={(e) => {
                  const newType = e.target.value as SoulType;
                  if (draft.soulDrop) {
                    setDraft((prev: Partial<EnemyJsonSchema>) => ({
                      ...prev,
                      soulDrop: {
                        ...prev.soulDrop!,
                        type: newType,
                      },
                    }));
                  }
                }}
                options={soulOptions}
                variant="castle"
              />

              <div className="flex items-center gap-3 p-2 bg-stone-950/40 border border-stone-800/60 rounded-lg">
                <Switch
                  id="enemy-field-aerial"
                  size="sm"
                  checked={draft.isAerial ?? false}
                  onCheckedChange={(checked) => updateField("isAerial", checked)}
                  label={
                    <span className="text-xs text-amber-200/90">
                      {t("dataStudioEnemyIsAerial")}
                    </span>
                  }
                />
              </div>

              <div className="flex items-center gap-3 p-2 bg-stone-950/40 border border-stone-800/60 rounded-lg">
                <Switch
                  id="enemy-field-dummy"
                  size="sm"
                  checked={draft.isDummy ?? false}
                  onCheckedChange={(checked) => updateField("isDummy", checked)}
                  label={
                    <span className="text-xs text-amber-200/90">
                      {t("dataStudioEnemyIsDummy")}
                    </span>
                  }
                />
              </div>
            </div>

            <SchemaValidationAlert errors={validationErrors} />
          </>
        )}
      </CardContent>
    </Card>
  );
};
