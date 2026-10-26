import React, { useState } from "react";
import {
  Grid,
  Upload,
  FileJson,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  FileUploadButton,
  Tooltip,
  ConfirmDialog,
  Text,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { AtlasPresetSelector } from "./AtlasPresetSelector";

export interface AtlasHeaderToolbarProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onJsonUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
}

export const AtlasHeaderToolbar: React.FC<AtlasHeaderToolbarProps> = ({
  selectedPresetId,
  onSelectPreset,
  onImageUpload,
  onJsonUpload,
  onResetDefaults,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const { t } = useI18n();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  return (
    <>
      <Card variant="default">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CardTitle icon={<Grid className="w-4 h-4 text-amber-400" />}>
                {t("subtabAtlasSlicer")}
              </CardTitle>
              <Badge variant="amber">Studio v3 Pro</Badge>
            </div>

            <AtlasPresetSelector
              selectedPresetId={selectedPresetId}
              onSelectPreset={onSelectPreset}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FileUploadButton
              accept="image/png,image/jpeg"
              onChange={onImageUpload}
              icon={<Upload size={12} />}
              label={t("atlasStudioUploadImage")}
            />

            <FileUploadButton
              accept="application/json,.json"
              onChange={onJsonUpload}
              icon={<FileJson size={12} />}
              label={t("atlasStudioLoadJsonFile")}
            />

            <Tooltip content={t("atlasStudioResetDefaults")}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsResetConfirmOpen(true)}
                className="h-8 px-2.5"
              >
                <RotateCcw size={13} />
              </Button>
            </Tooltip>

            <Tooltip
              content={
                isInspectorOpen
                  ? t("atlasStudioCollapseInspector")
                  : t("atlasStudioExpandInspector")
              }
            >
              <Button
                size="sm"
                variant={isInspectorOpen ? "secondary" : "primary"}
                onClick={onToggleInspector}
                className="h-8 px-2.5 flex items-center gap-1.5"
              >
                {isInspectorOpen ? (
                  <PanelRightClose size={13} />
                ) : (
                  <PanelRightOpen size={13} />
                )}
                <Text as="span" size="xs" weight="semibold" className="hidden sm:inline">
                  {isInspectorOpen
                    ? t("atlasStudioCollapseInspector")
                    : t("atlasStudioExpandInspector")}
                </Text>
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
      </Card>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetDefaults();
        }}
        title={t("atlasStudioResetDefaults")}
        message={
          t("atlasStudioResetDefaultsConfirm") ||
          "Are you sure you want to reset all modifications to defaults? Unsaved slicing and track changes will be lost."
        }
        confirmLabel={t("atlasStudioResetConfirm") || "Reset"}
        cancelLabel={t("cancel") || "Cancel"}
        confirmVariant="danger"
      />
    </>
  );
};

export default AtlasHeaderToolbar;
