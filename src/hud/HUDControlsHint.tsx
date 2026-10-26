import React from "react";
import { Swords, Wind, VolumeX } from "lucide-react";
import { Badge, Button, IconText } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard, formatKeyLabel } from "@game-menu/controls";
import { PlayerId } from "@game/types";
import { HUDPanel } from "./components/common/HUDPanel";
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
      <HUDPanel
        borderColor="border-amber-900/40"
        padding="none"
        className="hidden md:flex items-center gap-2 px-3 py-2"
      >
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
      </HUDPanel>

      <HUDPanel
        variant="subtle"
        padding="none"
        className="hidden md:flex flex-col gap-2 p-2.5 max-w-[170px] text-[11px] text-stone-400"
      >
        <IconText
          as="div"
          weight="bold"
          variant="primary"
          size="2xs"
          icon={<Swords size={12} />}
        >
          {t("meleeAttack")}: [{meleeKey}]
        </IconText>
        <IconText
          as="div"
          weight="bold"
          variant="default"
          size="2xs"
          icon={<Wind size={12} className="text-cyan-400" />}
        >
          {t("dashAction")}: [{dashKey}]
        </IconText>
      </HUDPanel>
    </div>
  );
});

HUDControlsHint.displayName = "HUDControlsHint";
export default HUDControlsHint;
