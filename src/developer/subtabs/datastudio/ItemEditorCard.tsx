import React, { useMemo } from "react";
import { Shield } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  CompactNumberStepper,
  ItemSlot,
  Text,
  Paragraph,
  MetaItem,
  Badge,
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
import { ExportToolbar } from "./components/ExportToolbar";
import { useEntityDraft } from "./hooks/useEntityDraft";
import { createDefaultItemDraft } from "./services/entityDraftFactory";

export const ItemEditorCard: React.FC = () => {
  const { t } = useI18n();

  const existingItems = useMemo(
    () => Object.values(itemsJson as Record<string, ItemJsonSchema>),
    []
  );

  const {
    selectedId: selectedItemId,
    draft,
    updateField,
    validationResult,
    validationErrors,
    handleSelectPreset: handleSelectItem,
    handleCreateNew,
  } = useEntityDraft<ItemJsonSchema>({
    initialItems: existingItems,
    createDefaultDraft: createDefaultItemDraft,
    validate: validateItem,
  });

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
          <div className="flex items-center gap-2">
            <ExportToolbar
              data={draft}
              filename={`${draft.id || "item"}.json`}
              modalTitle={`${t("dataStudioExportModalTitle")}: ${draft.id || "item"}`}
              isValid={validationResult.success}
            />
            <SchemaValidationBadge
              isValid={validationResult.success}
              errorCount={validationErrors.length}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PresetSelectorHeader
          selectedValue={selectedItemId}
          onSelect={handleSelectItem}
          options={presetOptions}
          createButtonLabel={t("dataStudioItemCreateNew")}
          onCreateNew={handleCreateNew}
        />

        {/* Visual Item Preview & Properties */}
        <div className="flex items-center gap-4 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg flex-wrap sm:flex-nowrap">
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <ItemSlot
              size="lg"
              rarity={draft.rarity}
              slot={{
                id: draft.id,
                icon: draft.icon,
                rarity: draft.rarity,
                label: draft.id,
              }}
            />
            <Text as="span" family="mono" size="3xs" weight="semibold" uppercase className="tracking-wider text-amber-300">
              {draft.rarity ?? "common"}
            </Text>
          </div>
          <div className="flex-1 flex flex-col gap-1 text-xs text-stone-300">
            <div className="flex items-center justify-between">
              <Text as="strong" size="sm" weight="semibold" className="text-amber-200">{draft.id}</Text>
              <Text as="span" family="mono" weight="semibold" uppercase className="text-amber-400">{draft.type}</Text>
            </div>
            <Paragraph size="2xs" variant="muted" italic>
              {draft.descriptionKey ? t(draft.descriptionKey) : draft.descriptionKey}
            </Paragraph>
            <div className="flex items-center gap-3 text-stone-300 pt-1 flex-wrap">
              {draft.attackBonus ? <MetaItem label="ATK" value={`+${draft.attackBonus}`} size="2xs" mono /> : null}
              {draft.defenseBonus ? <MetaItem label="DEF" value={`+${draft.defenseBonus}`} size="2xs" mono /> : null}
              {draft.maxHpBonus ? <MetaItem label="HP" value={`+${draft.maxHpBonus}`} size="2xs" mono /> : null}
              {draft.maxManaBonus ? <MetaItem label="MP" value={`+${draft.maxManaBonus}`} size="2xs" mono /> : null}
              {draft.damageType ? <Badge size="sm" variant="amber" className="text-amber-300">[{draft.damageType}]</Badge> : null}
            </div>
          </div>
        </div>

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

        <SchemaValidationAlert errors={validationErrors} />
      </CardContent>
    </Card>
  );
};
