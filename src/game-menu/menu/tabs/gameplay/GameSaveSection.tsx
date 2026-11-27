import React, { useState } from "react";
import { Save, FolderOpen, HardDrive, FileJson } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmDialog,
  FileUploadButton,
  Paragraph,
  Text,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameSaveSectionProps {
  readonly onSaveToLocalStorage: () => void;
  readonly onLoadFromLocalStorage: () => void;
  readonly onSaveGame: () => void;
  readonly onLoadGame: (file: File) => void;
  readonly className?: string;
}

type PendingLoad =
  | { readonly kind: "quick" }
  | { readonly kind: "file"; readonly file: File };

export const GameSaveSection = ({
  onSaveToLocalStorage,
  onLoadFromLocalStorage,
  onSaveGame,
  onLoadGame,
  className,
}: GameSaveSectionProps): React.ReactElement => {
  const { t } = useI18n();
  const [pendingLoad, setPendingLoad] = useState<PendingLoad | null>(null);

  const confirmLoad = () => {
    const load = pendingLoad;
    setPendingLoad(null);
    if (!load) return;
    if (load.kind === "quick") {
      onLoadFromLocalStorage();
    } else {
      onLoadGame(load.file);
    }
  };

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <CardTitle icon={<Save className="w-4 h-4 text-amber-400" />}>
          {t("saveLoadTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-col justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <Text size="xs" weight="bold" variant="amber">
                  {t("saveStorageBrowserTitle")}
                </Text>
                <Paragraph size="2xs" variant="muted" className="mt-0.5">
                  {t("saveStorageBrowserDesc")}
                </Paragraph>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                id="save-local-btn"
                variant="primary"
                size="sm"
                icon={<Save size={13} />}
                onClick={onSaveToLocalStorage}
              >
                {t("saveActionQuickSave")}
              </Button>
              <Button
                id="load-local-btn"
                variant="secondary"
                size="sm"
                icon={<FolderOpen size={13} />}
                onClick={() => setPendingLoad({ kind: "quick" })}
              >
                {t("saveActionQuickLoad")}
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-col justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FileJson className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <Text size="xs" weight="bold" variant="amber">
                  {t("saveStorageFileTitle")}
                </Text>
                <Paragraph size="2xs" variant="muted" className="mt-0.5">
                  {t("saveStorageFileDesc")}
                </Paragraph>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                id="save-game-btn"
                variant="secondary"
                size="sm"
                icon={<Save size={13} />}
                onClick={onSaveGame}
              >
                {t("saveActionExport")}
              </Button>
              <FileUploadButton
                id="load-game-file-btn"
                accept=".json"
                onFileSelect={(file) => setPendingLoad({ kind: "file", file })}
                icon={<FolderOpen size={13} className="text-amber-400" />}
                label={t("saveActionImport")}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        isOpen={pendingLoad !== null}
        onClose={() => setPendingLoad(null)}
        onConfirm={confirmLoad}
        title={t("loadSaveConfirmTitle")}
        message={t("loadSaveConfirmMessage")}
        confirmLabel={t("loadSaveConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />
    </Card>
  );
};
