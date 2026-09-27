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
import { Button, Slider, Badge } from "@/components/ui";
import { useI18n } from "@/hooks/useI18n";
import { IAtlasBackgroundConfig } from "./types";
import { BackgroundProcessor } from "@/game/engine/meta/slicing";

export interface AtlasBackgroundPanelProps {
  imageSrc: string;
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
  assetId,
  backgroundConfig,
  onBackgroundConfigChange,
  onRequestEyedropper,
}) => {
  const { t } = useI18n();

  const [isBaking, setIsBaking] = useState<boolean>(false);
  const [bakedSuccess, setBakedSuccess] = useState<boolean>(false);

  const currentMode = backgroundConfig?.mode || "transparent";
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
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for baking"));
      });

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
      console.error("Failed to bake clean PNG", err);
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

        {/* Mode Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModeChange("transparent")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${currentMode === "transparent"
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
              }`}
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{t("atlasStudioBgTransparent")}</span>
          </button>

          <button
            onClick={() => handleModeChange("color")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${currentMode === "color"
                ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm shadow-amber-950/40"
                : "bg-black/50 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
              }`}
          >
            <Pipette size={14} className="text-amber-400" />
            <span>{t("atlasStudioBgColor")}</span>
          </button>
        </div>
      </div>

      {/* 2. Color Sampling & Tolerance Controls (when mode === 'color') */}
      {currentMode === "color" && (
        <div className="p-2.5 bg-[#120603] rounded-xl border border-stone-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Pipette size={13} className="text-amber-400" />
              Chroma Key & Eyedropper
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
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2 border-stone-700 shadow-inner flex-shrink-0"
              style={{ backgroundColor: currentColor }}
              title={`Current sampled color: ${currentColor}`}
            />
            <div className="flex-1 flex items-center gap-1.5">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#000000"
                className="w-full bg-black/70 border border-stone-800 rounded px-2.5 py-1 text-xs text-amber-200 font-mono font-bold"
              />
              <input
                type="color"
                value={currentColor.startsWith("#") && currentColor.length === 7 ? currentColor : "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-7 bg-transparent border-0 cursor-pointer rounded"
                title="Open system color picker"
              />
            </div>
          </div>

          {/* Quick Presets Swatches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-stone-400 mr-1 font-medium">Presets:</span>
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

          {/* Remove at runtime checkbox */}
          <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={currentRemoveRuntime}
              onChange={(e) => handleRuntimeToggle(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-[11px]">{t("atlasStudioBgRemoveRuntime")}</span>
          </label>
        </div>
      )}

      {/* 3. Export Clean PNG (Bake Alpha) Card */}
      <div className="p-3 bg-gradient-to-br from-[#180d06] to-[#120603] rounded-xl border border-amber-900/60 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Asset Slicer & Alpha Baker
          </span>
          {bakedSuccess && (
            <Badge variant="green">
              <Check size={10} className="mr-0.5 inline" /> Downloaded
            </Badge>
          )}
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          Bake chroma transparency permanently into a standalone PNG asset, ready for game engines or production export.
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
