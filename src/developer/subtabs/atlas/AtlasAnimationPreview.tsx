import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FlipHorizontal,
  ArrowLeftRight,
} from "lucide-react";
import { Button, Select, Slider, Label } from "@ui";
import type { IAnimationTrackMeta, ResolvedFrameRect } from "@game/engine/meta/types";
import { PIVOT_ANCHOR_PRESETS, type EditableMetaDoc } from "./atlasSlicerHelpers";

export interface AtlasAnimationPreviewProps {
  readonly previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly animations: Record<string, IAnimationTrackMeta>;
  readonly activeTrackName: string;
  readonly activeTrack: IAnimationTrackMeta | undefined;
  readonly activeTrackFrames: readonly ResolvedFrameRect[];
  readonly anchor: { readonly x: number; readonly y: number };
  readonly isPlaying: boolean;
  readonly playheadIdx: number;
  readonly previewScale: number;
  readonly flipX: boolean;
  readonly showGroundLine: boolean;
  readonly onionSkin: boolean;
  readonly onSelectTrack: (trackName: string) => void;
  readonly onStepPrev: () => void;
  readonly onTogglePlay: () => void;
  readonly onStepNext: () => void;
  readonly onPreviewScaleChange: (scale: number) => void;
  readonly onToggleFlipX: () => void;
  readonly onToggleGroundLine: () => void;
  readonly onToggleOnionSkin: () => void;
  readonly onUpdateMeta: (updater: (prev: EditableMetaDoc) => EditableMetaDoc) => void;
  readonly onReverseTrack: () => void;
  readonly onPingPongTrack: () => void;
  readonly onSelectFilmstripFrame: (idx: number, frameId: string) => void;
}

/**
 * Live animation playback preview tab with FPS/scale sliders, pivot presets, and filmstrip ordering.
 */
export const AtlasAnimationPreview: React.FC<AtlasAnimationPreviewProps> = ({
  previewCanvasRef,
  animations,
  activeTrackName,
  activeTrack,
  activeTrackFrames,
  anchor,
  isPlaying,
  playheadIdx,
  previewScale,
  flipX,
  showGroundLine,
  onionSkin,
  onSelectTrack,
  onStepPrev,
  onTogglePlay,
  onStepNext,
  onPreviewScaleChange,
  onToggleFlipX,
  onToggleGroundLine,
  onToggleOnionSkin,
  onUpdateMeta,
  onReverseTrack,
  onPingPongTrack,
  onSelectFilmstripFrame,
}) => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Select
        value={activeTrackName}
        onChange={(e) => onSelectTrack(e.target.value)}
        options={Object.keys(animations).map((name) => ({
          value: name,
          label: `${name} (${animations[name].frames} kl.)`,
        }))}
        size="sm"
        containerClassName="flex-1 min-w-[150px]"
      />
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          icon={<SkipBack size={13} />}
          onClick={onStepPrev}
          className="whitespace-nowrap shrink-0 px-2"
          aria-label="Poprzednia klatka"
        />
        <Button
          size="sm"
          variant={isPlaying ? "primary" : "secondary"}
          icon={isPlaying ? <Pause size={13} /> : <Play size={13} />}
          onClick={onTogglePlay}
          className="whitespace-nowrap shrink-0 px-3"
        >
          {isPlaying ? "Pauza" : "Odtwórz"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<SkipForward size={13} />}
          onClick={onStepNext}
          className="whitespace-nowrap shrink-0 px-2"
          aria-label="Następna klatka"
        />
      </div>
    </div>

    <div className="flex justify-center rounded-xl border border-stone-800 bg-black/70 p-2">
      <canvas
        ref={previewCanvasRef}
        width={260}
        height={190}
        className="rounded-lg"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Slider
        label="FPS"
        min={1}
        max={30}
        step={1}
        unit=" fps"
        value={activeTrack?.fps ?? 8}
        onChange={(fps) =>
          onUpdateMeta((prev) => ({
            ...prev,
            animations: {
              ...prev.animations,
              [activeTrackName]: {
                ...prev.animations[activeTrackName],
                fps,
              },
            },
          }))
        }
      />
      <Slider
        label="Skala podglądu"
        min={0.5}
        max={3}
        step={0.25}
        unit="×"
        value={previewScale}
        onChange={onPreviewScaleChange}
      />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={flipX ? "primary" : "secondary"}
        icon={<FlipHorizontal size={12} />}
        onClick={onToggleFlipX}
        className="whitespace-nowrap shrink-0 px-2.5"
      >
        Odbij X
      </Button>
      <Button
        size="sm"
        variant={showGroundLine ? "primary" : "secondary"}
        onClick={onToggleGroundLine}
        className="whitespace-nowrap shrink-0 px-2.5"
      >
        Linia gruntu
      </Button>
      <Button
        size="sm"
        variant={onionSkin ? "primary" : "secondary"}
        onClick={onToggleOnionSkin}
        className="whitespace-nowrap shrink-0 px-2.5"
      >
        Onion Skin
      </Button>
    </div>

    <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
      <Label>Punkt zakotwiczenia (Pivot)</Label>
      <div className="flex flex-wrap gap-1.5">
        {PIVOT_ANCHOR_PRESETS.map((pv) => (
          <Button
            key={pv.id}
            size="sm"
            variant={
              anchor.x === pv.x && anchor.y === pv.y ? "primary" : "ghost"
            }
            onClick={() =>
              onUpdateMeta((prev) => ({
                ...prev,
                layout: {
                  ...prev.layout,
                  anchor: { x: pv.x, y: pv.y },
                  origin: {
                    type: pv.id,
                    normalized: { x: pv.x, y: pv.y },
                  },
                },
              }))
            }
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            {pv.label}
          </Button>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>
          Taśma klatek ({activeTrackFrames.length}) — klatka {playheadIdx + 1}
        </Label>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<ArrowLeftRight size={12} />}
            className="whitespace-nowrap shrink-0 px-2"
            onClick={onReverseTrack}
          >
            Odwróć
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="whitespace-nowrap shrink-0 px-2"
            onClick={onPingPongTrack}
          >
            Ping-Pong
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 max-h-[84px] overflow-y-auto">
        {activeTrackFrames.map((f, idx) => (
          <Button
            key={`${f.id}_${idx}`}
            size="sm"
            variant={idx === playheadIdx ? "primary" : "secondary"}
            onClick={() => onSelectFilmstripFrame(idx, f.id)}
            className="whitespace-nowrap shrink-0 px-2 font-mono text-[11px] tabular-nums"
          >
            #{idx + 1}
          </Button>
        ))}
      </div>
    </div>
  </>
);
