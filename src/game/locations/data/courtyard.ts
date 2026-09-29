import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import courtyardData from "./courtyard.json";

// High-quality parallax layer assets from assets/bg/courtyard
import bgFarHighPng from "@assets/bg/courtyard/courtyard_far_high.png";
import bgMidFarHighPng from "@assets/bg/courtyard/courtyard_mid-far_high.png";
import bgMidHighPng from "@assets/bg/courtyard/courtyard_mid_high.png";
import bgMidCloseHighPng from "@assets/bg/courtyard/courtyard_mid-close_high.png";
import bgCloseHighPng from "@assets/bg/courtyard/courtyard_close_high.png";

/**
 * Courtyard Location parsed directly from courtyard.json blueprint.
 * Features:
 * - Extensible JSON schema
 * - 5-tier high-resolution Parallax background (far, mid-far, mid, mid-close, close)
 * - Monster dictionary (training dummies, sentinels, gargoyles)
 * - Multi-portal network leading to Thorn Chasm, Clocktower, and Grand Bastion
 */
export const courtyardLocation: LocationDefinition = LocationParser.parse(
  courtyardData as unknown as LocationJsonSchema
);

// Map actual imported asset URLs to the corresponding layer definitions
if (courtyardLocation.parallaxBackground?.layers) {
  const urlMap: Record<string, string> = {
    bg_far: bgFarHighPng,
    bg_mid_far: bgMidFarHighPng,
    bg_mid: bgMidHighPng,
    bg_mid_close: bgMidCloseHighPng,
    bg_close: bgCloseHighPng,
    courtyard_far_high: bgFarHighPng,
    "courtyard_mid-far_high": bgMidFarHighPng,
    courtyard_mid_high: bgMidHighPng,
    "courtyard_mid-close_high": bgMidCloseHighPng,
    courtyard_close_high: bgCloseHighPng,
  };

  const tierMap: Record<string, "far" | "mid_far" | "mid" | "mid_close" | "close"> = {
    bg_far: "far",
    bg_mid_far: "mid_far",
    bg_mid: "mid",
    bg_mid_close: "mid_close",
    bg_close: "close",
    courtyard_far_high: "far",
    "courtyard_mid-far_high": "mid_far",
    courtyard_mid_high: "mid",
    "courtyard_mid-close_high": "mid_close",
    courtyard_close_high: "close",
  };

  courtyardLocation.parallaxBackground.layers.forEach((layer) => {
    if (layer.imageUrl && urlMap[layer.imageUrl]) {
      layer.imageUrl = urlMap[layer.imageUrl];
    } else if (urlMap[layer.id]) {
      layer.imageUrl = urlMap[layer.id];
    }
    if (!layer.tier && tierMap[layer.id]) {
      layer.tier = tierMap[layer.id];
    }
  });
}

export default courtyardLocation;

