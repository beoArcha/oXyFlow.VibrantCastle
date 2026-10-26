import React, { useState } from "react";
import {
  Pipette,
  Download,
  Check,
  Sparkles,
  Sliders,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button, Slider, Badge, Switch, SegmentedControl, ColorPickerInput, Card, Text, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import { IAtlasBackgroundConfig } from "./types";
import { BackgroundProcessor } from "@/game/engine/meta/slicing";
import { LoggerManager } from "@lib/logger";
import { AssetError, CanvasContextError, ErrorCode } from "@lib/errors";
import { downloadBlob, formatAtlasExportFileName } from "./utils";

export interface AtlasBackgroundPanelProps {
  imageSrc: string;
  image?: HTMLImageElement | null;
  assetId: string;
  backgroundConfig?: IAtlasBackgroundConfig;
  onBackgroundConfigChange: (config: IAtlasBackgroundConfig) => void;
  onRequestEyedropper: () => void;
}

const COMMON_PRESETS = [
  { name: "Black", hex: "#000000", label: "Pure Black" },
  { name: "White", hex: "#ffffff", label: "Pure White" },
  { name: "Green", hex: "#00ff00", label: "Chroma Green" },
  { name: "Magenta", hex: "#ff00ff", label: "Magenta Pink" },
  { name: "Cyan", hex: "#00ffff", label: "Chroma Cyan" },
];

export const AtlasBackgroundPanel: React.FC<AtlasBackgroundPanelProps> = ({
  imageSrc,
  image,
  assetId,
  backgroundConfig,
  onBackgroundConfigChange,
  onRequestEyedropper,
}) => {
  const { t } = useI18n();

  const [isBaking, setIsBaking] = useState<boolean>(false);
  const [bakedSuccess, setBakedSuccess] = useState<boolean>(false);

  const currentMode = backgroundConfig?.mode || "transparent";
  const activeMode: "transparent" | "color" = currentMode === "color" || currentMode === "solid" ? "color" : "transparent";
  const currentColor = backgroundConfig?.colorHex || "#000000";
  const currentTolerance = backgroundConfig?.tolerance ?? 15;
  const currentRemoveRuntime = backgroundConfig?.removeAtRuntime ?? true;

  // Change Background Mode
  const handleModeChange = (mode: "transparent" | "color") => {
    onBackgroundConfigChange({
      mode,
      colorHex: currentColor,
      tolerance: currentTolerance,
      removeAtRuntime: currentRemoveRuntime,
    });
  };

  // Change Hex Color
  const handleColorChange = (hex: string) => {
    onBackgroundConfigChange({
      ...backgroundConfig,
      mode: "color",
      colorHex: hex,
      tolerance: currentTolerance,
      removeAtRuntime: currentRemoveRuntime,
    });
  };

  // Change Tolerance
  const handleToleranceChange = (tolerance: number) => {
    onBackgroundConfigChange({
      ...backgroundConfig,
      mode: currentMode,
      colorHex: currentColor,
      tolerance,
      removeAtRuntime: currentRemoveRuntime,
    });
  };

  // Change Runtime Toggle
  const handleRuntimeToggle = (removeAtRuntime: boolean) => {
    onBackgroundConfigChange({
      ...backgroundConfig,
      mode: currentMode,
      colorHex: currentColor,
      tolerance: currentTolerance,
      removeAtRuntime,
    });
  };

  // Bake & Download Clean PNG
  const handleBakeCleanPng = async () => {
    if (isBaking) return;
    setIsBaking(true);
    setBakedSuccess(false);

    try {
      let img: HTMLImageElement;
      if (image && image.complete && image.naturalWidth > 0) {
        img = image;
      } else {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "anonymous";
        fallbackImg.src = imageSrc;

        await new Promise<void>((resolve, reject) => {
          if (fallbackImg.complete) return resolve();
          fallbackImg.onload = () => resolve();
          fallbackImg.onerror = () =>
            reject(
              new AssetError("Failed to load image for baking", ErrorCode.ASSET_IMAGE_LOAD_FAILED, {
                details: { imageSrc },
              })
            );
        });
        img = fallbackImg;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new CanvasContextError("Could not acquire 2d context for baking", {
          details: { assetId },
        });
      }

      ctx.drawImage(img, 0, 0);

      if (currentMode === "color") {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const keyed = BackgroundProcessor.applyChromaKey(
          imgData,
          currentColor,
          currentTolerance
        );
        imgData.data.set(keyed.data);
        ctx.putImageData(imgData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          setIsBaking(false);
          return;
        }
        const filename = formatAtlasExportFileName(assetId, "cleaned", "png");
        downloadBlob(filename, blob);

        setIsBaking(false);
        setBakedSuccess(true);
        setTimeout(() => setBakedSuccess(false), 3000);
      }, "image/png");
    } catch (err) {
      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .error("Failed to bake clean PNG", {
          error: err instanceof Error ? err.message : String(err),
        });
      setIsBaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Background Mode Switcher */}
      <Card variant="subtle" className="p-2.5 flex flex-col gap-2">
        <Text as="span" size="2xs" weight="bold" uppercase className="text-stone-300 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-400" />
            {t("atlasStudioBgMode")}
          </span>
          <Badge variant={currentMode === "transparent" ? "green" : "amber"}>
            {currentMode}
          </Badge>
        </Text>

        {/* Mode Switcher */}
        <SegmentedControl<"transparent" | "color">
          options={[
            {
              value: "transparent",
              label: t("atlasStudioBgTransparent"),
              icon: <ShieldCheck size={14} className="text-emerald-400" />,
            },
            {
              value: "color",
              label: t("atlasStudioBgColor"),
              icon: <Pipette size={14} className="text-amber-400" />,
            },
          ]}
          value={activeMode}
          onChange={handleModeChange}
          fullWidth
          size="md"
        />
      </Card>

      {/* 2. Color Sampling & Tolerance Controls (when mode === 'color') */}
      {currentMode === "color" && (
        <Card variant="subtle" className="p-2.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Text as="span" size="2xs" weight="bold" uppercase className="text-stone-300 tracking-wider flex items-center gap-1.5">
              <Pipette size={13} className="text-amber-400" />
              {t("atlasStudioChromaKeyTitle")}
            </Text>

            <Button
              size="sm"
              variant="primary"
              onClick={onRequestEyedropper}
              className="h-6 text-[11px] px-2"
            >
              <Pipette size={11} className="mr-1" />
              {t("atlasStudioEyedropperPick")}
            </Button>
          </div>

          {/* Color Hex Input & Swatch */}
          <ColorPickerInput
            value={currentColor}
            onChange={handleColorChange}
            placeholder="#000000"
            sampleTitle={`${t("atlasStudioCurrentColorSampled")} ${currentColor}`}
            colorPickerTitle={t("atlasStudioColorPickerTitle")}
          />

          {/* Quick Presets Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Text as="span" size="3xs" weight="medium" className="text-stone-400 mr-1">{t("atlasStudioPresetsLabel")}</Text>
            {COMMON_PRESETS.map((p) => {
              const isSelected = currentColor.toLowerCase() === p.hex.toLowerCase();
              return (
                <Button
                  key={p.hex}
                  size="sm"
                  variant={isSelected ? "primary" : "secondary"}
                  onClick={() => handleColorChange(p.hex)}
                  className={`h-6 px-1.5 text-[10px] min-h-0 ${
                    !isSelected ? "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200" : ""
                  }`}
                  leftIcon={
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-stone-700 shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                  }
                >
                  <Text as="span" family="mono" size="3xs">{p.name}</Text>
                </Button>
              );
            })}
          </div>

          {/* Tolerance Slider */}
          <div className="pt-1 border-t border-stone-800/80">
            <Slider
              label={t("atlasStudioBgTolerance")}
              value={currentTolerance}
              onChange={handleToleranceChange}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
          </div>

          {/* Remove at runtime toggle */}
          <div className="pt-1">
            <Switch
              checked={currentRemoveRuntime}
              onCheckedChange={handleRuntimeToggle}
              label={
                <Text as="span" size="2xs" weight="medium" className="text-stone-300 select-none">
                  {t("atlasStudioBgRemoveRuntime")}
                </Text>
              }
              size="sm"
            />
          </div>
        </Card>
      )}

      {/* 3. Export Clean PNG (Bake Alpha) Card */}
      <Card variant="subtle" className="p-3 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between">
          <Text as="span" size="xs" weight="bold" className="text-amber-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            {t("atlasStudioAlphaBakerTitle")}
          </Text>
          {bakedSuccess && (
            <Badge variant="green">
              <Check size={10} className="mr-0.5 inline" /> {t("atlasStudioDownloadedBadge")}
            </Badge>
          )}
        </div>

        <Paragraph size="2xs" variant="muted" className="leading-relaxed">
          {t("atlasStudioAlphaBakerDesc")}
        </Paragraph>

        <Button
          size="sm"
          variant="primary"
          onClick={handleBakeCleanPng}
          disabled={isBaking}
          className="h-8 text-xs w-full mt-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-950/60"
        >
          {isBaking ? (
            <>
              <Sparkles size={13} className="mr-1.5 animate-spin text-amber-300" />
              {t("atlasStudioBaking")}
            </>
          ) : (
            <>
              <Download size={13} className="mr-1.5" />
              {t("atlasStudioBakeCleanPng")}
            </>
          )}
        </Button>
      </Card>
    </div>
  );
};
