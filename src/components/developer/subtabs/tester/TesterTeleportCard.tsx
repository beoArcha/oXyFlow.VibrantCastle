import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Compass, Crosshair } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { debugManager, SpawnPreset } from "@game/debug/debugManager";
import gameEngine from "@game/loop/engine";
import { PlayerId } from "@game/types";
import { getLocation, LocationId } from "@game/locations";

export const LOCATION_IDS: LocationId[] = [
  "courtyard",
  "thorn_chasm",
  "grand_bastion",
  "clocktower",
  "aether_sanctuary",
];

export interface TesterTeleportCardProps {
  currentLocationId: LocationId;
  onLoadLocation: (locId: LocationId) => void;
  playerX?: number;
  playerY?: number;
  clickToTeleport: boolean;
  onToggleClickToTeleport: () => void;
}

export const TesterTeleportCard: React.FC<TesterTeleportCardProps> = ({
  currentLocationId,
  onLoadLocation,
  playerX,
  playerY,
  clickToTeleport,
  onToggleClickToTeleport,
}) => {
  const { t } = useI18n();

  const [customX, setCustomX] = useState<number>(() =>
    playerX !== undefined && Number.isFinite(playerX) ? Math.round(playerX) : 150
  );
  const [customY, setCustomY] = useState<number>(() =>
    playerY !== undefined && Number.isFinite(playerY) ? Math.round(playerY) : 450
  );

  const presets = useMemo(
    () => debugManager.getSpawnPresets(currentLocationId),
    [currentLocationId]
  );

  const handleCustomTeleport = useCallback(() => {
    if (Number.isFinite(customX) && Number.isFinite(customY)) {
      gameEngine.teleportPlayer(PlayerId.Player1, Math.round(customX), Math.round(customY));
    }
  }, [customX, customY]);

  const handlePresetTeleport = useCallback((x: number, y: number) => {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      setCustomX(Math.round(x));
      setCustomY(Math.round(y));
      gameEngine.teleportPlayer(PlayerId.Player1, Math.round(x), Math.round(y));
    }
  }, []);

  const getPresetLabel = useCallback(
    (preset: SpawnPreset): string => {
      const pascalKey = `preset${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
      const localized = t(pascalKey);
      return localized !== pascalKey ? localized : preset.name;
    },
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
          {t("testerSpawnPointsTitle")}
        </CardTitle>
        <Badge variant="amber">{currentLocationId}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Predefined Checkpoints */}
        <div>
          <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
            <Compass size={13} className="text-amber-400" />
            <span>{t("testerCheckpointsLabel")}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((preset: SpawnPreset) => (
              <Button
                key={preset.id}
                variant="secondary"
                size="sm"
                onClick={() => handlePresetTeleport(preset.x, preset.y)}
                className="flex flex-col items-start py-2 px-3 text-left h-auto"
              >
                <span className="font-bold text-amber-300 text-xs">
                  {getPresetLabel(preset)}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  X: {preset.x}, Y: {preset.y}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Teleport Coordinates */}
        <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crosshair size={15} className="text-amber-400" />
            <span className="text-xs font-bold text-stone-200">
              {t("testerCoordsLabel")}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-stone-400 font-mono">X:</span>
              <input
                type="number"
                value={customX}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomX(Number.isFinite(val) ? val : 0);
                }}
                className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-stone-400 font-mono">Y:</span>
              <input
                type="number"
                value={customY}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomY(Number.isFinite(val) ? val : 0);
                }}
                className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <Button size="sm" variant="primary" onClick={handleCustomTeleport}>
              {t("testerTeleportBtn")}
            </Button>
          </div>
        </div>

        {/* Click to Teleport & Location Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#4a1d0d]">
          <Button
            size="sm"
            variant={clickToTeleport ? "primary" : "secondary"}
            icon={<Crosshair size={14} />}
            onClick={onToggleClickToTeleport}
          >
            {t("testerClickTeleportLabel")}{" "}
            {clickToTeleport ? t("testerStatusOn") : t("testerStatusOff")}
          </Button>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 font-medium">
              {t("testerSwitchLocationLabel")}
            </span>
            {LOCATION_IDS.map((locId) => {
              const locDef = getLocation(locId);
              const locName = locDef ? t(locDef.nameKey) : locId;
              const shortName = locName.split(" ")[0];

              return (
                <button
                  key={locId}
                  type="button"
                  onClick={() => onLoadLocation(locId)}
                  className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${currentLocationId === locId
                      ? "bg-amber-600 text-white border-amber-400"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-700"
                    }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterTeleportCard;
