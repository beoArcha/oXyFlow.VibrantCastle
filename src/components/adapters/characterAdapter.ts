import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "@game/engine/spriteTypes";
import { assetLoader } from "@game/engine/assetLoader";
import { SpriteAnimator } from "@game/engine/spriteAnimator";
import { CharacterPortraitCrop } from "@components/character/types";

export interface CharacterPortraitVM {
  readonly src: string;
  readonly crop?: CharacterPortraitCrop;
  readonly alt: string;
  readonly isLoaded: boolean;
  readonly isMain: boolean;
  readonly characterId: string;
  readonly mood: string;
  readonly description?: string;
}

export interface CharacterSpriteVM {
  readonly texture: HTMLImageElement | null;
  readonly frame: SpriteFrame | null;
  readonly characterId: string;
  readonly quality: AssetQuality;
  readonly tier: CharacterProgressionTier;
  readonly state: AnimationName;
  readonly isLoaded: boolean;
  readonly getFrameForTick: (continuousTicks: number) => {
    readonly frame: SpriteFrame | null;
    readonly frameIndex: number;
  };
}

export interface CharacterProfileVM {
  readonly characterId: string;
  readonly name: string;
  readonly classTitleKey: string;
  readonly classTagsKey: string;
  readonly accentColor: string;
}

export interface AtlasGridDimensionsVM {
  readonly columns: number;
  readonly rows: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
}

export interface AnimationRowVM {
  readonly row: number;
  readonly name: AnimationName;
  readonly labelKey: string;
}

export interface AtlasSheetMetaVM {
  readonly spritesheetUrl: string;
  readonly portraitsGridUrl: string;
  readonly spritesheetGrid: AtlasGridDimensionsVM;
  readonly portraitsGrid: AtlasGridDimensionsVM;
  readonly animationRows: readonly AnimationRowVM[];
}

export const ANIMATION_ROW_MAP: Record<AnimationName, number> = {
  idle: 0,
  run: 1,
  move: 1,
  jump: 2,
  fall: 3,
  attack: 4,
  dash: 5,
  cast: 6,
  crouch: 7,
};

export function resolveAnimationRowIndex(
  animName: AnimationName,
  rows?: readonly AnimationRowVM[]
): number {
  if (rows) {
    const found = rows.find((r) => r.name === animName);
    if (found !== undefined) return found.row;
  }
  return ANIMATION_ROW_MAP[animName] ?? 0;
}

export const DEFAULT_ANIMATION_ROWS: readonly AnimationRowVM[] = [
  { row: 0, name: "idle", labelKey: "animIdle" },
  { row: 1, name: "run", labelKey: "animRun" },
  { row: 2, name: "jump", labelKey: "animJump" },
  { row: 3, name: "fall", labelKey: "animFall" },
  { row: 4, name: "attack", labelKey: "animAttack" },
  { row: 5, name: "dash", labelKey: "animDash" },
  { row: 6, name: "cast", labelKey: "animCast" },
  { row: 7, name: "crouch", labelKey: "animCrouch" },
];

/**
 * Transforms engine portrait and manifest state into a UI CharacterPortraitVM.
 */
export function resolveCharacterPortraitVM(
  characterId: string = "valen",
  mood: string = "main"
): CharacterPortraitVM {
  const resolved = assetLoader.getPortrait(characterId, mood);
  const isLoaded = Boolean(
    resolved.texture && resolved.texture.complete && resolved.texture.naturalWidth > 0
  );

  const manifest = assetLoader.getCharacterManifest(characterId);
  const charName =
    manifest?.name ||
    (characterId ? characterId.charAt(0).toUpperCase() + characterId.slice(1) : "Character");

  const alt = resolved.isMain
    ? `${charName} - ${manifest?.title || "Portrait"}`
    : `${charName} (${mood}) - ${resolved.description || "Mood"}`;

  const crop: CharacterPortraitCrop | undefined = resolved.isMain
    ? undefined
    : {
      x: resolved.sx,
      y: resolved.sy,
      width: resolved.sw,
      height: resolved.sh,
    };

  return {
    src: resolved.imageUrl,
    crop,
    alt,
    isLoaded,
    isMain: resolved.isMain,
    characterId,
    mood,
    description: resolved.description,
  };
}

/**
 * Transforms engine sprite atlas and animator state into a UI CharacterSpriteVM.
 */
export function resolveCharacterSpriteVM(
  characterId: string = "valen",
  quality: AssetQuality = "high",
  state: AnimationName = "idle",
  tier: CharacterProgressionTier = 1
): CharacterSpriteVM {
  const initial = assetLoader.getFrame(characterId, state, 0, quality, tier);
  const texture = initial.texture;
  const isLoaded = Boolean(texture && texture.complete && texture.naturalWidth > 0);

  const getFrameForTick = (continuousTicks: number) => {
    const frameIdx = SpriteAnimator.getFrameIndex(
      characterId,
      state,
      continuousTicks,
      quality,
      tier
    );
    const res = assetLoader.getFrame(
      characterId,
      state,
      frameIdx,
      quality,
      tier
    );
    return {
      frame: res.frame,
      frameIndex: frameIdx,
    };
  };

  return {
    texture,
    frame: initial.frame,
    characterId,
    quality,
    tier,
    state,
    isLoaded,
    getFrameForTick,
  };
}

/**
 * Transforms character identity into presentation profile data (theme color, i18n label keys).
 */
export function resolveCharacterProfileVM(characterId: string): CharacterProfileVM {
  const manifest = assetLoader.getCharacterManifest(characterId);
  const name =
    manifest?.name ||
    (characterId ? characterId.charAt(0).toUpperCase() + characterId.slice(1) : "Character");

  if (characterId === "aurelia") {
    return {
      characterId,
      name,
      classTitleKey: "aureliaClassTitle",
      classTagsKey: "aureliaClassTags",
      accentColor: "#06b6d4",
    };
  }

  return {
    characterId,
    name,
    classTitleKey: "valenClassTitle",
    classTagsKey: "valenClassTags",
    accentColor: "#d97706",
  };
}

/**
 * Resolves sheet URLs, grid configurations, and animation rows for AtlasSheetViewer.
 */
export function resolveAtlasSheetMetaVM(
  characterId: string = "valen",
  quality: AssetQuality = "high"
): AtlasSheetMetaVM {
  const manifest = assetLoader.getCharacterManifest(characterId);
  const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality);

  const spritesheetUrl = spriteMap?.meta.imageUrl || "";
  const portraitsGridUrl = manifest?.portraitsGridUrl || "";

  const sheetW = spriteMap?.meta.sheetWidth || 1536;
  const sheetH = spriteMap?.meta.sheetHeight || 1024;
  const spritesheetColumns = 12;
  const spritesheetRows = 8;
  const spriteCellWidth = sheetW / spritesheetColumns;
  const spriteCellHeight = sheetH / spritesheetRows;

  const portraitColumns = manifest?.portraitsGridColumns || 5;
  const portraitRows = manifest?.portraitsGridRows || 5;
  const portraitCellWidth = manifest?.portraitsGridCellWidth || 232;
  const portraitCellHeight = manifest?.portraitsGridCellHeight || 270;

  return {
    spritesheetUrl,
    portraitsGridUrl,
    spritesheetGrid: {
      columns: spritesheetColumns,
      rows: spritesheetRows,
      cellWidth: spriteCellWidth,
      cellHeight: spriteCellHeight,
    },
    portraitsGrid: {
      columns: portraitColumns,
      rows: portraitRows,
      cellWidth: portraitCellWidth,
      cellHeight: portraitCellHeight,
    },
    animationRows: DEFAULT_ANIMATION_ROWS,
  };
}

/**
 * Subscribes a listener callback to engine asset readiness events.
 */
export function subscribeToAssetLoader(listener: () => void): () => void {
  return assetLoader.subscribe(listener);
}

/**
 * Preloads character textures from the engine asset loader.
 */
export async function preloadCharacterAssets(
  characterId: string,
  quality: AssetQuality = "high",
  tier: CharacterProgressionTier = 1
): Promise<void> {
  return assetLoader.preloadCharacter(characterId, quality, tier);
}
