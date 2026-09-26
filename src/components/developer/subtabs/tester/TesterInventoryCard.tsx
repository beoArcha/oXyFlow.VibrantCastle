import React from "react";
import { Swords, Sparkles, Heart, Trash2, Coins } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";

export interface TesterInventoryCardProps {
  onGiveAllWeapons: () => void;
  onUnlockAllSkills: () => void;
  onGivePotions: () => void;
  onClearInventory: () => void;
  onAddGold: (amount: number) => void;
}

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
        {/* Item & Skill buttons */}
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

        {/* Gold buttons */}
        <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-yellow-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerAddGoldLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onAddGold(100)}>
              +100
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAddGold(1000)}>
              +1,000
            </Button>
            <Button size="sm" variant="primary" onClick={() => onAddGold(10000)}>
              +10,000
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterInventoryCard;
