import { Enemy } from "@game/types";
import { IAtlasSpriteRenderer } from "./atlasSpriteRenderer";

const DUMMY_ATLAS_ID = "training_dummy";
const AERIAL_ATLAS_ID = "clockwork_owl_gargoyle";

/**
 * Atlas priority: explicit enemy.atlasId, then templateId, then legacy dummy/aerial defaults.
 */
export function pickEnemyAtlasId(atlasRenderer: IAtlasSpriteRenderer, enemy: Enemy): string | null {
  if (enemy.atlasId && atlasRenderer.hasAtlas(enemy.atlasId)) return enemy.atlasId;
  if (enemy.templateId && atlasRenderer.hasAtlas(enemy.templateId)) return enemy.templateId;
  if (enemy.isDummy && atlasRenderer.hasAtlas(DUMMY_ATLAS_ID)) return DUMMY_ATLAS_ID;
  if (enemy.isAerial && atlasRenderer.hasAtlas(AERIAL_ATLAS_ID)) return AERIAL_ATLAS_ID;
  return null;
}

function baseAnimation(enemy: Enemy): string {
  if (enemy.isAerial) return "fly";
  return !enemy.isDummy && enemy.vx !== 0 ? "move" : "idle";
}

function withIdleFallback(atlasRenderer: IAtlasSpriteRenderer, atlasId: string, name: string): string {
  if (name === "idle" || atlasRenderer.hasAnimation(atlasId, name)) return name;
  return "idle";
}

/**
 * Picks an animation the atlas really defines: move/fly fall back to idle,
 * hit falls back to the enemy's current base animation (itself falling back to idle).
 */
export function resolveEnemyAnimation(
  atlasRenderer: IAtlasSpriteRenderer,
  atlasId: string,
  requested: string,
  enemy: Enemy
): string {
  if (atlasRenderer.hasAnimation(atlasId, requested)) return requested;
  if (requested === "hit") return withIdleFallback(atlasRenderer, atlasId, baseAnimation(enemy));
  if (requested === "move" || requested === "fly") return "idle";
  return requested;
}
