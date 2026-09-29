import React, { useRef, useEffect } from "react";
import { cn } from "@lib/utils";
import { useCharacterPortrait } from "./useCharacterPortrait";
import { CharacterPortraitCrop } from "./types";

export type CharacterPortraitSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";
export type CharacterPortraitVariant = "raw" | "framed" | "circle";

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
  /** Semantic portrait dimension preset */
  size?: CharacterPortraitSize;
  /** Visual presentation style frame */
  variant?: CharacterPortraitVariant;
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses: Record<CharacterPortraitSize, string> = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
  fill: "w-full h-full",
};

const variantClasses: Record<CharacterPortraitVariant, string> = {
  raw: "",
  framed: "rounded-lg border border-[#8d4325] bg-[#140602] shadow-md shadow-black/50",
  circle: "rounded-full border-2 border-amber-500/60 bg-[#140602] shadow-md shadow-black/50",
};

/**
 * Generic Character Portrait Presentation Component
 *
 * Adheres strictly to separation of concerns:
 * - Presentation-only: renders the image or cropped sub-region that it is given.
 * - Semantic sizing & styling: supports raw, framed, circle variants and standardized sizes.
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
        size = "fill",
        variant = "raw",
        className = "",
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

      const containerClasses = cn(
        "relative overflow-hidden",
        sizeClasses[size],
        variantClasses[variant],
        className
      );

      if (!effectiveCrop) {
        // Standard full portrait rendering (*_main.png)
        return (
          <div ref={ref} className={containerClasses}>
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
        <div ref={ref} className={containerClasses}>
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
