import { defaultMetaParser } from "../../src/game/engine/meta";
import type { IAtlasMetaLike } from "../../src/game/renderer/atlasMetadataResolver";

/** Structures carry `entityId`, creatures and objects carry `characterId` (see assetLoader registration). */
export function parseSheetMeta(raw: Record<string, unknown>): IAtlasMetaLike {
  const parsed = "entityId" in raw ? defaultMetaParser.parseStructure(raw) : defaultMetaParser.parseCreature(raw);
  return parsed as unknown as IAtlasMetaLike;
}
