import React from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Button, Input, Select, Switch, Label } from "@ui";
import type { IAnimationTrackMeta, SlicingMethod } from "@game/engine/meta/types";
import type { EditableMetaDoc } from "./atlasSlicerHelpers";
import { SLICING_METHOD_OPTIONS } from "./types";

export interface AtlasSlicingInspectorProps {
  readonly meta: EditableMetaDoc;
  readonly activeTrackName: string;
  readonly activeTrack: IAnimationTrackMeta | undefined;
  readonly newTrackName: string;
  readonly onNewTrackNameChange: (name: string) => void;
  readonly onUpdateMeta: (updater: (prev: EditableMetaDoc) => EditableMetaDoc) => void;
  readonly onBakeAutoIslands: () => void;
  readonly onAddTrack: () => void;
  readonly onDeleteActiveTrack: () => void;
}

/**
 * Slicing strategy, grid/cell geometry inputs, auto-islands baking, and animation track manager tab.
 */
export const AtlasSlicingInspector: React.FC<AtlasSlicingInspectorProps> = ({
  meta,
  activeTrackName,
  activeTrack,
  newTrackName,
  onNewTrackNameChange,
  onUpdateMeta,
  onBakeAutoIslands,
  onAddTrack,
  onDeleteActiveTrack,
}) => (
  <>
    <Select
      label="Strategia cięcia (AtlasSlicingEngine)"
      value={meta.slicing.method}
      onChange={(e) =>
        onUpdateMeta((prev) => ({
          ...prev,
          slicing: {
            ...prev.slicing,
            method: e.target.value as SlicingMethod,
          },
        }))
      }
      options={SLICING_METHOD_OPTIONS}
    />

    <div className="grid grid-cols-2 gap-2.5">
      <Input
        label="Kolumny"
        type="number"
        min={1}
        value={String(meta.atlas.columns)}
        onChange={(e) => {
          const columns = Math.max(1, Number(e.target.value) || 1);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, columns },
            slicing: {
              ...prev.slicing,
              grid: { ...(prev.slicing.grid ?? prev.atlas), columns },
            },
          }));
        }}
      />
      <Input
        label="Wiersze"
        type="number"
        min={1}
        value={String(meta.atlas.rows)}
        onChange={(e) => {
          const rows = Math.max(1, Number(e.target.value) || 1);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, rows },
            slicing: {
              ...prev.slicing,
              grid: { ...(prev.slicing.grid ?? prev.atlas), rows },
            },
          }));
        }}
      />
      <Input
        label="Szer. komórki (px)"
        type="number"
        min={8}
        value={String(meta.slicing.cellSize?.cellWidth ?? meta.atlas.cellWidth)}
        onChange={(e) => {
          const cellWidth = Math.max(8, Number(e.target.value) || 64);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, cellWidth },
            slicing: {
              ...prev.slicing,
              cellSize: {
                cellHeight: prev.slicing.cellSize?.cellHeight ?? prev.atlas.cellHeight,
                ...prev.slicing.cellSize,
                cellWidth,
              },
            },
          }));
        }}
      />
      <Input
        label="Wys. komórki (px)"
        type="number"
        min={8}
        value={String(meta.slicing.cellSize?.cellHeight ?? meta.atlas.cellHeight)}
        onChange={(e) => {
          const cellHeight = Math.max(8, Number(e.target.value) || 64);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, cellHeight },
            slicing: {
              ...prev.slicing,
              cellSize: {
                cellWidth: prev.slicing.cellSize?.cellWidth ?? prev.atlas.cellWidth,
                ...prev.slicing.cellSize,
                cellHeight,
              },
            },
          }));
        }}
      />
      <Input
        label="Odstęp (spacing)"
        type="number"
        min={0}
        value={String(meta.atlas.spacing)}
        onChange={(e) => {
          const spacing = Math.max(0, Number(e.target.value) || 0);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, spacing },
          }));
        }}
      />
      <Input
        label="Safe Margin (px)"
        type="number"
        min={0}
        value={String(meta.atlas.safeMargin)}
        onChange={(e) => {
          const safeMargin = Math.max(0, Number(e.target.value) || 0);
          onUpdateMeta((prev) => ({
            ...prev,
            atlas: { ...prev.atlas, safeMargin },
          }));
        }}
      />
    </div>

    {meta.slicing.method === "auto_islands" && (
      <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-stone-800">
        <Input
          label="Min. pikseli wyspy"
          type="number"
          min={4}
          containerClassName="flex-1"
          value={String(meta.slicing.autoIslands?.minIslandPixels ?? 24)}
          onChange={(e) =>
            onUpdateMeta((prev) => ({
              ...prev,
              slicing: {
                ...prev.slicing,
                autoIslands: {
                  ...prev.slicing.autoIslands,
                  minIslandPixels: Math.max(4, Number(e.target.value) || 16),
                },
              },
            }))
          }
        />
        <Button
          size="sm"
          variant="primary"
          icon={<Wand2 size={13} />}
          onClick={onBakeAutoIslands}
          className="whitespace-nowrap shrink-0"
        >
          Wykryj i wypal wyspy
        </Button>
      </div>
    )}

    <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
      <Label>Ścieżki Animacji</Label>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nazwa nowej ścieżki (np. heavy_slash)"
          value={newTrackName}
          onChange={(e) => onNewTrackNameChange(e.target.value)}
          containerClassName="flex-1"
        />
        <Button
          size="sm"
          variant="primary"
          icon={<Plus size={13} />}
          className="whitespace-nowrap shrink-0"
          onClick={onAddTrack}
        >
          Dodaj
        </Button>
      </div>

      {activeTrack && (
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/40 border border-stone-800">
          <Input
            label="Wiersz"
            type="number"
            min={0}
            value={String(activeTrack.row)}
            onChange={(e) =>
              onUpdateMeta((prev) => ({
                ...prev,
                animations: {
                  ...prev.animations,
                  [activeTrackName]: {
                    ...prev.animations[activeTrackName],
                    row: Math.max(0, Number(e.target.value) || 0),
                  },
                },
              }))
            }
          />
          <Input
            label="Klatki"
            type="number"
            min={1}
            value={String(activeTrack.frames)}
            onChange={(e) =>
              onUpdateMeta((prev) => ({
                ...prev,
                animations: {
                  ...prev.animations,
                  [activeTrackName]: {
                    ...prev.animations[activeTrackName],
                    frames: Math.max(1, Number(e.target.value) || 1),
                  },
                },
              }))
            }
          />
          <div className="flex flex-col justify-between">
            <Label>Pętla (Loop)</Label>
            <div className="flex items-center justify-between pt-1">
              <Switch
                checked={activeTrack.loop}
                onCheckedChange={(loop) =>
                  onUpdateMeta((prev) => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      [activeTrackName]: {
                        ...prev.animations[activeTrackName],
                        loop,
                      },
                    },
                  }))
                }
              />
              {Object.keys(meta.animations).length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={12} />}
                  className="px-2"
                  aria-label="Usuń ścieżkę"
                  onClick={onDeleteActiveTrack}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
