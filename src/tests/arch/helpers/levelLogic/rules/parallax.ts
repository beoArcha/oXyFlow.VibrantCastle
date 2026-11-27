import { resolveLayerWithDefaults } from "@game/parallax/meta";
import { defaultParallaxRegistry } from "@game/parallax/registry";
import type { LevelContext, Rule } from "../context";
import { violation, type Violation } from "../types";

const MAX_PARALLAX_COMBO = 4;

/**
 * Validates `parallax.layers` combination keys and warns when a `zones` entry
 * has no matching variant file for the map's closest parallax layer.
 */
export const parallaxRules: Rule = ({ blueprint }: LevelContext): Violation[] => {
  if (!blueprint.parallax) {
    if (blueprint.id === "synthetic") return [];
    return [violation("error", "PARALLAX_COMBO", blueprint.id, "missing parallax configuration")];
  }

  const out: Violation[] = [];
  const worldId = blueprint.worldId ?? blueprint.id;
  const meta = defaultParallaxRegistry.getWorldMeta(worldId);
  if (!meta) {
    out.push(violation("error", "PARALLAX_COMBO", worldId, `missing parallax meta for world '${worldId}'`));
    return out;
  }

  const layers = blueprint.parallax.layers;
  if (!Array.isArray(layers) || layers.length < 1 || layers.length > MAX_PARALLAX_COMBO) {
    out.push(
      violation(
        "error",
        "PARALLAX_COMBO",
        "parallax.layers",
        `expected 1 to ${MAX_PARALLAX_COMBO} variation keys, got ${Array.isArray(layers) ? layers.length : 0}`
      )
    );
  }

  const seen = new Set<string>();
  let closestSlot: string | undefined;
  let closestDepth = -Infinity;

  for (const slot of layers ?? []) {
    if (seen.has(slot)) {
      out.push(violation("error", "PARALLAX_COMBO", slot, `duplicate parallax layer key '${slot}'`));
      continue;
    }
    seen.add(slot);

    if (slot === "far") {
      out.push(violation("error", "PARALLAX_COMBO", slot, "far is implicit and must not be listed in parallax.layers"));
      continue;
    }

    const rawLayer = meta.layers[slot];
    const fullKey = `${worldId}:${slot}`;
    if (!rawLayer || !defaultParallaxRegistry.has(fullKey)) {
      out.push(violation("error", "PARALLAX_COMBO", fullKey, `unknown parallax layer key '${fullKey}'`));
      continue;
    }

    const depth = blueprint.parallax.overrides?.[slot]?.depth ?? resolveLayerWithDefaults(rawLayer).depth;
    if (depth > closestDepth) {
      closestDepth = depth;
      closestSlot = slot;
    }
  }

  for (const effectId of blueprint.parallax.effects ?? []) {
    if (!meta.effects?.[effectId]) {
      out.push(violation("error", "PARALLAX_COMBO", `effect:${effectId}`, `unknown parallax effect '${effectId}' in world '${worldId}'`));
    }
  }

  const zones = blueprint.zones ?? blueprint.parallax.zones ?? [];
  for (const zone of zones) {
    for (const effectId of zone.effects ?? []) {
      if (!meta.effects?.[effectId]) {
        out.push(
          violation("error", "PARALLAX_COMBO", `zone:${zone.id}:${effectId}`, `unknown zone effect '${effectId}' in world '${worldId}'`)
        );
      }
    }

    if (closestSlot) {
      const zoneVariantKey = `${worldId}:${closestSlot}@${zone.kind}`;
      if (!defaultParallaxRegistry.has(zoneVariantKey)) {
        out.push(
          violation(
            "warn",
            "PARALLAX_ZONE",
            zone.id,
            `zone '${zone.id}' (${zone.kind}) has no variant file for closest layer '${zoneVariantKey}'`
          )
        );
      }
    }
  }

  return out;
};
