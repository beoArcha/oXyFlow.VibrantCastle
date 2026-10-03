import React from "react";
import { Save, FolderOpen, HardDrive, FileJson } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, FileUploadButton } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameSaveSectionProps {
  readonly onSaveToLocalStorage: () => void;
  readonly onLoadFromLocalStorage: () => void;
  readonly onSaveGame: () => void;
  readonly onLoadGame: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly className?: string;
}

export const GameSaveSection = ({
  onSaveToLocalStorage,
  onLoadFromLocalStorage,
  onSaveGame,
  onLoadGame,
  className,
}: GameSaveSectionProps): React.ReactElement => {
  const { t } = useI18n();

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
                <div className="text-xs font-bold text-amber-300">
                  {t("saveStorageBrowserTitle")}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  {t("saveStorageBrowserDesc")}
                </div>
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
                onClick={onLoadFromLocalStorage}
              >
                {t("saveActionQuickLoad")}
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-col justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FileJson className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300">
                  {t("saveStorageFileTitle")}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  {t("saveStorageFileDesc")}
                </div>
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
                onChange={onLoadGame}
                icon={<FolderOpen size={13} className="text-amber-400" />}
                label={t("saveActionImport")}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
