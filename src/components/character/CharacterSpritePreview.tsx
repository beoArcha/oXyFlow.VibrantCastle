import React, { useRef, useEffect, useImperativeHandle, useCallback } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "@game/engine/spriteTypes";
import { useCharacterSprite } from "./hooks/useCharacterSprite";
import { useCharacterContext } from "./CharacterContext";
import { renderSpritePreviewFrame } from "./renderSpritePreviewFrame";
import { useCanvasDpr } from "./hooks/useCanvasDpr";
import { SpriteStageVisualProps } from "./types";

export interface CharacterSpritePreviewProps extends SpriteStageVisualProps {
  /** Optional explicit texture for pure presentation primitive mode */
  readonly texture?: HTMLImageElement | null;
  /** Optional explicit frame slice for pure presentation primitive mode */
  readonly frame?: SpriteFrame | null;
  /** Optional character ID; if omitted, resolved from CharacterContext */
  readonly characterId?: string;
  /** Graphic quality tier */
  readonly quality?: AssetQuality;
  /** Active animation state */
  readonly state?: AnimationName;
  /** Progression tier */
  readonly tier?: CharacterProgressionTier;
  /** Playback speed factor. If 0, animation loop is halted. */
  readonly playbackSpeed?: number;
  readonly className?: string;
  readonly ariaLabel?: string;
}

const DEFAULT_BG_GRADIENT: readonly [string, string] = ["#1a0802", "#080201"];

/**
 * Generic Character Sprite Preview Component
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
      const bgGrad = backgroundGradient ?? (DEFAULT_BG_GRADIENT as [string, string]);

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

      // Synchronize immediately for frame-to-frame continuity
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

      // Static redraw effect (when paused or explicit frame provided)
      useEffect(() => {
        if (explicitFrame !== undefined || playbackSpeed === 0) {
          drawStaticFrame();
        }
      }, [
        explicitFrame,
        playbackSpeed,
        scale,
        flipHorizontal,
        bgGrad,
        accentColor,
        spriteData.frame,
        spriteData.texture,
        drawStaticFrame,
      ]);

      // Active animation rAF loop (executes only when playing)
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Static mode: explicit frame passed or animation halted
        if (explicitFrame !== undefined || playbackSpeed === 0) {
          return;
        }

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
        playbackSpeed === 0,
        characterId,
        state,
        tier,
        spriteData.texture,
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
