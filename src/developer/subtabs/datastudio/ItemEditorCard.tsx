import React, { useState, useMemo } from "react";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import itemsJson from "@data/items/items.json";
import {
  validateItem,
  ITEM_TYPES,
  ITEM_RARITIES,
  ItemType,
  ItemRarity,
  ItemJsonSchema,
} from "@lib/schemas/itemSchema";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";
import { DAMAGE_TYPES, DamageType } from "@lib/schemas/spellsSchema";

export const ItemEditorCard: React.FC = () => {
  const existingItems = useMemo(
    () => Object.values(itemsJson as Record<string, ItemJsonSchema>),
    []
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(existingItems[0]?.id ?? "");

  const initialItem = useMemo(
    () => existingItems.find((item) => item.id === selectedItemId) ?? existingItems[0],
    [existingItems, selectedItemId]
  );

  const [draft, setDraft] = useState<Partial<ItemJsonSchema>>(() => ({
    id: initialItem?.id ?? "item_new",
    nameKey: initialItem?.nameKey ?? "itemNew",
    descriptionKey: initialItem?.descriptionKey ?? "itemNewDesc",
    type: initialItem?.type ?? "weapon",
    rarity: initialItem?.rarity ?? "common",
    icon: initialItem?.icon ?? "Sword",
    attackBonus: initialItem?.attackBonus ?? 10,
    defenseBonus: initialItem?.defenseBonus ?? 0,
    damageType: initialItem?.damageType ?? "physical",
  }));

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const found = existingItems.find((item) => item.id === itemId);
    if (found) {
      setDraft({ ...found });
    }
  };

  const validationResult = useMemo(() => {
    return validateItem(draft);
  }, [draft]);

  const updateField = <K extends keyof ItemJsonSchema>(field: K, value: ItemJsonSchema[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Shield className="w-4 h-4 text-emerald-400" />}>
            Equipment & Item Editor
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
            value={selectedItemId}
            onChange={(e) => handleSelectItem(e.target.value)}
          >
            {existingItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} ({item.type})
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraft({
                id: `item_custom_${Date.now().toString().slice(-4)}`,
                nameKey: "itemCustomName",
                descriptionKey: "itemCustomDesc",
                type: "weapon",
                rarity: "rare",
                icon: "Sparkles",
                attackBonus: 25,
                defenseBonus: 5,
                damageType: "astral",
              });
            }}
          >
            Create New Item
          </Button>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Item ID</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.id ?? ""}
              onChange={(e) => updateField("id", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Item Type</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.type ?? "weapon"}
              onChange={(e) => updateField("type", e.target.value as ItemType)}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Rarity Tier</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.rarity ?? "common"}
              onChange={(e) => updateField("rarity", e.target.value as ItemRarity)}
            >
              {ITEM_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Damage Type</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.damageType ?? "physical"}
              onChange={(e) => updateField("damageType", e.target.value as DamageType)}
            >
              {DAMAGE_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Attack Bonus</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.attackBonus ?? 0}
              onChange={(e) => updateField("attackBonus", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Defense Bonus</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.defenseBonus ?? 0}
              onChange={(e) => updateField("defenseBonus", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Max HP Bonus</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.maxHpBonus ?? 0}
              onChange={(e) => updateField("maxHpBonus", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Max Mana Bonus</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.maxManaBonus ?? 0}
              onChange={(e) => updateField("maxManaBonus", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Icon Identifier</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.icon ?? ""}
              onChange={(e) => updateField("icon", e.target.value)}
            />
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
