import React, { useState, useMemo } from "react";
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

export const SpellAndSkillEditorCard: React.FC = () => {
  const { t } = useI18n();

  const existingSpells = useMemo(
    () => Object.values(spellsJson.spells as Record<string, SpellJsonSchema>),
    []
  );
  const [selectedSpellId, setSelectedSpellId] = useState<string>(existingSpells[0]?.id ?? "");

  const initialSpell = useMemo(
    () => existingSpells.find((s) => s.id === selectedSpellId) ?? existingSpells[0],
    [existingSpells, selectedSpellId]
  );

  const [draft, setDraft] = useState<Partial<SpellJsonSchema>>(() => ({
    id: initialSpell?.id ?? "spell_new",
    nameKey: initialSpell?.nameKey ?? "spellNew",
    descriptionKey: initialSpell?.descriptionKey ?? "spellNewDesc",
    category: initialSpell?.category ?? "offensive",
    triggerType: initialSpell?.triggerType ?? "action",
    magicDomain: (initialSpell?.magicDomain as MagicDomain) ?? "solar",
    castType: (initialSpell?.castType as SpellCastType) ?? "instant",
    manaCost: initialSpell?.manaCost ?? 20,
    staminaCost: initialSpell?.staminaCost ?? 0,
    cooldownFrames: initialSpell?.cooldownFrames ?? 30,
    damage: initialSpell?.damage ?? 50,
    projectileSpeed: initialSpell?.projectileSpeed ?? 8,
    color: initialSpell?.color ?? "#f59e0b",
    iconName: initialSpell?.iconName ?? "Flame",
  }));

  const handleSelectSpell = (spellId: string) => {
    setSelectedSpellId(spellId);
    const found = existingSpells.find((s) => s.id === spellId);
    if (found) {
      setDraft({ ...found });
    }
  };

  const validationResult = useMemo(() => {
    return validateSpell(draft);
  }, [draft]);

  const validationErrors = useMemo(
    () => (validationResult.success ? [] : validationResult.errors),
    [validationResult]
  );

  const updateField = <K extends keyof SpellJsonSchema>(field: K, value: SpellJsonSchema[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
          <SchemaValidationBadge
            isValid={validationResult.success}
            errorCount={validationErrors.length}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PresetSelectorHeader
          selectedValue={selectedSpellId}
          onSelect={handleSelectSpell}
          options={presetOptions}
          createButtonLabel={t("dataStudioSpellCreateNew")}
          onCreateNew={() => {
            setDraft({
              id: `spell_custom_${Date.now().toString().slice(-4)}`,
              nameKey: "spellCustomName",
              descriptionKey: "spellCustomDesc",
              category: "offensive",
              triggerType: "action",
              magicDomain: "solar",
              castType: "instant",
              manaCost: 25,
              staminaCost: 0,
              cooldownFrames: 30,
              damage: 60,
              projectileSpeed: 9,
              color: "#f59e0b",
              iconName: "Flame",
            });
          }}
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
            <label
              htmlFor="spell-field-color"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
            >
              {t("dataStudioSpellColor")}
            </label>
            <ColorPickerInput
              id="spell-field-color"
              ariaLabel={t("dataStudioSpellColor")}
              value={draft.color ?? "#f59e0b"}
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
