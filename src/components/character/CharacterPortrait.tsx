import React, { useRef, useEffect, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@lib/utils";
import { useCharacterPortrait } from "./useCharacterPortrait";
import { CharacterPortraitCrop } from "./types";

export type CharacterPortraitSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";
export type CharacterPortraitVariant = "raw" | "framed" | "circle";

export interface CharacterPortraitProps {
  /** Optional explicit image source URL (primitive mode) */
  readonly src?: string;
  /** Optional explicit cropping sub-rectangle (primitive mode) */
  readonly crop?: CharacterPortraitCrop;
  /** Optional explicit alt text */
  readonly alt?: string;
  /** Optional character ID; if omitted, resolved from CharacterContext */
  readonly characterId?: string;
  /** Optional mood expression (e.g. 'main', 'neutral', 'serious', 'smile', etc.); if omitted, resolved from CharacterContext */
  readonly mood?: string;
  /** Semantic portrait dimension preset */
  readonly size?: CharacterPortraitSize;
  /** Visual presentation style frame */
  readonly variant?: CharacterPortraitVariant;
  readonly className?: string;
  readonly children?: React.ReactNode;
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
 * - Memory & error resilient: unmount cancellation, error state fallback, DPR-aware canvas rendering.
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

      const effectiveSrc = explicitSrc !== undefined ? explicitSrc : contextData.src;
      const effectiveCrop = explicitCrop !== undefined ? explicitCrop : contextData.crop;
      const effectiveAlt = explicitAlt !== undefined ? explicitAlt : contextData.alt;

      const [hasError, setHasError] = useState(false);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);

      // Reset error state when source or crop changes
      useEffect(() => {
        setHasError(false);
      }, [effectiveSrc, effectiveCrop]);

      // Pure presentation rendering for cropped portrait atlas
      useEffect(() => {
        if (!effectiveCrop || !effectiveSrc || hasError) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let isCancelled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          if (isCancelled) return;
          const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
          const targetW = canvas.clientWidth || 256;
          const targetH = canvas.clientHeight || 256;

          canvas.width = Math.round(targetW * dpr);
          canvas.height = Math.round(targetH * dpr);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

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

        img.onerror = () => {
          if (isCancelled) return;
          setHasError(true);
        };

        img.src = effectiveSrc;

        return () => {
          isCancelled = true;
          img.onload = null;
          img.onerror = null;
        };
      }, [effectiveSrc, effectiveCrop, hasError]);

      const containerClasses = cn(
        "relative overflow-hidden",
        sizeClasses[size],
        variantClasses[variant],
        className
      );

      // Fallback state if image load fails or no source provided
      if (hasError || (!effectiveSrc && !children)) {
        return (
          <div
            ref={ref}
            className={cn(
              containerClasses,
              "flex items-center justify-center bg-stone-950/80 border border-stone-800/80 text-stone-500 select-none"
            )}
            role="img"
            aria-label={effectiveAlt || "Portrait unavailable"}
          >
            <User size={size === "xs" || size === "sm" ? 14 : 24} className="opacity-40 text-stone-400" />
            {children}
          </div>
        );
      }

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
              onError={() => setHasError(true)}
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
            role="img"
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
