import React, { useState } from "react";
import { Save, FolderOpen, RotateCcw } from "lucide-react";
import { Button, ConfirmDialog, FileUploadButton } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameConfigBarSectionProps {
  readonly onExportSettings: () => void;
  readonly onImportSettings: (file: File) => Promise<boolean | void>;
  readonly onResetDefaults: () => void;
  readonly onRestartLocation?: () => void;
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
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

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
          onFileSelect={(file) => setPendingImport(file)}
          icon={<FolderOpen size={13} className="text-amber-400" />}
          label={t("settingsImportBtn")}
          variant="secondary"
          size="sm"
        />

        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw size={13} />}
          onClick={() => setConfirmReset(true)}
        >
          {t("settingsDefaultsBtn")}
        </Button>
      </div>

      {onRestartLocation && (
        <Button
          id="restart-level-btn"
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={13} />}
          onClick={() => setConfirmRestart(true)}
          className="border-amber-700/60 hover:border-amber-500"
        >
          {t("restartLocation")}
        </Button>
      )}

      <ConfirmDialog
        isOpen={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          const file = pendingImport;
          setPendingImport(null);
          if (file) void onImportSettings(file);
        }}
        title={t("settingsImportConfirmTitle")}
        message={t("settingsImportConfirmMessage")}
        confirmLabel={t("settingsImportConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          onResetDefaults();
        }}
        title={t("settingsResetConfirmTitle")}
        message={t("settingsResetConfirmMessage")}
        confirmLabel={t("settingsResetConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />

      {onRestartLocation && (
        <ConfirmDialog
          isOpen={confirmRestart}
          onClose={() => setConfirmRestart(false)}
          onConfirm={() => {
            setConfirmRestart(false);
            onRestartLocation();
          }}
          title={t("restartConfirmTitle")}
          message={t("restartConfirmMessage")}
          confirmLabel={t("restartConfirmLabel")}
          cancelLabel={t("confirmCancelBtn")}
        />
      )}
    </div>
  );
};
