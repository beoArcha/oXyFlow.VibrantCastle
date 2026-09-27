import React from "react";
import { Swords, Wind, VolumeX } from "lucide-react";
import { Badge } from "@components/ui";
import { useI18n } from "@hooks/useI18n";

export interface HUDControlsHintProps {
  isAudioInitialized: boolean;
  onInitializeAudio: () => void;
}

/**
 * Clean control reminders and audio enablement widget for single player mode.
 */
export const HUDControlsHint: React.FC<HUDControlsHintProps> = React.memo(({
  isAudioInitialized,
  onInitializeAudio,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 1P Mode and Audio indicator */}
      <div className="hidden md:flex items-center gap-2 bg-[#140602]/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-[#5c2d18]">
        <Badge variant="amber" icon={<Swords size={12} />}>
          1P Mode
        </Badge>
        {!isAudioInitialized && (
          <button
            onClick={onInitializeAudio}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold hover:bg-amber-600/50 cursor-pointer animate-pulse"
          >
            <VolumeX size={13} />
            {t("enableAudio")}
          </button>
        )}
      </div>

      {/* Action Shortcut Reminders */}
      <div className="hidden md:flex flex-col gap-2 bg-[#140602]/70 backdrop-blur-md p-2.5 rounded-2xl border border-stone-900/60 max-w-[170px] text-[11px] text-stone-400">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Swords size={12} />
          <span>{t("meleeAttack")}: [J]</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-300 font-bold">
          <Wind size={12} className="text-cyan-400" />
          <span>{t("dashAction")}: [L]</span>
        </div>
      </div>
    </div>
  );
});
