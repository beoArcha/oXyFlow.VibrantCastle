import { cva, type VariantProps } from "class-variance-authority";

export const dialogBackdropVariants = cva(
  "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-all duration-200 animate-in fade-in-0",
  {
    variants: {
      blur: {
        none: "backdrop-blur-none",
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
      },
    },
    defaultVariants: {
      blur: "sm",
    },
  }
);

export const dialogContentVariants = cva(
  "relative w-full rounded-2xl border border-border-strong bg-surface-darker/95 p-6 text-amber-lighter shadow-2xl shadow-black/95 transition-all duration-200 outline-none animate-in fade-in-0 zoom-in-95",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
        full: "max-w-[95vw] h-[90vh]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type DialogBackdropVariantProps = VariantProps<typeof dialogBackdropVariants>;
export type DialogContentVariantProps = VariantProps<typeof dialogContentVariants>;
