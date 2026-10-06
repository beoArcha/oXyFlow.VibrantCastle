import React, { useState, useMemo } from "react";
import { Skull, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import enemiesJson from "@data/enemies/enemies.json";
import {
  validateEnemy,
  SOUL_TYPES,
  SoulType,
  EnemyJsonSchema,
  EnemyStatsSchema,
} from "@lib/schemas/enemySchema";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";

export const EnemyEditorCard: React.FC = () => {
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

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Skull className="w-4 h-4 text-rose-400" />}>
            Enemy & Creature Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            {validationResult.success ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                <CheckCircle2 size={13} /> Valid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded">
                <AlertTriangle size={13} /> {validationResult.errors.length} Error(s)
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-amber-200/80">Select Preset:</label>
          <select
            className="bg-[#140602] border border-amber-900/60 text-amber-100 text-xs rounded px-2 py-1"
            value={selectedEnemyId}
            onChange={(e) => handleSelectEnemy(e.target.value)}
          >
            {existingEnemies.map((e) => (
              <option key={e.id} value={e.id}>
                {e.defaultName} ({e.id})
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
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
          >
            Create New Enemy
          </Button>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Enemy ID</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.id ?? ""}
              onChange={(e) => updateField("id", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Default Name</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.defaultName ?? ""}
              onChange={(e) => updateField("defaultName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Category</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.category ?? "standard"}
              onChange={(e) => updateField("category", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Health</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.stats?.health ?? 100}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateStat("health", val);
                updateStat("maxHealth", val);
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Attack Power</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.stats?.attackPower ?? 10}
              onChange={(e) => updateStat("attackPower", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Speed</label>
            <input
              type="number"
              step="0.1"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.stats?.speed ?? 1}
              onChange={(e) => updateStat("speed", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Width (px)</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.dimensions?.width ?? 32}
              onChange={(e) =>
                updateField("dimensions", {
                  width: Number(e.target.value),
                  height: draft.dimensions?.height ?? 32,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Height (px)</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.dimensions?.height ?? 32}
              onChange={(e) =>
                updateField("dimensions", {
                  width: draft.dimensions?.width ?? 32,
                  height: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Color Hex</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.proceduralFallback?.bodyColor ?? "#dc2626"}
              onChange={(e) =>
                updateField("proceduralFallback", {
                  bodyColor: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isAerialCheckbox"
              className="accent-amber-500 rounded"
              checked={draft.isAerial ?? false}
              onChange={(e) => updateField("isAerial", e.target.checked)}
            />
            <label htmlFor="isAerialCheckbox" className="text-amber-200/80 cursor-pointer">
              Aerial Flying Enemy
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDummyCheckbox"
              className="accent-amber-500 rounded"
              checked={draft.isDummy ?? false}
              onChange={(e) => updateField("isDummy", e.target.checked)}
            />
            <label htmlFor="isDummyCheckbox" className="text-amber-200/80 cursor-pointer">
              Training Dummy
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Soul Type</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
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
            >
              {SOUL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Errors List */}
        {!validationResult.success && (
          <div className="bg-rose-950/40 border border-rose-900/50 rounded p-2 text-xs text-rose-300 flex flex-col gap-1">
            <div className="font-semibold text-rose-400">Schema Validation Errors:</div>
            {validationResult.errors.map((err: ValidationErrorDetail, i: number) => (
              <div key={i} className="font-mono text-[11px]">
                • <span className="text-amber-300">{err.path}</span>: {err.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
