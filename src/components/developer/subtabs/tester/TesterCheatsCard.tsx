import React from "react";
import { Shield, Zap, FastForward, Ghost, Heart } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Switch } from "@components/ui";
import { useI18n } from "@context/I18nContext";

export interface TesterCheatsCardProps {
  godMode: boolean;
  infiniteMana: boolean;
  infiniteStamina: boolean;
  noClip: boolean;
  onToggleGodMode: () => void;
  onToggleInfiniteMana: () => void;
  onToggleInfiniteStamina: () => void;
  onToggleNoClip: () => void;
  onSetPlayerHp: (amount: number) => void;
  onRefillVitals: () => void;
}

export const TesterCheatsCard: React.FC<TesterCheatsCardProps> = ({
  godMode,
  infiniteMana,
  infiniteStamina,
  noClip,
  onToggleGodMode,
  onToggleInfiniteMana,
  onToggleInfiniteStamina,
  onToggleNoClip,
  onSetPlayerHp,
  onRefillVitals,
}) => {
  const { t } = useI18n();

  const cheatToggles = [
    {
      id: "godMode",
      label: t("testerGodModeLabel"),
      icon: <Shield size={14} className={godMode ? "text-amber-400" : "text-stone-400"} />,
      checked: godMode,
      onToggle: onToggleGodMode,
    },
    {
      id: "infiniteMana",
      label: t("testerInfManaLabel"),
      icon: <Zap size={14} className={infiniteMana ? "text-cyan-400" : "text-stone-400"} />,
      checked: infiniteMana,
      onToggle: onToggleInfiniteMana,
    },
    {
      id: "infiniteStamina",
      label: t("testerInfStaminaLabel"),
      icon: <FastForward size={14} className={infiniteStamina ? "text-emerald-400" : "text-stone-400"} />,
      checked: infiniteStamina,
      onToggle: onToggleInfiniteStamina,
    },
    {
      id: "noClip",
      label: t("testerNoClipLabel"),
      icon: <Ghost size={14} className={noClip ? "text-purple-400" : "text-stone-400"} />,
      checked: noClip,
      onToggle: onToggleNoClip,
    },
  ];

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Shield className="w-4 h-4 text-amber-400" />}>
          {t("testerCheatsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Cheat Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cheatToggles.map((cheat) => (
            <div
              key={cheat.id}
              className="flex items-center justify-between p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {cheat.icon}
                <span className="text-xs font-semibold text-stone-200">{cheat.label}</span>
              </div>
              <Switch
                checked={cheat.checked}
                onCheckedChange={cheat.onToggle}
                size="sm"
                aria-label={cheat.label}
              />
            </div>
          ))}
        </div>

        {/* Vitals Quick Restores */}
        <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart size={15} className="text-red-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerHpControlsLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => onSetPlayerHp(1)}>
              {t("tester1HpBtn")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSetPlayerHp(50)}>
              {t("tester50HpBtn")}
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Heart size={13} />}
              onClick={onRefillVitals}
            >
              {t("testerRefillAllBtn")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterCheatsCard;
