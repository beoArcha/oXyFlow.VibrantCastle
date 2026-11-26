import React from "react";
import { Users, User, Sparkles, Sun, Compass } from "lucide-react";
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
import {
  PLAYABLE_CHARACTER_PROFILES,
  type CharacterProfile,
} from "@game/characters";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameModeSectionProps {
  readonly isTwoPlayer: boolean;
  readonly onSelectMode: (twoPlayer: boolean) => void;
  readonly primaryCharacter?: "valen" | "aurelia";
  readonly onSelectCharacter?: (characterId: "valen" | "aurelia") => void;
  readonly className?: string;
}

const CharacterLoreFooter: React.FC<{
  readonly profile: CharacterProfile;
  readonly t: (key: string) => string;
}> = ({ profile, t }) => {
  const { baseStats, id } = profile;
  const isValen = id === "valen";
  const spellBonusPct = Math.round((baseStats.spellPowerMultiplier - 1) * 100);

  return (
    <div className="mt-2.5 pt-2 border-t border-stone-800/80 space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tabular-nums">
        <Text size="2xs" family="mono" className="text-rose-300">
          {t("statHealthShort")} {baseStats.maxHp}
        </Text>
        <Text size="2xs" family="mono" className="text-cyan-300">
          {t("statManaShort")} {baseStats.maxMana}
        </Text>
        <Text size="2xs" family="mono" className="text-amber-300">
          {t("statStaminaShort")} {baseStats.maxStamina}
        </Text>
        <Text size="2xs" family="mono" className="text-stone-300">
          {t("statAttackShort")} {baseStats.baseAttack}
        </Text>
        {isValen ? (
          <Text size="2xs" family="mono" className="text-amber-200">
            {t("statDefenseShort")} {baseStats.baseDefense}
          </Text>
        ) : (
          <Text size="2xs" family="mono" className="text-violet-300">
            {t("statSpellShort")} +{spellBonusPct}%
          </Text>
        )}
      </div>

      <div className="flex items-start gap-1.5">
        {isValen ? (
          <Sun size={12} className="text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <Compass size={12} className="text-cyan-300 shrink-0 mt-0.5" />
        )}
        <Text size="2xs" variant="muted" className="leading-snug">
          <Text
            as="span"
            size="2xs"
            weight="semibold"
            className={isValen ? "text-amber-300" : "text-cyan-300"}
          >
            {t(profile.passiveNameKey)}
          </Text>
          {" — "}
          {t(profile.passiveDescKey)}
        </Text>
      </div>
    </div>
  );
};

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
            {PLAYABLE_CHARACTER_PROFILES.map((profile) => {
              const isValen = profile.id === "valen";
              return (
                <SettingOptionCard
                  key={profile.id}
                  id={`character-select-${profile.id}`}
                  selected={primaryCharacter === profile.id}
                  onSelect={() => onSelectCharacter?.(profile.id)}
                  variant={isValen ? "amber" : "cyan"}
                  icon={<CharacterPortrait characterId={profile.id} size="xs" />}
                  title={t(isValen ? "characterValenTitle" : "characterAureliaTitle")}
                  description={t(isValen ? "characterValenDesc" : "characterAureliaDesc")}
                >
                  <CharacterLoreFooter profile={profile} t={t} />
                </SettingOptionCard>
              );
            })}
          </div>

          <Text as="div" size="xs" variant="muted" className="mt-2.5 text-stone-400">
            {t("characterSwapNotice")}
          </Text>
        </div>
      </CardContent>
    </Card>
  );
};
