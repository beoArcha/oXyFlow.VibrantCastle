import React from "react";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { IFreeformFrameRect } from "@game/engine/meta/types";

export interface AtlasSlicingFreeformTableProps {
  frames: IFreeformFrameRect[];
  selectedFrameIds: string[];
  onToggleSelectFrame: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onAddFrame: () => void;
  onUpdateFrameField: <K extends keyof IFreeformFrameRect>(
    id: string,
    field: K,
    val: IFreeformFrameRect[K]
  ) => void;
  onDeleteFrame: (id: string) => void;
  onSelectFrame?: (frameIdx: number) => void;
}

export type SlicingFreeformTableProps = AtlasSlicingFreeformTableProps;

export const AtlasSlicingFreeformTable: React.FC<AtlasSlicingFreeformTableProps> = ({
  frames,
  selectedFrameIds,
  onToggleSelectFrame,
  onSelectAll,
  onDeselectAll,
  onAddFrame,
  onUpdateFrameField,
  onDeleteFrame,
  onSelectFrame,
}) => {
  const { t } = useI18n();

  const allSelected = frames.length > 0 && selectedFrameIds.length === frames.length;

  return (
    <div className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-stone-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              allSelected
                ? onDeselectAll()
                : onSelectAll(frames.map((f, idx) => f.id || `frame_${idx}`))
            }
            className="text-stone-400 hover:text-stone-200 cursor-pointer"
            title={allSelected ? t("atlasStudioDeselectAll") : t("atlasStudioSelectAll")}
          >
            {allSelected ? (
              <CheckSquare size={14} className="text-amber-400" />
            ) : (
              <Square size={14} />
            )}
          </button>
          <span className="text-xs font-semibold text-stone-300">
            {t("atlasStudioFreeformFramesTitle")} ({frames.length})
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={12} />}
          onClick={onAddFrame}
          className="text-xs py-1"
        >
          {t("atlasStudioAddFrameBtn")}
        </Button>
      </div>

      {/* Frame Table Container */}
      <div className="max-h-60 overflow-y-auto custom-scrollbar border border-stone-800 rounded-lg">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="bg-stone-900/90 text-stone-400 border-b border-stone-800">
              <th className="p-1.5 w-6 text-center">#</th>
              <th className="p-1.5">{t("atlasStudioFrameColId")}</th>
              <th className="p-1.5 w-14">X</th>
              <th className="p-1.5 w-14">Y</th>
              <th className="p-1.5 w-14">W</th>
              <th className="p-1.5 w-14">H</th>
              <th className="p-1.5">{t("atlasStudioFrameColTrack")}</th>
              <th className="p-1.5 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {frames.map((frame, idx) => {
              const frameId = frame.id || `frame_${idx}`;
              const isSelected = selectedFrameIds.includes(frameId);

              return (
                <tr
                  key={frameId}
                  onClick={() => onSelectFrame?.(idx)}
                  className={`border-b border-stone-900/80 hover:bg-stone-900/40 transition-colors ${isSelected ? "bg-amber-950/25" : ""
                    }`}
                >
                  <td className="p-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectFrame(frameId)}
                      className="text-stone-400 hover:text-amber-400 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare size={13} className="text-amber-400" />
                      ) : (
                        <Square size={13} />
                      )}
                    </button>
                  </td>
                  <td className="p-1.5 text-amber-200/90 font-bold truncate max-w-[90px]">
                    {frameId}
                  </td>
                  <td className="p-1 text-stone-300">
                    <input
                      type="number"
                      value={frame.x}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "x", parseInt(e.target.value, 10))
                      }
                      className="w-12 bg-black/60 border border-stone-800 rounded px-1 text-center font-mono text-[10px]"
                    />
                  </td>
                  <td className="p-1 text-stone-300">
                    <input
                      type="number"
                      value={frame.y}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "y", parseInt(e.target.value, 10))
                      }
                      className="w-12 bg-black/60 border border-stone-800 rounded px-1 text-center font-mono text-[10px]"
                    />
                  </td>
                  <td className="p-1 text-stone-300">
                    <input
                      type="number"
                      value={frame.width}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "width", parseInt(e.target.value, 10))
                      }
                      className="w-12 bg-black/60 border border-stone-800 rounded px-1 text-center font-mono text-[10px]"
                    />
                  </td>
                  <td className="p-1 text-stone-300">
                    <input
                      type="number"
                      value={frame.height}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "height", parseInt(e.target.value, 10))
                      }
                      className="w-12 bg-black/60 border border-stone-800 rounded px-1 text-center font-mono text-[10px]"
                    />
                  </td>
                  <td className="p-1.5 text-stone-400 truncate max-w-[80px]">
                    {frame.trackName || "—"}
                  </td>
                  <td className="p-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDeleteFrame(frameId)}
                      className="text-stone-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SlicingFreeformTable = AtlasSlicingFreeformTable;
export default AtlasSlicingFreeformTable;
