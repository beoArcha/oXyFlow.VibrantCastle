import React, { useState, useMemo } from "react";
import { Wand2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import spellsJson from "@data/skills/spells.json";
import {
  validateSpell,
  MAGIC_DOMAINS,
  SPELL_CAST_TYPES,
  MagicDomain,
  SpellCastType,
  SpellJsonSchema,
} from "@lib/schemas/spellsSchema";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";

export const SpellAndSkillEditorCard: React.FC = () => {
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

  const updateField = <K extends keyof SpellJsonSchema>(field: K, value: SpellJsonSchema[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Wand2 className="w-4 h-4 text-amber-400" />}>
            Spell & Magic Editor
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
        {/* Spell Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-amber-200/80">Select Preset:</label>
          <select
            className="bg-[#140602] border border-amber-900/60 text-amber-100 text-xs rounded px-2 py-1"
            value={selectedSpellId}
            onChange={(e) => handleSelectSpell(e.target.value)}
          >
            {existingSpells.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} ({s.magicDomain})
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
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
          >
            Create New Spell
          </Button>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Spell ID</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.id ?? ""}
              onChange={(e) => updateField("id", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Magic Domain</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.magicDomain ?? "solar"}
              onChange={(e) => updateField("magicDomain", e.target.value as MagicDomain)}
            >
              {MAGIC_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Cast Type</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.castType ?? "instant"}
              onChange={(e) => updateField("castType", e.target.value as SpellCastType)}
            >
              {SPELL_CAST_TYPES.map((castType) => (
                <option key={castType} value={castType}>
                  {castType}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Mana Cost</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.manaCost ?? 0}
              onChange={(e) => updateField("manaCost", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Damage</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.damage ?? 0}
              onChange={(e) => updateField("damage", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Projectile Speed</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.projectileSpeed ?? 0}
              onChange={(e) => updateField("projectileSpeed", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Cooldown Frames</label>
            <input
              type="number"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.cooldownFrames ?? 0}
              onChange={(e) => updateField("cooldownFrames", Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Color (Hex)</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.color ?? ""}
              onChange={(e) => updateField("color", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-amber-200/70">Icon Identifier</label>
            <input
              type="text"
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1"
              value={draft.iconName ?? ""}
              onChange={(e) => updateField("iconName", e.target.value)}
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
