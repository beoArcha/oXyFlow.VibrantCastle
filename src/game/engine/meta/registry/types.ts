/**
 * types.ts
 *
 * Domain types and contracts for the Central Atlas Asset Registry.
 * Follows SOLID (Interface Segregation Principle & Open-Closed Principle).
 */

import { AtlasMetaDoc } from "@/components/developer/subtabs/atlas/types";

export type AtlasCategory =
  | "character"
  | "enemy"
  | "structure"
  | "portrait"
  | "custom";

export interface IAtlasAssetManifestItem {
  id: string;
  name: string;
  category: AtlasCategory;
  isPopular?: boolean;
  tags?: string[];
  imageRelPath: string; // Strictly relational, e.g. "./characters/valen/valen_level_1_high.png"
  metaRelPath: string; // Strictly relational, e.g. "./characters/valen/valen_meta.json"
  description?: string;
}

export interface IAtlasManifest {
  version: string;
  assets: IAtlasAssetManifestItem[];
}

export interface ResolvedAtlasAssetItem extends IAtlasAssetManifestItem {
  imageSrc: string;
  defaultMeta: AtlasMetaDoc;
}

export interface IAtlasAssetRegistry {
  getAll(): IAtlasAssetManifestItem[];
  getById(id: string): IAtlasAssetManifestItem | undefined;
  getByCategory(category: AtlasCategory): IAtlasAssetManifestItem[];
  getPopular(): IAtlasAssetManifestItem[];
  search(query: string, filter?: AtlasCategory | "all" | "popular"): IAtlasAssetManifestItem[];
  register(item: IAtlasAssetManifestItem): void;
  resolveAsset(id: string): ResolvedAtlasAssetItem | undefined;
  getAllResolved(): ResolvedAtlasAssetItem[];
}
