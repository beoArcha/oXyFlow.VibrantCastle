import React, { useRef, useEffect, useImperativeHandle } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "@game/engine/spriteTypes";
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
  /** Playback speed factor. If 0, animation loop is halted. */
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
 * Adheres strictly to AGENT.md Sec. 3.3 and presentation separation:
 * - Presentation-only: renders the provided sprite frame and texture onto the canvas.
 * - Zero per-frame React re-renders: animation loop executes directly in rAF on the Canvas 2D context.
 * - Dynamic buffer: adapts canvas dimensions to container with DPR support to prevent pixel squashing.
 * - Smart vertical positioning: ensures head, jump peaks, and attack sweeps are never clipped.
 */
export const CharacterSpritePreview = React.memo(
  React.forwardRef<HTMLDivElement, CharacterSpritePreviewProps>(
    (
      {
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
      },
      ref
    ) => {
      const context = useCharacterContext();

      const spriteData = useCharacterSprite(
        characterId,
        quality,
        state,
        playbackSpeed,
        tier
      );

      const accentColor = explicitAccent || context.accentColor || "#d97706";
      const bgGrad: [string, string] = backgroundGradient || ["#1a0802", "#080201"];

      const containerRef = useRef<HTMLDivElement | null>(null);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);

      useImperativeHandle(ref, () => containerRef.current!);

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

      // Keep latest mutable rendering parameters for rAF loop
      const paramsRef = useRef({
        scale,
        flipHorizontal,
        bgGrad,
        accentColor,
        playbackSpeed,
        explicitTexture,
        explicitFrame,
        spriteData,
      });

      useEffect(() => {
        paramsRef.current = {
          scale,
          flipHorizontal,
          bgGrad,
          accentColor,
          playbackSpeed,
          explicitTexture,
          explicitFrame,
          spriteData,
        };
      });

      // Canvas Rendering & Animation Loop (Zero React setState calls)
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const drawFrame = (currentFrame: SpriteFrame | null, currentTexture: HTMLImageElement | null) => {
          const {
            scale: curScale,
            flipHorizontal: curFlip,
            bgGrad: curBgGrad,
            accentColor: curAccent,
          } = paramsRef.current;

          const w = canvas.width;
          const h = canvas.height;
          if (w <= 0 || h <= 0) return;

          ctx.clearRect(0, 0, w, h);

          // 1. Background atmospheric gradient
          const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 1.1);
          grad.addColorStop(0, curBgGrad[0]);
          grad.addColorStop(1, curBgGrad[1]);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // 2. Ground & Center calculation with zero clipping clearance
          let feetX = Math.round(w / 2);
          let feetY = Math.round(h * 0.78);

          if (currentFrame) {
            const scaledHeadHeight = currentFrame.originY * curScale;
            const scaledFeetDepth = (currentFrame.h - currentFrame.originY) * curScale;
            const scaledLeftWidth = currentFrame.originX * curScale;
            const scaledRightWidth = (currentFrame.w - currentFrame.originX) * curScale;

            if (feetY - scaledHeadHeight < 24) {
              feetY = Math.round(scaledHeadHeight + 24);
            }
            if (feetY + scaledFeetDepth > h - 20) {
              feetY = Math.round(h - scaledFeetDepth - 20);
            }
            if (feetX - scaledLeftWidth < 24) {
              feetX = Math.round(scaledLeftWidth + 24);
            } else if (feetX + scaledRightWidth > w - 24) {
              feetX = Math.round(w - scaledRightWidth - 24);
            }
          }

          const groundY = feetY;

          // 3. Ground guide line
          ctx.strokeStyle = curAccent;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.max(16, feetX - 120 * curScale), groundY);
          ctx.lineTo(Math.min(w - 16, feetX + 120 * curScale), groundY);
          ctx.stroke();

          // 4. Contact shadow
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.beginPath();
          ctx.ellipse(feetX, groundY, 24 * curScale, 7 * curScale, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1;

          // 5. Blit Sprite Frame
          if (currentFrame && currentTexture && currentTexture.complete && currentTexture.naturalWidth > 0) {
            ctx.save();
            ctx.translate(feetX, feetY);
            if (curFlip) {
              ctx.scale(-1, 1);
            }
            if (curScale !== 1) {
              ctx.scale(curScale, curScale);
            }

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              currentTexture,
              currentFrame.x,
              currentFrame.y,
              currentFrame.w,
              currentFrame.h,
              -currentFrame.originX,
              -currentFrame.originY,
              currentFrame.w,
              currentFrame.h
            );
            ctx.restore();
          }
        };

        // Static mode: explicit frame passed or animation halted
        if (explicitFrame !== undefined || playbackSpeed === 0) {
          const activeTexture = explicitTexture !== undefined ? explicitTexture : spriteData.texture;
          const activeFrame = explicitFrame !== undefined ? explicitFrame : spriteData.frame;
          drawFrame(activeFrame, activeTexture);
          return;
        }

        // Active animation rAF loop
        let animId: number;
        let continuousTicks = 0;
        let lastTime = performance.now();

        const loop = (now: number) => {
          const delta = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;
          continuousTicks += delta * 60 * paramsRef.current.playbackSpeed;

          const currentTexture =
            paramsRef.current.explicitTexture !== undefined
              ? paramsRef.current.explicitTexture
              : paramsRef.current.spriteData.texture;

          const { frame: currentFrame } = paramsRef.current.spriteData.getFrameForTick(continuousTicks);

          drawFrame(currentFrame, currentTexture);
          animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);

        return () => {
          if (animId) {
            cancelAnimationFrame(animId);
          }
        };
      }, [
        explicitTexture,
        explicitFrame,
        playbackSpeed,
        scale,
        flipHorizontal,
        bgGrad,
        accentColor,
        spriteData,
      ]);

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
    }
  )
);

CharacterSpritePreview.displayName = "CharacterSpritePreview";

export default CharacterSpritePreview;
