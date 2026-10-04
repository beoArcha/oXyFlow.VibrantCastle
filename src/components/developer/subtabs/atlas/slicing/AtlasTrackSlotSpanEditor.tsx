import React from "react";
import { Minus, Plus } from "lucide-react";
import { IconButton } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface AtlasTrackSlotSpanEditorProps {
  framesCount: number;
  slotSpan?: number[];
  cells?: number[];
  onAdjustSlotSpan: (frameIndex: number, delta: number) => void;
}

export const AtlasTrackSlotSpanEditor: React.FC<AtlasTrackSlotSpanEditorProps> = React.memo(({
  framesCount,
  slotSpan,
  cells,
  onAdjustSlotSpan,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-stone-800/80">
      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
        <span>{t("atlasStudioTrackSlotSpan")}</span>
        <span className="text-[9px] text-amber-400/90 font-normal">
          {t("atlasStudioResizeSpansHint")}
        </span>
      </span>

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
        {Array.from({ length: framesCount }).map((_, fIdx) => {
          const currentSpan = slotSpan?.[fIdx] ?? cells?.[fIdx] ?? 1;

          return (
            <div
              key={fIdx}
              className={`flex flex-col items-center justify-between p-1.5 rounded-lg border text-center transition-all ${currentSpan > 1
                  ? "bg-amber-950/40 border-amber-500/80 text-amber-300"
                  : "bg-black/60 border-stone-800 text-stone-300"
                }`}
              style={{ minWidth: `${Math.max(54, currentSpan * 32)}px` }}
            >
              <span className="text-[10px] font-mono text-stone-400">
                #{fIdx}
              </span>
              <span className="text-xs font-mono font-bold text-amber-200">
                {currentSpan}x
              </span>

              <div className="flex items-center gap-1 mt-1">
                <IconButton
                  size="xs"
                  variant="secondary"
                  onClick={() => onAdjustSlotSpan(fIdx, -1)}
                  disabled={currentSpan <= 1}
                  aria-label={t("atlasStudioSubSlotSpan")}
                  tooltipContent={t("atlasStudioSubSlotSpan")}
                  icon={<Minus size={11} />}
                  className="bg-stone-800 border-stone-700 hover:bg-stone-700 text-stone-300"
                />
                <IconButton
                  size="xs"
                  variant="primary"
                  onClick={() => onAdjustSlotSpan(fIdx, 1)}
                  disabled={currentSpan >= 8}
                  aria-label={t("atlasStudioAddSlotSpan")}
                  tooltipContent={t("atlasStudioAddSlotSpan")}
                  icon={<Plus size={11} />}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

AtlasTrackSlotSpanEditor.displayName = "AtlasTrackSlotSpanEditor";

export default AtlasTrackSlotSpanEditor;
