import React, { useState, useMemo, useCallback } from "react";
import { MapPin, Compass, Crosshair, RefreshCw } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, CompactNumberStepper, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { SpawnPreset, debugManager } from "@game/debug/debugManager";
import { getLocation, LocationId } from "@game/locations";
import { LOCATION_IDS } from "./constants";
import { TesterTeleportCardProps } from "./types";

/**
 * Presentation card for player teleportation, checkpoints navigation and location switching.
 */
export const TesterTeleportCard: React.FC<TesterTeleportCardProps> = ({
  currentLocationId,
  onLoadLocation,
  onTeleportPlayer,
  playerX,
  playerY,
  clickToTeleport,
  onToggleClickToTeleport,
  presets: externalPresets,
}) => {
  const { t, isPl } = useI18n();

  const [customX, setCustomX] = useState<number>(() =>
    playerX !== undefined && Number.isFinite(playerX) ? Math.round(playerX) : 150
  );
  const [customY, setCustomY] = useState<number>(() =>
    playerY !== undefined && Number.isFinite(playerY) ? Math.round(playerY) : 450
  );

  const presets = useMemo(
    () => externalPresets || debugManager.getSpawnPresets(currentLocationId),
    [externalPresets, currentLocationId]
  );

  const handleCustomTeleport = useCallback(() => {
    if (Number.isFinite(customX) && Number.isFinite(customY)) {
      onTeleportPlayer?.(Math.round(customX), Math.round(customY));
    }
  }, [customX, customY, onTeleportPlayer]);

  const handlePresetTeleport = useCallback(
    (x: number, y: number) => {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        setCustomX(Math.round(x));
        setCustomY(Math.round(y));
        onTeleportPlayer?.(Math.round(x), Math.round(y));
      }
    },
    [onTeleportPlayer]
  );

  const handleSyncCurrentPosition = useCallback(() => {
    if (playerX !== undefined && Number.isFinite(playerX)) setCustomX(Math.round(playerX));
    if (playerY !== undefined && Number.isFinite(playerY)) setCustomY(Math.round(playerY));
  }, [playerX, playerY]);

  const getPresetLabel = useCallback(
    (preset: SpawnPreset): string => {
      if (isPl && preset.namePl) {
        return preset.namePl;
      }
      return preset.name;
    },
    [isPl]
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
        <div>
          <Text as="div" size="xs" weight="semibold" className="text-stone-300 mb-2 flex items-center gap-1.5">
            <Compass size={13} className="text-amber-400" />
            <span>{t("testerCheckpointsLabel")}</span>
          </Text>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((preset: SpawnPreset) => (
              <Button
                key={preset.id}
                variant="secondary"
                size="sm"
                onClick={() => handlePresetTeleport(preset.x, preset.y)}
                className="flex flex-col items-start py-2 px-3 text-left h-auto"
              >
                <Text as="span" weight="bold" size="xs" className="text-amber-300">
                  {getPresetLabel(preset)}
                </Text>
                <Text as="span" family="mono" size="2xs" className="text-stone-400">
                  X: {preset.x}, Y: {preset.y}
                </Text>
              </Button>
            ))}
          </div>
        </div>

        <Card variant="dark" className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crosshair size={15} className="text-amber-400" />
            <Text as="span" size="xs" weight="bold" className="text-stone-200">
              {t("testerCoordsLabel")}
            </Text>
            {playerX !== undefined && (
              <Button
                size="sm"
                variant="ghost"
                icon={<RefreshCw size={12} />}
                onClick={handleSyncCurrentPosition}
                title="Sync with current player position"
                className="text-[10px] text-stone-400 hover:text-amber-300 px-1 py-0.5 h-6"
              >
                {Math.round(playerX)}, {Math.round(playerY ?? 0)}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CompactNumberStepper
              label="X"
              value={customX}
              onChange={setCustomX}
              min={0}
              step={10}
              className="w-24 text-xs"
            />
            <CompactNumberStepper
              label="Y"
              value={customY}
              onChange={setCustomY}
              min={0}
              step={10}
              className="w-24 text-xs"
            />
            <Button size="sm" variant="primary" onClick={handleCustomTeleport}>
              {t("testerTeleportBtn")}
            </Button>
          </div>
        </Card>

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
            <Text as="span" size="xs" weight="medium" className="text-stone-400">
              {t("testerSwitchLocationLabel")}
            </Text>
            {LOCATION_IDS.map((locId: LocationId) => {
              const locDef = getLocation(locId);
              const locName = locDef ? t(locDef.nameKey) : locId;

              return (
                <Button
                  key={locId}
                  size="sm"
                  variant={currentLocationId === locId ? "primary" : "secondary"}
                  onClick={() => onLoadLocation(locId)}
                  className="text-xs py-1 px-2.5 h-7"
                >
                  {locName}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TesterTeleportCard;
