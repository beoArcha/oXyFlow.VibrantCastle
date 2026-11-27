import aetherSanctuaryMeta from "@assets/parallax/aether_sanctuary/aether_sanctuary_parallax_meta.json";
import alchemistLibraryMeta from "@assets/parallax/alchemist_library/alchemist_library_parallax_meta.json";
import ashenCatacombsMeta from "@assets/parallax/ashen_catacombs/ashen_catacombs_parallax_meta.json";
import clocktowerMeta from "@assets/parallax/clocktower/clocktower_parallax_meta.json";
import courtyardMeta from "@assets/parallax/courtyard/courtyard_parallax_meta.json";
import eclipseCrownMeta from "@assets/parallax/eclipse_crown/eclipse_crown_parallax_meta.json";
import grandBastionMeta from "@assets/parallax/grand_bastion/grand_bastion_parallax_meta.json";
import thornChasmMeta from "@assets/parallax/thorn_chasm/thorn_chasm_parallax_meta.json";
import type { ParallaxPlaceholderColors, WorldParallaxMeta } from "../meta";

const ALL_WORLD_METAS: readonly WorldParallaxMeta[] = [
  courtyardMeta as unknown as WorldParallaxMeta,
  thornChasmMeta as unknown as WorldParallaxMeta,
  ashenCatacombsMeta as unknown as WorldParallaxMeta,
  clocktowerMeta as unknown as WorldParallaxMeta,
  alchemistLibraryMeta as unknown as WorldParallaxMeta,
  aetherSanctuaryMeta as unknown as WorldParallaxMeta,
  grandBastionMeta as unknown as WorldParallaxMeta,
  eclipseCrownMeta as unknown as WorldParallaxMeta,
];

const WORLD_META_BY_ID = new Map<string, WorldParallaxMeta>();
for (const meta of ALL_WORLD_METAS) {
  WORLD_META_BY_ID.set(meta.worldId, meta);
}

/**
 * Returns the parsed parallax metadata for a world, if shipped.
 */
export function getWorldParallaxMeta(worldId: string | undefined): WorldParallaxMeta | undefined {
  if (!worldId) return undefined;
  return WORLD_META_BY_ID.get(worldId);
}

/**
 * Returns the frame-1 placeholder gradient/silhouette colours defined in the world's parallax meta.
 */
export function getWorldPlaceholderColors(worldId: string | undefined): ParallaxPlaceholderColors | undefined {
  return getWorldParallaxMeta(worldId)?.placeholder;
}
