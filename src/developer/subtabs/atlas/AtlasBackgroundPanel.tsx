import React from "react";
import { Download, Wand2 } from "lucide-react";
import {
  Button,
  Switch,
  Slider,
  ColorPickerInput,
  Text,
  Label,
} from "@ui";
import type { IAtlasBackgroundConfig } from "@game/engine/meta/types";
import { CHROMA_COLOR_PRESETS, type EditableMetaDoc } from "./atlasSlicerHelpers";

export interface AtlasBackgroundPanelProps {
  readonly backgroundConfig: IAtlasBackgroundConfig;
  readonly chromaFeather: number;
  readonly showChromaPreview: boolean;
  readonly onUpdateMeta: (updater: (prev: EditableMetaDoc) => EditableMetaDoc) => void;
  readonly onAutoDetectBackground: () => void;
  readonly onEnableChromaPreview: () => void;
  readonly onChromaPreviewChange: (enabled: boolean) => void;
  readonly onChromaFeatherChange: (feather: number) => void;
  readonly onBakeCleanPng: () => void;
}

/**
 * Background transparency and chroma-key alpha baking inspector tab.
 */
export const AtlasBackgroundPanel: React.FC<AtlasBackgroundPanelProps> = ({
  backgroundConfig,
  chromaFeather,
  showChromaPreview,
  onUpdateMeta,
  onAutoDetectBackground,
  onEnableChromaPreview,
  onChromaPreviewChange,
  onChromaFeatherChange,
  onBakeCleanPng,
}) => (
  <>
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={backgroundConfig.mode === "transparent" ? "primary" : "secondary"}
        onClick={() =>
          onUpdateMeta((prev) => ({
            ...prev,
            backgroundConfig: { ...prev.backgroundConfig, mode: "transparent" },
          }))
        }
        className="whitespace-nowrap shrink-0 px-3"
      >
        Przezroczyste (Alpha)
      </Button>
      <Button
        size="sm"
        variant={backgroundConfig.mode === "color" ? "primary" : "secondary"}
        onClick={() =>
          onUpdateMeta((prev) => ({
            ...prev,
            backgroundConfig: { ...prev.backgroundConfig, mode: "color" },
          }))
        }
        className="whitespace-nowrap shrink-0 px-3"
      >
        Kluczowanie kolorem (Chroma)
      </Button>
      <Button
        size="sm"
        variant="outline"
        icon={<Wand2 size={13} />}
        onClick={onAutoDetectBackground}
        className="whitespace-nowrap shrink-0 px-3"
      >
        Auto-wykryj tło
      </Button>
    </div>

    <div className="flex flex-col gap-1.5">
      <Label>Kolor tła do usunięcia (użyj też Pipety na canvasie)</Label>
      <ColorPickerInput
        value={backgroundConfig.colorHex ?? "#ff00ff"}
        onChange={(hex) =>
          onUpdateMeta((prev) => ({
            ...prev,
            backgroundConfig: {
              ...prev.backgroundConfig,
              mode: "color",
              colorHex: hex,
            },
          }))
        }
      />
      <div className="flex flex-wrap gap-1.5 pt-1">
        {CHROMA_COLOR_PRESETS.map((sw) => (
          <Button
            key={sw.hex}
            size="sm"
            variant="ghost"
            onClick={() => {
              onUpdateMeta((prev) => ({
                ...prev,
                backgroundConfig: {
                  ...prev.backgroundConfig,
                  mode: "color",
                  colorHex: sw.hex,
                },
              }));
              onEnableChromaPreview();
            }}
            className="whitespace-nowrap shrink-0 px-2.5 text-[11px]"
          >
            {sw.label}
          </Button>
        ))}
      </div>
    </div>

    <Slider
      label="Tolerancja koloru"
      min={0}
      max={60}
      step={1}
      unit="%"
      value={backgroundConfig.tolerance ?? 18}
      onChange={(tolerance) =>
        onUpdateMeta((prev) => ({
          ...prev,
          backgroundConfig: { ...prev.backgroundConfig, tolerance },
        }))
      }
    />

    <Slider
      label="Wygładzanie krawędzi (Feather)"
      min={0}
      max={25}
      step={1}
      unit="%"
      value={chromaFeather}
      onChange={onChromaFeatherChange}
    />

    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
      <div className="flex items-center gap-2">
        <Switch
          checked={showChromaPreview}
          onCheckedChange={onChromaPreviewChange}
        />
        <Text size="xs">Podgląd wyciętego tła na żywo</Text>
      </div>
      <Button
        size="sm"
        variant="primary"
        icon={<Download size={13} />}
        onClick={onBakeCleanPng}
        className="whitespace-nowrap shrink-0 px-3"
      >
        Wypal czyste PNG (Alpha)
      </Button>
    </div>
  </>
);
