import React from "react";
import { MapPin, Compass, Check } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "../../ui";
import { getAllLocations } from "../../../game/locations";
import { useGame } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import { cn } from "../../../lib/utils";

export const LocationsTab: React.FC = () => {
  const { loadLocation, currentLocationId } = useGame();
  const { t } = useI18n();
  const allLocations = getAllLocations();

  return (
    <div id="tab-content-locations" className="flex flex-col gap-3 animate-in fade-in duration-150">
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
            {t("selectLocationTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allLocations.map((loc) => {
              const isCurrent = loc.id === currentLocationId;
              const locName = t(loc.nameKey);
              const locDesc = t(loc.descriptionKey);

              return (
                <div
                  key={loc.id}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3",
                    isCurrent
                      ? "bg-[#2d140a] border-[#f59e0b] shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/50"
                      : "bg-[#1c0c07] border-[#4a200e] hover:border-[#8d4325] hover:bg-[#26120b]"
                  )}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-serif font-bold text-amber-300 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                        {locName}
                      </h4>
                      {isCurrent && (
                        <Badge variant="amber" icon={<Check size={10} />}>
                          {t("activeBadge")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">{locDesc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#5c2d18]/50 pt-2 text-[11px] text-stone-400">
                    <span>
                      {t("dimensionsLabel")}: {loc.width} &times; {loc.height}
                    </span>
                    <Button
                      size="sm"
                      variant={isCurrent ? "secondary" : "primary"}
                      onClick={() => loadLocation(loc.id)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? t("activeBadge") : t("changeLocation")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationsTab;
