import type { ISpriteSourceFactory } from "../sprites";
import { discoverTilesetFiles } from "./tilesetDiscovery";
import { TilesetManager } from "./tilesetManager";

export { parseTilesetMeta, REQUIRED_TILES } from "./tilesetMeta";
export type { TilesetMeta, TilesetKind, TileCell, TilesetVariantMeta } from "./tilesetMeta";
export { buildTilePlan, tileHash, PLAN_STRIDE } from "./tilePlan";
export type { TilePlan } from "./tilePlan";
export { TilesetManager, loadTilesetImage } from "./tilesetManager";
export type { ITilesetProvider, ResolvedTileset, TilesetImageLoader } from "./tilesetManager";
export { discoverTilesetFiles } from "./tilesetDiscovery";

/** A manager holding every tileset found under `src/assets/tiles`, following the given quality source. */
export function createDiscoveredTilesetManager(sprites: ISpriteSourceFactory): TilesetManager {
  const manager = new TilesetManager(sprites);
  manager.registerDiscovered(discoverTilesetFiles());
  return manager;
}
