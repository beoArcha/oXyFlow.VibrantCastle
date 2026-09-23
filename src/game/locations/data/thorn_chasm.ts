import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import thornChasmData from "./thorn_chasm.json";

// High-quality parallax layer assets from assets/bg/thorn_chasm
import bgChasmFarHighPng from "../../../assets/bg/thorn_chasm/thorn_chasm_far_high.png";
import bgChasmMidFarHighPng from "../../../assets/bg/thorn_chasm/thorn_chasm_mid_far_high.png";
import bgChasmMidHighPng from "../../../assets/bg/thorn_chasm/thorn_chasm_mid_high.png";
import bgChasmCloseMidHighPng from "../../../assets/bg/thorn_chasm/thorn_chasm_close_mid_high.png";
import bgChasmCloseHighPng from "../../../assets/bg/thorn_chasm/thorn_chasm_close_high.png";

/**
 * Thorn Chasm Location parsed directly from thorn_chasm.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - 5-tier layered parallax background (far general base, mid-far, mid, mid-close, close overlay)
 * - Hazard pits, stepping stones, crouch slide archway, moving rock platform
 * - Castlevania portals: return to Courtyard & forward to Clocktower
 */
export const thornChasmLocation: LocationDefinition = LocationParser.parse(
  thornChasmData as unknown as LocationJsonSchema
);

// Map actual imported asset URLs to the corresponding layer definitions
if (thornChasmLocation.parallaxBackground?.layers) {
  const urlMap: Record<string, string> = {
    bg_chasm_far: bgChasmFarHighPng,
    bg_chasm_mid_far: bgChasmMidFarHighPng,
    bg_chasm_mid: bgChasmMidHighPng,
    bg_chasm_mid_close: bgChasmCloseMidHighPng,
    bg_chasm_close: bgChasmCloseHighPng,
    thorn_chasm_far_high: bgChasmFarHighPng,
    thorn_chasm_mid_far_high: bgChasmMidFarHighPng,
    thorn_chasm_mid_high: bgChasmMidHighPng,
    thorn_chasm_close_mid_high: bgChasmCloseMidHighPng,
    thorn_chasm_close_high: bgChasmCloseHighPng,
  };

  const tierMap: Record<string, "far" | "mid_far" | "mid" | "mid_close" | "close"> = {
    bg_chasm_far: "far",
    bg_chasm_mid_far: "mid_far",
    bg_chasm_mid: "mid",
    bg_chasm_mid_close: "mid_close",
    bg_chasm_close: "close",
    thorn_chasm_far_high: "far",
    thorn_chasm_mid_far_high: "mid_far",
    thorn_chasm_mid_high: "mid",
    thorn_chasm_close_mid_high: "mid_close",
    thorn_chasm_close_high: "close",
  };

  thornChasmLocation.parallaxBackground.layers.forEach((layer) => {
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

export default thornChasmLocation;

