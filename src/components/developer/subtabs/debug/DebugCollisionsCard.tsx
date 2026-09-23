import React from "react";
import { Eye, Activity, Crosshair, Ghost } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import { debugManager } from "../../../../game/debug/debugManager";

export interface DebugCollisionsProps {
  showHitboxes: boolean;
  showProfiler: boolean;
  clickToTeleport: boolean;
  freezeAI: boolean;
}

export const DebugCollisionsCard: React.FC<DebugCollisionsProps> = ({
  showHitboxes,
  showProfiler,
  clickToTeleport,
  freezeAI,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
          {t("debugCollisionSensorTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Button
          variant={showHitboxes ? "primary" : "secondary"}
          icon={<Eye size={14} />}
          onClick={() => debugManager.toggleHitboxes()}
          className="text-xs"
        >
          {t("debugToggleHitboxes")}: {showHitboxes ? t("testerStatusOn") : t("testerStatusOff")}
        </Button>

        <Button
          variant={showProfiler ? "primary" : "secondary"}
          icon={<Activity size={14} />}
          onClick={() => debugManager.toggleProfiler()}
          className="text-xs"
        >
          {t("debugToggleProfiler")}: {showProfiler ? t("testerStatusOn") : t("testerStatusOff")}
        </Button>

        <Button
          variant={clickToTeleport ? "primary" : "secondary"}
          icon={<Crosshair size={14} />}
          onClick={() => debugManager.toggleClickToTeleport()}
          className="text-xs"
        >
          {t("testerClickTeleportLabel")}{" "}
          {clickToTeleport ? t("testerStatusOn") : t("testerStatusOff")}
        </Button>

        <Button
          variant={freezeAI ? "primary" : "secondary"}
          icon={<Ghost size={14} />}
          onClick={() => debugManager.toggleFreezeAI()}
          className="text-xs"
        >
          {t("testerFreezeAiLabel")} {freezeAI ? t("testerStatusOn") : t("testerStatusOff")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DebugCollisionsCard;
