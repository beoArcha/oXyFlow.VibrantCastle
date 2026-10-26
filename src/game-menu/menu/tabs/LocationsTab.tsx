import React from "react";
import { MapPin, Compass, Check } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Heading, Paragraph } from "@ui";
import { useGameSession } from "@context/GameSessionContext";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface LocationItemVM {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly width: number;
  readonly height: number;
}

export interface LocationsTabProps {
  readonly locations?: readonly LocationItemVM[];
  readonly currentLocationId?: string;
  readonly onLoadLocation?: (locId: string) => void;
  readonly className?: string;
}

export const LocationsTab = ({
  locations,
  currentLocationId: propCurrentLocationId,
  onLoadLocation,
  className,
}: LocationsTabProps = {}): React.ReactElement => {
  const session = useGameSession();
  const { t } = useI18n();

  const allLocations = locations ?? session.availableLocations;
  const activeLocationId = propCurrentLocationId ?? session.currentLocationId;
  const handleLoadLocation = onLoadLocation ?? session.loadLocation;

  return (
    <div id="tab-content-locations" className={cn("flex flex-col gap-3 animate-in fade-in duration-150", className)}>
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
            {t("selectLocationTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allLocations.map((loc) => {
              const isCurrent = loc.id === activeLocationId;
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
                      <Heading level={4} size="sm" variant="primary" className="flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{locName}</span>
                      </Heading>
                      {isCurrent && (
                        <Badge variant="amber" icon={<Check size={10} />}>
                          {t("activeBadge")}
                        </Badge>
                      )}
                    </div>
                    <Paragraph size="xs" variant="default" className="leading-relaxed">{locDesc}</Paragraph>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#5c2d18]/50 pt-2 text-[11px] text-stone-400">
                    <span>
                      {t("dimensionsLabel")}: {loc.width} &times; {loc.height}
                    </span>
                    <Button
                      size="sm"
                      variant={isCurrent ? "secondary" : "primary"}
                      onClick={() => handleLoadLocation(loc.id)}
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
