import React from "react";
import { Shield, Zap, FastForward, Ghost, Heart } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@components/ui";
import { useI18n } from "@hooks/useI18n";

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
          <Button
            variant={godMode ? "primary" : "secondary"}
            icon={<Shield size={14} />}
            onClick={onToggleGodMode}
          >
            {t("testerGodModeLabel")}{" "}
            {godMode ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
          <Button
            variant={infiniteMana ? "primary" : "secondary"}
            icon={<Zap size={14} />}
            onClick={onToggleInfiniteMana}
          >
            {t("testerInfManaLabel")}{" "}
            {infiniteMana ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
          <Button
            variant={infiniteStamina ? "primary" : "secondary"}
            icon={<FastForward size={14} />}
            onClick={onToggleInfiniteStamina}
          >
            {t("testerInfStaminaLabel")}{" "}
            {infiniteStamina ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
          <Button
            variant={noClip ? "primary" : "secondary"}
            icon={<Ghost size={14} />}
            onClick={onToggleNoClip}
          >
            {t("testerNoClipLabel")}{" "}
            {noClip ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>
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
