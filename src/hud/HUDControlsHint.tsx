import React from "react";
import { Swords, Wind, VolumeX } from "lucide-react";
import { Badge, Button, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard, formatKeyLabel } from "@game-menu/controls";
import { PlayerId } from "@game/types";
import type { HUDControlsHintProps } from "./types";

export type { HUDControlsHintProps };

export const HUDControlsHint: React.FC<HUDControlsHintProps> = React.memo(({
  isAudioInitialized,
  onInitializeAudio,
}) => {
  const { t } = useI18n();
  const { bindings } = useKeyboard(PlayerId.Player1);

  const meleeKey = bindings.action1?.[0]
    ? formatKeyLabel(bindings.action1[0], t("spaceKey"))
    : "J";

  const dashKey = bindings.action2?.[0]
    ? formatKeyLabel(bindings.action2[0], t("spaceKey"))
    : "L";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="hidden md:flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-amber-900/40">
        <Badge variant="amber" icon={<Swords size={12} />}>
          {t("singlePlayerMode")}
        </Badge>
        {!isAudioInitialized && (
          <Button
            size="sm"
            variant="accent"
            onClick={onInitializeAudio}
            leftIcon={<VolumeX size={13} />}
            className="h-6 px-2 py-0.5 rounded-lg animate-pulse"
          >
            {t("enableAudio")}
          </Button>
        )}
      </div>

      <div className="hidden md:flex flex-col gap-2 bg-stone-950/70 backdrop-blur-md p-2.5 rounded-2xl border border-stone-900/60 max-w-[170px] text-[11px] text-stone-400">
        <Text as="div" weight="bold" variant="primary" size="2xs" className="flex items-center gap-1.5">
          <Swords size={12} />
          <span>{t("meleeAttack")}: [{meleeKey}]</span>
        </Text>
        <Text as="div" weight="bold" variant="default" size="2xs" className="flex items-center gap-1.5">
          <Wind size={12} className="text-cyan-400" />
          <span>{t("dashAction")}: [{dashKey}]</span>
        </Text>
      </div>
    </div>
  );
});
