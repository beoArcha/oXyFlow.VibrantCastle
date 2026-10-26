import React from "react";
import { Sparkles, Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Paragraph, Text, IconText, List, ListItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface GameCombatTipsSectionProps {
  readonly className?: string;
}

export const GameCombatTipsSection = ({
  className,
}: GameCombatTipsSectionProps = {}): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
          {t("crouchAimTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
        <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
          <Text family="serif" weight="bold" size="sm" variant="amber" className="block mb-1">
            {t("dashAction")}:
          </Text>
          <Paragraph size="xs" variant="default">{t("slideDescription")}</Paragraph>
          <Paragraph size="xs" variant="muted" className="mt-1">{t("backstepDescription")}</Paragraph>
        </div>

        <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
          <Text family="serif" weight="bold" size="sm" variant="amber" className="block mb-1">
            {t("directionalAimingTitle")}:
          </Text>
          <List variant="none" columns={2} className="gap-1.5 text-stone-300">
            <ListItem>
              <IconText size="xs" icon={<Compass size={12} className="text-amber-400" />}>
                {t("aimStraightUp")}
              </IconText>
            </ListItem>
            <ListItem>
              <IconText size="xs" icon={<Compass size={12} className="text-amber-400" />}>
                {t("aim45Up")}
              </IconText>
            </ListItem>
            <ListItem>
              <IconText size="xs" icon={<Compass size={12} className="text-amber-400" />}>
                {t("aim45Down")}
              </IconText>
            </ListItem>
            <ListItem>
              <IconText size="xs" icon={<Compass size={12} className="text-amber-400" />}>
                {t("aimStraightDown")}
              </IconText>
            </ListItem>
          </List>
        </div>
      </CardContent>
    </Card>
  );
};
