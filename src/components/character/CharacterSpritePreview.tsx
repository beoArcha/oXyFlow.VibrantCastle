import React, { useRef, useEffect, useImperativeHandle, useCallback } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "@game/engine/spriteTypes";
import { useCharacterSprite } from "./useCharacterSprite";
import { useCharacterContext } from "./CharacterContext";
import { renderSpritePreviewFrame } from "./renderSpritePreviewFrame";
import { useCanvasDpr } from "./useCanvasDpr";

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
 * - Presentation-only: renders the provided sprite frame onto canvas.
 * - Zero per-frame React re-renders: animation loop executes directly in rAF on Canvas 2D.
 * - Decoupled rendering: blit and anti-clipping math isolated in renderSpritePreviewFrame.
 * - Dynamic buffer: adapted to container dimensions and DPR via useCanvasDpr.
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

      // Latest parameters stored in ref for zero-latency rAF consumption
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

      const drawStaticFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const {
          scale: curScale,
          flipHorizontal: curFlip,
          bgGrad: curBgGrad,
          accentColor: curAccent,
          explicitTexture: curExpTex,
          explicitFrame: curExpFrame,
          spriteData: curSpriteData,
        } = paramsRef.current;

        const activeTexture = curExpTex !== undefined ? curExpTex : curSpriteData.texture;
        const activeFrame = curExpFrame !== undefined ? curExpFrame : curSpriteData.frame;

        renderSpritePreviewFrame({
          canvas,
          ctx,
          frame: activeFrame,
          texture: activeTexture,
          scale: curScale,
          flipHorizontal: curFlip,
          backgroundGradient: curBgGrad,
          accentColor: curAccent,
        });
      }, []);

      // Dynamic DPR buffer adaptation
      useCanvasDpr(canvasRef, containerRef, drawStaticFrame);

      // Canvas Rendering & Animation Loop (Zero React setState calls)
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Static mode: explicit frame passed or animation halted
        if (explicitFrame !== undefined || playbackSpeed === 0) {
          drawStaticFrame();
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

          const { frame: currentFrame } =
            paramsRef.current.spriteData.getFrameForTick(continuousTicks);

          renderSpritePreviewFrame({
            canvas,
            ctx,
            frame: currentFrame,
            texture: currentTexture,
            scale: paramsRef.current.scale,
            flipHorizontal: paramsRef.current.flipHorizontal,
            backgroundGradient: paramsRef.current.bgGrad,
            accentColor: paramsRef.current.accentColor,
          });

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
        drawStaticFrame,
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

