import React, { useState, useMemo } from "react";
import { Shield } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  CompactNumberStepper,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import itemsJson from "@data/items/items.json";
import {
  validateItem,
  ITEM_TYPES,
  ITEM_RARITIES,
  ItemType,
  ItemRarity,
  ItemJsonSchema,
} from "@lib/schemas/itemSchema";
import { DAMAGE_TYPES, DamageType } from "@lib/schemas/spellsSchema";
import { PresetSelectorHeader } from "./components/PresetSelectorHeader";
import { SchemaValidationAlert } from "./components/SchemaValidationAlert";
import { SchemaValidationBadge } from "./components/SchemaValidationBadge";

export const ItemEditorCard: React.FC = () => {
  const { t } = useI18n();

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
    maxHpBonus: initialItem?.maxHpBonus ?? 0,
    maxManaBonus: initialItem?.maxManaBonus ?? 0,
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

  const validationErrors = useMemo(
    () => (validationResult.success ? [] : validationResult.errors),
    [validationResult]
  );

  const updateField = <K extends keyof ItemJsonSchema>(field: K, value: ItemJsonSchema[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const itemTypeOptions = useMemo(
    () => ITEM_TYPES.map((type) => ({ value: type, label: type })),
    []
  );

  const rarityOptions = useMemo(
    () => ITEM_RARITIES.map((rarity) => ({ value: rarity, label: rarity })),
    []
  );

  const damageTypeOptions = useMemo(
    () => DAMAGE_TYPES.map((dt) => ({ value: dt, label: dt })),
    []
  );

  const presetOptions = useMemo(
    () =>
      existingItems.map((item) => ({
        value: item.id,
        label: `${item.id} (${item.type})`,
      })),
    [existingItems]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Shield className="w-4 h-4 text-emerald-400" />}>
            {t("dataStudioItemCardTitle")}
          </CardTitle>
          <SchemaValidationBadge
            isValid={validationResult.success}
            errorCount={validationErrors.length}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Preset Selector */}
        <PresetSelectorHeader
          selectedValue={selectedItemId}
          onSelect={handleSelectItem}
          options={presetOptions}
          createButtonLabel={t("dataStudioItemCreateNew")}
          onCreateNew={() => {
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
              maxHpBonus: 20,
              maxManaBonus: 10,
            });
          }}
        />

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Input
            id="item-field-id"
            label={t("dataStudioItemId")}
            value={draft.id ?? ""}
            onChange={(e) => updateField("id", e.target.value)}
          />

          <Select
            id="item-field-type"
            label={t("dataStudioItemType")}
            value={draft.type ?? "weapon"}
            onChange={(e) => updateField("type", e.target.value as ItemType)}
            options={itemTypeOptions}
            variant="castle"
          />

          <Select
            id="item-field-rarity"
            label={t("dataStudioItemRarity")}
            value={draft.rarity ?? "common"}
            onChange={(e) => updateField("rarity", e.target.value as ItemRarity)}
            options={rarityOptions}
            variant="castle"
          />

          <Select
            id="item-field-damage-type"
            label={t("dataStudioItemDamageType")}
            value={draft.damageType ?? "physical"}
            onChange={(e) => updateField("damageType", e.target.value as DamageType)}
            options={damageTypeOptions}
            variant="castle"
          />

          <CompactNumberStepper
            id="item-field-attack-bonus"
            label={t("dataStudioItemAttackBonus")}
            value={draft.attackBonus ?? 0}
            min={0}
            max={9999}
            onChange={(val) => updateField("attackBonus", val)}
          />

          <CompactNumberStepper
            id="item-field-defense-bonus"
            label={t("dataStudioItemDefenseBonus")}
            value={draft.defenseBonus ?? 0}
            min={0}
            max={9999}
            onChange={(val) => updateField("defenseBonus", val)}
          />

          <CompactNumberStepper
            id="item-field-max-hp-bonus"
            label={t("dataStudioItemMaxHpBonus")}
            value={draft.maxHpBonus ?? 0}
            min={0}
            max={99999}
            onChange={(val) => updateField("maxHpBonus", val)}
          />

          <CompactNumberStepper
            id="item-field-max-mana-bonus"
            label={t("dataStudioItemMaxManaBonus")}
            value={draft.maxManaBonus ?? 0}
            min={0}
            max={99999}
            onChange={(val) => updateField("maxManaBonus", val)}
          />

          <Input
            id="item-field-icon"
            label={t("dataStudioItemIcon")}
            value={draft.icon ?? ""}
            onChange={(e) => updateField("icon", e.target.value)}
          />
        </div>

        {/* Validation Errors List */}
        <SchemaValidationAlert errors={validationErrors} />
      </CardContent>
    </Card>
  );
};
