import { AssetQuality } from "../types";
import { AnimationName, CharacterProgressionTier } from "./spriteTypes";
import { assetLoader } from "./assetLoader";

export interface RenderSpriteOptions {
  characterId?: string;
  quality?: AssetQuality;
  tier?: CharacterProgressionTier;
  state: AnimationName;
  frameIndex?: number;
  ticks?: number;
  facingLeft?: boolean;
  alpha?: number;
  scale?: number;
  groundOffset?: number;
  targetX: number;
  targetY: number;
  targetWidth?: number;
  targetHeight?: number;
}

export class SpriteAnimator {
  /**
   * Calculates the discrete frame index given continuous ticks and animation track
   */
  public static getFrameIndex(
    characterId: string,
    animName: AnimationName,
    ticks: number,
    quality: AssetQuality = assetLoader.getQuality(),
    tier: CharacterProgressionTier = 1
  ): number {
    const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality, tier);
    if (!spriteMap) return 0;

    const resolvedName =
      animName === "move" && !spriteMap.animations.move
        ? "run"
        : animName === "run" && !spriteMap.animations.run
        ? "move"
        : animName;

    const track = spriteMap.animations[resolvedName] || spriteMap.animations.idle;
    const duration = Math.max(1, track.frameDuration);
    const totalFrames = Math.max(1, track.frameCount);

    if (track.loop) {
      return Math.floor(ticks / duration) % totalFrames;
    } else {
      return Math.min(Math.floor(ticks / duration), totalFrames - 1);
    }
  }

  /**
   * Draws a character frame to a 2D canvas context using the sprite map
   */
  public static renderToCanvas(
    ctx: CanvasRenderingContext2D,
    options: RenderSpriteOptions
  ): boolean {
    const {
      characterId = "valen",
      quality = assetLoader.getQuality(),
      tier = 1,
      state,
      ticks = 0,
      facingLeft = false,
      alpha = 1,
      scale = 1,
      targetX,
      targetY,
      targetWidth = 28,
      targetHeight = 52,
    } = options;

    const frameIdx =
      options.frameIndex !== undefined
        ? options.frameIndex
        : this.getFrameIndex(characterId, state, ticks, quality, tier);

    const { texture, frame } = assetLoader.getFrame(
      characterId,
      state,
      frameIdx,
      quality,
      tier
    );

    if (!frame) return false;

    // Save context state for transform & alpha
    ctx.save();
    ctx.globalAlpha = alpha;

    // Anchor at center feet of the character
    const feetX = Math.round(targetX + targetWidth / 2);
    const feetY = Math.round(targetY + targetHeight);

    ctx.translate(feetX, feetY);

    if (facingLeft) {
      ctx.scale(-1 * scale, scale);
    } else if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    if (texture && texture.complete && texture.naturalWidth > 0) {
      // Texture is loaded: Blit sub-rectangle directly from Sprite Map Atlas
      // Scale sprite proportionally so that standard standing height matches targetHeight across Low/Mid/High qualities
      const rowHeight = texture.naturalHeight / 8;
      const standingHeight = characterId === "aurelia" ? rowHeight * 0.90 : rowHeight * 0.92;
      const renderScale = targetHeight / Math.max(1, standingHeight);
      const drawW = frame.w * renderScale;
      const drawH = frame.h * renderScale;
      const drawOriginX = frame.originX * renderScale;
      const drawOriginY = frame.originY * renderScale;

      ctx.drawImage(
        texture,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -drawOriginX,
        -drawOriginY,
        drawW,
        drawH
      );
    } else {
      // Graceful fallback while texture loads in background
      ctx.fillStyle = characterId === "valen" ? "rgba(120, 53, 15, 0.4)" : "rgba(8, 145, 178, 0.4)";
      ctx.fillRect(-12, -targetHeight, 24, targetHeight);
      ctx.fillStyle = characterId === "valen" ? "#f59e0b" : "#22d3ee";
      ctx.fillRect(-8, -targetHeight + 4, 16, 14);
    }

    ctx.restore();
    return true;
  }

  /**
   * Renders a player character entity with movement state resolution, character progression tiers and trail effects
   */
  public static renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: {
      id: string;
      characterId?: string;
      levelGroup?: 1 | 2 | 3;
      characterTier?: 1 | 2 | 3;
      unlockedSkills?: string[];
      score?: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      width: number;
      height: number;
      facingLeft: boolean;
      isAttacking: boolean;
      attackTime: number;
      isDashing: boolean;
      dashTime?: number;
      isCasting?: boolean;
      castTime?: number;
      isCrouching: boolean;
      isGrounded: boolean;
    },
    quality: AssetQuality = assetLoader.getQuality(),
    gameTick: number = 0
  ) {
    // 1. Resolve character identity & progression tier (Level Group 1, 2, or 3)
    const characterId = player.characterId || (player.id === "player1" ? "valen" : "aurelia");
    
    let tier: CharacterProgressionTier = 1;
    if (player.characterTier) {
      tier = player.characterTier;
    } else if (player.levelGroup) {
      tier = player.levelGroup;
    } else if (player.unlockedSkills && player.unlockedSkills.length >= 6) {
      tier = 3;
    } else if (player.unlockedSkills && player.unlockedSkills.length >= 3) {
      tier = 2;
    }

    // 2. Resolve active animation state & frame index
    let activeAnim: AnimationName = "idle";
    let frameIndex: number | undefined = undefined;

    if (player.isAttacking) {
      activeAnim = "attack";
      const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality, tier);
      const meta = spriteMap?.animations.attack || { frameCount: 6 };
      const maxTime = 14;
      const progress = Math.max(0, Math.min(0.99, 1 - (player.attackTime / maxTime)));
      frameIndex = Math.min(Math.floor(progress * meta.frameCount), meta.frameCount - 1);
    } else if (player.isDashing) {
      activeAnim = "dash";
      const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality, tier);
      const meta = spriteMap?.animations.dash || { frameCount: 4 };
      const maxTime = 13;
      const progress = Math.max(0, Math.min(0.99, 1 - ((player.dashTime ?? 0) / maxTime)));
      frameIndex = Math.min(Math.floor(progress * meta.frameCount), meta.frameCount - 1);
    } else if (player.isCasting) {
      activeAnim = "cast";
      const spriteMap = assetLoader.getActiveSpriteMap(characterId, quality, tier);
      const meta = spriteMap?.animations.cast || { frameCount: 6 };
      const maxTime = 16;
      const progress = Math.max(0, Math.min(0.99, 1 - ((player.castTime ?? 0) / maxTime)));
      frameIndex = Math.min(Math.floor(progress * meta.frameCount), meta.frameCount - 1);
    } else if (player.isCrouching) {
      activeAnim = "crouch";
    } else if (!player.isGrounded) {
      if (player.vy < -0.5) {
        activeAnim = "jump";
        frameIndex = Math.min(2, Math.floor(Math.abs(player.vy) / 4));
      } else {
        activeAnim = "fall";
      }
    } else if (Math.abs(player.vx) > 0.5) {
      activeAnim = "run";
    } else {
      activeAnim = "idle";
    }

    // 3. Dash & Slide Ghost Trails
    if (player.isDashing) {
      const ghostAlpha = quality === "high" ? 0.35 : 0.2;
      // Ghost Trail 1
      this.renderToCanvas(ctx, {
        characterId,
        quality,
        tier,
        state: activeAnim,
        ticks: gameTick,
        frameIndex,
        facingLeft: player.facingLeft,
        alpha: ghostAlpha,
        targetX: player.x - player.vx * 1.6,
        targetY: player.y,
        targetWidth: player.width,
        targetHeight: player.height,
      });

      // Ghost Trail 2
      this.renderToCanvas(ctx, {
        characterId,
        quality,
        tier,
        state: activeAnim,
        ticks: gameTick,
        frameIndex,
        facingLeft: player.facingLeft,
        alpha: ghostAlpha * 0.5,
        targetX: player.x - player.vx * 2.8,
        targetY: player.y,
        targetWidth: player.width,
        targetHeight: player.height,
      });
    }

    // 4. Main Sprite Render
    this.renderToCanvas(ctx, {
      characterId,
      quality,
      tier,
      state: activeAnim,
      ticks: gameTick,
      frameIndex,
      facingLeft: player.facingLeft,
      alpha: 1,
      targetX: player.x,
      targetY: player.y,
      targetWidth: player.width,
      targetHeight: player.height,
    });
  }
}
