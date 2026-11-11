import type { AssetQuality } from "../../types";
import type {
  IUniversalMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
} from "../meta";
import type { AtlasMetaDoc } from "../spriteTypes";

export type AtlasCategory = "enemy" | "structure";
export type AtlasFormat = "png" | "svg";
export type AtlasMeta =
  | IUniversalMetaDocument
  | ICreatureMetaDocument
  | IStructureMetaDocument
  | AtlasMetaDoc;

export interface AtlasVariant {
  src: string;
  format: AtlasFormat;
  meta: AtlasMeta;
}

export type AtlasVariants = Partial<Record<AssetQuality, AtlasVariant>>;

export interface AtlasCatalogEntry {
  id: string;
  category: AtlasCategory;
  variants: AtlasVariants;
}

/** Legacy single-image view of an atlas; `imageSrc` and `meta` describe the variant currently in use. */
export interface RegisteredAtlasItem {
  id: string;
  category: AtlasCategory;
  imageSrc: string;
  meta: AtlasMeta;
  variants?: AtlasVariants;
}

/** Drawable sheet with explicit pixel size (canvases have no naturalWidth). */
export interface AtlasTexture {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  /** Pixel-art raster: draw with image smoothing disabled. */
  readonly crisp: boolean;
}

/** Texture and the meta that describes its grid, resolved together so they never disagree. */
export interface ResolvedAtlasSource {
  readonly id: string;
  readonly tier: AssetQuality;
  readonly texture: AtlasTexture;
  readonly meta: AtlasMeta;
}

export interface AtlasFileMap {
  images: Readonly<Record<string, string>>;
  metas: Readonly<Record<string, unknown>>;
}
