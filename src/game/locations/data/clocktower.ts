import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import clocktowerData from "./clocktower.json";

// High-quality parallax layer assets from assets/bg/clocktower
import bgTowerFarHighPng from "../../../assets/bg/clocktower/clocktower_far_high.png";
import bgTowerMidFarHighPng from "../../../assets/bg/clocktower/clocktower_mid_far_high.png";
import bgTowerMidHighPng from "../../../assets/bg/clocktower/clocktower_mid_high.png";
import bgTowerMidCloseHighPng from "../../../assets/bg/clocktower/clocktower_mid_close_high.png";
import bgTowerCloseHighPng from "../../../assets/bg/clocktower/clocktower_close_high.png";

/**
 * Clocktower Location parsed directly from clocktower.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - 5-tier high-resolution Parallax background (far, mid-far, mid, mid-close, close)
 * - Multi-tiered vertical tower layout with dual moving elevators
 * - Angled target testing platforms (45° and 90° magic aiming)
 * - Clockwork Gear interactive lever and Spire Gate
 * - Castlevania portals: return to Thorn Chasm & forward to Aether Sanctuary
 */
export const clocktowerLocation: LocationDefinition = LocationParser.parse(
  clocktowerData as unknown as LocationJsonSchema
);

// Map actual imported asset URLs to the corresponding layer definitions
if (clocktowerLocation.parallaxBackground?.layers) {
  const urlMap: Record<string, string> = {
    bg_clocktower_far: bgTowerFarHighPng,
    bg_clocktower_mid_far: bgTowerMidFarHighPng,
    bg_clocktower_mid: bgTowerMidHighPng,
    bg_clocktower_mid_close: bgTowerMidCloseHighPng,
    bg_clocktower_close: bgTowerCloseHighPng,
    clocktower_far_high: bgTowerFarHighPng,
    clocktower_mid_far_high: bgTowerMidFarHighPng,
    clocktower_mid_high: bgTowerMidHighPng,
    clocktower_mid_close_high: bgTowerMidCloseHighPng,
    clocktower_close_high: bgTowerCloseHighPng,
  };

  const tierMap: Record<string, "far" | "mid_far" | "mid" | "mid_close" | "close"> = {
    bg_clocktower_far: "far",
    bg_clocktower_mid_far: "mid_far",
    bg_clocktower_mid: "mid",
    bg_clocktower_mid_close: "mid_close",
    bg_clocktower_close: "close",
    clocktower_far_high: "far",
    clocktower_mid_far_high: "mid_far",
    clocktower_mid_high: "mid",
    clocktower_mid_close_high: "mid_close",
    clocktower_close_high: "close",
  };

  clocktowerLocation.parallaxBackground.layers.forEach((layer) => {
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

export default clocktowerLocation;

