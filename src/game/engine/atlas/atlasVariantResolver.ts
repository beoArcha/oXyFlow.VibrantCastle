import type { AssetQuality } from "../../types";

const CHAINS: Record<AssetQuality, readonly AssetQuality[]> = {
  low: ["low", "mid", "high"],
  mid: ["mid", "high", "low"],
  high: ["high", "mid", "low"],
};

/**
 * Picks the tier to draw: the requested one, else mid, high, low.
 * `failed` lists tiers that could not be loaded and must be skipped.
 */
export function resolveVariantTier<T>(
  variants: Partial<Record<AssetQuality, T>>,
  requested: AssetQuality,
  failed?: ReadonlySet<AssetQuality>
): AssetQuality | null {
  const chain = CHAINS[requested];
  for (let i = 0; i < chain.length; i++) {
    const tier = chain[i];
    if (variants[tier] && !failed?.has(tier)) return tier;
  }
  return null;
}
