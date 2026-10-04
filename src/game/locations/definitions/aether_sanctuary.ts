import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import aetherSanctuaryData from "@data/locations/aether_sanctuary.json";

// High-quality parallax layer assets from assets/bg/aether_sanctuary
import bgAetherFarHighPng from "@assets/bg/aether_sanctuary/aether_sanctuary_far_high.png";
import bgAetherMidFarHighPng from "@assets/bg/aether_sanctuary/aether_sanctuary_mid_far_high.png";
import bgAetherMidHighPng from "@assets/bg/aether_sanctuary/aether_sanctuary_mid_high.png";
import bgAetherMidCloseHighPng from "@assets/bg/aether_sanctuary/aether_sanctuary_mid_close_high.png";
import bgAetherCloseHighPng from "@assets/bg/aether_sanctuary/aether_sanctuary_close_high.png";

/**
 * Aether Sanctuary Location parsed directly from aether_sanctuary.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - 5-tier high-resolution Parallax background (far, mid-far, mid, mid-close, close)
 * - Floating masonry sky islands with celestial void hazard abyss below
 * - Moving crystal platforms and vertical celestial elevator
 * - Sanctuary Gateway lever unlocking the Celestial Barrier
 * - Castlevania portals: return to Clocktower & forward to Grand Bastion
 */
export const aetherSanctuaryLocation: LocationDefinition = LocationParser.parse(
  aetherSanctuaryData as unknown as LocationJsonSchema
);

// Map actual imported asset URLs to the corresponding layer definitions
if (aetherSanctuaryLocation.parallaxBackground?.layers) {
  const urlMap: Record<string, string> = {
    bg_aether_far: bgAetherFarHighPng,
    bg_aether_mid_far: bgAetherMidFarHighPng,
    bg_aether_mid: bgAetherMidHighPng,
    bg_aether_mid_close: bgAetherMidCloseHighPng,
    bg_aether_close: bgAetherCloseHighPng,
    aether_sanctuary_far_high: bgAetherFarHighPng,
    aether_sanctuary_mid_far_high: bgAetherMidFarHighPng,
    aether_sanctuary_mid_high: bgAetherMidHighPng,
    aether_sanctuary_mid_close_high: bgAetherMidCloseHighPng,
    aether_sanctuary_close_high: bgAetherCloseHighPng,
  };

  const tierMap: Record<string, "far" | "mid_far" | "mid" | "mid_close" | "close"> = {
    bg_aether_far: "far",
    bg_aether_mid_far: "mid_far",
    bg_aether_mid: "mid",
    bg_aether_mid_close: "mid_close",
    bg_aether_close: "close",
    aether_sanctuary_far_high: "far",
    aether_sanctuary_mid_far_high: "mid_far",
    aether_sanctuary_mid_high: "mid",
    aether_sanctuary_mid_close_high: "mid_close",
    aether_sanctuary_close_high: "close",
  };

  aetherSanctuaryLocation.parallaxBackground.layers.forEach((layer) => {
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

export default aetherSanctuaryLocation;

