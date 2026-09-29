import React, { useRef, useEffect } from "react";
import { useCharacterPortrait } from "./useCharacterPortrait";
import { CharacterPortraitCrop } from "./types";

export interface CharacterPortraitProps {
  /** Optional explicit image source URL (primitive mode) */
  src?: string;
  /** Optional explicit cropping sub-rectangle (primitive mode) */
  crop?: CharacterPortraitCrop;
  /** Optional explicit alt text */
  alt?: string;
  /** Optional character ID; if omitted, resolved from CharacterContext */
  characterId?: string;
  /** Optional mood expression (e.g. 'main', 'neutral', 'serious', 'smile', etc.); if omitted, resolved from CharacterContext */
  mood?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Generic Character Portrait Presentation Component
 *
 * Adheres strictly to separation of concerns:
 * - Presentation-only: renders the image or cropped sub-region that it is given.
 * - Context-driven: if direct source/crop are not provided, it consumes the resolved portrait from context/hook.
 * - Free of hardcoded character selection or business rules.
 */
export const CharacterPortrait = React.memo(
  React.forwardRef<HTMLDivElement, CharacterPortraitProps>(
    (
      {
        src: explicitSrc,
        crop: explicitCrop,
        alt: explicitAlt,
        characterId,
        mood,
        className = "w-full h-full",
        children,
      },
      ref
    ) => {
      // If not provided explicitly as a pure primitive, resolve data from context/engine hook
      const contextData = useCharacterPortrait(characterId, mood);

      const effectiveSrc = explicitSrc || contextData.src;
      const effectiveCrop = explicitCrop !== undefined ? explicitCrop : contextData.crop;
      const effectiveAlt = explicitAlt || contextData.alt;

      const canvasRef = useRef<HTMLCanvasElement | null>(null);

      // Pure presentation rendering for cropped portrait atlas
      useEffect(() => {
        if (!effectiveCrop || !effectiveSrc) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          canvas.width = canvas.clientWidth || 256;
          canvas.height = canvas.clientHeight || 256;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;

          ctx.drawImage(
            img,
            effectiveCrop.x,
            effectiveCrop.y,
            effectiveCrop.width,
            effectiveCrop.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        };
        img.src = effectiveSrc;
      }, [effectiveSrc, effectiveCrop]);

      if (!effectiveCrop) {
        // Standard full portrait rendering (*_main.png)
        return (
          <div ref={ref} className={`relative overflow-hidden ${className}`}>
            <img
              src={effectiveSrc}
              alt={effectiveAlt}
              className="w-full h-full object-cover object-top select-none"
              loading="eager"
              decoding="async"
            />
            {children}
          </div>
        );
      }

      // Cropped mood expression rendering (*_portraits.png)
      return (
        <div ref={ref} className={`relative overflow-hidden ${className}`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover block"
            aria-label={effectiveAlt}
          />
          {children}
        </div>
      );
    }
  )
);

CharacterPortrait.displayName = "CharacterPortrait";

export default CharacterPortrait;
