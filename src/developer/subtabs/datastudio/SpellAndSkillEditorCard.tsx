import React, { useMemo } from "react";
import { Wand2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  ColorPickerInput,
  CompactNumberStepper,
  Label,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import spellsJson from "@data/skills/spells.json";
import {
  validateSpell,
  MAGIC_DOMAINS,
  SPELL_CAST_TYPES,
  MagicDomain,
  SpellCastType,
  SpellJsonSchema,
} from "@lib/schemas/spellsSchema";
import { PresetSelectorHeader } from "./components/PresetSelectorHeader";
import { SchemaValidationAlert } from "./components/SchemaValidationAlert";
import { SchemaValidationBadge } from "./components/SchemaValidationBadge";
import { ExportToolbar } from "./components/ExportToolbar";
import { useEntityDraft } from "./hooks/useEntityDraft";
import { createDefaultSpellDraft } from "./services/entityDraftFactory";

export const SpellAndSkillEditorCard: React.FC = () => {
  const { t } = useI18n();

  const existingSpells = useMemo(
    () => Object.values(spellsJson.spells as Record<string, SpellJsonSchema>),
    []
  );

  const {
    selectedId: selectedSpellId,
    draft,
    updateField,
    validationResult,
    validationErrors,
    handleSelectPreset: handleSelectSpell,
    handleCreateNew,
  } = useEntityDraft<SpellJsonSchema>({
    initialItems: existingSpells,
    createDefaultDraft: createDefaultSpellDraft,
    validate: validateSpell,
  });

  const domainOptions = useMemo(
    () => MAGIC_DOMAINS.map((domain) => ({ value: domain, label: domain })),
    []
  );

  const castTypeOptions = useMemo(
    () => SPELL_CAST_TYPES.map((castType) => ({ value: castType, label: castType })),
    []
  );

  const presetOptions = useMemo(
    () =>
      existingSpells.map((s) => ({
        value: s.id,
        label: `${s.id} (${s.magicDomain})`,
      })),
    [existingSpells]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Wand2 className="w-4 h-4 text-amber-400" />}>
            {t("dataStudioSpellCardTitle")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExportToolbar
              data={draft}
              filename={`${draft.id || "spell"}.json`}
              modalTitle={`${t("dataStudioExportModalTitle")}: ${draft.id || "spell"}`}
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
          selectedValue={selectedSpellId}
          onSelect={handleSelectSpell}
          options={presetOptions}
          createButtonLabel={t("dataStudioSpellCreateNew")}
          onCreateNew={handleCreateNew}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Input
            id="spell-field-id"
            label={t("dataStudioSpellId")}
            value={draft.id ?? ""}
            onChange={(e) => updateField("id", e.target.value)}
          />

          <Select
            id="spell-field-magic-domain"
            label={t("dataStudioSpellDomain")}
            value={draft.magicDomain ?? "solar"}
            onChange={(e) => updateField("magicDomain", e.target.value as MagicDomain)}
            options={domainOptions}
            variant="castle"
          />

          <Select
            id="spell-field-cast-type"
            label={t("dataStudioSpellCastType")}
            value={draft.castType ?? "instant"}
            onChange={(e) => updateField("castType", e.target.value as SpellCastType)}
            options={castTypeOptions}
            variant="castle"
          />

          <CompactNumberStepper
            id="spell-field-mana-cost"
            label={t("dataStudioSpellManaCost")}
            value={draft.manaCost ?? 0}
            min={0}
            max={999}
            onChange={(val) => updateField("manaCost", val)}
          />

          <CompactNumberStepper
            id="spell-field-damage"
            label={t("dataStudioSpellDamage")}
            value={draft.damage ?? 0}
            min={0}
            max={9999}
            onChange={(val) => updateField("damage", val)}
          />

          <CompactNumberStepper
            id="spell-field-projectile-speed"
            label={t("dataStudioSpellProjectileSpeed")}
            value={draft.projectileSpeed ?? 0}
            min={0}
            max={100}
            step={0.5}
            onChange={(val) => updateField("projectileSpeed", val)}
          />

          <CompactNumberStepper
            id="spell-field-cooldown"
            label={t("dataStudioSpellCooldown")}
            value={draft.cooldownFrames ?? 0}
            min={0}
            max={600}
            onChange={(val) => updateField("cooldownFrames", val)}
          />

          <div className="flex flex-col gap-1 text-left">
            <Label
              htmlFor="spell-field-color"
              size="xs"
              uppercase
              className="text-stone-400 select-none"
            >
              {t("dataStudioSpellColor")}
            </Label>
            <ColorPickerInput
              id="spell-field-color"
              ariaLabel={t("dataStudioSpellColor")}
              value={draft.color ?? ""}
              onChange={(hex) => updateField("color", hex)}
            />
          </div>

          <Input
            id="spell-field-icon"
            label={t("dataStudioSpellIcon")}
            value={draft.iconName ?? ""}
            onChange={(e) => updateField("iconName", e.target.value)}
          />
        </div>

        <SchemaValidationAlert errors={validationErrors} />
      </CardContent>
    </Card>
  );
};
