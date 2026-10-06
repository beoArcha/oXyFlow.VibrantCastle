import React, { useState, useMemo } from "react";
import { Bot, Play, FileJson } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Textarea,
  CopyableSnippet,
} from "@ui";
import { useI18n } from "@context/I18nContext";
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
import { SchemaValidationAlert } from "./components/SchemaValidationAlert";
import { SchemaValidationBadge } from "./components/SchemaValidationBadge";

export const AIGeneratorCard: React.FC = () => {
  const { t } = useI18n();

  const [selectedType, setSelectedType] = useState<SupportedSchemaType>("spell");
  const [promptIntent, setPromptIntent] = useState<string>("Create an elemental fire combat spell");
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return JSON.stringify(Object.values(spellsJson.spells)[0], null, 2);
  });

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

  const schemaTypeOptions = useMemo(
    () => [
      { value: "spell", label: t("dataStudioAiTypeSpell") },
      { value: "enemy", label: t("dataStudioAiTypeEnemy") },
      { value: "item", label: t("dataStudioAiTypeItem") },
      { value: "visual_novel", label: t("dataStudioAiTypeVn") },
    ],
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<Bot className="w-4 h-4 text-purple-400" />}>
            {t("dataStudioAiCardTitle")}
          </CardTitle>
          <SchemaValidationBadge
            isValid={validationResult.success}
            errorCount={validationResult.errors.length}
            validLabel={t("dataStudioValidConforming")}
            errorLabelSuffix={t("dataStudioIssuesCount")}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Schema Selector & Intent Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <Select
            id="ai-target-type"
            label={t("dataStudioAiTargetType")}
            value={selectedType}
            onChange={(e) => {
              const nextType = e.target.value as SupportedSchemaType;
              setSelectedType(nextType);
              if (nextType === "spell") setPromptIntent("Create an elemental combat spell");
              if (nextType === "enemy") setPromptIntent("Create a flying cavern beast");
              if (nextType === "item") setPromptIntent("Create a legendary weapon");
              if (nextType === "visual_novel") setPromptIntent("Create a meeting dialogue scene");
            }}
            options={schemaTypeOptions}
            variant="castle"
          />

          <div className="md:col-span-2">
            <Input
              id="ai-prompt-intent"
              label={t("dataStudioAiPromptObjective")}
              value={promptIntent}
              onChange={(e) => setPromptIntent(e.target.value)}
            />
          </div>
        </div>

        {/* Copyable System Prompt Snippet */}
        <CopyableSnippet
          text={promptTemplate}
          title={t("dataStudioAiSystemPrompt")}
          icon={<FileJson size={14} className="text-amber-400" />}
          copyLabel={t("dataStudioAiCopyPrompt")}
          copiedLabel={t("dataStudioAiCopied")}
          maxHeightClass="max-h-36"
        />

        {/* Payload Ingestion Sandbox */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label
              htmlFor="ai-json-sandbox"
              className="text-xs font-semibold uppercase tracking-wider text-stone-400 select-none"
            >
              {t("dataStudioAiSandbox")}
            </label>
            <Button
              variant="secondary"
              size="sm"
              icon={<Play size={12} />}
              onClick={handleLoadSample}
            >
              {t("dataStudioAiLoadSample")}
            </Button>
          </div>
          <Textarea
            id="ai-json-sandbox"
            rows={8}
            className="font-mono text-xs"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={t("dataStudioAiPlaceholder")}
          />
        </div>

        {/* Validation Errors List */}
        <SchemaValidationAlert errors={validationResult.errors} />
      </CardContent>
    </Card>
  );
};
