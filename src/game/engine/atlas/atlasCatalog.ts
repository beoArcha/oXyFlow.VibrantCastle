import type { AssetQuality } from "../../types";
import { defaultMetaParser } from "../meta";
import type {
  AtlasCatalogEntry,
  AtlasCategory,
  AtlasFileMap,
  AtlasMeta,
  AtlasVariant,
  AtlasVariants,
} from "./atlasTypes";

export interface AtlasCatalogOptions {
  /** Structure folders that are registered; every other structure folder is ignored. */
  structureAllowList: readonly string[];
}

interface AtlasFolder {
  category: AtlasCategory;
  id: string;
  images: Map<string, string>;
  metas: Map<string, unknown>;
}

const PATH_PATTERN = /(?:^|\/)(enemies|structures)\/([^/]+)\/([^/]+)$/;

const SVG_TIERS: ReadonlyArray<{ tier: AssetQuality; suffix: string }> = [
  { tier: "low", suffix: "hi8bit" },
  { tier: "mid", suffix: "hi16bit" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function groupByFolder(files: AtlasFileMap): Map<string, AtlasFolder> {
  const folders = new Map<string, AtlasFolder>();
  const add = (key: string, kind: "images" | "metas", value: unknown): void => {
    const match = PATH_PATTERN.exec(key.replace(/\\/g, "/"));
    if (!match) return;
    const category: AtlasCategory = match[1] === "enemies" ? "enemy" : "structure";
    const folderKey = `${category}/${match[2]}`;
    let folder = folders.get(folderKey);
    if (!folder) {
      folder = { category, id: match[2], images: new Map(), metas: new Map() };
      folders.set(folderKey, folder);
    }
    if (kind === "images") folder.images.set(match[3], value as string);
    else folder.metas.set(match[3], value);
  };
  for (const [key, value] of Object.entries(files.images)) add(key, "images", value);
  for (const [key, value] of Object.entries(files.metas)) add(key, "metas", value);
  return folders;
}

function readBodyBox(raw: unknown): { x: number; y: number; w: number; h: number } | null {
  if (!isRecord(raw) || !isRecord(raw.layout) || !isRecord(raw.layout.bodyBox)) return null;
  const { x, y, w, h } = raw.layout.bodyBox;
  if (typeof x !== "number" || typeof y !== "number" || typeof w !== "number" || typeof h !== "number") {
    return null;
  }
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

function readSlicing(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw) || !isRecord(raw.slicing)) return null;
  return raw.slicing;
}

/**
 * Parses a raw meta and carries `layout.bodyBox` and `slicing` over: the shared layout parser
 * drops them, yet the renderer needs bodyBox for scale/anchoring and slicing for irregular sheets.
 */
export function parseAtlasMeta(raw: unknown, category: AtlasCategory): AtlasMeta {
  const parsed: AtlasMeta =
    category === "enemy" ? defaultMetaParser.parseCreature(raw) : defaultMetaParser.parseStructure(raw);
  const bodyBox = readBodyBox(raw);
  const slicing = readSlicing(raw);
  if (!bodyBox && !slicing) return parsed;
  const next: Record<string, unknown> = { ...(parsed as unknown as Record<string, unknown>) };
  if (bodyBox) {
    const layout = (parsed as { layout?: object }).layout ?? {};
    next.layout = { ...layout, bodyBox };
  }
  if (slicing) {
    next.slicing = slicing;
  }
  return next as unknown as AtlasMeta;
}

function declaredSvgFile(raw: unknown, tier: AssetQuality): string | null {
  if (!isRecord(raw) || !isRecord(raw.variants)) return null;
  const variant = raw.variants[tier];
  return isRecord(variant) && typeof variant.file === "string" ? variant.file : null;
}

function stripPngSlicingForSvg(meta: AtlasMeta): AtlasMeta {
  const record = meta as unknown as Record<string, unknown>;
  if (!("slicing" in record) || record.slicing === undefined) return meta;
  const next: Record<string, unknown> = { ...record };
  delete next.slicing;
  return next as unknown as AtlasMeta;
}

function buildVariants(folder: AtlasFolder): AtlasVariants {
  const { id, images, metas } = folder;
  const variants: AtlasVariants = {};
  const variant = (src: string, format: AtlasVariant["format"], meta: AtlasMeta): AtlasVariant => ({
    src,
    format,
    meta,
  });

  const sharedRaw = metas.get(`${id}_meta.json`);
  const sharedMeta = sharedRaw !== undefined ? parseAtlasMeta(sharedRaw, folder.category) : null;
  const svgMeta = sharedMeta ? stripPngSlicingForSvg(sharedMeta) : null;

  for (const { tier, suffix } of SVG_TIERS) {
    const declaredFile = declaredSvgFile(sharedRaw, tier);
    const file = declaredFile ?? `${id}_${suffix}.svg`;
    const src = images.get(file);
    if (src && svgMeta) {
      // PNG freeform_rects slicing applies to the original PNG only, never to grid-based SVG sheets.
      variants[tier] = variant(src, "svg", svgMeta);
    }
  }

  const packedRaw = metas.get(`${id}_packed_meta.json`);
  const packedSrc = images.get(`${id}_packed_high.png`);
  const originalSrc = images.get(`${id}_high.png`);
  if (packedSrc && packedRaw !== undefined) {
    variants.high = variant(packedSrc, "png", parseAtlasMeta(packedRaw, folder.category));
  } else if (originalSrc && sharedMeta) {
    variants.high = variant(originalSrc, "png", sharedMeta);
  }
  return variants;
}

/**
 * Builds the atlas catalog from a discovered file map. Enemy folders are all registered;
 * structure folders only when allow-listed. Packed PNG sheets win over the original sheet.
 */
export function buildAtlasCatalog(files: AtlasFileMap, options: AtlasCatalogOptions): AtlasCatalogEntry[] {
  const catalog: AtlasCatalogEntry[] = [];
  for (const folder of groupByFolder(files).values()) {
    if (folder.category === "structure" && !options.structureAllowList.includes(folder.id)) continue;
    const variants = buildVariants(folder);
    if (Object.keys(variants).length === 0) continue;
    catalog.push({ id: folder.id, category: folder.category, variants });
  }
  return catalog.sort((a, b) => a.id.localeCompare(b.id));
}
