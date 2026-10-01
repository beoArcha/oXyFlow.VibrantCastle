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
import { Button, Slider, Badge, Switch, SegmentedControl, ColorPickerInput } from "@/components/ui";
import { useI18n } from "@context/I18nContext";
import { IAtlasBackgroundConfig } from "./types";
import { BackgroundProcessor } from "@/game/engine/meta/slicing";
import { LoggerManager } from "@lib/logger";

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
          fallbackImg.onerror = () => reject(new Error("Failed to load image for baking"));
        });
        img = fallbackImg;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not acquire 2d context for baking");

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
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${assetId}_cleaned.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

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
      <div className="p-2.5 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2">
        <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-400" />
            {t("atlasStudioBgMode")}
          </span>
          <Badge variant={currentMode === "transparent" ? "green" : "amber"}>
            {currentMode}
          </Badge>
        </span>

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
      </div>

      {/* 2. Color Sampling & Tolerance Controls (when mode === 'color') */}
      {currentMode === "color" && (
        <div className="p-2.5 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Pipette size={13} className="text-amber-400" />
              {t("atlasStudioChromaKeyTitle")}
            </span>

            <Button
              size="sm"
              variant="primary"
              onClick={onRequestEyedropper}
              className="h-6 text-[11px] px-2 font-bold"
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
            <span className="text-[10px] text-stone-400 mr-1 font-medium">{t("atlasStudioPresetsLabel")}</span>
            {COMMON_PRESETS.map((p) => (
              <button
                key={p.hex}
                onClick={() => handleColorChange(p.hex)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${currentColor.toLowerCase() === p.hex.toLowerCase()
                    ? "border-amber-400 bg-amber-950/50 text-amber-200 font-bold"
                    : "border-stone-800 bg-black/40 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                  }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-stone-700"
                  style={{ backgroundColor: p.hex }}
                />
                {p.name}
              </button>
            ))}
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
                <span className="text-[11px] text-stone-300 font-medium select-none">
                  {t("atlasStudioBgRemoveRuntime")}
                </span>
              }
              size="sm"
            />
          </div>
        </div>
      )}

      {/* 3. Export Clean PNG (Bake Alpha) Card */}
      <div className="p-3 bg-gradient-to-br from-[#180d06] to-[#120603] rounded-xl border border-amber-900/60 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            {t("atlasStudioAlphaBakerTitle")}
          </span>
          {bakedSuccess && (
            <Badge variant="green">
              <Check size={10} className="mr-0.5 inline" /> {t("atlasStudioDownloadedBadge")}
            </Badge>
          )}
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          {t("atlasStudioAlphaBakerDesc")}
        </p>

        <Button
          size="sm"
          variant="primary"
          onClick={handleBakeCleanPng}
          disabled={isBaking}
          className="h-8 text-xs font-bold w-full mt-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-950/60"
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
      </div>
    </div>
  );
};
