import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import grandBastionData from "@data/locations/grand_bastion.json";

// High-quality parallax layer assets from assets/bg/grand_bastion
import bgBastionFarHighPng from "@assets/bg/grand_bastion/grand_bastion_far_high.png";
import bgBastionMidFarHighPng from "@assets/bg/grand_bastion/grand_bastion_mid_far_high.png";
import bgBastionMidHighPng from "@assets/bg/grand_bastion/grand_bastion_mid_high.png";
import bgBastionMidCloseHighPng from "@assets/bg/grand_bastion/grand_bastion_mid_close_high.png";
import bgBastionCloseHighPng from "@assets/bg/grand_bastion/grand_bastion_close_high.png";

/**
 * Grand Bastion Location parsed directly from grand_bastion.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - 5-tier layered parallax background (far general base, mid-far, mid, mid-close, close overlay)
 * - Expansive unified training circuit incorporating all zone archetypes
 * - Moving platform, thorn bridge, low crouch tunnel, angled shooting ledges
 * - Main Sluice Lever operating the Grand Portcullis
 * - Room transition portals: return to Aether Sanctuary & Mastery Loop portal back to Courtyard
 */
export const grandBastionLocation: LocationDefinition = LocationParser.parse(
  grandBastionData as unknown as LocationJsonSchema
);

// Map actual imported asset URLs to the corresponding layer definitions
if (grandBastionLocation.parallaxBackground?.layers) {
  const urlMap: Record<string, string> = {
    bg_bastion_far: bgBastionFarHighPng,
    bg_bastion_mid_far: bgBastionMidFarHighPng,
    bg_bastion_mid: bgBastionMidHighPng,
    bg_bastion_mid_close: bgBastionMidCloseHighPng,
    bg_bastion_close: bgBastionCloseHighPng,
    grand_bastion_far_high: bgBastionFarHighPng,
    grand_bastion_mid_far_high: bgBastionMidFarHighPng,
    grand_bastion_mid_high: bgBastionMidHighPng,
    grand_bastion_mid_close_high: bgBastionMidCloseHighPng,
    grand_bastion_close_high: bgBastionCloseHighPng,
  };

  const tierMap: Record<string, "far" | "mid_far" | "mid" | "mid_close" | "close"> = {
    bg_bastion_far: "far",
    bg_bastion_mid_far: "mid_far",
    bg_bastion_mid: "mid",
    bg_bastion_mid_close: "mid_close",
    bg_bastion_close: "close",
    grand_bastion_far_high: "far",
    grand_bastion_mid_far_high: "mid_far",
    grand_bastion_mid_high: "mid",
    grand_bastion_mid_close_high: "mid_close",
    grand_bastion_close_high: "close",
  };

  grandBastionLocation.parallaxBackground.layers.forEach((layer) => {
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

export default grandBastionLocation;

