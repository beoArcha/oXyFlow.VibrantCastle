import React from "react";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Text,
} from "@ui";
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
    <Card variant="subtle" className="p-3 gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={allSelected ? t("atlasStudioDeselectAll") : t("atlasStudioSelectAll")}
            tooltipContent={allSelected ? t("atlasStudioDeselectAll") : t("atlasStudioSelectAll")}
            onClick={() =>
              allSelected
                ? onDeselectAll()
                : onSelectAll(frames.map((f, idx) => f.id || `frame_${idx}`))
            }
            className="text-stone-400 hover:text-stone-200"
            icon={
              allSelected ? (
                <CheckSquare size={14} className="text-amber-400" />
              ) : (
                <Square size={14} />
              )
            }
          />
          <Text as="span" size="xs" weight="semibold" className="text-stone-300">
            {t("atlasStudioFreeformFramesTitle")} ({frames.length})
          </Text>
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
      <div className="max-h-60 overflow-y-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center p-1">#</TableHead>
              <TableHead className="p-1.5">{t("atlasStudioFrameColId")}</TableHead>
              <TableHead className="w-14 p-1.5">X</TableHead>
              <TableHead className="w-14 p-1.5">Y</TableHead>
              <TableHead className="w-14 p-1.5">W</TableHead>
              <TableHead className="w-14 p-1.5">H</TableHead>
              <TableHead className="p-1.5">{t("atlasStudioFrameColTrack")}</TableHead>
              <TableHead className="w-8 text-center p-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frames.map((frame, idx) => {
              const frameId = frame.id || `frame_${idx}`;
              const isSelected = selectedFrameIds.includes(frameId);

              return (
                <TableRow
                  key={frameId}
                  isSelected={isSelected}
                  onClick={() => onSelectFrame?.(idx)}
                  className="cursor-pointer"
                >
                  <TableCell
                    className="p-1 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label={
                        isSelected ? t("atlasStudioDeselectAll") : t("atlasStudioSelectAll")
                      }
                      onClick={() => onToggleSelectFrame(frameId)}
                      className="text-stone-400 hover:text-amber-400"
                      icon={
                        isSelected ? (
                          <CheckSquare size={13} className="text-amber-400" />
                        ) : (
                          <Square size={13} />
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="p-1.5 text-amber-200/90 truncate max-w-[90px]">
                    <Text as="span" size="xs" weight="bold">{frameId}</Text>
                  </TableCell>
                  <TableCell className="p-1 text-stone-300">
                    <Input
                      family="mono"
                      type="number"
                      value={frame.x}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "x", parseInt(e.target.value, 10))
                      }
                      containerClassName="w-12 max-w-[48px]"
                      className="h-5.5 px-0.5 text-center text-[10px] bg-black/60 border-stone-800 rounded"
                    />
                  </TableCell>
                  <TableCell className="p-1 text-stone-300">
                    <Input
                      family="mono"
                      type="number"
                      value={frame.y}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "y", parseInt(e.target.value, 10))
                      }
                      containerClassName="w-12 max-w-[48px]"
                      className="h-5.5 px-0.5 text-center text-[10px] bg-black/60 border-stone-800 rounded"
                    />
                  </TableCell>
                  <TableCell className="p-1 text-stone-300">
                    <Input
                      family="mono"
                      type="number"
                      value={frame.width}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "width", parseInt(e.target.value, 10))
                      }
                      containerClassName="w-12 max-w-[48px]"
                      className="h-5.5 px-0.5 text-center text-[10px] bg-black/60 border-stone-800 rounded"
                    />
                  </TableCell>
                  <TableCell className="p-1 text-stone-300">
                    <Input
                      family="mono"
                      type="number"
                      value={frame.height}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateFrameField(frameId, "height", parseInt(e.target.value, 10))
                      }
                      containerClassName="w-12 max-w-[48px]"
                      className="h-5.5 px-0.5 text-center text-[10px] bg-black/60 border-stone-800 rounded"
                    />
                  </TableCell>
                  <TableCell className="p-1.5 text-stone-400 truncate max-w-[80px]">
                    {frame.trackName || "—"}
                  </TableCell>
                  <TableCell
                    className="p-1 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label={t("delete") || "Delete"}
                      tooltipContent={t("delete") || "Delete"}
                      onClick={() => onDeleteFrame(frameId)}
                      className="text-stone-500 hover:text-rose-400 hover:bg-rose-950/40"
                      icon={<Trash2 size={12} />}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default AtlasSlicingFreeformTable;
