import React from "react";
import { Users, User, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  SettingOptionCard,
  Text,
} from "@ui";
import { CharacterPortrait } from "@game-menu/character";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameModeSectionProps {
  readonly isTwoPlayer: boolean;
  readonly onSelectMode: (twoPlayer: boolean) => void;
  readonly primaryCharacter?: "valen" | "aurelia";
  readonly onSelectCharacter?: (characterId: "valen" | "aurelia") => void;
  readonly className?: string;
}

export const GameModeSection = ({
  isTwoPlayer,
  onSelectMode,
  primaryCharacter = "valen",
  onSelectCharacter,
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingOptionCard
            id="gamemode-select-1p"
            selected={!isTwoPlayer}
            onSelect={() => onSelectMode(false)}
            variant="amber"
            icon={<User size={20} />}
            title={t("play1P")}
            description={t("characterSoloValenDesc")}
          />
          <SettingOptionCard
            id="gamemode-select-2p"
            selected={isTwoPlayer}
            onSelect={() => onSelectMode(true)}
            variant="cyan"
            icon={<Users size={20} />}
            title={t("play2P")}
            description={t("characterCoopValenLyraDesc")}
          />
        </div>

        <div className="pt-3 border-t border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
              {t("characterSelectTitle")}
            </CardTitle>
            <Badge variant={primaryCharacter === "aurelia" ? "cyan" : "amber"}>
              {primaryCharacter === "aurelia"
                ? t("characterAureliaTitle")
                : t("characterValenTitle")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingOptionCard
              id="character-select-valen"
              selected={primaryCharacter === "valen"}
              onSelect={() => onSelectCharacter?.("valen")}
              variant="amber"
              icon={<CharacterPortrait characterId="valen" size="xs" />}
              title={t("characterValenTitle")}
              description={t("characterValenDesc")}
            />
            <SettingOptionCard
              id="character-select-aurelia"
              selected={primaryCharacter === "aurelia"}
              onSelect={() => onSelectCharacter?.("aurelia")}
              variant="cyan"
              icon={<CharacterPortrait characterId="aurelia" size="xs" />}
              title={t("characterAureliaTitle")}
              description={t("characterAureliaDesc")}
            />
          </div>

          <Text as="div" size="xs" variant="muted" className="mt-2.5 text-stone-400">
            {t("characterSwapNotice")}
          </Text>
        </div>
      </CardContent>
    </Card>
  );
};
