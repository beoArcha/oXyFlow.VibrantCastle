import React from "react";
import { Save, FolderOpen, RotateCcw } from "lucide-react";
import { Button, FileUploadButton } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameConfigBarSectionProps {
  readonly onExportSettings: () => void;
  readonly onImportSettings: (file: File) => Promise<boolean | void>;
  readonly onResetDefaults: () => void;
  readonly onRestartLocation: () => void;
  readonly className?: string;
}

export const GameConfigBarSection = ({
  onExportSettings,
  onImportSettings,
  onResetDefaults,
  onRestartLocation,
  className,
}: GameConfigBarSectionProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "p-3.5 rounded-xl bg-[#140602] border border-[#4a200e] flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Save size={13} />}
          onClick={onExportSettings}
          title={t("settingsExportTooltip")}
        >
          {t("settingsExportBtn")}
        </Button>

        <FileUploadButton
          id="import-settings-file-btn"
          accept=".json"
          onFileSelect={onImportSettings}
          icon={<FolderOpen size={13} className="text-amber-400" />}
          label={t("settingsImportBtn")}
          variant="secondary"
          size="sm"
        />

        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw size={13} />}
          onClick={onResetDefaults}
        >
          {t("settingsDefaultsBtn")}
        </Button>
      </div>

      <Button
        id="restart-level-btn"
        variant="secondary"
        size="sm"
        icon={<RotateCcw size={13} />}
        onClick={onRestartLocation}
        className="border-amber-700/60 hover:border-amber-500"
      >
        {t("restartLocation")}
      </Button>
    </div>
  );
};

