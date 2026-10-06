import React, { useState, useMemo } from "react";
import { Skull } from "lucide-react";
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

export const EnemyEditorCard: React.FC = () => {
  const { t } = useI18n();

  const existingEnemies = useMemo(
    () => Object.values(enemiesJson.enemies as Record<string, EnemyJsonSchema>),
    []
  );
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(existingEnemies[0]?.id ?? "");

  const initialEnemy = useMemo(
    () => existingEnemies.find((e) => e.id === selectedEnemyId) ?? existingEnemies[0],
    [existingEnemies, selectedEnemyId]
  );

  const [draft, setDraft] = useState<Partial<EnemyJsonSchema>>(() => ({
    id: initialEnemy?.id ?? "enemy_new",
    nameKey: initialEnemy?.nameKey ?? "enemyNew",
    defaultName: initialEnemy?.defaultName ?? "New Enemy",
    category: initialEnemy?.category ?? "standard",
    isDummy: initialEnemy?.isDummy ?? false,
    isAerial: initialEnemy?.isAerial ?? false,
    dimensions: initialEnemy?.dimensions ?? { width: 32, height: 32 },
    stats: initialEnemy?.stats ?? {
      health: 100,
      maxHealth: 100,
      speed: 1.5,
      attackPower: 15,
      scoreReward: 50,
    },
    soulDrop: initialEnemy?.soulDrop ?? {
      soulId: "soul_enemy_new",
      type: "bullet",
      dropRate: 0.15,
      grantedSkillId: "skill_dash",
      icon: "Sparkles",
      i18n: {
        nameKey: "soulName",
        descriptionKey: "soulDesc",
      },
    },
    proceduralFallback: initialEnemy?.proceduralFallback ?? {
      bodyColor: "#dc2626",
    },
  }));

  const handleSelectEnemy = (enemyId: string) => {
    setSelectedEnemyId(enemyId);
    const found = existingEnemies.find((e) => e.id === enemyId);
    if (found) {
      setDraft({ ...found });
    }
  };

  const validationResult = useMemo(() => {
    return validateEnemy(draft);
  }, [draft]);

  const validationErrors = useMemo(
    () => (validationResult.success ? [] : validationResult.errors),
    [validationResult]
  );

  const updateField = <K extends keyof EnemyJsonSchema>(
    field: K,
    value: EnemyJsonSchema[K]
  ) => {
    setDraft((prev: Partial<EnemyJsonSchema>) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Skull className="w-4 h-4 text-rose-400" />}>
            {t("dataStudioEnemyCardTitle")}
          </CardTitle>
          <SchemaValidationBadge
            isValid={validationResult.success}
            errorCount={validationErrors.length}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PresetSelectorHeader
          selectedValue={selectedEnemyId}
          onSelect={handleSelectEnemy}
          options={presetOptions}
          createButtonLabel={t("dataStudioEnemyCreateNew")}
          onCreateNew={() => {
            setDraft({
              id: `enemy_custom_${Date.now().toString().slice(-4)}`,
              nameKey: "enemyCustomName",
              defaultName: "Custom Beast",
              category: "beast",
              isDummy: false,
              isAerial: false,
              dimensions: { width: 40, height: 40 },
              stats: {
                health: 120,
                maxHealth: 120,
                speed: 2,
                attackPower: 18,
                scoreReward: 60,
              },
              soulDrop: {
                soulId: "soul_custom",
                type: "bullet",
                dropRate: 0.2,
                grantedSkillId: "skill_fireball",
                icon: "Flame",
                i18n: {
                  nameKey: "soulCustomName",
                  descriptionKey: "soulCustomDesc",
                },
              },
              proceduralFallback: {
                bodyColor: "#b91c1c",
              },
            });
          }}
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
              value={draft.proceduralFallback?.bodyColor ?? "#dc2626"}
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
              label={<span className="text-xs text-amber-200/90">{t("dataStudioEnemyIsAerial")}</span>}
            />
          </div>

          <div className="flex items-center gap-3 p-2 bg-stone-950/40 border border-stone-800/60 rounded-lg">
            <Switch
              id="enemy-field-dummy"
              size="sm"
              checked={draft.isDummy ?? false}
              onCheckedChange={(checked) => updateField("isDummy", checked)}
              label={<span className="text-xs text-amber-200/90">{t("dataStudioEnemyIsDummy")}</span>}
            />
          </div>
        </div>

        <SchemaValidationAlert errors={validationErrors} />
      </CardContent>
    </Card>
  );
};
