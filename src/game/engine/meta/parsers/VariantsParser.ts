import { ISectionParser } from "./ISectionParser";
import { IVariantsConfig, IVariantTier } from "../types";
import { AssetQuality } from "../../../types";

export class VariantsParser implements ISectionParser<IVariantsConfig> {
  public readonly sectionName = "variants";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.variants || !!doc.atlas;
  }

  public parse(raw: unknown): IVariantsConfig {
    const doc = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, any>;
    const rawVariants = doc.variants || {};

    const atlas = doc.atlas || {};
    const baseWidth = Number(atlas.cellWidth) || 64;
    const baseHeight = Number(atlas.cellHeight) || 64;

    const parseTier = (quality: AssetQuality, defaultScale: number): IVariantTier => {
      const tier = rawVariants[quality];
      if (tier && typeof tier === "object") {
        return {
          cellWidth: Math.max(1, Number(tier.cellWidth) || Math.round(baseWidth * defaultScale)),
          cellHeight: Math.max(1, Number(tier.cellHeight) || Math.round(baseHeight * defaultScale)),
          scale: Number(tier.scale) > 0 ? Number(tier.scale) : defaultScale,
        };
      }

      return {
        cellWidth: Math.round(baseWidth * defaultScale),
        cellHeight: Math.round(baseHeight * defaultScale),
        scale: defaultScale,
      };
    };

    return {
      variants: {
        low: parseTier("low", 0.67),
        mid: parseTier("mid", 1.0),
        high: parseTier("high", 1.5),
      },
    };
  }
}

export const defaultVariantsParser = new VariantsParser();
