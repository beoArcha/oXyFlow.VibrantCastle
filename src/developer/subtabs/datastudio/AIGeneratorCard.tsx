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
import { SchemaValidationAlert } from "./components/SchemaValidationAlert";
import { SchemaValidationBadge } from "./components/SchemaValidationBadge";
import {
  validateSchemaPayload,
  getCanonicalSampleJson,
} from "./services/aiGeneratorService";

export const AIGeneratorCard: React.FC = () => {
  const { t } = useI18n();

  const [selectedType, setSelectedType] = useState<SupportedSchemaType>("spell");
  const [promptIntent, setPromptIntent] = useState<string>(() => t("dataStudioAiIntentSpell"));
  const [jsonInput, setJsonInput] = useState<string>(() => getCanonicalSampleJson("spell"));

  const promptTemplate = useMemo(() => {
    return buildAiPromptTemplate(selectedType, promptIntent);
  }, [selectedType, promptIntent]);

  const validationResult = useMemo(() => {
    return validateSchemaPayload(
      selectedType,
      jsonInput,
      t("dataStudioAiErrorEmpty"),
      t("dataStudioAiErrorMalformed")
    );
  }, [selectedType, jsonInput, t]);

  const handleLoadSample = () => {
    setJsonInput(getCanonicalSampleJson(selectedType));
  };

  const handleTypeChange = (nextType: SupportedSchemaType) => {
    setSelectedType(nextType);
    if (nextType === "spell") setPromptIntent(t("dataStudioAiIntentSpell"));
    if (nextType === "enemy") setPromptIntent(t("dataStudioAiIntentEnemy"));
    if (nextType === "item") setPromptIntent(t("dataStudioAiIntentItem"));
    if (nextType === "visual_novel") setPromptIntent(t("dataStudioAiIntentVn"));
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <Select
            id="ai-target-type"
            label={t("dataStudioAiTargetType")}
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as SupportedSchemaType)}
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

        <CopyableSnippet
          text={promptTemplate}
          title={t("dataStudioAiSystemPrompt")}
          icon={<FileJson size={14} className="text-amber-400" />}
          copyLabel={t("dataStudioAiCopyPrompt")}
          copiedLabel={t("dataStudioAiCopied")}
          maxHeightClass="max-h-36"
        />

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

        <SchemaValidationAlert errors={validationResult.errors} />
      </CardContent>
    </Card>
  );
};

