import React, { useState, useMemo } from "react";
import { Bot, CheckCircle2, AlertTriangle, Copy, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import {
  SupportedSchemaType,
  buildAiPromptTemplate,
} from "@lib/schemas/openapiExporter";
import { validateSpell } from "@lib/schemas/spellsSchema";
import { validateEnemy } from "@lib/schemas/enemySchema";
import { validateItem } from "@lib/schemas/itemSchema";
import { validateVisualNovelScene } from "@lib/schemas/visualNovelSchema";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";
import spellsJson from "@data/skills/spells.json";
import enemiesJson from "@data/enemies/enemies.json";
import itemsJson from "@data/items/items.json";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";

export const AIGeneratorCard: React.FC = () => {
  const [selectedType, setSelectedType] = useState<SupportedSchemaType>("spell");
  const [promptIntent, setPromptIntent] = useState<string>("Create an elemental fire combat spell");
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return JSON.stringify(Object.values(spellsJson.spells)[0], null, 2);
  });
  const [copied, setCopied] = useState<boolean>(false);

  const promptTemplate = useMemo(() => {
    return buildAiPromptTemplate(selectedType, promptIntent);
  }, [selectedType, promptIntent]);

  const validationResult = useMemo<{ success: boolean; errors: ValidationErrorDetail[] }>(() => {
    if (!jsonInput.trim()) {
      return { success: false, errors: [{ path: "root", message: "Empty JSON input" }] };
    }

    try {
      const parsed = JSON.parse(jsonInput);
      switch (selectedType) {
        case "spell": {
          const res = validateSpell(parsed);
          return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
        }
        case "enemy": {
          const res = validateEnemy(parsed);
          return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
        }
        case "item": {
          const res = validateItem(parsed);
          return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
        }
        case "visual_novel": {
          const res = validateVisualNovelScene(parsed);
          return res.success ? { success: true, errors: [] } : { success: false, errors: res.errors };
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        errors: [{ path: "syntax", message: `Malformed JSON: ${message}` }],
      };
    }
  }, [jsonInput, selectedType]);

  const handleLoadSample = () => {
    let sample: unknown;
    switch (selectedType) {
      case "spell":
        sample = Object.values(spellsJson.spells)[0];
        break;
      case "enemy":
        sample = Object.values(enemiesJson.enemies)[0];
        break;
      case "item":
        sample = Object.values(itemsJson)[0];
        break;
      case "visual_novel":
        sample = Object.values(dialoguesVnJson.scenes)[0];
        break;
    }
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  const handleCopyPrompt = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(promptTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Bot className="w-4 h-4 text-purple-400" />}>
            AI Structured Outputs & Schema Generator
          </CardTitle>
          <div className="flex items-center gap-2">
            {validationResult.success ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                <CheckCircle2 size={13} /> Valid Conforming Payload
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded">
                <AlertTriangle size={13} /> {validationResult.errors.length} Issue(s)
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Schema Selector & Intent Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-amber-200/80 font-medium">Target Entity Type:</label>
            <select
              className="bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2 py-1.5"
              value={selectedType}
              onChange={(e) => {
                const nextType = e.target.value as SupportedSchemaType;
                setSelectedType(nextType);
                if (nextType === "spell") setPromptIntent("Create an elemental combat spell");
                if (nextType === "enemy") setPromptIntent("Create a flying cavern beast");
                if (nextType === "item") setPromptIntent("Create a legendary weapon");
                if (nextType === "visual_novel") setPromptIntent("Create a meeting dialogue scene");
              }}
            >
              <option value="spell">Magic Spell (SpellSchema)</option>
              <option value="enemy">Enemy Monster (EnemySchema)</option>
              <option value="item">Equipment Item (ItemSchema)</option>
              <option value="visual_novel">Visual Novel Scene (VisualNovelSchema)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-amber-200/80 font-medium">Design Intent / Prompt Objective:</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-[#140602] border border-amber-900/60 text-amber-100 rounded px-2.5 py-1.5"
                value={promptIntent}
                onChange={(e) => setPromptIntent(e.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy size={13} />}
                onClick={handleCopyPrompt}
              >
                {copied ? "Copied!" : "Copy Prompt"}
              </Button>
            </div>
          </div>
        </div>

        {/* JSON Schema Prompt Preview */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-200/60 uppercase tracking-wider">
            Generated LLM System Prompt (with Inlined JSON Schema):
          </label>
          <pre className="bg-[#0b0301] border border-amber-950 rounded p-2.5 text-[11px] font-mono text-amber-200/80 max-h-36 overflow-auto select-all whitespace-pre-wrap">
            {promptTemplate}
          </pre>
        </div>

        {/* Payload Ingestion & Real-Time Validator */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-amber-200/80 uppercase tracking-wider">
              JSON Output Validation Sandbox:
            </label>
            <Button
              variant="secondary"
              size="sm"
              icon={<Play size={12} />}
              onClick={handleLoadSample}
            >
              Load Canonical Sample
            </Button>
          </div>
          <textarea
            rows={8}
            className="w-full bg-[#120502] border border-amber-900/70 rounded p-2.5 font-mono text-xs text-amber-100 focus:outline-none focus:border-amber-600"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste generated JSON here for instant schema compliance check..."
          />
        </div>

        {/* Errors list */}
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
