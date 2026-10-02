import React from "react";
import { Swords, Sparkles, Heart, Trash2, Coins } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { GOLD_PRESETS } from "./constants";
import { TesterInventoryCardProps } from "./types";

/**
 * Presentation card for weapon grants, skill unlocks, potion supplies and economy injection.
 */
export const TesterInventoryCard: React.FC<TesterInventoryCardProps> = ({
  onGiveAllWeapons,
  onUnlockAllSkills,
  onGivePotions,
  onClearInventory,
  onAddGold,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Swords className="w-4 h-4 text-amber-400" />}>
          {t("testerItemsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="secondary"
            icon={<Swords size={14} />}
            onClick={onGiveAllWeapons}
          >
            {t("testerGiveWeaponsBtn")}
          </Button>
          <Button
            variant="secondary"
            icon={<Sparkles size={14} />}
            onClick={onUnlockAllSkills}
          >
            {t("testerUnlockSpellsBtn")}
          </Button>
          <Button
            variant="secondary"
            icon={<Heart size={14} />}
            onClick={onGivePotions}
          >
            {t("testerGivePotionsBtn")}
          </Button>
          <Button
            variant="secondary"
            icon={<Trash2 size={14} />}
            onClick={onClearInventory}
          >
            {t("testerClearInventoryBtn")}
          </Button>
        </div>

        <Card variant="dark" className="flex items-center justify-between p-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-yellow-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerAddGoldLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {GOLD_PRESETS.map((amount) => (
              <Button
                key={amount}
                size="sm"
                variant={amount >= 10000 ? "primary" : "secondary"}
                onClick={() => onAddGold(amount)}
              >
                +{amount.toLocaleString()}
              </Button>
            ))}
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export default TesterInventoryCard;
