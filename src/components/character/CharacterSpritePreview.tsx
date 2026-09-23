import React, { useRef, useEffect } from "react";
import { AssetQuality } from "../../game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "../../game/engine/spriteTypes";
import { useCharacterSprite } from "./useCharacterSprite";
import { useCharacterContext } from "./CharacterContext";

export interface CharacterSpritePreviewProps {
  /** Optional explicit texture for pure presentation primitive mode */
  texture?: HTMLImageElement | null;
  /** Optional explicit frame slice for pure presentation primitive mode */
  frame?: SpriteFrame | null;
  /** Optional character ID; if omitted, resolved from CharacterContext */
  characterId?: string;
  /** Graphic quality tier */
  quality?: AssetQuality;
  /** Active animation state */
  state?: AnimationName;
  /** Progression tier */
  tier?: CharacterProgressionTier;
  /** Playback speed factor */
  playbackSpeed?: number;
  /** Visual scale */
  scale?: number;
  /** Optional flip horizontally */
  flipHorizontal?: boolean;
  /** Optional custom canvas background color/gradient */
  backgroundGradient?: [string, string];
  /** Optional ground accent line color */
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Generic Character Sprite Preview Component
 *
 * Adheres strictly to presentation separation:
 * - Presentation-only: renders the provided sprite frame and texture onto the canvas.
 * - Decoupled: does not contain hardcoded character identity checks or business decision trees.
 * - Dynamic buffer: adapts canvas dimensions to container with DPR support to prevent pixel squashing.
 * - Smart vertical positioning: ensures head, jump peaks, and attack sweeps are NEVER clipped.
 */
export const CharacterSpritePreview: React.FC<CharacterSpritePreviewProps> = React.memo(({
  texture: explicitTexture,
  frame: explicitFrame,
  characterId,
  quality,
  state = "idle",
  tier,
  playbackSpeed = 1,
  scale = 1.6,
  flipHorizontal = false,
  backgroundGradient,
  accentColor: explicitAccent,
  className = "w-full h-full",
  ariaLabel,
}) => {
  const context = useCharacterContext();

  // If texture and frame are not explicitly passed, consume via dedicated sprite hook
  const spriteData = useCharacterSprite(
    characterId,
    quality,
    state,
    playbackSpeed,
    tier
  );

  const texture = explicitTexture !== undefined ? explicitTexture : spriteData.texture;
  const frame = explicitFrame !== undefined ? explicitFrame : spriteData.frame;

  const accentColor = explicitAccent || context.accentColor || "#d97706";
  const bgGrad: [string, string] = backgroundGradient || ["#1a0802", "#080201"];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamically resize internal canvas buffer to match container resolution with DPR
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateBuffer = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const nw = Math.floor(clientWidth * dpr);
        const nh = Math.floor(clientHeight * dpr);
        if (canvas.width !== nw || canvas.height !== nh) {
          canvas.width = nw;
          canvas.height = nh;
        }
      }
    };

    updateBuffer();
    const observer = new ResizeObserver(updateBuffer);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);

    // 1. Background atmospheric gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 1.1);
    grad.addColorStop(0, bgGrad[0]);
    grad.addColorStop(1, bgGrad[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. Intelligent Ground & Center calculation to guarantee ZERO clipping
    let feetX = Math.round(w / 2);
    // Default baseline around 78% height
    let feetY = Math.round(h * 0.78);

    if (frame) {
      const scaledHeadHeight = frame.originY * scale;
      const scaledFeetDepth = (frame.h - frame.originY) * scale;
      const scaledLeftWidth = frame.originX * scale;
      const scaledRightWidth = (frame.w - frame.originX) * scale;

      // Keep at least 24px clearance from top edge
      if (feetY - scaledHeadHeight < 24) {
        feetY = Math.round(scaledHeadHeight + 24);
      }
      // Keep at least 20px clearance from bottom edge
      if (feetY + scaledFeetDepth > h - 20) {
        feetY = Math.round(h - scaledFeetDepth - 20);
      }

      // Horizontal clearance
      if (feetX - scaledLeftWidth < 24) {
        feetX = Math.round(scaledLeftWidth + 24);
      } else if (feetX + scaledRightWidth > w - 24) {
        feetX = Math.round(w - scaledRightWidth - 24);
      }
    }

    const groundY = feetY;

    // 3. Ground guide line
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.max(16, feetX - 120 * scale), groundY);
    ctx.lineTo(Math.min(w - 16, feetX + 120 * scale), groundY);
    ctx.stroke();

    // 4. Contact shadow
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.beginPath();
    ctx.ellipse(feetX, groundY, 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // 5. Draw Sprite Frame
    if (frame && texture && texture.complete && texture.naturalWidth > 0) {
      ctx.save();
      ctx.translate(feetX, feetY);
      if (flipHorizontal) {
        ctx.scale(-1, 1);
      }
      if (scale !== 1) {
        ctx.scale(scale, scale);
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        texture,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -frame.originX,
        -frame.originY,
        frame.w,
        frame.h
      );
      ctx.restore();
    }
  }, [texture, frame, scale, flipHorizontal, bgGrad, accentColor]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl border border-amber-500/20 shadow-inner ${className}`}
      role="img"
      aria-label={ariaLabel || `Character Sprite Preview: ${state}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block image-rendering-pixelated"
      />
    </div>
  );
});

export default CharacterSpritePreview;
