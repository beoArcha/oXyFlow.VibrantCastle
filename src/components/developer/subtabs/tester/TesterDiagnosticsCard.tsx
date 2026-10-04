import React from "react";
import { Eye, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Switch } from "@ui";
import { useI18n } from "@context/I18nContext";
import { TesterDiagnosticsCardProps } from "./types";

/**
 * Presentation card for collision hitboxes and performance profiler diagnostic overlays.
 */
export const TesterDiagnosticsCard: React.FC<TesterDiagnosticsCardProps> = ({
  showHitboxes,
  showProfiler,
  onToggleHitboxes,
  onToggleProfiler,
}) => {
  const { t } = useI18n();

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
          {t("testerHitboxesTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center justify-between p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
          <div className="flex items-center gap-2">
            <Eye size={14} className={showHitboxes ? "text-amber-400" : "text-stone-400"} />
            <span className="text-xs font-semibold text-stone-200">{t("testerHitboxesLabel")}</span>
          </div>
          <Switch
            checked={showHitboxes}
            onCheckedChange={onToggleHitboxes}
            size="sm"
            aria-label={t("testerHitboxesLabel")}
          />
        </div>
        <div className="flex items-center justify-between p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
          <div className="flex items-center gap-2">
            <Activity size={14} className={showProfiler ? "text-amber-400" : "text-stone-400"} />
            <span className="text-xs font-semibold text-stone-200">{t("testerProfilerLabel")}</span>
          </div>
          <Switch
            checked={showProfiler}
            onCheckedChange={onToggleProfiler}
            size="sm"
            aria-label={t("testerProfilerLabel")}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterDiagnosticsCard;
