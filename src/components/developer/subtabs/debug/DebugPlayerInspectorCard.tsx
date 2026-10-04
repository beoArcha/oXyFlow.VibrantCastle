import React from "react";
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@ui";
import { Player } from "@game/types";
import { useI18n } from "@context/I18nContext";
import { DebugPlayerStatsSection } from "./DebugPlayerStatsSection";

export interface DebugPlayerInspectorProps {
  p1: Player | null;
  p2: Player | null;
  isTwoPlayer: boolean;
}

export const DebugPlayerInspectorCard: React.FC<DebugPlayerInspectorProps> = React.memo(
  function DebugPlayerInspectorCard({ p1, p2, isTwoPlayer }) {
    const { t } = useI18n();

    return (
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Shield className="w-4 h-4 text-amber-400" />}>
            {t("debugPlayerInspectorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {p1 && <DebugPlayerStatsSection player={p1} playerNumber={1} label={t("p1Tag")} />}
          {isTwoPlayer && p2 && (
            <DebugPlayerStatsSection player={p2} playerNumber={2} label={t("p2Tag")} />
          )}
        </CardContent>
      </Card>
    );
  }
);

DebugPlayerInspectorCard.displayName = "DebugPlayerInspectorCard";

export default DebugPlayerInspectorCard;
