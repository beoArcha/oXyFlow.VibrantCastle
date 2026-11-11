export * from "./atlasTypes";
export { buildAtlasCatalog, parseAtlasMeta } from "./atlasCatalog";
export type { AtlasCatalogOptions } from "./atlasCatalog";
export { discoverAtlasFiles, REGISTERED_STRUCTURE_IDS } from "./atlasFileDiscovery";
export { resolveVariantTier } from "./atlasVariantResolver";
export { AtlasTextureManager } from "./atlasTextureManager";
export type { AtlasTextureDeps } from "./atlasTextureManager";
export { chooseRasterScale, loadSvgTexture } from "./svgRaster";
export type { RasterEnvironment, ReleasableTexture } from "./svgRaster";
