import React from "react";
import { Users, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, SettingOptionCard } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameModeSectionProps {
  readonly isTwoPlayer: boolean;
  readonly onSelectMode: (twoPlayer: boolean) => void;
  readonly className?: string;
}

export const GameModeSection = ({
  isTwoPlayer,
  onSelectMode,
  className,
}: GameModeSectionProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="default" className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle icon={<Users className="w-4 h-4 text-amber-400" />}>
            {t("gameMode")}
          </CardTitle>
          <Badge variant="amber">
            {isTwoPlayer ? t("gameModeLocalCoop") : t("gameModeSinglePlayer")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingOptionCard
            selected={!isTwoPlayer}
            onSelect={() => onSelectMode(false)}
            variant="amber"
            icon={<User size={20} />}
            title={t("play1P")}
            description={t("characterSoloValenDesc")}
          />
          <SettingOptionCard
            selected={isTwoPlayer}
            onSelect={() => onSelectMode(true)}
            variant="cyan"
            icon={<Users size={20} />}
            title={t("play2P")}
            description={t("characterCoopValenLyraDesc")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
